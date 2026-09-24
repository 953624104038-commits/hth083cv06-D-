import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as THREE from 'three';
import { Play, Pause, RotateCcw, Compass, Gauge, AlertCircle } from 'lucide-react';
import { createHandModel, applyHandPose, disposeHandModel, type HandRig } from './handModel';
import { getGesture3D } from './gestureAnimations';
import type { GesturePhase } from './types';

interface Hand3DViewerProps {
  signId: string;
  fallbackImgSrc?: string;
  autoPlay?: boolean;
  className?: string;
}

export const Hand3DViewer: React.FC<Hand3DViewerProps> = ({
  signId,
  fallbackImgSrc,
  autoPlay = true,
  className = '',
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const animFrameIdRef = useRef<number | null>(null);
  const rightHandRigRef = useRef<HandRig | null>(null);
  const leftHandRigRef = useRef<HandRig | null>(null);

  // Animation playback state
  const [isPlaying, setIsPlaying] = useState<boolean>(autoPlay);
  const [speed, setSpeed] = useState<number>(1.0);
  const [currentPhase, setCurrentPhase] = useState<GesturePhase>('START');
  const [motionHint, setMotionHint] = useState<string>('');
  const [progress, setProgress] = useState<number>(0);
  const [webglError, setWebglError] = useState<boolean>(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState<boolean>(false);

  const gesture = getGesture3D(signId);

  // Time & Progress refs for animation loop
  const progressRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(performance.now());
  const isPlayingRef = useRef<boolean>(isPlaying);
  const speedRef = useRef<number>(speed);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    speedRef.current = speed;
  }, [speed]);

  // Reduced motion preference
  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      setPrefersReducedMotion(mediaQuery.matches);
      const listener = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
      mediaQuery.addEventListener('change', listener);
      return () => mediaQuery.removeEventListener('change', listener);
    }
  }, []);

  // Camera Orbit State
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const orbitRef = useRef({
    theta: 0.15, // horizontal yaw
    phi: 0.25, // vertical pitch
    radius: 6.2,
    isDragging: false,
    prevPointerX: 0,
    prevPointerY: 0,
  });

  const updateCameraPosition = useCallback(() => {
    const cam = cameraRef.current;
    if (!cam) return;
    const { theta, phi, radius } = orbitRef.current;
    cam.position.x = radius * Math.sin(theta) * Math.cos(phi);
    cam.position.y = radius * Math.sin(phi) + 0.3;
    cam.position.z = radius * Math.cos(theta) * Math.cos(phi);
    cam.lookAt(0, 0.4, 0);
  }, []);

  const handleResetCamera = () => {
    orbitRef.current.theta = 0.15;
    orbitRef.current.phi = 0.25;
    orbitRef.current.radius = gesture?.isTwoHanded ? 7.2 : 6.2;
    updateCameraPosition();
  };

  // Three.js Scene Setup & Loop
  useEffect(() => {
    if (!gesture || !mountRef.current) return;
    const container = mountRef.current;

    // Check WebGL availability
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance',
      });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(container.clientWidth || 320, container.clientHeight || 260);
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      container.appendChild(renderer.domElement);
      rendererRef.current = renderer;
    } catch {
      setWebglError(true);
      return;
    }

    const scene = new THREE.Scene();

    // Camera
    const camera = new THREE.PerspectiveCamera(
      42,
      (container.clientWidth || 320) / (container.clientHeight || 260),
      0.1,
      50
    );
    cameraRef.current = camera;
    orbitRef.current.radius = gesture.isTwoHanded ? 7.2 : 6.2;
    updateCameraPosition();

    // Studio Lighting for Clear Anatomical Contours
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.95);
    scene.add(ambientLight);

    const mainLight = new THREE.DirectionalLight(0xfff6ea, 1.4);
    mainLight.position.set(4, 8, 6);
    mainLight.castShadow = true;
    mainLight.shadow.mapSize.width = 1024;
    mainLight.shadow.mapSize.height = 1024;
    scene.add(mainLight);

    const fillLight = new THREE.DirectionalLight(0xdbeafe, 0.7);
    fillLight.position.set(-5, 3, -4);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xffffff, 0.5);
    rimLight.position.set(0, -4, 4);
    scene.add(rimLight);

    // Build Hands
    const rightRig = createHandModel(false);
    scene.add(rightRig.rootGroup);
    rightHandRigRef.current = rightRig;

    let leftRig: HandRig | null = null;
    if (gesture.isTwoHanded) {
      leftRig = createHandModel(true);
      scene.add(leftRig.rootGroup);
      leftHandRigRef.current = leftRig;
    }

    // Apply initial start pose immediately
    const initialPose = gesture.evaluatePose(0);
    applyHandPose(rightRig, initialPose.rightHand);
    if (leftRig && initialPose.leftHand) {
      applyHandPose(leftRig, initialPose.leftHand);
    }
    setMotionHint(initialPose.motionHint);
    setCurrentPhase(initialPose.phase);

    // Pointer Drag Listeners for 3D Camera Orbit
    const onPointerDown = (e: PointerEvent) => {
      orbitRef.current.isDragging = true;
      orbitRef.current.prevPointerX = e.clientX;
      orbitRef.current.prevPointerY = e.clientY;
      (e.target as HTMLElement)?.setPointerCapture?.(e.pointerId);
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!orbitRef.current.isDragging) return;
      const dx = e.clientX - orbitRef.current.prevPointerX;
      const dy = e.clientY - orbitRef.current.prevPointerY;
      orbitRef.current.prevPointerX = e.clientX;
      orbitRef.current.prevPointerY = e.clientY;

      orbitRef.current.theta -= dx * 0.012;
      // Clamp vertical phi to prevent gimbal flipping
      orbitRef.current.phi = Math.max(-0.6, Math.min(1.2, orbitRef.current.phi + dy * 0.012));
      updateCameraPosition();
    };

    const onPointerUp = (e: PointerEvent) => {
      orbitRef.current.isDragging = false;
      try {
        (e.target as HTMLElement)?.releasePointerCapture?.(e.pointerId);
      } catch {
        // ignore
      }
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      orbitRef.current.radius = Math.max(3.8, Math.min(11.0, orbitRef.current.radius + e.deltaY * 0.005));
      updateCameraPosition();
    };

    const dom = renderer.domElement;
    dom.addEventListener('pointerdown', onPointerDown);
    dom.addEventListener('pointermove', onPointerMove);
    dom.addEventListener('pointerup', onPointerUp);
    dom.addEventListener('wheel', onWheel, { passive: false });

    // Handle container resize
    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const width = container.clientWidth || 320;
      const height = container.clientHeight || 260;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    // Render & Animation Loop
    lastTimeRef.current = performance.now();

    const animate = () => {
      const now = performance.now();
      const deltaMs = now - lastTimeRef.current;
      lastTimeRef.current = now;

      if (isPlayingRef.current) {
        const step = (deltaMs * speedRef.current) / gesture.durationMs;
        let newProg = progressRef.current + step;
        if (newProg >= 1.0) {
          // Pause slightly at end before looping
          newProg = 0;
        }
        progressRef.current = newProg;
        setProgress(newProg);

        // Evaluate kinematic poses
        const state = gesture.evaluatePose(newProg);
        if (rightRig) {
          applyHandPose(rightRig, state.rightHand);
        }
        if (leftRig && state.leftHand) {
          applyHandPose(leftRig, state.leftHand);
        }
        setCurrentPhase(state.phase);
        setMotionHint(state.motionHint);
      }

      renderer.render(scene, camera);
      animFrameIdRef.current = requestAnimationFrame(animate);
    };

    animFrameIdRef.current = requestAnimationFrame(animate);

    // Cleanup on unmount or sign change
    return () => {
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
      resizeObserver.disconnect();
      dom.removeEventListener('pointerdown', onPointerDown);
      dom.removeEventListener('pointermove', onPointerMove);
      dom.removeEventListener('pointerup', onPointerUp);
      dom.removeEventListener('wheel', onWheel);

      if (rightRig) disposeHandModel(rightRig);
      if (leftRig) disposeHandModel(leftRig);
      renderer.dispose();

      if (dom.parentElement === container) {
        container.removeChild(dom);
      }
    };
  }, [gesture, updateCameraPosition]);

  // Controls Handlers
  const handleTogglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const handleReplay = () => {
    progressRef.current = 0;
    setProgress(0);
    setIsPlaying(true);
  };

  const handleCycleSpeed = () => {
    const nextSpeed = speed === 0.5 ? 1.0 : speed === 1.0 ? 1.5 : 0.5;
    setSpeed(nextSpeed);
  };

  const handleStepPose = (phaseTarget: 'START' | 'END') => {
    if (!gesture || !rightHandRigRef.current) return;
    const t = phaseTarget === 'START' ? 0.05 : 0.95;
    progressRef.current = t;
    setProgress(t);
    setIsPlaying(false);
    const state = gesture.evaluatePose(t);
    applyHandPose(rightHandRigRef.current, state.rightHand);
    if (leftHandRigRef.current && state.leftHand) {
      applyHandPose(leftHandRigRef.current, state.leftHand);
    }
    setCurrentPhase(state.phase);
    setMotionHint(state.motionHint);
  };

  // Fallback if 3D is not supported or missing
  if (!gesture || webglError) {
    return (
      <div className={`flex flex-col items-center justify-center p-3 text-center bg-slate-950/80 rounded-xl border border-slate-800 ${className}`}>
        {fallbackImgSrc ? (
          <img
            src={fallbackImgSrc}
            alt={`ISL ${signId} reference`}
            className="w-full h-48 object-contain mb-2 filter contrast-105"
            loading="lazy"
          />
        ) : (
          <AlertCircle className="w-8 h-8 text-amber-400 mb-2" />
        )}
        <p className="text-xs text-amber-300 font-semibold">3D demonstration unavailable for this sign</p>
        <p className="text-[11px] text-slate-400 mt-1">Showing verified instructional reference diagram.</p>
      </div>
    );
  }

  return (
    <div className={`relative flex flex-col bg-slate-950/90 rounded-2xl border border-slate-800 overflow-hidden shadow-xl ${className}`}>
      {/* Top Overlay: Phase Pills & Motion Hint */}
      <div className="absolute top-2.5 left-2.5 right-2.5 z-10 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-1.5 pointer-events-auto">
          <span
            className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider transition-colors ${
              currentPhase === 'START'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50'
                : 'bg-slate-900/70 text-slate-500'
            }`}
          >
            Start
          </span>
          <span className="text-[9px] text-slate-600">→</span>
          <span
            className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider transition-colors ${
              currentPhase === 'MOVE'
                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/50 animate-pulse'
                : 'bg-slate-900/70 text-slate-500'
            }`}
          >
            Move
          </span>
          <span className="text-[9px] text-slate-600">→</span>
          <span
            className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider transition-colors ${
              currentPhase === 'END'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50'
                : 'bg-slate-900/70 text-slate-500'
            }`}
          >
            End
          </span>
        </div>

        {/* 3D Camera Reset Button */}
        <button
          onClick={handleResetCamera}
          className="pointer-events-auto flex items-center gap-1 text-[10px] font-medium px-2 py-1 rounded-lg bg-slate-900/85 hover:bg-slate-800 text-slate-300 border border-slate-700/60 shadow transition active:scale-95"
          title="Reset Camera Angle"
          aria-label="Reset camera angle"
        >
          <Compass className="w-3 h-3 text-indigo-400" />
          <span>Reset View</span>
        </button>
      </div>

      {/* Interactive Three.js WebGL Container */}
      <div
        ref={mountRef}
        className="w-full h-56 sm:h-64 cursor-grab active:cursor-grabbing select-none"
        title="Drag to rotate hand angle • Scroll to zoom"
      />

      {/* Drag & Rotate Guidance Tip */}
      <div className="absolute bottom-14 left-0 right-0 text-center pointer-events-none">
        <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-slate-950/70 text-slate-400 border border-slate-800/80 backdrop-blur-sm">
          🖱 Drag to rotate 3D view • Pinch/scroll to zoom
        </span>
      </div>

      {/* Bottom Interactive Controls Bar */}
      <div className="p-2.5 bg-slate-900/95 border-t border-slate-800/80 flex items-center justify-between text-xs">
        {/* Playback & Replay Controls */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleTogglePlay}
            className="p-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition active:scale-95 flex items-center gap-1"
            title={isPlaying ? 'Pause 3D Demonstration' : 'Play 3D Demonstration'}
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={handleReplay}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition active:scale-95"
            title="Replay from Start"
            aria-label="Replay animation"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* Speed Toggle (0.5x | 1x | 1.5x) */}
          <button
            onClick={handleCycleSpeed}
            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] font-semibold text-slate-300 transition active:scale-95"
            title="Adjust Animation Playback Speed"
            aria-label={`Playback speed: ${speed}x`}
          >
            <Gauge className="w-3 h-3 text-emerald-400" />
            <span>{speed}×</span>
          </button>
        </div>

        {/* Step-by-Step Buttons for Accessibility / Reduced Motion */}
        {prefersReducedMotion ? (
          <div className="flex items-center gap-1">
            <button
              onClick={() => handleStepPose('START')}
              className="text-[10px] font-medium px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
            >
              Start Pose
            </button>
            <button
              onClick={() => handleStepPose('END')}
              className="text-[10px] font-medium px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
            >
              End Pose
            </button>
          </div>
        ) : (
          <div className="text-[10px] text-slate-400 truncate max-w-[170px] text-right font-medium">
            {motionHint || gesture.description}
          </div>
        )}
      </div>

      {/* Progress timeline bar */}
      <div className="w-full bg-slate-900 h-1">
        <div
          className="bg-gradient-to-r from-emerald-500 via-indigo-500 to-emerald-400 h-full transition-all duration-75"
          style={{ width: `${Math.round(progress * 100)}%` }}
        />
      </div>
    </div>
  );
};

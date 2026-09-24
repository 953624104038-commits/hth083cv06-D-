import React, { useCallback, useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GaugeIcon, Move3dIcon, PauseIcon, PlayIcon, RotateCcwIcon, ScanIcon } from 'lucide-react';
import { createHandModel, applyHandPose, disposeHandModel, type HandRig } from './handModel';
import { getGesture3D } from './gestureAnimations';
import type { GesturePhase } from './types';

interface Hand3DViewerProps {
  signId: string;
  autoPlay?: boolean;
  /** Compact = card preview: no controls bar, no hint overlay. */
  compact?: boolean;
  className?: string;
  stageClassName?: string;
  fallbackImgSrc?: string;
}

const PHASES: GesturePhase[] = ['START', 'MOVE', 'END'];
const PHASE_LABEL: Record<GesturePhase, string> = { START: 'Start', MOVE: 'Move', END: 'End' };

export function Hand3DViewer({
  signId,
  autoPlay = true,
  compact = false,
  className = '',
  stageClassName = 'h-64'
}: Hand3DViewerProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const animFrameIdRef = useRef<number | null>(null);
  const rightHandRigRef = useRef<HandRig | null>(null);
  const leftHandRigRef = useRef<HandRig | null>(null);

  const [isPlaying, setIsPlaying] = useState<boolean>(autoPlay);
  const [speed, setSpeed] = useState<number>(1.0);
  const [currentPhase, setCurrentPhase] = useState<GesturePhase>('START');
  const [motionHint, setMotionHint] = useState<string>('');
  const [progress, setProgress] = useState<number>(0);
  const [webglError, setWebglError] = useState<boolean>(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState<boolean>(false);

  const gesture = getGesture3D(signId);

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

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mq.matches);
    if (mq.matches && compact) setIsPlaying(false);
    const listener = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mq.addEventListener('change', listener);
    return () => mq.removeEventListener('change', listener);
  }, [compact]);

  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const orbitRef = useRef({ theta: 0.15, phi: 0.25, radius: 6.2, isDragging: false, prevPointerX: 0, prevPointerY: 0 });

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

  useEffect(() => {
    if (!gesture || !mountRef.current) return;
    const container = mountRef.current;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(container.clientWidth || 320, container.clientHeight || 260);
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      container.appendChild(renderer.domElement);
    } catch {
      setWebglError(true);
      return;
    }

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      42,
      (container.clientWidth || 320) / (container.clientHeight || 260),
      0.1,
      50
    );
    cameraRef.current = camera;
    orbitRef.current.radius = gesture.isTwoHanded ? 7.2 : 6.2;
    updateCameraPosition();

    scene.add(new THREE.AmbientLight(0xffffff, 0.95));
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

    const rightRig = createHandModel(false);
    scene.add(rightRig.rootGroup);
    rightHandRigRef.current = rightRig;

    let leftRig: HandRig | null = null;
    if (gesture.isTwoHanded) {
      leftRig = createHandModel(true);
      scene.add(leftRig.rootGroup);
      leftHandRigRef.current = leftRig;
    }

    const initialPose = gesture.evaluatePose(0);
    applyHandPose(rightRig, initialPose.rightHand);
    if (leftRig && initialPose.leftHand) applyHandPose(leftRig, initialPose.leftHand);
    setMotionHint(initialPose.motionHint);
    setCurrentPhase(initialPose.phase);

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
      orbitRef.current.phi = Math.max(-0.6, Math.min(1.2, orbitRef.current.phi + dy * 0.012));
      updateCameraPosition();
    };
    const onPointerUp = (e: PointerEvent) => {
      orbitRef.current.isDragging = false;
      try {
        (e.target as HTMLElement)?.releasePointerCapture?.(e.pointerId);
      } catch {

        // ignore
      }};
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      orbitRef.current.radius = Math.max(3.8, Math.min(11.0, orbitRef.current.radius + e.deltaY * 0.005));
      updateCameraPosition();
    };

    const dom = renderer.domElement;
    dom.addEventListener('pointerdown', onPointerDown);
    dom.addEventListener('pointermove', onPointerMove);
    dom.addEventListener('pointerup', onPointerUp);
    if (!compact) dom.addEventListener('wheel', onWheel, { passive: false });

    const handleResize = () => {
      const width = container.clientWidth || 320;
      const height = container.clientHeight || 260;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };
    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    lastTimeRef.current = performance.now();
    const animate = () => {
      const now = performance.now();
      const deltaMs = now - lastTimeRef.current;
      lastTimeRef.current = now;

      if (isPlayingRef.current) {
        let newProg = progressRef.current + deltaMs * speedRef.current / gesture.durationMs;
        if (newProg >= 1.0) newProg = 0;
        progressRef.current = newProg;
        setProgress(newProg);

        const state = gesture.evaluatePose(newProg);
        applyHandPose(rightRig, state.rightHand);
        if (leftRig && state.leftHand) applyHandPose(leftRig, state.leftHand);
        setCurrentPhase(state.phase);
        setMotionHint(state.motionHint);
      }

      renderer.render(scene, camera);
      animFrameIdRef.current = requestAnimationFrame(animate);
    };
    animFrameIdRef.current = requestAnimationFrame(animate);

    return () => {
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
      resizeObserver.disconnect();
      dom.removeEventListener('pointerdown', onPointerDown);
      dom.removeEventListener('pointermove', onPointerMove);
      dom.removeEventListener('pointerup', onPointerUp);
      dom.removeEventListener('wheel', onWheel);
      disposeHandModel(rightRig);
      if (leftRig) disposeHandModel(leftRig);
      renderer.dispose();
      if (dom.parentElement === container) container.removeChild(dom);
    };
  }, [gesture, updateCameraPosition, compact]);

  const handleTogglePlay = () => setIsPlaying((p) => !p);

  const handleReplay = () => {
    progressRef.current = 0;
    setProgress(0);
    setIsPlaying(true);
  };

  const handleCycleSpeed = () => setSpeed((s) => s === 0.5 ? 1.0 : s === 1.0 ? 1.5 : 0.5);

  const handleStepPose = (phaseTarget: 'START' | 'END') => {
    if (!gesture || !rightHandRigRef.current) return;
    const t = phaseTarget === 'START' ? 0.05 : 0.95;
    progressRef.current = t;
    setProgress(t);
    setIsPlaying(false);
    const state = gesture.evaluatePose(t);
    applyHandPose(rightHandRigRef.current, state.rightHand);
    if (leftHandRigRef.current && state.leftHand) applyHandPose(leftHandRigRef.current, state.leftHand);
    setCurrentPhase(state.phase);
    setMotionHint(state.motionHint);
  };

  // Space toggles playback when the viewer itself has focus (never hijacks buttons/inputs).
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.target !== e.currentTarget) return;
    if (e.key === ' ') {
      e.preventDefault();
      handleTogglePlay();
    }
  };

  if (!gesture || webglError) {
    return (
      <div className={`flex flex-col items-center justify-center rounded-md bg-card p-4 text-center ${className}`}>
        <ScanIcon className="mb-2 h-6 w-6 text-subtle" aria-hidden="true" />
        <p className="text-sm font-semibold text-ink">3D demonstration unavailable</p>
        <p className="mt-1 text-xs text-muted">Follow the written instruction for this sign.</p>
      </div>);

  }

  return (
    <div
      className={`relative flex flex-col overflow-hidden rounded-md bg-[#0b0b0b] ${className}`}
      tabIndex={compact ? -1 : 0}
      onKeyDown={compact ? undefined : handleKeyDown}
      aria-label={compact ? undefined : `3D demonstration of ${gesture.name}. Press Space to ${isPlaying ? 'pause' : 'play'}.`}
      role={compact ? undefined : 'group'}>
      
      {!compact &&
      <div className="pointer-events-none absolute left-3 right-3 top-3 z-10 flex items-center justify-between">
          <ol className="flex items-center gap-1" aria-label="Gesture phase">
            {PHASES.map((p) => {
            const active = currentPhase === p;
            return (
              <li
                key={p}
                aria-current={active ? 'step' : undefined}
                className={`rounded-full px-2 py-0.5 text-[11px] font-bold transition-colors duration-150 ${
                active ? 'bg-accent text-accent-ink' : 'bg-black/60 text-muted'}`
                }>
                
                  {PHASE_LABEL[p]}
                </li>);

          })}
          </ol>
          <button
          type="button"
          onClick={handleResetCamera}
          className="pointer-events-auto flex h-7 items-center gap-1 rounded-full bg-black/60 px-2.5 text-[11px] font-semibold text-muted transition-colors duration-150 hover:text-ink"
          aria-label="Reset 3D camera angle">
          
            <RotateCcwIcon className="h-3 w-3" aria-hidden="true" />
            Reset view
          </button>
        </div>
      }

      <div
        ref={mountRef}
        className={`w-full cursor-grab select-none active:cursor-grabbing ${stageClassName}`}
        aria-hidden="true" />
      

      {!compact &&
      <>
          <div className="flex items-center gap-2 border-t border-line bg-card px-3 py-2">
            <button
            type="button"
            onClick={handleTogglePlay}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ink text-canvas transition-transform duration-150 ease-snappy hover:scale-105 active:scale-95"
            aria-label={isPlaying ? 'Pause demonstration' : 'Play demonstration'}>
            
              {isPlaying ? <PauseIcon className="h-4 w-4" /> : <PlayIcon className="ml-0.5 h-4 w-4" />}
            </button>
            <button
            type="button"
            onClick={handleReplay}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted transition-colors duration-150 hover:bg-raised hover:text-ink"
            aria-label="Replay from start">
            
              <RotateCcwIcon className="h-4 w-4" />
            </button>
            <button
            type="button"
            onClick={handleCycleSpeed}
            className="flex h-8 shrink-0 items-center gap-1 rounded-full px-2 text-xs font-bold text-muted transition-colors duration-150 hover:bg-raised hover:text-ink"
            aria-label={`Playback speed ${speed}x. Change speed`}>
            
              <GaugeIcon className="h-3.5 w-3.5" aria-hidden="true" />
              {speed}×
            </button>
            {prefersReducedMotion ?
          <div className="ml-auto flex gap-1">
                <button type="button" onClick={() => handleStepPose('START')} className="h-8 rounded-full px-2.5 text-xs font-semibold text-muted hover:bg-raised hover:text-ink">
                  Start pose
                </button>
                <button type="button" onClick={() => handleStepPose('END')} className="h-8 rounded-full px-2.5 text-xs font-semibold text-muted hover:bg-raised hover:text-ink">
                  End pose
                </button>
              </div> :

          <p className="ml-auto min-w-0 truncate text-right text-xs text-muted" aria-live="polite">
                {motionHint || gesture.description}
              </p>
          }
          </div>
          <div className="h-1 w-full bg-raised" aria-hidden="true">
            <div className="h-full bg-accent" style={{ width: `${Math.round(progress * 100)}%` }} />
          </div>
          <p className="sr-only">Drag to rotate the hand, scroll to zoom.</p>
          <Move3dIcon className="pointer-events-none absolute bottom-16 right-3 h-4 w-4 text-subtle" aria-hidden="true" />
        </>
      }
    </div>);

}
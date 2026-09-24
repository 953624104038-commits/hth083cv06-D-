import { useCallback, useEffect, useRef } from 'react';
import type { CameraStatus } from '../types/voxis';

interface UseCameraOptions {
  status: CameraStatus;
  setStatus: (s: CameraStatus) => void;
  onFrame: (base64Image: string) => void;
}

const CAPTURE_INTERVAL_MS = 33;
const CAPTURE_WIDTH = 640;
const CAPTURE_HEIGHT = 480;

/** Webcam capture — same constraints and JPEG frame cadence as the original CameraFeed. */
export function useCamera({ status, setStatus, onFrame }: UseCameraOptions) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const onFrameRef = useRef(onFrame);

  useEffect(() => {
    onFrameRef.current = onFrame;
  }, [onFrame]);

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setStatus('idle');
  }, [setStatus]);

  const start = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setStatus('unavailable');
      return;
    }
    setStatus('starting');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, frameRate: { ideal: 30 }, facingMode: 'user' },
        audio: false
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => undefined);
      }
      setStatus('live');
    } catch (err) {
      const name = err instanceof DOMException ? err.name : '';
      setStatus(name === 'NotFoundError' || name === 'OverconstrainedError' ? 'unavailable' : 'denied');
    }
  }, [setStatus]);

  const togglePause = useCallback(() => {
    if (status === 'live') setStatus('paused');else
    if (status === 'paused') setStatus('live');
  }, [status, setStatus]);

  // Frame capture loop
  useEffect(() => {
    if (status !== 'live') return;
    if (!canvasRef.current) {
      canvasRef.current = document.createElement('canvas');
      canvasRef.current.width = CAPTURE_WIDTH;
      canvasRef.current.height = CAPTURE_HEIGHT;
    }
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const id = window.setInterval(() => {
      const video = videoRef.current;
      if (!video || !ctx || video.readyState < 2) return;
      ctx.drawImage(video, 0, 0, CAPTURE_WIDTH, CAPTURE_HEIGHT);
      onFrameRef.current(canvas.toDataURL('image/jpeg', 0.65));
    }, CAPTURE_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [status]);

  // Release the camera on unmount
  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, []);

  return { videoRef, start, stop, togglePause };
}
import React, { useCallback, useEffect, useRef, useState } from 'react';
import jsQR from 'jsqr';
import { Camera, CameraOff, Loader2, SwitchCamera } from 'lucide-react';

import { Button } from '@/components/ui/button';

/**
 * Reads a student's clearance code from the camera.
 *
 * Decoding runs on an animation frame against an offscreen canvas rather
 * than on a timer, so it keeps pace with the preview on a phone instead of
 * queueing work the device cannot finish. The stream is stopped on every
 * exit path — unmount, tab change, camera switch — because a camera left
 * running is both a battery drain and a light that stays on.
 */
const QrScanner = ({ onDetected, paused = false }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const frameRef = useRef(null);
  const streamRef = useRef(null);
  // Read through a ref so the scan loop never restarts when they change
  const pausedRef = useRef(paused);
  const lastTokenRef = useRef({ value: null, at: 0 });

  const [facingMode, setFacingMode] = useState('environment');
  const [status, setStatus] = useState('starting');
  const [error, setError] = useState('');

  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  const stop = useCallback(() => {
    if (frameRef.current) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }, []);

  useEffect(() => {
    let cancelled = false;

    const scan = () => {
      frameRef.current = requestAnimationFrame(scan);

      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (pausedRef.current || !video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) {
        return;
      }

      // Decode at a capped width: a 1080p frame costs several times more to
      // scan and reads no better than a 480px one
      const scale = Math.min(1, 480 / video.videoWidth);
      const width = Math.round(video.videoWidth * scale);
      const height = Math.round(video.videoHeight * scale);

      if (!width || !height) return;

      canvas.width = width;
      canvas.height = height;

      const context = canvas.getContext('2d', { willReadFrequently: true });
      context.drawImage(video, 0, 0, width, height);

      const { data } = context.getImageData(0, 0, width, height);
      const found = jsQR(data, width, height, { inversionAttempts: 'dontInvert' });

      if (!found?.data) return;

      // The same card stays in frame for many frames; only report it once
      const now = Date.now();
      const last = lastTokenRef.current;

      if (last.value === found.data && now - last.at < 2500) return;

      lastTokenRef.current = { value: found.data, at: now };
      onDetected(found.data.trim());
    };

    const start = async () => {
      setStatus('starting');
      setError('');

      if (!navigator.mediaDevices?.getUserMedia) {
        setStatus('error');
        setError('This browser cannot open a camera. Enter the ID number instead.');
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode, width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        });

        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
        }

        setStatus('scanning');
        frameRef.current = requestAnimationFrame(scan);
      } catch (err) {
        if (cancelled) return;

        setStatus('error');
        setError(
          err?.name === 'NotAllowedError'
            ? 'Camera access was blocked. Allow it in your browser settings, or enter the ID number instead.'
            : 'No camera could be opened. Enter the ID number instead.'
        );
      }
    };

    start();

    return () => {
      cancelled = true;
      stop();
    };
  }, [facingMode, onDetected, stop]);

  // A backgrounded tab should not hold the camera open
  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden) stop();
    };

    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [stop]);

  return (
    <div className="relative w-full aspect-square max-w-sm mx-auto rounded-2xl overflow-hidden bg-gray-900">
      <video
        ref={videoRef}
        playsInline
        muted
        className="w-full h-full object-cover"
      />
      <canvas ref={canvasRef} className="hidden" />

      {/* Reticle */}
      {status === 'scanning' && (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <div className="w-2/3 h-2/3 relative">
            {['top-0 left-0 border-t-4 border-l-4', 'top-0 right-0 border-t-4 border-r-4',
              'bottom-0 left-0 border-b-4 border-l-4', 'bottom-0 right-0 border-b-4 border-r-4'].map((corner) => (
              <span key={corner} className={`absolute w-8 h-8 border-white/90 rounded-sm ${corner}`} />
            ))}
          </div>
        </div>
      )}

      {status === 'starting' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white gap-3">
          <Loader2 className="w-8 h-8 animate-spin" />
          <p className="text-sm">Opening the camera…</p>
        </div>
      )}

      {status === 'error' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white gap-3 p-6 text-center">
          <CameraOff className="w-10 h-10 text-white/70" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {paused && status === 'scanning' && (
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
          <p className="text-white text-sm font-medium">Paused</p>
        </div>
      )}

      {status === 'scanning' && (
        <Button
          type="button"
          size="icon"
          variant="secondary"
          onClick={() => setFacingMode((mode) => (mode === 'environment' ? 'user' : 'environment'))}
          className="absolute bottom-3 right-3 h-10 w-10 rounded-full bg-white/90 cursor-pointer"
          title="Switch camera"
        >
          <SwitchCamera className="w-5 h-5" />
        </Button>
      )}

      {status === 'scanning' && (
        <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-black/50 text-white text-xs px-2.5 py-1 rounded-full">
          <Camera className="w-3.5 h-3.5" /> Scanning
        </div>
      )}
    </div>
  );
};

export default QrScanner;

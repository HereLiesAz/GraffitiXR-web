import React, { useRef, useEffect, useState, useMemo } from 'react';
import { useMainViewModel } from '../hooks/useMainViewModel';
import { GestureHandler } from '../utils/GestureHandler';

const OverlayScreen = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const { uiState, updateState } = useMainViewModel();
  const [imageBitmap, setImageBitmap] = useState(null);

  const uiStateRef = useRef(uiState);
  useEffect(() => { uiStateRef.current = uiState; }, [uiState]);

  // 1. Camera Feed Logic
  useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'environment' },
            audio: false
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Error accessing camera:", err);
      }
    };

    startCamera();

    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = videoRef.current.srcObject.getTracks();
        tracks.forEach(track => track.stop());
      }
    };
  }, []);

  // 2. Load Image
  useEffect(() => {
    if (uiState.overlayImageUri) {
      const img = new Image();
      img.src = uiState.overlayImageUri;
      img.onload = () => {
        setImageBitmap(img);
      };
    }
  }, [uiState.overlayImageUri]);

  // 3. Gesture Handler
  useEffect(() => {
      if (!containerRef.current) return;

      const handler = new GestureHandler(containerRef.current, {
          onScale: (factor) => {
              const current = uiStateRef.current;
              const newScale = current.scale * factor;
              updateState({ scale: newScale });
          },
          onRotate: (deltaRadians) => {
              // Convert to degrees for CSS
              const current = uiStateRef.current;
              const deltaDegrees = deltaRadians * (180 / Math.PI);
              const newRot = current.rotationZ + deltaDegrees;
              updateState({ rotationZ: newRot });
          },
          onPan: (dx, dy) => {
              const current = uiStateRef.current;
              const newOffset = {
                  x: current.offset.x + dx,
                  y: current.offset.y + dy
              };
              updateState({ offset: newOffset });
          }
      });

      return () => handler.destroy();
  }, []);

  // 4. Render Logic (CSS Transforms for "1:1" feel of 2D overlay)
  // Android uses Canvas drawing with Matrix. We can use CSS transform on the image element.
  // We need to apply Color Filters. CSS `filter` property supports brightness, contrast, saturation, opacity.
  // Color Balance is harder in CSS filter (needs SVG filter or Canvas).
  // For now, standard filters.

  const imageStyle = useMemo(() => {
      if (!imageBitmap) return { display: 'none' };

      const {
          scale, rotationZ, offset,
          opacity, brightness, contrast, saturation
      } = uiState;

      // Map Android values to CSS
      // Brightness: Android 0..1? PWA 0..2?
      // If PWA state is 0 (neutral) -> CSS 100%? Or CSS brightness(1).
      // Let's assume standard CSS: 1 = 100%.
      // Our shader used additive.
      // Let's use CSS brightness(1 + val).

      return {
          position: 'absolute',
          top: '50%',
          left: '50%',
          width: imageBitmap.width,
          height: imageBitmap.height,
          transform: `translate(-50%, -50%) translate(${offset.x}px, ${offset.y}px) rotate(${rotationZ}deg) scale(${scale})`,
          opacity: opacity,
          filter: `brightness(${1 + brightness}) contrast(${contrast}) saturate(${saturation})`,
          // Note: Color Balance not supported in CSS filter efficiently without SVG.
          // Ignoring R/G/B knobs for Overlay Mode for now (or implement Canvas rendering).
      };
  }, [uiState, imageBitmap]);

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', backgroundColor: 'black' }}>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            position: 'absolute',
            top: 0,
            left: 0
        }}
      />
      {imageBitmap && (
          <img
            src={uiState.overlayImageUri}
            alt="Overlay"
            style={imageStyle}
            draggable={false}
          />
      )}
    </div>
  );
};

export default OverlayScreen;

import React, { useRef, useEffect, useState, useMemo } from 'react';
import { useMainViewModel } from '../hooks/useMainViewModel';
import { GestureHandler } from '../utils/GestureHandler';

const MockupScreen = () => {
  const containerRef = useRef(null);
  const { uiState, updateState } = useMainViewModel();
  const [overlayBitmap, setOverlayBitmap] = useState(null);

  const uiStateRef = useRef(uiState);
  useEffect(() => { uiStateRef.current = uiState; }, [uiState]);

  // Background Image? Not in MainViewModel yet.
  // Let's assume uiState.backgroundImageUri logic.

  // Logic is very similar to OverlayScreen, but "Background" is an image instead of Video.

  // 1. Load Background Image
  // Android uses AsyncImage.

  // 2. Load Overlay Image
  useEffect(() => {
    if (uiState.overlayImageUri) {
      const img = new Image();
      img.src = uiState.overlayImageUri;
      img.onload = () => {
        setOverlayBitmap(img);
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

  const overlayStyle = useMemo(() => {
      if (!overlayBitmap) return { display: 'none' };
      const { scale, rotationZ, offset, opacity, brightness, contrast, saturation } = uiState;
      return {
          position: 'absolute',
          top: '50%',
          left: '50%',
          width: overlayBitmap.width,
          height: overlayBitmap.height,
          transform: `translate(-50%, -50%) translate(${offset.x}px, ${offset.y}px) rotate(${rotationZ}deg) scale(${scale})`,
          opacity: opacity,
          filter: `brightness(${1 + brightness}) contrast(${contrast}) saturate(${saturation})`
      };
  }, [uiState, overlayBitmap]);

  const handleBackgroundClick = () => {
      // Logic to pick background? Or handled by NavRail "Wall" button?
      // Android: "onBackgroundImageSelected" callback.
      // In PWA MainScreen, "Wall" button should trigger file picker.
      // I need to implement that connection.
  };

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', backgroundColor: '#333' }}>
      {uiState.backgroundImageUri ? (
          <img
            src={uiState.backgroundImageUri}
            alt="Background"
            style={{ width: '100%', height: '100%', objectFit: 'contain' }} // or cover?
          />
      ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#888' }}>
              Tap "Wall" to select background
          </div>
      )}

      {overlayBitmap && (
          <img
            src={uiState.overlayImageUri}
            alt="Overlay"
            style={overlayStyle}
            draggable={false}
          />
      )}
    </div>
  );
};

export default MockupScreen;

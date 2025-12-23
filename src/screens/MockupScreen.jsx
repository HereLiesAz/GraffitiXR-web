import React, { useRef, useEffect, useState, useMemo } from 'react';
import { useMainViewModel } from '../hooks/useMainViewModel';
import { GestureHandler } from '../utils/GestureHandler';
import { calculateHomography } from '../utils/Homography';

const MockupScreen = () => {
  const containerRef = useRef(null);
  const { uiState, updateState } = useMainViewModel();
  const [overlayBitmap, setOverlayBitmap] = useState(null);

  // Perspective Warp State (Corners)
  const [corners, setCorners] = useState(null);
  const activeHandleRef = useRef(null);

  const uiStateRef = useRef(uiState);
  useEffect(() => { uiStateRef.current = uiState; }, [uiState]);

  useEffect(() => {
    const uri = (uiState.isBackgroundRemovalEnabled && uiState.backgroundRemovedImageUri)
        ? uiState.backgroundRemovedImageUri
        : uiState.overlayImageUri;

    if (uri) {
      const img = new Image();
      img.src = uri;
      img.onload = () => {
        setOverlayBitmap(img);
        // Initialize corners at image boundary
        // We will map these to screen coordinates later or keep local
        // Let's keep them relative to image unwarped size for now?
        // No, perspective warp maps source rect to destination quad.
        // Destination quad is what we drag.
        // Initial dest quad = source rect.
        // Only reset corners if image dimensions changed significantly or it's a new load
        // For BG removal toggle, dimensions might be same (transparent padding) or cropped.
        // imgly usually returns same dimension or cropped?
        // If cropped, we need to reset corners to match new bounds.
        setCorners([
            { x: 0, y: 0 },
            { x: img.width, y: 0 },
            { x: img.width, y: img.height },
            { x: 0, y: img.height }
        ]);
      };
    }
  }, [uiState.overlayImageUri, uiState.isBackgroundRemovalEnabled, uiState.backgroundRemovedImageUri]);

  // Handle Drag
  const handlePointerDown = (index, e) => {
      e.stopPropagation(); // Prevent gesture handler
      activeHandleRef.current = { index, startX: e.clientX, startY: e.clientY };
  };

  const handlePointerMove = (e) => {
      if (activeHandleRef.current !== null && corners) {
          e.preventDefault();
          const { index } = activeHandleRef.current;
          const rect = containerRef.current.getBoundingClientRect();
          // Calculate local position relative to image center/transform?
          // This is tricky because the handles themselves should be part of the transform?
          // No, usually handles are overlay controls in screen space (or container space),
          // and we warp the image to match them.

          // Let's assume corners are in "Overlay Local Space" (before warp).
          // But wait, warp *defines* the corners.
          // Simplest approach: Render handles in a container that has Scale/Rotate/Translate applied.
          // Then warp is applied *inside* that container relative to those handles?
          // Or handles are screen space?

          // Android implementation usually defines corners in 0..1 space or pixel space of the bitmap.
          // Let's implement handles in "Image Space" but rendered on top.
          // If we drag a handle, we update its coordinate.

          // Since we already apply Scale/Rotate/Translate to the image container,
          // the corners should be relative to that container's origin (top-left of unwarped image).

          // We need to map pointer delta to local delta.
          // Ignoring rotation/scale for handle drag for a moment is dangerous.
          // Correct way: Map screen delta to local space delta using inverse transform.
          // Or just update the corner value and let the visual update?

          // Simplified: We assume `corners` are simply the destination points in local image space.
          // We apply `matrix3d` to the image to map [0,0]...[w,h] to [c0]...[c3].

          // Math for delta:
          // Local Scale/Rot is applied via CSS `transform`.
          // If we are inside that transformed div, coordinates are local.
          // But handles usually shouldn't be warped *with* the image, they define the warp.

          // Strategy:
          // 1. Render a container `<div>` with S/R/T transform.
          // 2. Inside, render the Image with `matrix3d` (Perspective).
          // 3. Inside, render Handles at `corners` coordinates.
          // 4. Dragging handle updates `corners`.

          // If we are inside the transformed container, mouse events are in transformed space?
          // No, clientX is screen. We need to project.
          // For now, let's implement basic delta update assuming scale=1 rot=0 for testing,
          // or try to project.

          const sensitivity = 1 / uiState.scale; // Simple compensation
          // Rotation compensation is harder.

          const deltaX = (e.clientX - activeHandleRef.current.startX) * sensitivity;
          const deltaY = (e.clientY - activeHandleRef.current.startY) * sensitivity;

          // Apply rotation compensation
          const rad = -uiState.rotationZ * (Math.PI / 180);
          const localDX = deltaX * Math.cos(rad) - deltaY * Math.sin(rad);
          const localDY = deltaX * Math.sin(rad) + deltaY * Math.cos(rad);

          const newCorners = [...corners];
          newCorners[index] = {
              x: newCorners[index].x + localDX,
              y: newCorners[index].y + localDY
          };
          setCorners(newCorners);
          activeHandleRef.current.startX = e.clientX;
          activeHandleRef.current.startY = e.clientY;
      }
  };

  const handlePointerUp = () => {
      activeHandleRef.current = null;
  };

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

  const transformStyle = useMemo(() => {
      if (!overlayBitmap || !corners) return { display: 'none' };

      const { scale, rotationZ, offset, opacity, brightness, contrast, saturation } = uiState;

      // Calculate Homography
      const w = overlayBitmap.width;
      const h = overlayBitmap.height;
      const src = [
          { x: 0, y: 0 },
          { x: w, y: 0 },
          { x: w, y: h },
          { x: 0, y: h }
      ];

      // H maps src to corners
      const H = calculateHomography(src, corners);

      // Convert 3x3 H to 4x4 CSS Matrix
      // Matrix3d(a1, b1, c1, d1, a2, b2, c2, d2, a3, b3, c3, d3, a4, b4, c4, d4)
      // col-major
      // H = [h0, h1, h2, h3, h4, h5, h6, h7, 1] (row major from our function?)
      // Our function returns simple array. Let's verify indexing.
      // solveGaussian returns x.
      // If we mapped:
      // x' = (h0*x + h1*y + h2) / (h6*x + h7*y + 1)
      // y' = (h3*x + h4*y + h5) / ...

      // CSS matrix3d is:
      // a1 a2 a3 a4
      // b1 b2 b3 b4
      // c1 c2 c3 c4
      // d1 d2 d3 d4

      // x' = a1*x + b1*y + d1*1  ...

      // So mapping H to Matrix3d:
      // a1=h0, b1=h1, d1=h2
      // a2=h3, b2=h4, d2=h5
      // a4=h6, b4=h7, d4=1
      // c lines are 0, 0, 1, 0

      const cssMatrix = [
          H[0], H[3], 0, H[6],
          H[1], H[4], 0, H[7],
          0,    0,    1, 0,
          H[2], H[5], 0, 1
      ].join(',');

      return {
          position: 'absolute',
          top: '50%',
          left: '50%',
          width: w,
          height: h,
          // Apply SRT first (Container), then Warp?
          // If we put handles in the same container, yes.
          transform: `translate(-50%, -50%) translate(${offset.x}px, ${offset.y}px) rotate(${rotationZ}deg) scale(${scale}) matrix3d(${cssMatrix})`,
          opacity: opacity,
          filter: `brightness(${1 + brightness}) contrast(${contrast}) saturate(${saturation})`,
          transformOrigin: '0 0' // Matrix applies from top-left
      };
  }, [uiState, overlayBitmap, corners]);

  return (
    <div
        ref={containerRef}
        style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', backgroundColor: '#333' }}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
    >
      {uiState.backgroundImageUri ? (
          <img
            src={uiState.backgroundImageUri}
            alt="Background"
            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
          />
      ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#888' }}>
              Tap "Wall" to select background
          </div>
      )}

      {overlayBitmap && corners && (
          <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: overlayBitmap.width,
              height: overlayBitmap.height,
              // Apply Base Transform to container
              transform: `translate(-50%, -50%) translate(${uiState.offset.x}px, ${uiState.offset.y}px) rotate(${uiState.rotationZ}deg) scale(${uiState.scale})`,
              transformOrigin: 'center'
          }}>
              {/* Image with Perspective Warp */}
              <img
                src={(uiState.isBackgroundRemovalEnabled && uiState.backgroundRemovedImageUri) ? uiState.backgroundRemovedImageUri : uiState.overlayImageUri}
                alt="Overlay"
                style={{
                    width: '100%', height: '100%',
                    transform: `matrix3d(${
                        // Re-calculate local matrix here or pass from memo?
                        // The memo above combined them. Let's split.
                        // We need the matrix to apply ONLY to the image inside this container.
                        (() => {
                             const w = overlayBitmap.width;
                             const h = overlayBitmap.height;
                             const src = [{x:0,y:0}, {x:w,y:0}, {x:w,y:h}, {x:0,y:h}];
                             const H = calculateHomography(src, corners);
                             return [
                                H[0], H[3], 0, H[6],
                                H[1], H[4], 0, H[7],
                                0,    0,    1, 0,
                                H[2], H[5], 0, 1
                            ].join(',');
                        })()
                    })`,
                    transformOrigin: '0 0',
                    opacity: uiState.opacity,
                    filter: `brightness(${1 + uiState.brightness}) contrast(${uiState.contrast}) saturate(${uiState.saturation})`
                }}
                draggable={false}
              />

              {/* Handles */}
              {corners.map((corner, i) => (
                  <div
                    key={i}
                    onPointerDown={(e) => handlePointerDown(i, e)}
                    style={{
                        position: 'absolute',
                        left: corner.x,
                        top: corner.y,
                        width: 20, height: 20,
                        backgroundColor: 'white',
                        border: '2px solid black',
                        borderRadius: '50%',
                        transform: 'translate(-50%, -50%)',
                        cursor: 'crosshair',
                        pointerEvents: 'auto'
                    }}
                  />
              ))}
          </div>
      )}
    </div>
  );
};

export default MockupScreen;

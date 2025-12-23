import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { ARButton } from 'three/examples/jsm/webxr/ARButton.js';
import { XRControllerModelFactory } from 'three/examples/jsm/webxr/XRControllerModelFactory.js';
import { useMainViewModel } from '../hooks/useMainViewModel';
import { OverlayMesh } from '../components/OverlayMesh';
import { GestureHandler } from '../utils/GestureHandler';

const ARScreen = () => {
  const containerRef = useRef(null);
  const { uiState, updateState, setPlacementMode } = useMainViewModel();

  // Refs for Three.js globals
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const reticleRef = useRef(null);
  const overlayMeshInstanceRef = useRef(null);

  const uiStateRef = useRef(uiState);
  useEffect(() => { uiStateRef.current = uiState; }, [uiState]);

  // 1. Initialize Three.js
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 10);
    camera.position.set(0, 1.6, 3);
    cameraRef.current = camera;
    scene.add(camera);

    const light = new THREE.DirectionalLight(0xffffff);
    light.position.set(1, 1, 1).normalize();
    scene.add(light);

    const reticle = new THREE.Mesh(
      new THREE.RingGeometry(0.15, 0.2, 32).rotateX(-Math.PI / 2),
      new THREE.MeshBasicMaterial()
    );
    reticle.matrixAutoUpdate = false;
    reticle.visible = false;
    scene.add(reticle);
    reticleRef.current = reticle;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.xr.enabled = true;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const arButton = ARButton.createButton(renderer, {
      requiredFeatures: ['hit-test'],
      optionalFeatures: ['dom-overlay'],
      domOverlay: { root: document.body }
    });
    document.body.appendChild(arButton);

    const controller1 = renderer.xr.getController(0);
    controller1.addEventListener('select', onSelect);
    scene.add(controller1);

    const controller2 = renderer.xr.getController(1);
    controller2.addEventListener('select', onSelect);
    scene.add(controller2);

    const controllerModelFactory = new XRControllerModelFactory();
    const controllerGrip1 = renderer.xr.getControllerGrip(0);
    controllerGrip1.add(controllerModelFactory.createControllerModel(controllerGrip1));
    scene.add(controllerGrip1);

    const controllerGrip2 = renderer.xr.getControllerGrip(1);
    controllerGrip2.add(controllerModelFactory.createControllerModel(controllerGrip2));
    scene.add(controllerGrip2);

    const overlay = new OverlayMesh();
    overlay.visible = false;
    scene.add(overlay);
    overlayMeshInstanceRef.current = overlay;

    // Gesture Handler
    const gestureHandler = new GestureHandler(document.body, {
        onScale: (scaleFactor) => {
            if (overlay.visible) {
                // Update local mesh immediately for smoothness
                overlay.scale.multiplyScalar(scaleFactor);
                // Debounce/Throttling state update recommended, but for now direct update
                // Need to read current scale from state or mesh?
                // Better to update state and let useEffect sync, but that might be slow loop.
                // Hybrid: Update mesh, commit to state on end?
                // GestureHandler doesn't have onEnd callback yet for this purpose.
                // For "1:1 port" correctness, we should update state.
                const newScale = uiStateRef.current.scale * scaleFactor;
                updateState({ scale: newScale });
            }
        },
        onRotate: (rotationDelta) => {
             if (overlay.visible) {
                 overlay.rotateZ(rotationDelta); // Rotate around Z (up/normal)
                 const newRot = uiStateRef.current.rotationZ + (rotationDelta * (180/Math.PI));
                 updateState({ rotationZ: newRot });
             }
        },
        onPan: (deltaX, deltaY) => {
            // Pan logic needs projection to ground plane.
            // Simplified: Move relative to camera view?
            // Android uses `TranslationGestureDetector`.
            // Let's implement simple X/Z movement based on camera orientation later.
        }
    });

    window.addEventListener('resize', onWindowResize);
    renderer.setAnimationLoop(render);

    let hitTestSource = null;
    let hitTestSourceRequested = false;

    function render(timestamp, frame) {
        if (!renderer || !scene || !camera) return;

        if (frame) {
            const referenceSpace = renderer.xr.getReferenceSpace();
            const session = renderer.xr.getSession();

            if (hitTestSourceRequested === false) {
                session.requestReferenceSpace('viewer').then((refSpace) => {
                    session.requestHitTestSource({ space: refSpace }).then((source) => {
                        hitTestSource = source;
                    }).catch((err) => console.error("Hit Test Error", err));
                });
                session.addEventListener('end', () => {
                    hitTestSourceRequested = false;
                    hitTestSource = null;
                });
                hitTestSourceRequested = true;
            }

            if (hitTestSource) {
                const hitTestResults = frame.getHitTestResults(hitTestSource);
                // Only update and show reticle if in Placement Mode
                if (uiStateRef.current.isArPlacementMode && hitTestResults.length > 0) {
                    const hit = hitTestResults[0];
                    reticle.visible = true;
                    reticle.matrix.fromArray(hit.getPose(referenceSpace).transform.matrix);
                } else {
                    reticle.visible = false;
                }
            }
        }
        renderer.render(scene, camera);
    }

    return () => {
      gestureHandler.destroy();
      renderer.setAnimationLoop(null);
      window.removeEventListener('resize', onWindowResize);
      if (containerRef.current && renderer.domElement) {
        containerRef.current.removeChild(renderer.domElement);
      }
      if (arButton) document.body.removeChild(arButton);
    };
  }, []);

  // 2. Handle Overlay Image Loading
  useEffect(() => {
    if (uiState.overlayImageUri && overlayMeshInstanceRef.current) {
        new THREE.TextureLoader().load(uiState.overlayImageUri, (texture) => {
            overlayMeshInstanceRef.current.updateTexture(texture);
        });
    }
  }, [uiState.overlayImageUri]);

  // 3. Handle Adjustments & Transform State Sync
  useEffect(() => {
      if (overlayMeshInstanceRef.current) {
          overlayMeshInstanceRef.current.updateAdjustments(uiState);

          // Sync transforms if state changed externally (or by gesture loop)
          // Scale
          const s = 0.5 * uiState.scale; // Base scale 0.5
          // We only set scale if it deviates significantly to avoid fighting with gesture loop?
          // No, gesture loop updates state, state triggers this.
          // Ideally we set it here.
          // overlayMeshInstanceRef.current.scale.set(s, s, s);
          // But wait, if aspect ratio changes, Y scale might be different.
          // OverlayMesh.updateTexture handles geometry aspect.
          // So uniform scale is fine.
          overlayMeshInstanceRef.current.scale.setScalar(s);

          // Rotation
          // overlayMeshInstanceRef.current.rotation.z = uiState.rotationZ * (Math.PI / 180);
          // But wait, we placed it using quaternion from reticle.
          // We should rotate LOCAL Z?
          // The android app maintains `rotationY` (up axis in Unity/ARCore?)
          // In ThreeJS default, Y is up.
          // If plane is horizontal, normal is Y. So we rotate around Y?
          // But Reticle is rotated -90 X.
          // Let's assume Z rotation for now as per `OverlayMesh` being a plane.
      }
  }, [
      uiState.opacity, uiState.brightness, uiState.contrast, uiState.saturation,
      uiState.colorBalanceR, uiState.colorBalanceG, uiState.colorBalanceB,
      uiState.scale, uiState.rotationZ
  ]);

  const onSelect = () => {
    const reticle = reticleRef.current;
    const overlay = overlayMeshInstanceRef.current;

    if (reticle && reticle.visible && overlay) {
        overlay.position.setFromMatrixPosition(reticle.matrix);
        overlay.quaternion.setFromRotationMatrix(reticle.matrix);
        overlay.visible = true;
    }
  };

  const onWindowResize = () => {
    if (cameraRef.current && rendererRef.current) {
      cameraRef.current.aspect = window.innerWidth / window.innerHeight;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(window.innerWidth, window.innerHeight);
    }
  };

  return <div ref={containerRef} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }} />;
};

export default ARScreen;

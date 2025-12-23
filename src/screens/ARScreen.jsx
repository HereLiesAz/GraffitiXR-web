import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { ARButton } from 'three/examples/jsm/webxr/ARButton.js';
import { XRControllerModelFactory } from 'three/examples/jsm/webxr/XRControllerModelFactory.js';
import { useMainViewModel } from '../hooks/useMainViewModel';
import { OverlayMesh } from '../components/OverlayMesh';

const ARScreen = () => {
  const containerRef = useRef(null);
  const { uiState } = useMainViewModel();

  // Refs for Three.js globals
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const reticleRef = useRef(null);
  const overlayMeshInstanceRef = useRef(null); // Instance of OverlayMesh class

  // Mutable state for render loop access
  const uiStateRef = useRef(uiState);
  useEffect(() => { uiStateRef.current = uiState; }, [uiState]);

  // 1. Initialize Three.js (Run once)
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

    // Reticle
    const reticle = new THREE.Mesh(
      new THREE.RingGeometry(0.15, 0.2, 32).rotateX(-Math.PI / 2),
      new THREE.MeshBasicMaterial()
    );
    reticle.matrixAutoUpdate = false;
    reticle.visible = false;
    scene.add(reticle);
    reticleRef.current = reticle;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.xr.enabled = true;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // AR Button
    const arButton = ARButton.createButton(renderer, {
      requiredFeatures: ['hit-test'],
      optionalFeatures: ['dom-overlay'],
      domOverlay: { root: document.body }
    });
    document.body.appendChild(arButton);

    // Controllers
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

    // Overlay Mesh Init
    const overlay = new OverlayMesh();
    overlay.visible = false;
    scene.add(overlay);
    overlayMeshInstanceRef.current = overlay;

    window.addEventListener('resize', onWindowResize);
    renderer.setAnimationLoop(render);

    // Hit Test Source
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
                if (hitTestResults.length > 0) {
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
            // Don't auto-show yet? Or show if already placed?
            // For 1:1, usually waiting for placement.
            // But if we load *after* placement (change image), it should show.
            // Let's assume visibility is managed by "isArTargetCreated" or similar.
            // For now, if we have a texture, we allow placement.
        });
    }
  }, [uiState.overlayImageUri]);

  // 3. Handle Adjustments
  useEffect(() => {
      if (overlayMeshInstanceRef.current) {
          overlayMeshInstanceRef.current.updateAdjustments(uiState);
      }
  }, [
      uiState.opacity, uiState.brightness, uiState.contrast, uiState.saturation,
      uiState.colorBalanceR, uiState.colorBalanceG, uiState.colorBalanceB
  ]);

  const onSelect = () => {
    // Access current state via ref
    const reticle = reticleRef.current;
    const overlay = overlayMeshInstanceRef.current;

    if (reticle && reticle.visible && overlay) {
        overlay.position.setFromMatrixPosition(reticle.matrix);
        overlay.quaternion.setFromRotationMatrix(reticle.matrix);
        overlay.visible = true;
        // Notify ViewModel/State?
        // actions.setArTargetCreated(true);
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

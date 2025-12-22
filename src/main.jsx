import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import * as THREE from 'three';
import { ARButton } from 'three/examples/jsm/webxr/ARButton.js';
import { XRControllerModelFactory } from 'three/examples/jsm/webxr/XRControllerModelFactory.js';
import AzNavRail from './components/AzNavRail';
import UndoRedoRow from './components/UndoRedoRow';
import { AdjustmentsKnobsRow, ColorBalanceKnobsRow } from './components/AdjustmentsRow';
import './components/UIComponents.css';

const MAX_HISTORY = 20;

// Simple Toast Component
const Toast = ({ message, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  if (!message) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: '100px',
      left: '50%',
      transform: 'translateX(-50%)',
      backgroundColor: 'rgba(0,0,0,0.8)',
      color: 'white',
      padding: '10px 20px',
      borderRadius: '20px',
      zIndex: 3000,
      pointerEvents: 'none'
    }}>
      {message}
    </div>
  );
};

const App = () => {
  // Refs for Three.js globals
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const overlayMeshRef = useRef(null);
  const reticleRef = useRef(null);
  const controller1Ref = useRef(null);
  const controller2Ref = useRef(null);
  const hitTestSourceRef = useRef(null);
  const hitTestSourceRequestedRef = useRef(false);
  const spotlightRef = useRef(null);
  const containerRef = useRef(null);

  // Refs for Logic
  const undoStack = useRef([]);
  const redoStack = useRef([]);
  const isLockedRef = useRef(false);

  // State
  const [editorMode, setEditorMode] = useState('AR');
  const [activePanel, setActivePanel] = useState(null);
  const [overlayImage, setOverlayImage] = useState(false);
  const [adjustments, setAdjustments] = useState({
    opacity: 0.8,
    brightness: 0.5,
    contrast: 0.5,
    saturation: 0.5,
    scale: 1.0, // Kept for logic, but removed from UI to match original app
    r: 1.0, g: 1.0, b: 1.0
  });
  const [flashlightOn, setFlashlightOn] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // History UI state
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  const fileInputRef = useRef(null);
  const loadInputRef = useRef(null);

  // Sync isLocked ref
  useEffect(() => {
    isLockedRef.current = isLocked;
  }, [isLocked]);

  // Initialize Three.js
  useEffect(() => {
    const container = document.createElement('div');
    containerRef.current = container;
    document.body.appendChild(container);

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 10);
    camera.position.set(0, 1.6, 3);
    cameraRef.current = camera;
    scene.add(camera);

    const light = new THREE.DirectionalLight(0xffffff);
    light.position.set(1, 1, 1).normalize();
    scene.add(light);

    const spotlight = new THREE.SpotLight(0xffffff, 0);
    spotlight.position.set(0, 0, 0);
    camera.add(spotlight);
    spotlight.target = camera;
    scene.add(spotlight.target);
    spotlightRef.current = spotlight;

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
    controller1Ref.current = controller1;

    const controller2 = renderer.xr.getController(1);
    controller2.addEventListener('select', onSelect);
    scene.add(controller2);
    controller2Ref.current = controller2;

    const controllerModelFactory = new XRControllerModelFactory();
    const controllerGrip1 = renderer.xr.getControllerGrip(0);
    controllerGrip1.add(controllerModelFactory.createControllerModel(controllerGrip1));
    scene.add(controllerGrip1);

    const controllerGrip2 = renderer.xr.getControllerGrip(1);
    controllerGrip2.add(controllerModelFactory.createControllerModel(controllerGrip2));
    scene.add(controllerGrip2);

    window.addEventListener('resize', onWindowResize);
    renderer.setAnimationLoop(render);

    return () => {
      renderer.setAnimationLoop(null);
      window.removeEventListener('resize', onWindowResize);
      if (containerRef.current) document.body.removeChild(containerRef.current);
      if (arButton) document.body.removeChild(arButton);
    };
  }, []);

  const render = (timestamp, frame) => {
    const renderer = rendererRef.current;
    const scene = sceneRef.current;
    const camera = cameraRef.current;
    const reticle = reticleRef.current;

    if (!renderer || !scene || !camera) return;

    if (frame) {
      const referenceSpace = renderer.xr.getReferenceSpace();
      const session = renderer.xr.getSession();

      if (hitTestSourceRequestedRef.current === false) {
        session.requestReferenceSpace('viewer').then((referenceSpace) => {
          session.requestHitTestSource({ space: referenceSpace }).then((source) => {
            hitTestSourceRef.current = source;
          }).catch((err) => console.error("Error requesting hit test source", err));
        }).catch((err) => console.error("Error requesting reference space", err));

        session.addEventListener('end', () => {
          hitTestSourceRequestedRef.current = false;
          hitTestSourceRef.current = null;
        });
        hitTestSourceRequestedRef.current = true;
      }

      if (hitTestSourceRef.current) {
        const hitTestResults = frame.getHitTestResults(hitTestSourceRef.current);
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
  };

  const onSelect = () => {
    if (isLockedRef.current) return;

    if (reticleRef.current && reticleRef.current.visible && overlayMeshRef.current) {
      overlayMeshRef.current.position.setFromMatrixPosition(reticleRef.current.matrix);
      overlayMeshRef.current.quaternion.setFromRotationMatrix(reticleRef.current.matrix);
      overlayMeshRef.current.visible = true;
      pushHistory();
    }
  };

  const onWindowResize = () => {
    if (cameraRef.current && rendererRef.current) {
      cameraRef.current.aspect = window.innerWidth / window.innerHeight;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(window.innerWidth, window.innerHeight);
    }
  };

  const showToast = (msg) => {
    setToastMessage(msg);
  };

  const loadImageTexture = (dataUrl) => {
    new THREE.TextureLoader().load(dataUrl, (texture) => {
      if (overlayMeshRef.current) sceneRef.current.remove(overlayMeshRef.current);
      const aspect = texture.image.width / texture.image.height;
      const geometry = new THREE.PlaneGeometry(1, 1 / aspect);
      const material = new THREE.MeshBasicMaterial({
          map: texture,
          transparent: true,
          opacity: adjustments.opacity,
          side: THREE.DoubleSide
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.visible = false;
      sceneRef.current.add(mesh);
      overlayMeshRef.current = mesh;

      setOverlayImage(true);
      pushHistory();
      showToast("Image Loaded");
    });
  };

  const pushHistory = useCallback(() => {
    const mesh = overlayMeshRef.current;
    const state = {
        adjustments: { ...adjustments },
        transform: mesh ? {
            position: mesh.position.clone(),
            quaternion: mesh.quaternion.clone(),
            scale: mesh.scale.clone()
        } : null
    };
    undoStack.current.push(state);
    if (undoStack.current.length > MAX_HISTORY) undoStack.current.shift();
    redoStack.current.length = 0;
    setCanUndo(true);
    setCanRedo(false);
  }, [adjustments]);

  const handleUndo = () => {
    if (undoStack.current.length === 0) return;
    const mesh = overlayMeshRef.current;

    const currentState = {
        adjustments: { ...adjustments },
        transform: mesh ? {
            position: mesh.position.clone(),
            quaternion: mesh.quaternion.clone(),
            scale: mesh.scale.clone()
        } : null
    };
    redoStack.current.push(currentState);

    const prevState = undoStack.current.pop();
    applyState(prevState);
    setCanUndo(undoStack.current.length > 0);
    setCanRedo(true);
    showToast("Undo");
  };

  const handleRedo = () => {
    if (redoStack.current.length === 0) return;
    const mesh = overlayMeshRef.current;

    const currentState = {
        adjustments: { ...adjustments },
        transform: mesh ? {
            position: mesh.position.clone(),
            quaternion: mesh.quaternion.clone(),
            scale: mesh.scale.clone()
        } : null
    };
    undoStack.current.push(currentState);

    const nextState = redoStack.current.pop();
    applyState(nextState);
    setCanUndo(true);
    setCanRedo(redoStack.current.length > 0);
    showToast("Redo");
  };

  const applyState = (state) => {
      setAdjustments(state.adjustments);
      const mesh = overlayMeshRef.current;
      if (mesh && state.transform) {
          mesh.position.copy(state.transform.position);
          mesh.quaternion.copy(state.transform.quaternion);
          mesh.scale.copy(state.transform.scale);
      }
  };

  useEffect(() => {
    if (overlayMeshRef.current) {
      const mesh = overlayMeshRef.current;
      mesh.material.opacity = adjustments.opacity;

      // Basic Brightness/Color Balance Implementation
      // Brightness > 0.5 boosts color, < 0.5 darkens it. 0.5 is neutral.
      // Color Balance multiplies the channel.
      const brightnessMult = adjustments.brightness * 2; // 0..2

      mesh.material.color.setRGB(
          adjustments.r * brightnessMult,
          adjustments.g * brightnessMult,
          adjustments.b * brightnessMult
      );

      const baseScale = 0.5;
      const s = baseScale * adjustments.scale;
      mesh.scale.set(s, s, s);
    }
  }, [adjustments]);

  useEffect(() => {
    if (spotlightRef.current) {
        spotlightRef.current.intensity = flashlightOn ? 2 : 0;
    }
  }, [flashlightOn]);

  const saveProject = () => {
      const mesh = overlayMeshRef.current;
      const data = {
          version: 1,
          adjustments,
          transform: mesh ? {
            position: mesh.position.toArray(),
            quaternion: mesh.quaternion.toArray()
          } : null
      };
      const blob = new Blob([JSON.stringify(data)], {type: 'application/json'});
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'Project.gxr';
      a.click();
      URL.revokeObjectURL(url);
      showToast("Project Saved");
  };

  const loadProject = (e) => {
      const file = e.target.files[0];
      if(file) {
          const reader = new FileReader();
          reader.onload = (ev) => {
              try {
                  const data = JSON.parse(ev.target.result);
                  if (data.adjustments) setAdjustments(data.adjustments);
                  if (overlayMeshRef.current && data.transform) {
                      overlayMeshRef.current.position.fromArray(data.transform.position);
                      overlayMeshRef.current.quaternion.fromArray(data.transform.quaternion);
                  }
                  showToast("Project Loaded");
              } catch(err) {
                  console.error(err);
                  showToast("Failed to load project");
              }
          };
          reader.readAsText(file);
      }
  };

  const handleAdjustmentChange = (key, value) => {
      setAdjustments(prev => ({...prev, [key]: value}));
  };

  const navItems = useMemo(() => {
    const items = [
        { id: 'mode_host', text: 'Modes', isHeader: true },
        { id: 'ar', text: 'AR Mode', onClick: () => setEditorMode('AR'), isRailItem: false },
        { id: 'overlay', text: 'Overlay', onClick: () => setEditorMode('OVERLAY'), isRailItem: false },
        { id: 'mockup', text: 'Mockup', onClick: () => setEditorMode('MOCKUP'), isRailItem: false },
        { id: 'trace', text: 'Trace', onClick: () => setEditorMode('TRACE'), isRailItem: false },
        { id: 'div1', isDivider: true },
    ];

    if (editorMode === 'AR') {
        items.push(
            { id: 'target_host', text: 'Grid', isHeader: true },
            { id: 'create_target', text: 'Create', onClick: () => {
                if(reticleRef.current) reticleRef.current.visible = true;
                showToast("Grid Mode: Tap to Place");
            }},
            { id: 'refine_target', text: 'Refine', onClick: () => {} },
            { id: 'update_target', text: 'Update', onClick: () => {} },
            { id: 'div2', isDivider: true }
        );
    }

    items.push(
        { id: 'design_host', text: 'Design', isHeader: true },
        { id: 'open', text: 'Open', onClick: () => fileInputRef.current.click() }
    );

    if (editorMode === 'MOCKUP') {
      items.push({ id: 'wall', text: 'Wall', onClick: () => {} });
    }

    if (overlayImage) {
        items.push(
            { id: 'isolate', text: 'Isolate', onClick: () => {} },
            { id: 'outline', text: 'Outline', onClick: () => {} },
            { id: 'div3', isDivider: true },
            { id: 'adjust', text: 'Adjust', onClick: () => setActivePanel(curr => curr === 'adjust' ? null : 'adjust') },
            { id: 'balance', text: 'Balance', onClick: () => setActivePanel(curr => curr === 'balance' ? null : 'balance') },
            { id: 'blending', text: 'Blending', onClick: () => {} },
            { id: 'div4', isDivider: true }
        );
    }

    items.push(
        { id: 'settings_host', text: 'Settings', isHeader: true },
        { id: 'new', text: 'New', onClick: () => {
            if(overlayMeshRef.current) {
                sceneRef.current.remove(overlayMeshRef.current);
                overlayMeshRef.current = null;
                setOverlayImage(false);
                showToast("New Project Started");
            }
        }},
        { id: 'save', text: 'Save', onClick: saveProject },
        { id: 'load', text: 'Load', onClick: () => loadInputRef.current.click() },
        { id: 'export', text: 'Export', onClick: saveProject },
        { id: 'help', text: 'Help', onClick: () => {} },
        { id: 'div5', isDivider: true },
        { id: 'light', text: 'Light', isRailItem: true, onClick: () => setFlashlightOn(prev => !prev), color: 'white' },
        { id: 'lock', text: 'Lock', isRailItem: true, onClick: () => setIsLocked(prev => !prev), color: 'white' }
    );
    return items;
  }, [editorMode, overlayImage, activePanel]);

  return (
    <>
      <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept="image/*" onChange={(e) => {
          const file = e.target.files[0];
          if(file) {
              const reader = new FileReader();
              reader.onload = (ev) => loadImageTexture(ev.target.result);
              reader.readAsDataURL(file);
          }
      }} />
      <input type="file" ref={loadInputRef} style={{ display: 'none' }} accept=".json" onChange={loadProject} />

      {/* Rail collapsed by default */}
      <AzNavRail initiallyExpanded={false} content={navItems} settings={{ appName: 'GraffitiXR' }} />
      <Toast message={toastMessage} onClose={() => setToastMessage(null)} />

      <div style={{ position: 'absolute', bottom: '20px', left: '0', width: '100%', pointerEvents: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 2000 }}>

        {overlayImage && !isLocked && (
             <UndoRedoRow
                canUndo={canUndo}
                canRedo={canRedo}
                onUndo={handleUndo}
                onRedo={handleRedo}
                onMagic={() => {}}
             />
        )}

        {activePanel === 'adjust' && (
            <AdjustmentsKnobsRow
                opacity={adjustments.opacity}
                brightness={adjustments.brightness}
                contrast={adjustments.contrast}
                saturation={adjustments.saturation}
                onOpacityChange={(v) => handleAdjustmentChange('opacity', v)}
                onBrightnessChange={(v) => handleAdjustmentChange('brightness', v)}
                onContrastChange={(v) => handleAdjustmentChange('contrast', v)}
                onSaturationChange={(v) => handleAdjustmentChange('saturation', v)}
            />
        )}

        {activePanel === 'balance' && (
            <ColorBalanceKnobsRow
                r={adjustments.r}
                g={adjustments.g}
                b={adjustments.b}
                onRChange={(v) => handleAdjustmentChange('r', v)}
                onGChange={(v) => handleAdjustmentChange('g', v)}
                onBChange={(v) => handleAdjustmentChange('b', v)}
            />
        )}
      </div>
    </>
  );
};

const container = document.getElementById('app');
const root = createRoot(container);
root.render(<App />);

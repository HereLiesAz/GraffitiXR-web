import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import * as THREE from 'three';
import { ARButton } from 'three/examples/jsm/webxr/ARButton.js';
import { XRControllerModelFactory } from 'three/examples/jsm/webxr/XRControllerModelFactory.js';
import AzNavRail from './components/AzNavRail';
import UndoRedoRow from './components/UndoRedoRow';
import { AdjustmentsKnobsRow, ColorBalanceKnobsRow } from './components/AdjustmentsRow';
import './components/UIComponents.css';

let camera, scene, renderer;
let controller1, controller2;
let controllerGrip1, controllerGrip2;
let reticle;
let hitTestSource = null;
let hitTestSourceRequested = false;
let overlayMesh = null;
let spotlight = null;

// Undo/Redo Stacks
const undoStack = [];
const redoStack = [];

const MAX_HISTORY = 20;

const App = () => {
  // State
  const [editorMode, setEditorMode] = useState('AR'); // AR, OVERLAY, MOCKUP, TRACE
  const [activePanel, setActivePanel] = useState(null); // 'adjust', 'balance', 'settings', etc
  const [overlayImage, setOverlayImage] = useState(null);
  const [adjustments, setAdjustments] = useState({
    opacity: 0.8,
    brightness: 0.5,
    contrast: 0.5,
    saturation: 0.5,
    r: 1.0, g: 1.0, b: 1.0,
    scale: 1.0,
    rotationY: 0
  });
  const [flashlightOn, setFlashlightOn] = useState(false);
  const [isLocked, setIsLocked] = useState(false);

  // History state helper
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  const fileInputRef = useRef(null);
  const loadInputRef = useRef(null);

  // Apply changes to ThreeJS scene
  useEffect(() => {
    if (overlayMesh) {
      // Material updates
      overlayMesh.material.opacity = adjustments.opacity;
      overlayMesh.material.color.setRGB(adjustments.r, adjustments.g, adjustments.b);

      // Transform updates (local scale/rotation)
      // Note: Position is handled by AR placement/drag
      const baseScale = 0.5; // Base size
      const s = baseScale * adjustments.scale;
      overlayMesh.scale.set(s, s, s);
      // Rotation Y relative to initial placement is tricky without a parent container
      // For now, we just update material. Ideally we'd rotate the mesh.
    }
  }, [adjustments, overlayImage]);

  useEffect(() => {
    if (spotlight) {
        spotlight.intensity = flashlightOn ? 2 : 0;
    }
  }, [flashlightOn]);

  const pushHistory = useCallback(() => {
    // Save current state of adjustments and transform
    const state = {
        adjustments: { ...adjustments },
        transform: overlayMesh ? {
            position: overlayMesh.position.clone(),
            quaternion: overlayMesh.quaternion.clone(),
            scale: overlayMesh.scale.clone()
        } : null
    };
    undoStack.push(state);
    if (undoStack.length > MAX_HISTORY) undoStack.shift();
    redoStack.length = 0; // Clear redo
    setCanUndo(true);
    setCanRedo(false);
  }, [adjustments]);

  const handleUndo = () => {
    if (undoStack.length === 0) return;
    const currentState = {
        adjustments: { ...adjustments },
        transform: overlayMesh ? {
            position: overlayMesh.position.clone(),
            quaternion: overlayMesh.quaternion.clone(),
            scale: overlayMesh.scale.clone()
        } : null
    };
    redoStack.push(currentState);

    const prevState = undoStack.pop();
    applyState(prevState);
    setCanUndo(undoStack.length > 0);
    setCanRedo(true);
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const currentState = {
        adjustments: { ...adjustments },
        transform: overlayMesh ? {
            position: overlayMesh.position.clone(),
            quaternion: overlayMesh.quaternion.clone(),
            scale: overlayMesh.scale.clone()
        } : null
    };
    undoStack.push(currentState);

    const nextState = redoStack.pop();
    applyState(nextState);
    setCanUndo(true);
    setCanRedo(redoStack.length > 0);
  };

  const applyState = (state) => {
      setAdjustments(state.adjustments);
      if (overlayMesh && state.transform) {
          overlayMesh.position.copy(state.transform.position);
          overlayMesh.quaternion.copy(state.transform.quaternion);
          overlayMesh.scale.copy(state.transform.scale);
      }
  };

  const handleAdjustmentChange = (key, value) => {
      setAdjustments(prev => ({...prev, [key]: value}));
      // Note: Real-time dragging shouldn't push history every frame.
      // Ideally push on drag end. For now, we skip pushing here.
  };

  const handleFileSelect = (e) => {
      const file = e.target.files[0];
      if (file) {
          const reader = new FileReader();
          reader.onload = (ev) => {
              loadImageTexture(ev.target.result, () => {
                setOverlayImage(true);
                pushHistory(); // Save state after load
              });
          };
          reader.readAsDataURL(file);
      }
  };

  const saveProject = () => {
      const data = {
          version: 1,
          adjustments,
          transform: overlayMesh ? {
            position: overlayMesh.position.toArray(),
            quaternion: overlayMesh.quaternion.toArray()
          } : null
      };
      const blob = new Blob([JSON.stringify(data)], {type: 'application/json'});
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'Project.gxr';
      a.click();
  };

  const loadProject = (e) => {
      const file = e.target.files[0];
      if(file) {
          const reader = new FileReader();
          reader.onload = (ev) => {
              try {
                  const data = JSON.parse(ev.target.result);
                  if (data.adjustments) setAdjustments(data.adjustments);
                  if (overlayMesh && data.transform) {
                      overlayMesh.position.fromArray(data.transform.position);
                      overlayMesh.quaternion.fromArray(data.transform.quaternion);
                  }
                  // Note: Image texture isn't saved in JSON in this simple version
                  // User would need to reload image or we'd serialize base64 (too heavy?)
                  alert("Project settings loaded. Please re-open the image if needed.");
              } catch(err) {
                  console.error(err);
              }
          };
          reader.readAsText(file);
      }
  };

  // Nav Items Construction
  const navItems = [
    // --- MODES ---
    { id: 'mode_host', text: 'Modes', isHeader: true },
    { id: 'ar', text: 'AR Mode', onClick: () => setEditorMode('AR'), isRailItem: false },
    { id: 'overlay', text: 'Overlay', onClick: () => setEditorMode('OVERLAY'), isRailItem: false },
    { id: 'mockup', text: 'Mockup', onClick: () => setEditorMode('MOCKUP'), isRailItem: false },
    { id: 'trace', text: 'Trace', onClick: () => setEditorMode('TRACE'), isRailItem: false },
    { isDivider: true },
  ];

  if (editorMode === 'AR') {
      navItems.push(
          { id: 'target_host', text: 'Grid', isHeader: true },
          { id: 'create_target', text: 'Create', onClick: () => { /* Logic to enable placement */ reticle.visible = true; } },
          { id: 'refine_target', text: 'Refine', onClick: () => {} },
          { id: 'update_target', text: 'Update', onClick: () => {} },
          { isDivider: true }
      );
  }

  navItems.push(
      { id: 'design_host', text: 'Design', isHeader: true },
      { id: 'open', text: 'Open', onClick: () => fileInputRef.current.click() }
  );

  if (editorMode === 'MOCKUP') {
      navItems.push({ id: 'wall', text: 'Wall', onClick: () => {} });
  }

  if (overlayImage) {
      navItems.push(
          { id: 'isolate', text: 'Isolate', onClick: () => {} },
          { id: 'outline', text: 'Outline', onClick: () => {} },
          { isDivider: true },
          { id: 'adjust', text: 'Adjust', onClick: () => setActivePanel(activePanel === 'adjust' ? null : 'adjust') },
          { id: 'balance', text: 'Balance', onClick: () => setActivePanel(activePanel === 'balance' ? null : 'balance') },
          { id: 'blending', text: 'Blending', onClick: () => {} },
          { isDivider: true }
      );
  }

  navItems.push(
      { id: 'settings_host', text: 'Settings', isHeader: true },
      { id: 'new', text: 'New', onClick: () => {
          if(overlayMesh) { scene.remove(overlayMesh); overlayMesh = null; setOverlayImage(false); }
      }},
      { id: 'save', text: 'Save', onClick: saveProject },
      { id: 'load', text: 'Load', onClick: () => loadInputRef.current.click() },
      { id: 'export', text: 'Export', onClick: saveProject },
      { id: 'help', text: 'Help', onClick: () => {} },
      { isDivider: true },
      // Rail Items (Always visible in rail)
      { id: 'light', text: 'Light', isRailItem: true, onClick: () => setFlashlightOn(!flashlightOn), color: 'white' },
      { id: 'lock', text: 'Lock', isRailItem: true, onClick: () => setIsLocked(!isLocked), color: 'white' }
  );

  return (
    <>
      <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept="image/*" onChange={handleFileSelect} />
      <input type="file" ref={loadInputRef} style={{ display: 'none' }} accept=".json" onChange={loadProject} />

      <AzNavRail content={navItems} settings={{ appName: 'GraffitiXR' }} />

      <div style={{ position: 'absolute', bottom: '20px', left: '0', width: '100%', pointerEvents: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 2000 }}>

        {/* Undo/Redo Row */}
        {overlayImage && !isLocked && (
             <UndoRedoRow
                canUndo={canUndo}
                canRedo={canRedo}
                onUndo={handleUndo}
                onRedo={handleRedo}
                onMagic={() => {}}
             />
        )}

        {/* Adjustment Panels */}
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

// Mount React App
const uiContainer = document.createElement('div');
document.body.appendChild(uiContainer);
const root = createRoot(uiContainer);
root.render(<App />);

// ThreeJS Logic
init();

function init() {
  const container = document.createElement('div');
  document.body.appendChild(container);

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x222222);

  camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 10);
  camera.position.set(0, 1.6, 3);

  // Note: For AR, room geometry is usually not needed or should be transparent/shadow-only
  // but kept here for basic visual reference if not in AR mode (e.g. desktop debug)
  const room = new THREE.LineSegments(
    new THREE.BoxGeometry(6, 6, 6, 10, 10, 10),
    new THREE.LineBasicMaterial({ color: 0x808080 })
  );
  room.geometry.translate(0, 3, 0);
  room.visible = false; // Hide room for AR focus, or only show in VR/Debug
  scene.add(room);

  scene.add(new THREE.HemisphereLight(0x606060, 0x404040));

  const light = new THREE.DirectionalLight(0xffffff);
  light.position.set(1, 1, 1).normalize();
  scene.add(light);

  spotlight = new THREE.SpotLight(0xffffff, 0);
  spotlight.position.set(0, 0, 0);
  camera.add(spotlight);
  spotlight.target = camera;
  scene.add(camera);

  reticle = new THREE.Mesh(
    new THREE.RingGeometry(0.15, 0.2, 32).rotateX(-Math.PI / 2),
    new THREE.MeshBasicMaterial()
  );
  reticle.matrixAutoUpdate = false;
  reticle.visible = false;
  scene.add(reticle);

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.xr.enabled = true;
  container.appendChild(renderer.domElement);

  // Use ARButton for Augmented Reality
  document.body.appendChild(ARButton.createButton(renderer, {
    requiredFeatures: ['hit-test'],
    optionalFeatures: ['dom-overlay'],
    domOverlay: { root: document.body }
  }));

  controller1 = renderer.xr.getController(0);
  controller1.addEventListener('select', onSelect);
  scene.add(controller1);

  controller2 = renderer.xr.getController(1);
  controller2.addEventListener('select', onSelect);
  scene.add(controller2);

  const controllerModelFactory = new XRControllerModelFactory();

  controllerGrip1 = renderer.xr.getControllerGrip(0);
  controllerGrip1.add(controllerModelFactory.createControllerModel(controllerGrip1));
  scene.add(controllerGrip1);

  controllerGrip2 = renderer.xr.getControllerGrip(1);
  controllerGrip2.add(controllerModelFactory.createControllerModel(controllerGrip2));
  scene.add(controllerGrip2);

  window.addEventListener('resize', onWindowResize);
  renderer.setAnimationLoop(render);
}

function onSelect() {
  if (reticle.visible && overlayMesh) {
    // Place or move the mesh to reticle
    overlayMesh.position.setFromMatrixPosition(reticle.matrix);
    overlayMesh.quaternion.setFromRotationMatrix(reticle.matrix);
    overlayMesh.visible = true;
  }
}

function loadImageTexture(dataUrl, onLoad) {
  new THREE.TextureLoader().load(dataUrl, (texture) => {
    if (overlayMesh) scene.remove(overlayMesh);
    const aspect = texture.image.width / texture.image.height;
    // Default size 1m wide
    const geometry = new THREE.PlaneGeometry(1, 1 / aspect);
    const material = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        opacity: 0.8,
        side: THREE.DoubleSide
    });
    overlayMesh = new THREE.Mesh(geometry, material);
    overlayMesh.visible = false; // Hidden until placed
    scene.add(overlayMesh);
    if(onLoad) onLoad();
  });
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function render(timestamp, frame) {
  if (frame) {
    const referenceSpace = renderer.xr.getReferenceSpace();
    const session = renderer.xr.getSession();

    if (hitTestSourceRequested === false) {
      session.requestReferenceSpace('viewer').then((referenceSpace) => {
        session.requestHitTestSource({ space: referenceSpace }).then((source) => {
          hitTestSource = source;
        });
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

import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import * as THREE from 'three';
import { VRButton } from 'three/examples/jsm/webxr/VRButton.js';
import { XRControllerModelFactory } from 'three/examples/jsm/webxr/XRControllerModelFactory.js';
import AzNavRail from './components/AzNavRail';

let camera, scene, renderer;
let controller1, controller2;
let controllerGrip1, controllerGrip2;
let reticle;
let hitTestSource = null;
let hitTestSourceRequested = false;
let overlayMesh = null; // The imported image mesh

// History Stacks
const undoStack = [];
const redoStack = [];

// --- App Component for UI ---
const App = () => {
  const [drawingColor, setDrawingColor] = useState('White');
  const [drawingMode, setDrawingMode] = useState('Cube');
  const [opacity, setOpacity] = useState('100%');
  const [locked, setLocked] = useState(false);
  const fileInputRef = React.useRef(null);
  const loadInputRef = React.useRef(null);

  // Update global drawing settings
  useEffect(() => {
    const opVal = parseInt(opacity) / 100.0;
    updateDrawingSettings(drawingColor.toLowerCase(), drawingMode.toLowerCase(), opVal, locked);
  }, [drawingColor, drawingMode, opacity, locked]);

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        loadImageTexture(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLoadSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        loadProjectData(e.target.result);
      };
      reader.readAsText(file);
    }
  };

  const navItems = [
    {
      id: 'import',
      text: 'Import Image',
      onClick: () => fileInputRef.current.click(),
    },
    {
      id: 'save',
      text: 'Save Project',
      onClick: () => saveProject(),
    },
    {
      id: 'load',
      text: 'Load Project',
      onClick: () => loadInputRef.current.click(),
    },
    {
      id: 'undo',
      text: 'Undo',
      isRailItem: true,
      onClick: () => undo(),
      color: 'white'
    },
    {
      id: 'redo',
      text: 'Redo',
      isRailItem: true,
      onClick: () => redo(),
      color: 'white'
    },
    {
      id: 'opacity',
      isRailItem: true,
      isCycler: true,
      options: ['100%', '75%', '50%', '25%'],
      selectedOption: opacity,
      onClick: (opt) => setOpacity(opt),
      color: 'white'
    },
    {
      id: 'color',
      isRailItem: true,
      isCycler: true,
      options: ['White', 'Red', 'Green', 'Blue'],
      selectedOption: drawingColor,
      onClick: (option) => setDrawingColor(option),
      color: 'white'
    },
    {
      id: 'brush',
      isRailItem: true,
      isCycler: true,
      options: ['Cube', 'Sphere'],
      selectedOption: drawingMode,
      onClick: (option) => setDrawingMode(option),
      color: 'white'
    },
    {
      id: 'lock',
      isRailItem: true,
      isToggle: true,
      isChecked: locked,
      toggleOnText: 'Unlock',
      toggleOffText: 'Lock',
      onClick: () => setLocked(!locked),
      color: 'white'
    },
    {
      id: 'clear',
      text: 'Clear',
      isRailItem: true,
      onClick: () => clearScene(),
      color: 'red'
    }
  ];

  return (
    <>
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: 'none' }}
        accept="image/*"
        onChange={handleFileSelect}
      />
      <input
        type="file"
        ref={loadInputRef}
        style={{ display: 'none' }}
        accept=".json"
        onChange={handleLoadSelect}
      />
      <AzNavRail content={navItems} settings={{ appName: 'GraffitiXR' }} />
    </>
  );
};

// Mount React App
const uiContainer = document.createElement('div');
document.body.appendChild(uiContainer);
const root = createRoot(uiContainer);
root.render(<App />);

init();

function init() {
  const container = document.createElement('div');
  document.body.appendChild(container);

  // ThreeJS setup
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x222222);

  camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 10);
  camera.position.set(0, 1.6, 3);

  const room = new THREE.LineSegments(
    new THREE.BoxGeometry(6, 6, 6, 10, 10, 10),
    new THREE.LineBasicMaterial({ color: 0x808080 })
  );
  room.geometry.translate(0, 3, 0);
  scene.add(room);

  scene.add(new THREE.HemisphereLight(0x606060, 0x404040));

  const light = new THREE.DirectionalLight(0xffffff);
  light.position.set(1, 1, 1).normalize();
  scene.add(light);

  // Reticle
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

  document.body.appendChild(VRButton.createButton(renderer, {
    requiredFeatures: ['hit-test'],
    optionalFeatures: ['dom-overlay'],
    domOverlay: { root: document.body }
  }));

  // controllers

  controller1 = renderer.xr.getController(0);
  controller1.addEventListener('selectstart', onSelectStart);
  controller1.addEventListener('selectend', onSelectEnd);
  scene.add(controller1);

  controller2 = renderer.xr.getController(1);
  controller2.addEventListener('selectstart', onSelectStart);
  controller2.addEventListener('selectend', onSelectEnd);
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

function onSelectStart() {
  this.userData.isSelecting = true;

  // Track start of stroke for undo/redo
  this.userData.strokeData = {};
  Object.keys(meshes).forEach(key => {
     this.userData.strokeData[key] = meshes[key].count;
  });
  // Clear redo stack on new action
  if (redoStack.length > 0) redoStack.length = 0;
}

function onSelectEnd() {
  this.userData.isSelecting = false;

  // Check if anything changed and push to undo stack
  const changes = [];
  Object.keys(meshes).forEach(key => {
     const start = this.userData.strokeData[key];
     const end = meshes[key].count;
     if (end > start) {
       changes.push({ mode: key, start, end });
     }
  });

  if (changes.length > 0) {
    undoStack.push(changes);
  }
}

function undo() {
  if (undoStack.length === 0) return;
  const changes = undoStack.pop();
  redoStack.push(changes);

  changes.forEach(change => {
    meshes[change.mode].count = change.start;
  });
}

function redo() {
  if (redoStack.length === 0) return;
  const changes = redoStack.pop();
  undoStack.push(changes);

  changes.forEach(change => {
    meshes[change.mode].count = change.end;
  });
}

function saveProject() {
  const data = {
    version: 1,
    meshes: {}
  };

  Object.keys(meshes).forEach(key => {
    const meshData = meshes[key];
    const count = meshData.count;
    if (count > 0) {
      const matrices = [];
      const colors = [];
      const tempMatrix = new THREE.Matrix4();
      const tempColor = new THREE.Color();

      for(let i=0; i<count; i++) {
        meshData.mesh.getMatrixAt(i, tempMatrix);
        matrices.push(tempMatrix.toArray());

        if (meshData.mesh.instanceColor) {
           meshData.mesh.getColorAt(i, tempColor);
           colors.push(tempColor.toArray());
        }
      }
      data.meshes[key] = { matrices, colors };
    }
  });

  const blob = new Blob([JSON.stringify(data)], {type: 'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'graffiti-xr-project.json';
  a.click();
}

function loadProjectData(json) {
  clearScene();
  try {
    const data = JSON.parse(json);
    if (data.meshes) {
      Object.keys(data.meshes).forEach(key => {
        if (meshes[key]) {
          const meshData = data.meshes[key];
          if (!meshes[key].mesh) initDrawing(key);

          const targetMesh = meshes[key].mesh;
          const count = meshData.matrices.length;

          meshes[key].count = count;

          for(let i=0; i<count; i++) {
            const m = new THREE.Matrix4().fromArray(meshData.matrices[i]);
            targetMesh.setMatrixAt(i, m);

            if (meshData.colors && meshData.colors[i]) {
               const c = new THREE.Color().fromArray(meshData.colors[i]);
               targetMesh.setColorAt(i, c);
            }
          }
          targetMesh.instanceMatrix.needsUpdate = true;
          if (targetMesh.instanceColor) targetMesh.instanceColor.needsUpdate = true;
        }
      });
    }
  } catch (e) {
    console.error("Failed to load project", e);
  }
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
}

const cubeGeometry = new THREE.BoxGeometry(0.01, 0.01, 0.01);
const sphereGeometry = new THREE.SphereGeometry(0.005, 8, 8);
const drawingMaterial = new THREE.MeshPhongMaterial({ color: 0xffffff });
const maxPoints = 10000;

// State management for multiple meshes
const meshes = {
  cube: { mesh: null, count: 0, geometry: cubeGeometry },
  sphere: { mesh: null, count: 0, geometry: sphereGeometry }
};

// Global settings state (mutable for performance access in render loop)
const globalSettings = {
  color: new THREE.Color('white'),
  mode: 'cube'
};

function updateDrawingSettings(colorName, mode, opVal, locked) {
  globalSettings.color.set(colorName);
  globalSettings.mode = mode;
  // TODO: Use opVal and locked in handleController or shader
}

function loadImageTexture(dataUrl) {
  new THREE.TextureLoader().load(dataUrl, (texture) => {
    if (overlayMesh) scene.remove(overlayMesh);
    const aspect = texture.image.width / texture.image.height;
    const geometry = new THREE.PlaneGeometry(0.5, 0.5 / aspect);
    const material = new THREE.MeshBasicMaterial({ map: texture, transparent: true, opacity: 0.8, side: THREE.DoubleSide });
    overlayMesh = new THREE.Mesh(geometry, material);
    overlayMesh.visible = false; // Hidden until placed
    scene.add(overlayMesh);
  });
}

function clearScene() {
  Object.values(meshes).forEach(data => {
    if (data.mesh) {
      data.count = 0;
      for (let i = 0; i < maxPoints; i++) {
        data.mesh.setMatrixAt(i, new THREE.Matrix4().set(0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0));
      }
      data.mesh.instanceMatrix.needsUpdate = true;
    }
  });
  if (overlayMesh) {
    scene.remove(overlayMesh);
    overlayMesh = null;
  }
  undoStack.length = 0;
  redoStack.length = 0;
}

function initDrawing(mode) {
  if (meshes[mode].mesh) return;

  const mesh = new THREE.InstancedMesh(meshes[mode].geometry, drawingMaterial, maxPoints);
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  // Hide all instances initially
  for (let i = 0; i < maxPoints; i++) {
    mesh.setMatrixAt(i, new THREE.Matrix4().set(0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0));
  }
  mesh.instanceMatrix.needsUpdate = true;
  scene.add(mesh);
  meshes[mode].mesh = mesh;
}

function handleController(controller) {
  if (controller.userData.isSelecting) {
    // If reticle is visible and we have an image to place, place it
    if (reticle.visible && overlayMesh && !overlayMesh.visible) {
      overlayMesh.position.setFromMatrixPosition(reticle.matrix);
      overlayMesh.quaternion.setFromRotationMatrix(reticle.matrix);
      overlayMesh.visible = true;
      return;
    }

    const mode = globalSettings.mode;
    if (!meshes[mode].mesh) initDrawing(mode);

    const data = meshes[mode];

    if (data.count < maxPoints) {
      const tempMatrix = new THREE.Matrix4();
      tempMatrix.compose(
        new THREE.Vector3(0, 0, -0.05).applyMatrix4(controller.matrixWorld),
        new THREE.Quaternion().setFromRotationMatrix(controller.matrixWorld),
        new THREE.Vector3(1, 1, 1)
      );

      data.mesh.setMatrixAt(data.count, tempMatrix);
      data.mesh.setColorAt(data.count, globalSettings.color);
      data.mesh.instanceMatrix.needsUpdate = true;
      if (data.mesh.instanceColor) data.mesh.instanceColor.needsUpdate = true;
      data.count++;
    }
  }
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

  handleController(controller1);
  handleController(controller2);
  renderer.render(scene, camera);
}

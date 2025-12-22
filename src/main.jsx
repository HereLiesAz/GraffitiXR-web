import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import * as THREE from 'three';
import { VRButton } from 'three/examples/jsm/webxr/VRButton.js';
import { XRControllerModelFactory } from 'three/examples/jsm/webxr/XRControllerModelFactory.js';
import AzNavRail from './components/AzNavRail';

let camera, scene, renderer;
let controller1, controller2;
let controllerGrip1, controllerGrip2;

// --- App Component for UI ---
const App = () => {
  const [drawingColor, setDrawingColor] = useState('white');
  const [drawingMode, setDrawingMode] = useState('cube'); // cube or sphere

  // Update global drawing settings
  useEffect(() => {
    updateDrawingSettings(drawingColor, drawingMode);
  }, [drawingColor, drawingMode]);

  const navItems = [
    {
      id: 'color',
      isRailItem: true,
      isCycler: true,
      options: ['White', 'Red', 'Green', 'Blue'],
      selectedOption: drawingColor.charAt(0).toUpperCase() + drawingColor.slice(1),
      onClick: (option) => setDrawingColor(option.toLowerCase()),
      color: 'white' // Border color
    },
    {
      id: 'mode',
      isRailItem: true,
      isCycler: true,
      options: ['Cube', 'Sphere'], // "Sphere" is not really impl yet but placeholder
      selectedOption: drawingMode.charAt(0).toUpperCase() + drawingMode.slice(1),
      onClick: (option) => setDrawingMode(option.toLowerCase()),
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

  return <AzNavRail content={navItems} settings={{ appName: 'GraffitiXR' }} />;
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

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.xr.enabled = true;
  container.appendChild(renderer.domElement);

  document.body.appendChild(VRButton.createButton(renderer, {
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
}

function onSelectEnd() {
  this.userData.isSelecting = false;
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

function updateDrawingSettings(colorName, mode) {
  globalSettings.color.set(colorName);
  globalSettings.mode = mode;
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

function render() {
  handleController(controller1);
  handleController(controller2);
  renderer.render(scene, camera);
}

# GraffitiXR PWA Porting Roadmap

This document outlines the plan to port the Android GraffitiXR application to a React/Three.js PWA 1:1.

## 1. Architecture & State Management
- [x] **State Store**: Implemented `UiState` and `MainContext`.
- [x] **Architecture**: Adopted feature-based folder structure.

## 2. Core Features & Screens

### A. Navigation & Shell
- [x] **AzNavRail**: Implemented with hierarchical items.
- [x] **Routing**: Implemented in `MainScreen.jsx`.

### B. AR Screen (WebXR)
- [x] **Renderer**: Ported Shaders and `OverlayMesh`.
    - [x] Camera Feed (Handled by WebXR).
    - [ ] Plane Detection visualization.
    - [x] Hit Test logic (Basic).
- [ ] **Target Creation**:
    - **Strategy**: Use WebXR Hit Test + Anchors.
- [x] **Overlay Rendering**: Implemented `OverlayMesh` with adjustments.
- [x] **Gestures**: Ported `GestureHandler` (Scale, Rotate).

### C. Overlay/Trace Screen (Non-AR)
- [x] **Camera Preview**: Uses `navigator.mediaDevices.getUserMedia`.
- [x] **Image Layer**: Simple 2D image with opacity over the video feed.

### D. Mockup Screen
- [x] **Canvas**: 2D background image + overlay.
- [ ] **Perspective Warp**: Android has "4-corner distortion". Need to implement a 4-corner homography/warp.

### E. Settings & Data
- [ ] **Project Persistence**: Port `ProjectData.kt` serialization.
- [ ] **Settings**: UI for version, permissions, etc.

## 3. Image Processing
- [x] **Adjustments**: Opacity, Brightness, Contrast, Saturation, Color Balance (RGB).
- [ ] **Background Removal**: Investigate client-side ML options if required.

## 4. UI/UX Refinement
- [x] **Theme**: Updated Font and Styling.
- [ ] **Onboarding**: Port the Onboarding Dialogs.

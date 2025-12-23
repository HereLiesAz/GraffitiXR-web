# GraffitiXR PWA Porting Roadmap

This document outlines the plan to port the Android GraffitiXR application to a React/Three.js PWA 1:1.

## 1. Architecture & State Management
- [ ] **State Store**: Implement a global state store that replicates `UiState.kt` fields.
- [ ] **Architecture**: Adopt a feature-based folder structure similar to the Android app (Screens, Components, Hooks/ViewModels).

## 2. Core Features & Screens

### A. Navigation & Shell
- [x] **AzNavRail**: Implemented.
- [ ] **Routing**: Implement a mechanism to switch between `ARScreen`, `OverlayScreen`, `MockupScreen`, `SettingsScreen`, `HelpScreen`.

### B. AR Screen (WebXR)
- [ ] **Renderer**: Port `ArRenderer.kt` logic to Three.js.
    - [ ] Camera Feed (Handled by WebXR).
    - [ ] Plane Detection visualization.
    - [ ] Anchors/Hit Test logic.
- [ ] **Target Creation**:
    - Android uses `AugmentedImageDatabase` created at runtime.
    - **Strategy**: Use WebXR Hit Test + Anchors.
- [ ] **Overlay Rendering**: Render the user's image on a Quad.
- [ ] **Gestures**: Port `MultiGestureDetector.kt` logic (Scale, Rotate, Translate).

### C. Overlay/Trace Screen (Non-AR)
- [ ] **Camera Preview**: Use `navigator.mediaDevices.getUserMedia`.
- [ ] **Image Layer**: Simple 2D image with opacity over the video feed.

### D. Mockup Screen
- [ ] **Canvas**: 2D canvas for background image + overlay.
- [ ] **Perspective Warp**: Android has "4-corner distortion". Need to implement a 4-corner homography/warp.

### E. Settings & Data
- [ ] **Project Persistence**: Port `ProjectData.kt` serialization.
- [ ] **Settings**: UI for version, permissions, etc.

## 3. Image Processing
- [ ] **Adjustments**: Opacity, Brightness, Contrast, Saturation, Color Balance (RGB), Curves.
- [ ] **Background Removal**: Investigate client-side ML options if required.

## 4. UI/UX Refinement
- [ ] **Theme**: Ensure styling matches `UI_UX.md`.
- [ ] **Onboarding**: Port the Onboarding Dialogs.

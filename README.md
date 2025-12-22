# GraffitiXR PWA Clone

A Progressive Web App (PWA) clone of [GraffitiXR](https://github.com/HereLiesAz/GraffitiXR) built with React, Three.js (WebXR), and AzNavRail.

## Features

- **WebXR Drawing**: Draw in 3D space using AR/VR controllers.
- **AzNavRail UI**: A faithful port of the AzNavRail navigation rail for React.
- **Modes**: Support for different brushes (Cube, Sphere) and Colors.
- **Undo/Redo**: Full undo/redo history for strokes.
- **PWA**: Installable on supported devices with offline support.

## Building

This project is a standard Node.js/Vite web application. It is **NOT** an Android Gradle project.

### Prerequisites

- Node.js (v18+)
- npm

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

### Production Build

```bash
npm run build
```

The output will be in the `dist/` directory.

## Troubleshooting

If you see an error like "Local build tools not installed", please ensure you are opening this project as a **Web** project (e.g., in VS Code) and NOT as an Android project in Android Studio, unless you are wrapping it in a Trusted Web Activity (TWA) manually.

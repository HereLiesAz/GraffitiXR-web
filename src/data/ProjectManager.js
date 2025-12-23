// Ported from ProjectData.kt

// In PWA, we can simply stringify the state object, but we need to handle "URI"s which might be Blob URLs or Data URLs.
// Data URLs are large strings, so they are serializable.
// Blob URLs are not persistent. We need to convert them to Data URLs if they are blobs, or just assume they are loaded as Data URLs (which we did in MainScreen handleFileChange).

// We need to map UiState keys to ProjectData keys to be 1:1 compatible if possible, or just define a consistent schema.
// Given "1:1 port", let's match the Android schema structure where logical.

export const serializeProject = (uiState) => {
    return {
        backgroundImageUri: uiState.backgroundImageUri,
        overlayImageUri: uiState.overlayImageUri,
        originalOverlayImageUri: uiState.originalOverlayImageUri,
        // targetImageUris: ... (Future AR implementation)

        opacity: uiState.opacity,
        brightness: uiState.brightness,
        contrast: uiState.contrast,
        saturation: uiState.saturation,
        colorBalanceR: uiState.colorBalanceR,
        colorBalanceG: uiState.colorBalanceG,
        colorBalanceB: uiState.colorBalanceB,

        scale: uiState.scale,
        rotationZ: uiState.rotationZ,
        // Android has X/Y rotation for "3D" effect on 2D overlay. We only have Z in Overlay/Mockup so far.
        rotationX: uiState.rotationX || 0,
        rotationY: uiState.rotationY || 0,

        offset: uiState.offset, // {x, y}

        // fingerprint: ... (AR persistence)

        isLineDrawing: uiState.isLineDrawing,

        // Metadata
        version: 1,
        timestamp: Date.now()
    };
};

export const deserializeProject = (jsonString) => {
    try {
        const data = JSON.parse(jsonString);
        // Validate or migrate schema if needed
        return data;
    } catch (e) {
        console.error("Failed to parse project data", e);
        return null;
    }
};

export const saveProjectFile = (uiState) => {
    const data = serializeProject(uiState);
    const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    a.download = `GraffitiXR_Project_${timestamp}.gxr`;
    a.click();
    URL.revokeObjectURL(url);
    return true;
};

export const loadProjectFile = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const data = deserializeProject(e.target.result);
            if (data) resolve(data);
            else reject(new Error("Invalid project file"));
        };
        reader.onerror = reject;
        reader.readAsText(file);
    });
};

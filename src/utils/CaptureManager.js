export const downloadCanvas = (canvas, filename = 'capture.png') => {
    const link = document.createElement('a');
    link.download = filename;
    link.href = canvas.toDataURL('image/png');
    link.click();
};

export const captureOverlayComposite = (video, image, uiState) => {
    if (!video) return;

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');

    // Draw Video
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Draw Overlay
    if (image) {
        ctx.save();

        // CSS Filters
        // brightness(1 + val) contrast(val) saturate(val)
        // Order matches CSS in OverlayScreen
        ctx.filter = `brightness(${1 + uiState.brightness}) contrast(${uiState.contrast}) saturate(${uiState.saturation})`;
        ctx.globalAlpha = uiState.opacity;

        // Transforms
        // CSS: translate(-50%, -50%) translate(offX, offY) rotate(rot) scale(s)
        // Canvas:
        // 1. Translate to center
        // 2. Apply transforms
        // 3. Translate back (but drawing centered image)

        // Center of canvas
        const cx = canvas.width / 2;
        const cy = canvas.height / 2;

        ctx.translate(cx, cy);
        ctx.translate(uiState.offset.x, uiState.offset.y);
        ctx.rotate(uiState.rotationZ * Math.PI / 180);
        ctx.scale(uiState.scale, uiState.scale);

        // Draw image centered at current origin
        // CSS translate(-50%, -50%) means center of image is at origin.
        ctx.drawImage(image, -image.width / 2, -image.height / 2);

        ctx.restore();
    }

    downloadCanvas(canvas, `GraffitiXR_Capture_${Date.now()}.png`);
};

export const captureMockupComposite = (bgImage, overlayImage, uiState, corners) => {
    // For Mockup, we have a background image instead of video.
    // If perspective warp (corners) is used, we technically need a homography warp.
    // Canvas 2D does not support this.
    // As a fallback, we can use the same Affine transform logic (Scale/Rot) if corners are default.
    // If warped, we might need a workaround (e.g. not supported warning, or client-side warp lib).

    // Simplest: Draw BG, Draw Overlay (Affine).
    // Note: If the user used Warp, the "result" will look unwarped in export if we only use affine.
    // But implementing warp here is complex.
    // User complaint was about "Overlay Mode" (Video).

    if (!bgImage) return;

    const canvas = document.createElement('canvas');
    canvas.width = bgImage.naturalWidth;
    canvas.height = bgImage.naturalHeight;
    const ctx = canvas.getContext('2d');

    ctx.drawImage(bgImage, 0, 0);

    if (overlayImage) {
        ctx.save();
        ctx.filter = `brightness(${1 + uiState.brightness}) contrast(${uiState.contrast}) saturate(${uiState.saturation})`;
        ctx.globalAlpha = uiState.opacity;

        const cx = canvas.width / 2;
        const cy = canvas.height / 2;

        ctx.translate(cx, cy);
        ctx.translate(uiState.offset.x, uiState.offset.y);
        ctx.rotate(uiState.rotationZ * Math.PI / 180);
        ctx.scale(uiState.scale, uiState.scale);

        ctx.drawImage(overlayImage, -overlayImage.width / 2, -overlayImage.height / 2);
        ctx.restore();
    }

    downloadCanvas(canvas, `GraffitiXR_Mockup_${Date.now()}.png`);
};

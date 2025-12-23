import React from 'react';
import Dialog from './Dialog';

const ONBOARDING_CONTENT = {
  AR: {
    title: "AR Mode",
    text: "Point your camera at a wall. Tap 'Create' in the Grid menu to place an anchor. Then load your image to overlay it."
  },
  OVERLAY: {
    title: "Overlay Mode",
    text: "This mode overlays your image on the camera feed. It is locked to the screen (not AR). Use gestures to scale and rotate."
  },
  MOCKUP: {
    title: "Mockup Mode",
    text: "Load a background image (Wall) and overlay your art. Drag the corners to warp the perspective."
  }
};

const OnboardingDialog = ({ mode, onDismiss }) => {
  const content = ONBOARDING_CONTENT[mode];
  if (!content) return null;

  return (
    <Dialog title={content.title} onDismiss={onDismiss}>
      <p>{content.text}</p>
    </Dialog>
  );
};

export default OnboardingDialog;

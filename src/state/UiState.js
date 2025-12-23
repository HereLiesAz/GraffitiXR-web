// Mirror of com.hereliesaz.graffitixr.UiState
// We use a plain JS object for the initial state.

export const EditorMode = {
  AR: 'AR',
  STATIC: 'STATIC', // "Mockup" in UI?
  OVERLAY: 'OVERLAY', // "Trace" in UI?
  TRACE: 'TRACE', // Wait, Android has STATIC (Mockup) and OVERLAY (Trace).
  // The Android UiState has EditorMode enum, let's find the values.
  // UiState.kt says: val editorMode: EditorMode = EditorMode.STATIC
  // EditorMode.kt likely defines the enum.
};

export const TargetCreationState = {
  IDLE: 'IDLE',
  CREATING: 'CREATING',
  SAVING: 'SAVING',
  SUCCESS: 'SUCCESS',
  ERROR: 'ERROR'
};

export const initialUiState = {
  editorMode: 'AR', // Defaulting to AR as per current PWA
  completedOnboardingModes: [], // Set of strings
  showOnboardingDialogForMode: null,
  isLoading: false,

  // Transform
  scale: 1.0,
  rotationX: 0.0,
  rotationY: 0.0,
  rotationZ: 0.0,
  arObjectScale: 1.0,
  offset: { x: 0, y: 0 },

  // Adjustments
  opacity: 1.0,
  brightness: 0.0, // Android: -1 to 1? Or 0 to 1? UiState says 0f default? No, brightness: Float = 0f.
  // PWA current: 0.5 default (neutral). I need to standardize.
  // UiState.kt: brightness: Float = 0f.
  // Let's assume -1..1 or 0..2?
  // AdjustmentsControls.kt in Android would show the range.
  contrast: 1.0,
  saturation: 1.0,
  colorBalanceR: 1.0,
  colorBalanceG: 1.0,
  colorBalanceB: 1.0,
  curvesPoints: [], // List of {x, y}
  processedImageUri: null,
  blendMode: 'SrcOver', // BlendMode enum

  activeRotationAxis: 'Z',

  isToolbarVisible: true,
  isSettingsPanelVisible: false,
  isImageSelectionMode: false,

  // Images
  backgroundImageUri: null, // For Mockup
  overlayImageUri: null,
  originalOverlayImageUri: null,
  backgroundRemovedImageUri: null,
  isLineDrawing: false,
  isBackgroundRemovalEnabled: false,
  isBackgroundRemovalLoading: false,
  backgroundRemovalError: null,

  // AR State
  arState: 'SEARCHING', // SEARCHING, LOCKED, PLACED
  targetCreationState: 'IDLE',
  isArPlanesDetected: false,
  isArTargetCreated: false,
  isArPlacementMode: true, // Default to placement enabled

  // Undo/Redo
  canUndo: false,
  canRedo: false,

  // Feedback
  showGestureFeedback: false,
  showRotationAxisFeedback: false,
  showDoubleTapHint: false,
  tapFeedback: null, // { success, position }

  fingerprintJson: null,
  isMarkingProgress: false,
  drawingPaths: [], // List of List of {x, y}
  progressPercentage: 0.0,

  isCapturingTarget: false,
  isTouchLocked: false,
  showUnlockInstructions: false,
  hideUiForCapture: false,

  updateStatusMessage: null,
  isCheckingForUpdate: false,
  latestRelease: null,
  isFlashlightOn: false,

  // Target Creation
  targetCreationMode: 'CAPTURE',
  captureStep: 'ADVICE',
  gridRows: 2,
  gridCols: 2,
  isGridGuideVisible: false,
  qualityWarning: null,
  captureFailureTimestamp: 0,
  capturedTargetUris: [],
  capturedTargetImages: [], // Bitmaps/Blobs

  evolutionCaptureUris: [],
  refinementPaths: [],
  isRefinementEraser: false,
  detectedKeypoints: [],
  targetMaskUri: null,
  augmentedImageDatabase: null,

  // Toast
  toastMessage: null
};

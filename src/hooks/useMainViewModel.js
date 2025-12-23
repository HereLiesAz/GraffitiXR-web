import { useMainContext } from '../state/MainContext';

export const useMainViewModel = () => {
  const { state, actions } = useMainContext();

  return {
    uiState: state,
    setEditorMode: actions.setEditorMode,
    onOverlayImageSelected: actions.setOverlayImage,
    updateAdjustment: actions.setAdjustment,
    updateState: actions.updateState,

    // Mapped Actions (to be implemented fully)
    onUndo: () => console.log("Undo"),
    onRedo: () => console.log("Redo"),
    toggleFlashlight: () => console.log("Toggle Flashlight"),
    toggleTouchLock: () => console.log("Toggle Touch Lock"),

    // Helper to check mode
    isArMode: state.editorMode === 'AR',
    isOverlayMode: state.editorMode === 'OVERLAY' || state.editorMode === 'TRACE', // Check logic
    isMockupMode: state.editorMode === 'STATIC' || state.editorMode === 'MOCKUP'
  };
};

import { useMainContext } from '../state/MainContext';
import { saveProjectFile, loadProjectFile } from '../data/ProjectManager';

export const useMainViewModel = () => {
  const { state, actions } = useMainContext();

  const handleSaveProject = () => {
      const success = saveProjectFile(state);
      if (success) actions.showToast("Project Saved");
  };

  const handleLoadProject = async (file) => {
      try {
          const data = await loadProjectFile(file);
          actions.loadProjectState(data);
          actions.showToast("Project Loaded");
      } catch (e) {
          console.error(e);
          actions.showToast("Failed to load project");
      }
  };

  return {
    uiState: state,
    setEditorMode: actions.setEditorMode,
    onOverlayImageSelected: actions.setOverlayImage,
    onBackgroundImageSelected: actions.setBackgroundImage,
    updateAdjustment: actions.setAdjustment,
    updateState: actions.updateState,
    showToast: actions.showToast,
    onSaveProject: handleSaveProject,
    onLoadProject: handleLoadProject,

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

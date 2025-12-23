import { useMainContext } from '../state/MainContext';
import { saveProjectFile, loadProjectFile } from '../data/ProjectManager';
import { removeBackground } from '@imgly/background-removal';

export const useMainViewModel = () => {
  const { state, actions } = useMainContext();

  const handleToggleIsolate = async () => {
      const newMode = !state.isBackgroundRemovalEnabled;
      actions.setIsolateMode(newMode);

      if (newMode && !state.backgroundRemovedImageUri && state.overlayImageUri) {
          actions.setBackgroundRemovalLoading(true);
          actions.showToast("Processing background removal...");
          try {
              // imgly takes URL or blob
              const blob = await removeBackground(state.overlayImageUri);
              const url = URL.createObjectURL(blob);
              actions.setBackgroundRemovedImage(url);
              actions.showToast("Background Removed");
          } catch (e) {
              console.error(e);
              actions.showToast("Background removal failed");
              actions.setBackgroundRemovalLoading(false);
              actions.setIsolateMode(false); // Revert
          }
      }
  };

  const handleSaveProject = () => {
      const success = saveProjectFile(state);
      if (success) actions.showToast("Project Saved");
  };

  const handleExportImage = () => {
      actions.setCapturing(true);
      // Actual capture logic happens in the active Screen component
      // which listens to state.isCapturingTarget
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

  const handleCreateTarget = () => {
      actions.setPlacementMode(true);
      actions.showToast("Tap to place");
  };

  const handleRefineTarget = () => {
      actions.setPlacementMode(true);
      actions.showToast("Refining Position");
  };

  const handleSetEditorMode = (mode) => {
      actions.setEditorMode(mode);
      if (!state.completedOnboardingModes.includes(mode) && ['AR', 'OVERLAY', 'MOCKUP'].includes(mode)) {
          actions.showOnboarding(mode);
      }
  };

  return {
    uiState: state,
    setEditorMode: handleSetEditorMode,
    onOverlayImageSelected: actions.setOverlayImage,
    onBackgroundImageSelected: actions.setBackgroundImage,
    updateAdjustment: actions.setAdjustment,
    updateState: actions.updateState,
    showToast: actions.showToast,
    onSaveProject: handleSaveProject,
    onExportImage: handleExportImage,
    onLoadProject: handleLoadProject,
    onToggleIsolate: handleToggleIsolate,
    setCapturing: actions.setCapturing,
    dismissOnboarding: actions.dismissOnboarding,
    onCreateTarget: handleCreateTarget,
    onRefineTarget: handleRefineTarget,
    setPlacementMode: actions.setPlacementMode,

    // Mapped Actions (to be implemented fully)
    onUndo: () => console.log("Undo"),
    onRedo: () => console.log("Redo"),
    toggleFlashlight: () => console.log("Toggle Flashlight"),
    toggleTouchLock: () => console.log("Toggle Touch Lock")
  };
};

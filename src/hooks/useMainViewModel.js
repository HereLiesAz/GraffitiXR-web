import { useCallback, useEffect, useRef } from 'react';
import { useMainContext } from '../state/MainContext';
import { saveProjectFile, loadProjectFile } from '../data/ProjectManager';
import { removeBackground } from '@imgly/background-removal';

export const useMainViewModel = () => {
  const { state, actions } = useMainContext();
  const stateRef = useRef(state);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const handleToggleIsolate = useCallback(async () => {
      const currentState = stateRef.current;
      const newMode = !currentState.isBackgroundRemovalEnabled;
      actions.setIsolateMode(newMode);

      if (newMode && !currentState.backgroundRemovedImageUri && currentState.overlayImageUri) {
          actions.setBackgroundRemovalLoading(true);
          actions.showToast("Processing background removal...");
          try {
              // imgly takes URL or blob
              const blob = await removeBackground(currentState.overlayImageUri);
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
  }, [actions]);

  const handleSaveProject = useCallback(() => {
      const currentState = stateRef.current;
      const success = saveProjectFile(currentState);
      if (success) actions.showToast("Project Saved");
  }, [actions]);

  const handleExportImage = useCallback(() => {
      actions.setCapturing(true);
      // Actual capture logic happens in the active Screen component
      // which listens to state.isCapturingTarget
  }, [actions]);

  const handleLoadProject = useCallback(async (file) => {
      try {
          const data = await loadProjectFile(file);
          actions.loadProjectState(data);
          actions.showToast("Project Loaded");
      } catch (e) {
          console.error(e);
          actions.showToast("Failed to load project");
      }
  }, [actions]);

  const handleCreateTarget = useCallback(() => {
      actions.setPlacementMode(true);
      actions.showToast("Tap to place");
  }, [actions]);

  const handleRefineTarget = useCallback(() => {
      actions.setPlacementMode(true);
      actions.showToast("Refining Position");
  }, [actions]);

  const handleSetEditorMode = useCallback((mode) => {
      actions.setEditorMode(mode);
      const currentState = stateRef.current;
      if (!currentState.completedOnboardingModes.includes(mode) && ['AR', 'OVERLAY', 'MOCKUP'].includes(mode)) {
          actions.showOnboarding(mode);
      }
  }, [actions]);

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

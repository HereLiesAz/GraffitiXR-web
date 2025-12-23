import React, { createContext, useReducer, useContext } from 'react';
import { initialUiState } from './UiState';

const MainContext = createContext(null);

const uiStateReducer = (state, action) => {
  switch (action.type) {
    case 'SET_MODE':
      return { ...state, editorMode: action.payload };
    case 'UPDATE_STATE':
      // Generic updater for simple properties
      return { ...state, ...action.payload };
    case 'SET_OVERLAY_IMAGE':
      return {
        ...state,
        overlayImageUri: action.payload,
        originalOverlayImageUri: action.payload // Assuming new load
      };
    case 'SET_BACKGROUND_IMAGE':
      return { ...state, backgroundImageUri: action.payload };
    case 'SET_BACKGROUND_REMOVED_IMAGE':
      return { ...state, backgroundRemovedImageUri: action.payload, isBackgroundRemovalLoading: false };
    case 'SET_BACKGROUND_REMOVAL_LOADING':
      return { ...state, isBackgroundRemovalLoading: action.payload };
    case 'SET_ISOLATE_MODE':
      return { ...state, isBackgroundRemovalEnabled: action.payload };
    case 'SET_CAPTURING':
      return { ...state, isCapturingTarget: action.payload };
    case 'SET_PLACEMENT_MODE':
      return { ...state, isArPlacementMode: action.payload };
    case 'SET_ADJUSTMENT':
        // payload: { key: 'opacity', value: 0.5 }
        return { ...state, [action.payload.key]: action.payload.value };
    case 'RESET_ADJUSTMENTS':
        return {
            ...state,
            opacity: 1.0, brightness: 0.0, contrast: 1.0, saturation: 1.0,
            colorBalanceR: 1.0, colorBalanceG: 1.0, colorBalanceB: 1.0
        };
    case 'SHOW_TOAST':
        return { ...state, toastMessage: action.payload };
    case 'LOAD_PROJECT':
        // Whitelist keys to prevent pollution
        const safePayload = {};
        Object.keys(initialUiState).forEach(key => {
            if (action.payload.hasOwnProperty(key)) {
                safePayload[key] = action.payload[key];
            }
        });
        return { ...state, ...safePayload };
    case 'SHOW_ONBOARDING':
        return { ...state, showOnboardingDialogForMode: action.payload };
    case 'DISMISS_ONBOARDING':
        const mode = state.showOnboardingDialogForMode;
        return {
            ...state,
            showOnboardingDialogForMode: null,
            completedOnboardingModes: [...state.completedOnboardingModes, mode]
        };
    default:
      return state;
  }
};

export const MainProvider = ({ children }) => {
  const [state, dispatch] = useReducer(uiStateReducer, initialUiState);

  // ViewModel-like methods can be exposed here or in a custom hook
  const setEditorMode = (mode) => dispatch({ type: 'SET_MODE', payload: mode });

  const updateState = (payload) => dispatch({ type: 'UPDATE_STATE', payload });

  const setOverlayImage = (uri) => dispatch({ type: 'SET_OVERLAY_IMAGE', payload: uri });
  const setBackgroundImage = (uri) => dispatch({ type: 'SET_BACKGROUND_IMAGE', payload: uri });
  const setBackgroundRemovedImage = (uri) => dispatch({ type: 'SET_BACKGROUND_REMOVED_IMAGE', payload: uri });
  const setBackgroundRemovalLoading = (isLoading) => dispatch({ type: 'SET_BACKGROUND_REMOVAL_LOADING', payload: isLoading });
  const setIsolateMode = (enabled) => dispatch({ type: 'SET_ISOLATE_MODE', payload: enabled });
  const setCapturing = (isCapturing) => dispatch({ type: 'SET_CAPTURING', payload: isCapturing });
  const setPlacementMode = (enabled) => dispatch({ type: 'SET_PLACEMENT_MODE', payload: enabled });

  const setAdjustment = (key, value) => dispatch({ type: 'SET_ADJUSTMENT', payload: { key, value } });

  const showToast = (message) => dispatch({ type: 'SHOW_TOAST', payload: message });
  const loadProjectState = (projectData) => dispatch({ type: 'LOAD_PROJECT', payload: projectData });
  const showOnboarding = (mode) => dispatch({ type: 'SHOW_ONBOARDING', payload: mode });
  const dismissOnboarding = () => dispatch({ type: 'DISMISS_ONBOARDING' });

  const value = {
    state,
    dispatch,
    actions: {
        setEditorMode,
        updateState,
        setOverlayImage,
        setBackgroundImage,
        setBackgroundRemovedImage,
        setBackgroundRemovalLoading,
        setIsolateMode,
        setCapturing,
        setPlacementMode,
        setAdjustment,
        showToast,
        loadProjectState,
        showOnboarding,
        dismissOnboarding
    }
  };

  return (
    <MainContext.Provider value={value}>
      {children}
    </MainContext.Provider>
  );
};

export const useMainContext = () => {
  const context = useContext(MainContext);
  if (!context) {
    throw new Error('useMainContext must be used within a MainProvider');
  }
  return context;
};

import React, { useCallback, useMemo, useRef, useState, Suspense, lazy } from 'react';
import { useMainViewModel } from '../hooks/useMainViewModel';
import AzNavRail from '../components/AzNavRail';
import { AdjustmentsKnobsRow, ColorBalanceKnobsRow } from '../components/AdjustmentsRow';
import UndoRedoRow from '../components/UndoRedoRow';
import Toast from '../components/Toast';
import OnboardingDialog from '../components/OnboardingDialog';

// Lazy load screens to split the bundle
const ARScreen = lazy(() => import('./ARScreen'));
const OverlayScreen = lazy(() => import('./OverlayScreen'));
const MockupScreen = lazy(() => import('./MockupScreen'));
const SettingsScreen = lazy(() => import('./SettingsScreen'));
const HelpScreen = lazy(() => import('./HelpScreen'));

// Extracted to constant to prevent re-renders in memoized AzNavRail
const NAV_SETTINGS = { appName: 'GraffitiXR' };

const MainScreen = () => {
  const {
      uiState, setEditorMode,
      onOverlayImageSelected, onBackgroundImageSelected,
      updateAdjustment, showToast,
      onSaveProject, onExportImage, onLoadProject, onToggleIsolate,
      dismissOnboarding, onCreateTarget, onRefineTarget
  } = useMainViewModel();

  const fileInputRef = useRef(null);
  const wallInputRef = useRef(null);
  const loadInputRef = useRef(null);

  // Local state for panel visibility (can be moved to global state later if needed)
  const [activePanel, setActivePanel] = useState(null);

  // Derived state
  const overlayImage = !!uiState.overlayImageUri;
  const isLocked = uiState.isLocked;

  const renderContent = () => {
    switch (uiState.editorMode) {
      case 'AR':
        return <ARScreen />;
      case 'OVERLAY':
      case 'TRACE':
        return <OverlayScreen />;
      case 'MOCKUP':
      case 'STATIC':
        return <MockupScreen />;
      case 'SETTINGS':
        return <SettingsScreen />;
      case 'HELP':
        return <HelpScreen />;
      default:
        return <ARScreen />;
    }
  };

  const handleFileChange = (e) => {
      const file = e.target.files[0];
      if (file) {
          const reader = new FileReader();
          reader.onload = (ev) => onOverlayImageSelected(ev.target.result);
          reader.readAsDataURL(file);
      }
  };

  const handleWallChange = (e) => {
      const file = e.target.files[0];
      if (file) {
          const reader = new FileReader();
          reader.onload = (ev) => onBackgroundImageSelected(ev.target.result);
          reader.readAsDataURL(file);
      }
  };

  const handleLoadProject = (e) => {
      const file = e.target.files[0];
      if (file) {
          onLoadProject(file);
      }
  };

  const handleOpacityChange = useCallback((v) => updateAdjustment('opacity', v), [updateAdjustment]);
  const handleBrightnessChange = useCallback((v) => updateAdjustment('brightness', v), [updateAdjustment]);
  const handleContrastChange = useCallback((v) => updateAdjustment('contrast', v), [updateAdjustment]);
  const handleSaturationChange = useCallback((v) => updateAdjustment('saturation', v), [updateAdjustment]);

  const handleRChange = useCallback((v) => updateAdjustment('colorBalanceR', v), [updateAdjustment]);
  const handleGChange = useCallback((v) => updateAdjustment('colorBalanceG', v), [updateAdjustment]);
  const handleBChange = useCallback((v) => updateAdjustment('colorBalanceB', v), [updateAdjustment]);

  const navItems = useMemo(() => {
    const items = [];

    // Modes Host
    const modesHost = {
        id: 'mode_host',
        type: 'host',
        text: 'Modes',
        children: [
            { id: 'ar', text: 'AR Mode', onClick: () => setEditorMode('AR'), isRailItem: false },
            { id: 'overlay', text: 'Overlay', onClick: () => setEditorMode('OVERLAY'), isRailItem: false },
            { id: 'mockup', text: 'Mockup', onClick: () => setEditorMode('MOCKUP'), isRailItem: false },
            { id: 'trace', text: 'Trace', onClick: () => setEditorMode('TRACE'), isRailItem: false }
        ]
    };
    items.push(modesHost);
    items.push({ id: 'div1', isDivider: true });

    // Grid Host (Only for AR Mode)
    if (uiState.editorMode === 'AR') {
        const gridHost = {
            id: 'target_host',
            type: 'host',
            text: 'Grid',
            children: [
                { id: 'create_target', text: 'Create', onClick: onCreateTarget },
                { id: 'refine_target', text: 'Refine', onClick: onRefineTarget },
                { id: 'update_target', text: 'Update', onClick: onRefineTarget } // Update same as Refine for now
            ]
        };
        items.push(gridHost);
        items.push({ id: 'div2', isDivider: true });
    }

    // Design Host
    const designChildren = [
        { id: 'open', text: 'Open', onClick: () => fileInputRef.current.click() }
    ];

    if (uiState.editorMode === 'MOCKUP') {
      designChildren.push({ id: 'wall', text: 'Wall', onClick: () => wallInputRef.current.click() });
    }

    if (overlayImage) {
        designChildren.push(
            {
                id: 'isolate',
                text: 'Isolate',
                onClick: onToggleIsolate,
                isToggle: true,
                isChecked: uiState.isBackgroundRemovalEnabled
            },
            { id: 'outline', text: 'Outline', onClick: () => {} },
            { id: 'adjust', text: 'Adjust', onClick: () => setActivePanel(curr => curr === 'adjust' ? null : 'adjust') },
            { id: 'balance', text: 'Balance', onClick: () => setActivePanel(curr => curr === 'balance' ? null : 'balance') },
            { id: 'blending', text: 'Blending', onClick: () => {} }
        );
    }

    items.push({
        id: 'design_host',
        type: 'host',
        text: 'Design',
        children: designChildren
    });
    items.push({ id: 'div4', isDivider: true });

    // Settings Host
    const settingsChildren = [
        { id: 'new', text: 'New', onClick: () => console.log("New Project") }, // Reset state logic needed
        { id: 'save', text: 'Save', onClick: onSaveProject },
        { id: 'load', text: 'Load', onClick: () => loadInputRef.current.click() },
        { id: 'export', text: 'Export', onClick: onExportImage },
        { id: 'help', text: 'Help', onClick: () => setEditorMode('HELP') },
        { id: 'about', text: 'About', onClick: () => setEditorMode('SETTINGS') } // Exposing Settings via Rail
    ];

    items.push({
        id: 'settings_host',
        type: 'host',
        text: 'Settings',
        children: settingsChildren
    });
    items.push({ id: 'div5', isDivider: true });

    items.push(
        { id: 'light', text: 'Light', isRailItem: true, onClick: () => console.log("Light"), color: 'white' },
        { id: 'lock', text: 'Lock', isRailItem: true, onClick: () => console.log("Lock"), color: 'white' }
    );

    return items;
  }, [uiState.editorMode, overlayImage, setEditorMode]);

  return (
    <>
      <Suspense fallback={<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: 'white' }}>Loading...</div>}>
        {renderContent()}
      </Suspense>

      <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept="image/*" onChange={handleFileChange} />
      <input type="file" ref={wallInputRef} style={{ display: 'none' }} accept="image/*" onChange={handleWallChange} />
      <input type="file" ref={loadInputRef} style={{ display: 'none' }} accept=".gxr,.json" onChange={handleLoadProject} />

      <AzNavRail
        content={navItems}
        settings={NAV_SETTINGS}
      />

      <Toast message={uiState.toastMessage} onClose={() => showToast(null)} />

      {uiState.showOnboardingDialogForMode && (
          <OnboardingDialog
            mode={uiState.showOnboardingDialogForMode}
            onDismiss={dismissOnboarding}
          />
      )}

      <div style={{ position: 'absolute', bottom: '20px', left: '0', width: '100%', pointerEvents: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 2000 }}>

        {overlayImage && !isLocked && (
             <UndoRedoRow
                canUndo={false}
                canRedo={false}
                onUndo={() => {}}
                onRedo={() => {}}
                onMagic={() => {}}
             />
        )}

        {activePanel === 'adjust' && (
            <AdjustmentsKnobsRow
                opacity={uiState.opacity}
                brightness={uiState.brightness}
                contrast={uiState.contrast}
                saturation={uiState.saturation}
                onOpacityChange={handleOpacityChange}
                onBrightnessChange={handleBrightnessChange}
                onContrastChange={handleContrastChange}
                onSaturationChange={handleSaturationChange}
            />
        )}

        {activePanel === 'balance' && (
            <ColorBalanceKnobsRow
                r={uiState.colorBalanceR}
                g={uiState.colorBalanceG}
                b={uiState.colorBalanceB}
                onRChange={handleRChange}
                onGChange={handleGChange}
                onBChange={handleBChange}
            />
        )}
      </div>
    </>
  );
};

export default MainScreen;

import React, { memo } from 'react';
import './UIComponents.css';

const UndoRedoRow = memo(({ canUndo, canRedo, onUndo, onRedo, onMagic }) => {
  return (
    <div className="floating-row">
      <button
        className="icon-button"
        disabled={!canUndo}
        onClick={onUndo}
        aria-label="Undo"
        title="Undo"
      >
        ↶
      </button>
      <button
        className="icon-button magic-button"
        onClick={onMagic}
        aria-label="Auto-enhance image"
        title="Auto-enhance image"
      >
        ✨
      </button>
      <button
        className="icon-button"
        disabled={!canRedo}
        onClick={onRedo}
        aria-label="Redo"
        title="Redo"
      >
        ↷
      </button>
    </div>
  );
});

export default UndoRedoRow;

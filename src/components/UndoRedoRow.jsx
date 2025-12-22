import React from 'react';
import './UIComponents.css';

const UndoRedoRow = ({ canUndo, canRedo, onUndo, onRedo, onMagic }) => {
  return (
    <div className="floating-row">
      <button className="icon-button" disabled={!canUndo} onClick={onUndo}>
        ↶
      </button>
      <button className="icon-button magic-button" onClick={onMagic}>
        ✨
      </button>
      <button className="icon-button" disabled={!canRedo} onClick={onRedo}>
        ↷
      </button>
    </div>
  );
};

export default UndoRedoRow;

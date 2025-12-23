import React from 'react';
import './UIComponents.css';

const Dialog = ({ title, children, onDismiss, actionText = "Got it" }) => {
  return (
    <div className="dialog-overlay">
      <div className="dialog-container">
        {title && <div className="dialog-title">{title}</div>}
        <div className="dialog-content">
          {children}
        </div>
        <div className="dialog-actions">
          <button className="dialog-button" onClick={onDismiss}>
            {actionText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dialog;

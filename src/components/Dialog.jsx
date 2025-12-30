import React, { useEffect, useRef, useId } from 'react';
import './UIComponents.css';

const Dialog = ({ title, children, onDismiss, actionText = "Got it" }) => {
  const buttonRef = useRef(null);
  const titleId = useId();

  useEffect(() => {
    // Focus the action button when dialog mounts
    if (buttonRef.current) {
      buttonRef.current.focus();
    }

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onDismiss();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onDismiss]);

  return (
    <div
      className="dialog-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? titleId : undefined}
    >
      <div className="dialog-container">
        {title && <div id={titleId} className="dialog-title">{title}</div>}
        <div className="dialog-content">
          {children}
        </div>
        <div className="dialog-actions">
          <button
            ref={buttonRef}
            className="dialog-button"
            onClick={onDismiss}
          >
            {actionText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dialog;

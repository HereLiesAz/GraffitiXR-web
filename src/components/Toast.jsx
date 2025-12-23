import React, { useEffect } from 'react';
import './UIComponents.css';

const Toast = ({ message, onClose }) => {
  useEffect(() => {
    if (message) {
      const timer = setTimeout(onClose, 3000);
      return () => clearTimeout(timer);
    }
  }, [message, onClose]);

  if (!message) return null;

  return (
    <div className="toast">
      {message}
    </div>
  );
};

export default Toast;

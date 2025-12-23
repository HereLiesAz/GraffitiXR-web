import React from 'react';
import './UIComponents.css';

const AzRailHostItem = ({ item, children }) => {
  return (
    <div className="az-rail-host-item">
      <div className="az-rail-host-header">
        {item.text}
      </div>
      <div className="az-rail-host-children">
        {children}
      </div>
    </div>
  );
};

export default AzRailHostItem;

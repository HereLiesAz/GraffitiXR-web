import React from 'react';
import './UIComponents.css';

const AzRailHostItem = ({ item, children }) => {
  // Host Item renders as a header/container in the drawer
  // It might also have a representation in the collapsed rail if needed,
  // but based on "Modes", "Grid" being headers previously, we treat them as sections.
  // The user said "buttons should each be a AzRailHostItem".
  // This implies the Host Item ITSELF might be clickable or just a visual container.
  // If it's a replacement for "Header", it's just text.
  // But if it's a "button", maybe it toggles?
  // Given the context of "Modes" (which was a header), I'll render it as a styled container.

  return (
    <div className="az-rail-host-item">
      <div className="az-rail-host-header" style={{
          color: 'white',
          fontSize: '1.2rem',
          marginBottom: '10px',
          textTransform: 'uppercase',
          borderBottom: '4px solid white',
          paddingBottom: '5px'
      }}>
        {item.text}
      </div>
      <div className="az-rail-host-children">
        {children}
      </div>
    </div>
  );
};

export default AzRailHostItem;

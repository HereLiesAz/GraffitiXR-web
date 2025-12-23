import React from 'react';
import './MenuItem.css'; // Reuse basic styles
import useFitText from '../hooks/useFitText';

const AzRailSubItem = ({ item, onClick }) => {
  const { text, selectedOption } = item;
  const textRef = useFitText();

  // Reusing MenuItem styling but ensuring it fits the "SubItem" concept.
  // Basically a button in the drawer.
  return (
    <div className="menu-item" onClick={onClick} style={{
        border: '4px solid white',
        borderRadius: '16px',
        margin: '5px 0',
        padding: '10px',
        cursor: 'pointer',
        textAlign: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)'
    }}>
        <div className="menu-item-content">
            <span ref={textRef} style={{ fontSize: '20px' }}>
                {selectedOption || text}
            </span>
        </div>
    </div>
  );
};

export default AzRailSubItem;

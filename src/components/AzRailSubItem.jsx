import React from 'react';
import './MenuItem.css';
import './UIComponents.css';
import useFitText from '../hooks/useFitText';

const AzRailSubItem = ({ item, onClick }) => {
  const { text, selectedOption, isToggle, isChecked } = item;
  const textRef = useFitText();

  return (
    <button
      type="button"
      className="menu-item az-rail-sub-item"
      onClick={onClick}
      aria-pressed={isToggle ? isChecked : undefined}
    >
        <div className="menu-item-content">
            <span ref={textRef} className="az-rail-sub-item-text">
                {selectedOption || text}
            </span>
        </div>
    </button>
  );
};

export default AzRailSubItem;

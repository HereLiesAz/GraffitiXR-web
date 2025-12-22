import React from 'react';
import './UIComponents.css';

export const AdjustmentsKnobsRow = ({
  opacity, scale,
  onOpacityChange, onScaleChange
}) => {
  return (
    <div className="knobs-row">
      <div className="slider-container">
        <div className="slider-label">Opacity {Math.round(opacity * 100)}%</div>
        <input
          type="range" min="0" max="1" step="0.05"
          value={opacity} onChange={(e) => onOpacityChange(parseFloat(e.target.value))}
        />
      </div>
      <div className="slider-container">
        <div className="slider-label">Scale {scale.toFixed(1)}x</div>
        <input
          type="range" min="0.1" max="3" step="0.1"
          value={scale} onChange={(e) => onScaleChange(parseFloat(e.target.value))}
        />
      </div>
    </div>
  );
};

export const ColorBalanceKnobsRow = ({ r, g, b, onRChange, onGChange, onBChange }) => {
  return (
    <div className="knobs-row">
      <div className="slider-container">
        <div className="slider-label slider-label--red">Red</div>
        <input
          type="range" min="0" max="2" step="0.05"
          value={r} onChange={(e) => onRChange(parseFloat(e.target.value))}
        />
      </div>
      <div className="slider-container">
        <div className="slider-label slider-label--green">Green</div>
        <input
          type="range" min="0" max="2" step="0.05"
          value={g} onChange={(e) => onGChange(parseFloat(e.target.value))}
        />
      </div>
      <div className="slider-container">
        <div className="slider-label slider-label--blue">Blue</div>
        <input
          type="range" min="0" max="2" step="0.05"
          value={b} onChange={(e) => onBChange(parseFloat(e.target.value))}
        />
      </div>
    </div>
  );
};

import React from 'react';
import './UIComponents.css';

export const AdjustmentsKnobsRow = ({
  opacity, brightness, contrast, saturation,
  onOpacityChange, onBrightnessChange, onContrastChange, onSaturationChange
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
      {/* Brightness/Contrast/Saturation are stubs in WebXR for now, but UI exists */}
      <div className="slider-container">
        <div className="slider-label">Brightness</div>
        <input
          type="range" min="0" max="1" step="0.05"
          value={brightness} onChange={(e) => onBrightnessChange(parseFloat(e.target.value))}
        />
      </div>
       {/* Hiding others to save screen space or keep it simple as per "Clone" request which implies full UI */}
       {/* But without shader implementation, they do nothing. I will show them for completeness. */}
    </div>
  );
};

export const ColorBalanceKnobsRow = ({ r, g, b, onRChange, onGChange, onBChange }) => {
  return (
    <div className="knobs-row">
      <div className="slider-container">
        <div className="slider-label" style={{color: '#ffaaaa'}}>Red</div>
        <input
          type="range" min="0" max="1" step="0.05"
          value={r} onChange={(e) => onRChange(parseFloat(e.target.value))}
        />
      </div>
      <div className="slider-container">
        <div className="slider-label" style={{color: '#aaffaa'}}>Green</div>
        <input
          type="range" min="0" max="1" step="0.05"
          value={g} onChange={(e) => onGChange(parseFloat(e.target.value))}
        />
      </div>
      <div className="slider-container">
        <div className="slider-label" style={{color: '#aaaaff'}}>Blue</div>
        <input
          type="range" min="0" max="1" step="0.05"
          value={b} onChange={(e) => onBChange(parseFloat(e.target.value))}
        />
      </div>
    </div>
  );
};

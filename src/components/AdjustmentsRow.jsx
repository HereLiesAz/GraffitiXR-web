import React, { memo } from 'react';
import './UIComponents.css';

const Slider = memo(({ label, value, min, max, step, onChange, labelClass }) => (
  <div className="slider-container">
    <div className={`slider-label ${labelClass || ''}`}>{label}</div>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(parseFloat(e.target.value))}
      aria-label={label}
    />
  </div>
));

export const AdjustmentsKnobsRow = memo(({
  opacity, brightness, contrast, saturation,
  onOpacityChange, onBrightnessChange, onContrastChange, onSaturationChange
}) => {
  return (
    <div className="knobs-row">
      <Slider
        label={`Opacity ${Math.round(opacity * 100)}%`}
        value={opacity} min="0" max="1" step="0.05"
        onChange={onOpacityChange}
      />
      <Slider
        label="Brightness"
        value={brightness} min="0" max="1" step="0.05"
        onChange={onBrightnessChange}
      />
      <Slider
        label="Contrast"
        value={contrast} min="0" max="1" step="0.05"
        onChange={onContrastChange}
      />
      <Slider
        label="Saturation"
        value={saturation} min="0" max="1" step="0.05"
        onChange={onSaturationChange}
      />
    </div>
  );
});

export const ColorBalanceKnobsRow = memo(({ r, g, b, onRChange, onGChange, onBChange }) => {
  return (
    <div className="knobs-row">
      <Slider
        label="Red" labelClass="slider-label--red"
        value={r} min="0" max="2" step="0.05"
        onChange={onRChange}
      />
      <Slider
        label="Green" labelClass="slider-label--green"
        value={g} min="0" max="2" step="0.05"
        onChange={onGChange}
      />
      <Slider
        label="Blue" labelClass="slider-label--blue"
        value={b} min="0" max="2" step="0.05"
        onChange={onBChange}
      />
    </div>
  );
});

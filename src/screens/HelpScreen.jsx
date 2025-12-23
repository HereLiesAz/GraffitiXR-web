import React from 'react';

const HelpScreen = () => {
  return (
    <div style={{ width: '100%', height: '100%', backgroundColor: '#121212', color: 'white', padding: '20px', overflowY: 'auto' }}>
      <h1>Help / Onboarding</h1>

      <div className="help-step">
        <h2>1. Create Target (AR Mode)</h2>
        <p>Point at a wall and tap "Create". This creates an anchor for your art.</p>
      </div>

      <div className="help-step">
        <h2>2. Design</h2>
        <p>Tap "Open" to load your image. Use "Adjust" to change opacity and blend.</p>
      </div>

      <div className="help-step">
        <h2>3. Trace</h2>
        <p>Use "Overlay" mode to trace directly on screen if AR is tricky.</p>
      </div>
    </div>
  );
};

export default HelpScreen;

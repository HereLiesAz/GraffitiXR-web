import React from 'react';
import '../components/UIComponents.css';

const SettingsScreen = () => {
  const appVersion = "1.0.0-pwa"; // Should come from package.json or config

  return (
    <div className="settings-screen">
      <div className="settings-container">
        <h1>Settings</h1>

        <div className="settings-section">
          <h2>About</h2>
          <p>GraffitiXR Clone (PWA)</p>
          <p>Version: {appVersion}</p>
        </div>

        <div className="settings-section">
          <h2>Links</h2>
          <button className="settings-button" onClick={() => window.open('https://github.com/HereLiesAz/GraffitiXR', '_blank', 'noopener,noreferrer')}>
            GitHub Repository
          </button>
          <button className="settings-button" onClick={() => window.open('https://github.com/HereLiesAz/GraffitiXR/blob/main/PRIVACY_POLICY.md', '_blank', 'noopener,noreferrer')}>
            Privacy Policy
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsScreen;

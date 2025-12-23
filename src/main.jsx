import React from 'react';
import { createRoot } from 'react-dom/client';
import { MainProvider } from './state/MainContext';
import MainScreen from './screens/MainScreen';
import './components/UIComponents.css';

// Entry point
const App = () => {
  return (
    <MainProvider>
      <MainScreen />
    </MainProvider>
  );
};

// Mount
const container = document.createElement('div');
document.body.appendChild(container);
const root = createRoot(container);
root.render(<App />);

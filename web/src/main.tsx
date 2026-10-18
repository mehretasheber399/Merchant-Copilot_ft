import '@fontsource/noto-sans-ethiopic/400.css';
import '@fontsource/noto-sans-ethiopic/600.css';
import '@fontsource/noto-sans-ethiopic/700.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import './i18n';
import './index.css';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element missing');
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

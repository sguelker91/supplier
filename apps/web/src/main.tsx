import React from 'react';
import ReactDOM from 'react-dom/client';

import { App } from './App';
import './design-system/tokens.css';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root-Element #root nicht gefunden.');
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import { ObsidianCursor } from './components/ObsidianCursor';
import './index.css';
import './cursor.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ObsidianCursor />
    <App />
  </React.StrictMode>,
);

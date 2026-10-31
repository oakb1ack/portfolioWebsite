import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import { StygiusCursor } from './components/StygiusCursor';
import './index.css';
import './regions.css';
import './cursor.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <StygiusCursor />
    <App />
  </React.StrictMode>,
);

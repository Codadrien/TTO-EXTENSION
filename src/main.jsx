import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Initialisation de React et montage du composant App dans l'élément avec l'id "root"
ReactDOM.createRoot(document.getElementById('root')).render(
  // StrictMode aide à identifier les problèmes potentiels dans l'application
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Fonction pour initialiser l'application React
function initApp() {
  console.log('[TTO] initApp called');
  
  // Démonter l'instance précédente si elle existe
  if (window.__ttoRoot) {
    try {
      console.log('[TTO] Unmounting previous React root');
      window.__ttoRoot.unmount();
    } catch (e) {
      console.warn('[TTO] Error unmounting React:', e);
    }
  }
  
  // Trouver le container
  const container = document.getElementById('tto-extension-root') || document.getElementById('root');
  
  if (container) {
    console.log('[TTO] Container found, mounting React');
    // Créer et conserver la référence au root React
    const root = ReactDOM.createRoot(container);
    window.__ttoRoot = root;
    
    // Rendre l'application
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
    
    console.log('[TTO] React mounted successfully');
  } else {
    console.error('[TTO Extension] Aucun élément racine trouvé pour monter React');
  }
}

// Exposer initApp pour pouvoir réinitialiser l'app sur réouverture
window.initTTO = initApp;

// Lancer l'initialisation une première fois
initApp();

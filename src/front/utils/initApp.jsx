import React from 'react';
import ReactDOM from 'react-dom/client';
import DraggableContainer from '../components/DraggableContainer';

/**
 * Fonction pour initialiser l'application React
 * Gère le démontage de l'instance précédente et la création d'une nouvelle
 * @param {React.Component} AppComponent - Le composant App principal à rendre
 */
export function initApp(AppComponent) {
  // Démonter l'instance précédente si elle existe
  if (window.__ttoRoot) {
    try {
      window.__ttoRoot.unmount();
    } catch (e) {
      console.warn('Erreur lors du démontage de l\'instance React précédente:', e);
    }
  }
  
  // Trouver le container
  const container = document.getElementById('tto-extension-root') || document.getElementById('root');
  
  if (container) {
    // Créer et conserver la référence au root React
    const root = ReactDOM.createRoot(container);
    window.__ttoRoot = root;
    
    // Rendre l'application avec le wrapper draggable
    root.render(
      <React.StrictMode>
        <DraggableContainer>
          <AppComponent />
        </DraggableContainer>
      </React.StrictMode>
    );
    
    console.log('Application React initialisée avec succès');
  } else {
    console.error('Container React introuvable (tto-extension-root ou root)');
  }
}

/**
 * Fonction pour démonter l'application React
 */
export function unmountApp() {
  if (window.__ttoRoot) {
    try {
      window.__ttoRoot.unmount();
      window.__ttoRoot = null;
      console.log('Application React démontée avec succès');
    } catch (e) {
      console.error('Erreur lors du démontage de l\'application React:', e);
    }
  }
}

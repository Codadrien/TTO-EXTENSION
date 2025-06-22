import React from 'react';
import ReactDOM from 'react-dom/client';
import { initDragHandler } from './dragHandler';

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
  const container = document.getElementById('tto-extension-container');
  
  if (container) {
    // Ajouter la classe CSS pour les styles du panneau sans supprimer la classe d'animation
    // Les styles de position et animation sont gérés par panelManager.js et les CSS
    container.classList.add('tto-panel-container');
    
    // Créer et conserver la référence au root React
    const root = ReactDOM.createRoot(container);
    window.__ttoRoot = root;
    
    // Rendre l'application directement sans wrapper
    root.render(
      <React.StrictMode>
        <AppComponent />
      </React.StrictMode>
    );
    
    // Initialiser le gestionnaire de drag après le rendu
    setTimeout(() => {
      window.__ttoDragCleanup = initDragHandler();
    }, 100);
    
    console.log('Application React initialisée avec succès');
  } else {
    console.error('Container React introuvable (tto-extension-container)');
  }
}

/**
 * Fonction pour démonter l'application React
 */
export function unmountApp() {
  // Nettoyer le gestionnaire de drag
  if (window.__ttoDragCleanup) {
    try {
      window.__ttoDragCleanup();
      window.__ttoDragCleanup = null;
    } catch (e) {
      console.warn('Erreur lors du nettoyage du gestionnaire de drag:', e);
    }
  }
  
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

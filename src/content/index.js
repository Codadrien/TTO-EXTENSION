// Content script entry point
// Initializes image scraping and event handling for the extension

import { registerChromeMessageListener, updateImagesData } from './eventHandlers.js';

// Ajouter un écouteur pour les clics sur la page
let debounceTimer = null;
document.addEventListener('click', () => {
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    updateImagesData();
  }, 300); // Attendre 300ms après le dernier clic
}, { passive: true });

// Initialisation du listener
registerChromeMessageListener();

// Content script entry point
// Initializes image scraping and event handling for the extension

import { registerChromeMessageListener, updateImagesData } from './eventHandlers.js';
import { startCustomBoTTO } from './customBoTTO.js';

// Protection contre les multiples injections du content script
if (window.ttoContentScriptInjected) {
  console.log('[contentScript] Content script déjà injecté, arrêt de l\'initialisation');
  // Ne pas lancer l'initialisation si déjà fait
} else {
  console.log('[contentScript] Première injection du content script, initialisation...');
  window.ttoContentScriptInjected = true;

  // Ajouter un écouteur pour les clics sur la page
  let debounceTimer = null;
  document.addEventListener('click', (event) => {
    // Vérifie si le clic a eu lieu dans la sidebar de l'extension
    const sidebar = document.getElementById('tto-extension-container');
    if (sidebar && sidebar.contains(event.target)) {
      // Clic dans la sidebar : on ignore
      return;
    }
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(async () => {
      await updateImagesData();
    }, 300); // Attendre 300ms après le dernier clic
  }, { passive: true });

  // Initialisation du listener
  registerChromeMessageListener();
  
  // Initialisation du système d'injection de formulaire et duplication de bouton
  startCustomBoTTO();
}

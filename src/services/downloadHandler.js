// src/services/downloadHandler.js

/**
 * Gestionnaire d'événements pour les téléchargements
 * Ce fichier est importé dans contentScript.js pour gérer les téléchargements
 */

/**
 * Initialise l'écouteur d'événements pour les téléchargements
 */
export function initDownloadListener() {
  console.log('[downloadHandler] Initialisation de l\'écouteur de téléchargement');
  
  // Écouter l'événement TTO_DOWNLOAD_IMAGES
  document.addEventListener('TTO_DOWNLOAD_IMAGES', (event) => {
    console.log('[downloadHandler] Événement de téléchargement reçu:', event.detail);
    
    // Vérifier que les données sont valides
    if (!event.detail || !event.detail.url || !event.detail.filename) {
      console.error('[downloadHandler] Données de téléchargement invalides:', event.detail);
      return;
    }
    
    // Transmettre la demande de téléchargement au background script
    try {
      chrome.runtime.sendMessage({
        type: 'download',
        url: event.detail.url,
        filename: event.detail.filename
      }, (response) => {
        if (chrome.runtime.lastError) {
          console.error('[downloadHandler] Erreur lors de l\'envoi du message:', chrome.runtime.lastError);
        } else {
          console.log('[downloadHandler] Réponse du background script:', response);
        }
      });
    } catch (error) {
      console.error('[downloadHandler] Exception lors de l\'envoi du message:', error);
    }
  });
  
  console.log('[downloadHandler] Écouteur de téléchargement initialisé');
}

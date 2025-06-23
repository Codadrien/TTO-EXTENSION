// Event handlers for content script
// Manages Chrome extension messaging and DOM events

import { collectAllUrls, filterAndEnrichImages } from './imageScraper.js';

/**
 * Listener pour messages Chrome, répond de manière asynchrone.
 */
export function registerChromeMessageListener() {
  // Toujours garder le listener Chrome pour la compatibilité
  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.type === 'SCRAPE_IMAGES') {
      const allUrls = collectAllUrls();
      const totalCount = allUrls.length;
      // Utiliser des seuils plus flexibles pour détecter plus d'images
      const threshold = msg.threshold || 300; // Réduit de 500 à 300
      const areaThreshold = msg.areaThreshold || 150000; // ~387x387px minimum
      filterAndEnrichImages(allUrls, threshold, areaThreshold)
        .then(imagesWithFormat => {
          const largeCount = imagesWithFormat.length;
          const responsePayload = { images: imagesWithFormat, totalCount, largeCount };
          document.dispatchEvent(new CustomEvent('TTO_IMAGES_DATA', { detail: responsePayload }));
        });
      return true;
    }
  });
  
  // Ajouter des écouteurs pour les événements personnalisés
  document.addEventListener('TTO_PANEL_OPENED', () => {
    const allUrls = collectAllUrls();
    const totalCount = allUrls.length;
    // Seuils plus flexibles pour détecter les images avec fond blanc
    filterAndEnrichImages(allUrls, 300, 150000)
      .then(imagesWithFormat => {
        const largeCount = imagesWithFormat.length;
        const responsePayload = { images: imagesWithFormat, totalCount, largeCount };
        const event = new CustomEvent('TTO_IMAGES_DATA', { detail: responsePayload });
        document.dispatchEvent(event);
      });
  });
  
  // Écouteur pour les événements de téléchargement
  document.addEventListener('TTO_DOWNLOAD_IMAGES', (event) => {
    if (!event.detail || !event.detail.url || !event.detail.filename) {
      return;
    }
    try {
      chrome.runtime.sendMessage({
        type: 'download',
        url: event.detail.url,
        filename: event.detail.filename
      }, () => {
        // Callback vide - aucun traitement nécessaire après l'envoi du message
      });
    } catch (e) {
      // Ignorer les erreurs de communication avec le background script
      console.error('[contentScript] Erreur lors de l\'envoi du message de téléchargement', e);
    }
  });

  // Écouteur pour lancer traitement + téléchargement depuis la page
  document.addEventListener('TTO_PROCESS_AND_DOWNLOAD', (event) => {
    const { entries, folderName } = event.detail || {};
    try {
      chrome.runtime.sendMessage({ type: 'process_and_download', entries, folderName });
    } catch (e) {
      console.error('[contentScript] Impossible d\'envoyer process_and_download', e);
    }
  });
}

/**
 * Analyse les images de la page et envoie les résultats à l'UI React
 */
export function updateImagesData() {
  if (!document.getElementById('tto-extension-container')) return;
  const allUrls = collectAllUrls();
  const totalCount = allUrls.length;
  // Utiliser les nouveaux seuils plus flexibles
  filterAndEnrichImages(allUrls, 300, 150000).then(imagesWithFormat => {
    const largeCount = imagesWithFormat.length;
    const responsePayload = { images: imagesWithFormat, totalCount, largeCount };
    document.dispatchEvent(new CustomEvent('TTO_IMAGES_DATA', { detail: responsePayload }));
  });
}

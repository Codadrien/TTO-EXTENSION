// Event handlers for content script
// Manages Chrome extension messaging and DOM events

import { collectAllUrls, collectAllUrlsEnhanced, filterAndEnrichImages } from './imageScraper.js';

/**
 * Listener pour messages Chrome, répond de manière asynchrone.
 */
export function registerChromeMessageListener() {
  // Protection contre les multiples registrations
  if (window.ttoListenersRegistered) {
    console.log('[eventHandlers] Listeners déjà enregistrés, éviter les doublons');
    return;
  }
  window.ttoListenersRegistered = true;
  console.log('[eventHandlers] Enregistrement des listeners...');

  // Toujours garder le listener Chrome pour la compatibilité
  chrome.runtime.onMessage.addListener(async (msg) => {
    if (msg.type === 'SCRAPE_IMAGES') {
      const allUrls = await collectAllUrlsEnhanced();
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
  document.addEventListener('TTO_PANEL_OPENED', async () => {
    const allUrls = await collectAllUrlsEnhanced();
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

  // Écouteur pour les demandes de prévisualisation Pixian
  document.addEventListener('TTO_PIXIAN_PREVIEW_REQUEST', (event) => {
    const { imageUrl, productType, customMargins } = event.detail || {};
    if (!imageUrl) {
      console.error('[contentScript] URL d\'image manquante pour la prévisualisation');
      return;
    }
    
    try {
      chrome.runtime.sendMessage({
        type: 'process_pixian_preview',
        imageUrl: imageUrl,
        productType: productType,
        customMargins: customMargins
      }, (response) => {
        // Renvoyer la réponse à l'interface via un événement personnalisé
        if (chrome.runtime.lastError) {
          console.error('[contentScript] Erreur runtime lors de la prévisualisation:', chrome.runtime.lastError);
          document.dispatchEvent(new CustomEvent('TTO_PIXIAN_PREVIEW_RESPONSE', {
            detail: { success: false, error: chrome.runtime.lastError.message }
          }));
        } else if (response) {
          document.dispatchEvent(new CustomEvent('TTO_PIXIAN_PREVIEW_RESPONSE', {
            detail: response
          }));
        } else {
          document.dispatchEvent(new CustomEvent('TTO_PIXIAN_PREVIEW_RESPONSE', {
            detail: { success: false, error: 'Aucune réponse du background script' }
          }));
        }
      });
    } catch (e) {
      console.error('[contentScript] Impossible d\'envoyer la demande de prévisualisation', e);
      document.dispatchEvent(new CustomEvent('TTO_PIXIAN_PREVIEW_RESPONSE', {
        detail: { success: false, error: e.message }
      }));
    }
  });

  // Écouteur pour les demandes de stockage des presets et états
  document.addEventListener('TTO_STORAGE_REQUEST', (event) => {
    const { type, presets, key, value } = event.detail || {};
    
    try {
      chrome.runtime.sendMessage({
        type: 'storage_request',
        storageType: type,
        data: presets,
        key: key,
        value: value
      }, (response) => {
        if (chrome.runtime.lastError) {
          console.error('[contentScript] Erreur runtime lors du stockage:', chrome.runtime.lastError);
        } else if (response) {
          // Renvoyer la réponse à l'interface
          document.dispatchEvent(new CustomEvent('TTO_STORAGE_RESPONSE', {
            detail: response
          }));
        }
      });
    } catch (e) {
      console.error('[contentScript] Impossible d\'envoyer la demande de stockage', e);
    }
  });
}

/**
 * Analyse les images de la page et envoie les résultats à l'UI React
 */
export async function updateImagesData() {
  if (!document.getElementById('tto-extension-container')) return;
  const allUrls = await collectAllUrlsEnhanced();
  const totalCount = allUrls.length;
  // Utiliser les nouveaux seuils plus flexibles
  filterAndEnrichImages(allUrls, 300, 150000).then(imagesWithFormat => {
    const largeCount = imagesWithFormat.length;
    const responsePayload = { images: imagesWithFormat, totalCount, largeCount };
    document.dispatchEvent(new CustomEvent('TTO_IMAGES_DATA', { detail: responsePayload }));
  });
}

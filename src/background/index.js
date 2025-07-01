// Background script entry point for Chrome Extension V3
// Handles Chrome extension listeners and coordinates background services

import { processWithPixianByProductType, callPixianAPI } from './pixianService.js';
import { fetchImageBlob, prepareImageBlob, blobToJpegDataUrl, blobToPngDataUrl } from './imageUtils.js';
import { processWithShadowPreservation, processWithResize } from './canvasProcessor.js';
import { toggleTTO } from './panelManager.js';

// Orchestration des traitements d'images intégrée dans index.js

async function processWithPixian(url, filename, productType = 'default', customMargins = null) {
  console.log(`[background] Traitement Pixian (${productType}) pour ${filename}`);
  
  const blob = await fetchImageBlob(url);
  const { blob: preparedBlob } = await prepareImageBlob(blob, filename);
  const processedBlob = await processWithPixianByProductType(preparedBlob, filename, productType, customMargins);
  return blobToJpegDataUrl(processedBlob);
}

async function processWithPixianPngTransparent(url, filename) {
  console.log(`[background] Traitement Pixian PNG transparent pour ${filename}`);
  
  const blob = await fetchImageBlob(url);
  const { blob: preparedBlob } = await prepareImageBlob(blob, filename);
  
  // Appel direct à l'API Pixian avec options spécifiques pour PNG transparent
  // NE PAS inclure targetSize pour éviter le rendu carré
  const processedBlob = await callPixianAPI(preparedBlob, filename, {
    margin: '0% 0% 0% 0%',
    cropToForeground: 'true',
    // Pas de backgroundColor pour avoir un fond transparent
    outputFormat: 'png'
    // PAS de targetSize !
  });
  
  return blobToPngDataUrl(processedBlob);
}

async function processShadowPreservation(url, filename, maxSize = 2000) {
  console.log(`[background] Traitement avec préservation d'ombre pour ${filename}`);
  
  const blob = await fetchImageBlob(url);
  const { blob: preparedBlob } = await prepareImageBlob(blob, filename);
  
  // Créer un ImageBitmap à partir du blob
  const img = await createImageBitmap(preparedBlob);
  const processedBlob = await processWithShadowPreservation(img, maxSize);
  
  return blobToJpegDataUrl(processedBlob);
}

async function processResize(url, filename, maxSize = 2000) {
  console.log(`[background] Redimensionnement pour ${filename}`);
  
  const blob = await fetchImageBlob(url);
  const { blob: preparedBlob } = await prepareImageBlob(blob, filename);
  
  // Créer un ImageBitmap à partir du blob
  const img = await createImageBitmap(preparedBlob);
  const processedBlob = await processWithResize(img, maxSize);
  
  return blobToJpegDataUrl(processedBlob);
}

// Listener principal appelant toggleTTO dans l'onglet actif
chrome.action.onClicked.addListener((tab) => {
  console.log('[background] icon clicked, tab:', tab.id);
  chrome.scripting.executeScript({ target: { tabId: tab.id }, func: toggleTTO });
});

// Listener pour les messages de téléchargement
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'process_pixian_preview') {
    console.log('[background] Traitement Pixian pour prévisualisation demandé');
    const { imageUrl, productType = 'default', customMargins = null } = message;
    
    (async () => {
      try {
        // Génère un nom de fichier temporaire
        const tempFilename = `preview_${Date.now()}.jpg`;
        
        // Si productType est 'no_margins_png', traiter en PNG transparent bord à bord
        let processedUrl;
        if (productType === 'no_margins_png') {
          console.log('[background] Traitement PNG transparent bord à bord demandé');
          // Traiter en PNG transparent avec marges nulles et crop to foreground
          processedUrl = await processWithPixianPngTransparent(imageUrl, tempFilename);
        } else {
          // Traitement normal avec le type de produit et les marges
          processedUrl = await processWithPixian(imageUrl, tempFilename, productType, customMargins);
        }
        
        // Envoie la réponse avec l'URL de l'image traitée
        sendResponse({ success: true, processedImageUrl: processedUrl });
        
        console.log('[background] Prévisualisation Pixian terminée avec succès');
      } catch (error) {
        console.error('[background] Erreur lors de la prévisualisation Pixian:', error);
        sendResponse({ success: false, error: error.message });
      }
    })();
    
    return true; // Indique que sendResponse sera appelé de manière asynchrone
  }

  if (message.type === 'process_and_download') {
    console.log('[background] Téléchargement / traitement demandé');
    const { entries, folderName } = message;
    (async () => {
      for (const entry of entries) {
        const { url, order, processType, productType = 'default', customMargins = null } = entry;
        
        // Détermine le type de traitement basé sur processType
        const needsProcessing = processType === 'pixian';
        const shadowPreservation = processType === 'shoes_with_shadow';
        
        // Crée le chemin complet: date + folder + order
        const date = new Date();
        const dd = String(date.getDate()).padStart(2,'0');
        const mm = String(date.getMonth()+1).padStart(2,'0');
        const yyyy = date.getFullYear();
        const prefix = order>0? String(order).padStart(2,'0')+'-':'';
        
        // Récupération du nom original et conversion en .jpg
        let originalName = url.split('/').pop().split('?')[0] || 'image';
        
        // Force l'extension en .jpg
        originalName = originalName.replace(/\.[^.]+$/, '') + '.jpg';
        
        const filename = `${dd} ${mm} ${yyyy}/${folderName.trim()}/${prefix}${originalName}`;
        try {
          let downloadUrl;
          
          // Log des paramètres de traitement
          console.log(`[background] Traitement: ${processType}, Type: ${productType}, Marges:`, customMargins);
          
          // Choix du traitement selon le type (pixian avec productType, shoes avec ombre ou resize)
          if (shadowPreservation) {
            // Traitement avec préservation d'ombre pour chaussures (marges spéciales)
            downloadUrl = await processShadowPreservation(url, originalName);
          } else if (needsProcessing) {
            // Traitement avec Pixian standard (suppression de fond) avec le type de produit et marges personnalisées
            downloadUrl = await processWithPixian(url, originalName, productType, customMargins);
          } else {
            // Traitement simple avec redimensionnement
            downloadUrl = await processResize(url, originalName);
          }
          
          // Télécharge l'image traitée
          chrome.downloads.download({ url: downloadUrl, filename }, () => {
            let processTypeLabel = 'Resize';
            if (shadowPreservation) processTypeLabel = 'Shoes avec ombre';
            else if (needsProcessing) {
              processTypeLabel = customMargins ? `Pixian (${productType} - personnalisé)` : `Pixian (${productType})`;
            }
            
            console.log(`[background] Image téléchargée: ${filename} (${processTypeLabel})`);
          });
          
          // Petit délai humain
          await new Promise(r => setTimeout(r, Math.floor(Math.random()*200)+100));
        } catch(err) {
          console.error('[background] Erreur process/download', url, err);
          // Si code 402 (Payment Required), afficher une alert sur la page
          if (err.message && err.message.includes('Pixian 402')) {
            chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
              if (tabs[0]?.id) {
                chrome.scripting.executeScript({
                  target: {tabId: tabs[0].id},
                  func: () => alert('Mode test non activé : crédit Pixian épuisé ou paiement requis.')
                });
              }
            });
          }
        }
      }
    })();
    return true;
  }

  if (message.type === 'download') {
    console.log('[background] Téléchargement demandé pour:', message.url);
    console.log('[background] Chemin de destination:', message.filename);
    
    try {
      chrome.downloads.download({
        url: message.url,
        filename: message.filename,
        saveAs: false
      }, (downloadId) => {
        if (chrome.runtime.lastError) {
          console.error('[background] Erreur de téléchargement:', chrome.runtime.lastError);
          sendResponse({ success: false, error: chrome.runtime.lastError.message });
        } else {
          console.log('[background] Téléchargement démarré, ID:', downloadId);
          sendResponse({ success: true, downloadId: downloadId });
        }
      });
    } catch (error) {
      console.error('[background] Exception lors du téléchargement:', error);
      sendResponse({ success: false, error: error.message });
    }
    
    return true; // Indique que sendResponse sera appelé de manière asynchrone
  }
});

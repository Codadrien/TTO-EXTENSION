// Background script entry point for Chrome Extension V3
// Handles Chrome extension listeners and coordinates background services

import { processWithPixian, processWithPixianShoes, processWithResize } from './imageProcessor.js';
import { toggleTTO } from './panelManager.js';

// Listener principal appelant toggleTTO dans l'onglet actif
chrome.action.onClicked.addListener((tab) => {
  console.log('[background] icon clicked, tab:', tab.id);
  chrome.scripting.executeScript({ target: { tabId: tab.id }, func: toggleTTO });
});

// Listener pour les messages de téléchargement
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'process_and_download') {
    console.log('[background] Téléchargement / traitement demandé');
    const { entries, folderName } = message;
    (async () => {
      for (const entry of entries) {
        const { url, order, processType } = entry;
        
        // Détermine le type de traitement basé sur processType
        const needsProcessing = processType === 'pixian';
        const shoesProcessing = processType === 'shoes';
        
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
          
          // Choix du traitement selon le type (shoes, pixian standard ou resize)
          if (shoesProcessing) {
            // Traitement avec Pixian spécifique pour chaussures (marges spéciales)
            downloadUrl = await processWithPixianShoes(url, originalName);
          } else if (needsProcessing) {
            // Traitement avec Pixian standard (suppression de fond)
            downloadUrl = await processWithPixian(url, originalName);
          } else {
            // Traitement simple avec redimensionnement
            downloadUrl = await processWithResize(url, originalName);
          }
          
          // Télécharge l'image traitée
          chrome.downloads.download({ url: downloadUrl, filename }, () => {
            console.log(`[background] Image téléchargée: ${filename} (${shoesProcessing ? 'Shoes' : needsProcessing ? 'Pixian' : 'Resize'})`);
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

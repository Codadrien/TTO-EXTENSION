// src/content/content.js

// Injecte le script dans la page web
const script = document.createElement('script');
script.src = chrome.runtime.getURL('injected/imagesScraper.js');
script.onload = function () { this.remove(); };
(document.head || document.documentElement).appendChild(script);

// Variable pour stocker les images récupérées
let cachedImages = null;

// Fonction pour scraper les images et les mettre en cache
function scrapeAndCacheImages() {
  console.log('[content.js] Lancement du scraping automatique au chargement');
  // Transmet la demande au script injecté
  document.dispatchEvent(new CustomEvent('FROM_EXTENSION', { 
    detail: { type: 'SCRAPE_IMAGES' } 
  }));
}

// Exécute le scraping au chargement du content script
scrapeAndCacheImages();

// Écoute les messages venant du popup React
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('[content.js] onMessage reçu', message, sender);
  if (message.type === 'SCRAPE_IMAGES') {
    console.log('[content.js] Reçu message SCRAPE_IMAGES du popup');
    
    // Si on a déjà des images en cache, on les renvoie immédiatement
    if (cachedImages) {
      console.log('[content.js] Utilisation des images en cache', cachedImages);
      sendResponse({ images: cachedImages });
      return true;
    }
    
    // Transmet la demande au script injecté
    document.dispatchEvent(new CustomEvent('FROM_EXTENSION', { detail: message }));
    console.log('[content.js] Dispatché FROM_EXTENSION vers injected script', message.detail || message);

    // Attend la réponse du script injecté
    const handler = (event) => {
      console.log('[content.js] Réponse reçue de imagesScraper.js, renvoi au popup', event.detail);
      console.log('[content.js] Tableau reçu :', event.detail.images);
      
      // Stocke les images en cache pour les futures requêtes
      cachedImages = event.detail.images;
      
      sendResponse(event.detail);
      document.removeEventListener('TTO-EXTENSION', handler);
    };
    document.addEventListener('TTO-EXTENSION', handler);
    return true; // Indique que la réponse est asynchrone
  }
});

// Écoute également les événements TTO-EXTENSION pour mettre à jour le cache
document.addEventListener('TTO-EXTENSION', (event) => {
  if (event.detail && event.detail.images) {
    console.log('[content.js] Mise à jour du cache d\'images', event.detail.images);
    cachedImages = event.detail.images;
  }
});

/*
Ce script sert de pont : il injecte imagesScraper.js dans la page, relaie les messages du popup
et transmet les réponses du script injecté à React. Les logs aident à suivre le flux de bout en bout.
*/

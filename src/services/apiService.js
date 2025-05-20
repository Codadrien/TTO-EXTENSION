// src/apiService.js

/**
 * Récupère les images de la page active via le content script.
 * En local (ex. http://localhost:5173), on peut fallback vers un JSON de test.
 */
export async function getImages() {
    // Si on est en dev local, on peut charger un fichier JSON
    if (window.location.origin.includes('localhost')) {
      const res = await fetch('/test-data.json');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    }
  
    // Sinon, on demande au content script
    return new Promise((resolve, reject) => {
      chrome.tabs.query(
        { active: true, currentWindow: true },
        ([tab]) => {
          if (!tab?.id) return reject(new Error('No active tab'));
          chrome.tabs.sendMessage(
            tab.id,
            { type: 'SCRAPE_IMAGES' },
            response => {
              if (chrome.runtime.lastError) {
                return reject(chrome.runtime.lastError);
              }
              resolve(response.images || []);
            }
          );
        }
      );
    });
  }
  
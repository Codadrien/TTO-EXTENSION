// src/apiService.js

/**
 * Récupère les images de la page active via le content script.
 * En local (ex. http://localhost), on peut fallback vers un JSON de test.
 */
export async function getImages() {
    // Dev local avec Vite : fallback vers test-data.json
    if (import.meta.env.DEV) {
      const res = await fetch('/test-data.json');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      // Retourner au format attendu
      if (Array.isArray(data)) {
        return { images: data, totalCount: data.length, largeCount: data.length };
      }
      return {
        images: data.images ?? [],
        totalCount: data.totalCount ?? (data.images?.length ?? 0),
        largeCount: data.largeCount ?? (data.images?.length ?? 0)
      };
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
              // Return images along with counts
              resolve({ 
                images: response.images || [], 
                totalCount: response.totalCount || 0, 
                largeCount: response.largeCount || 0 
              });
            }
          );
        }
      );
    });
  }
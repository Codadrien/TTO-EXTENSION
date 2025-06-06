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

  // Vérifier si nous sommes dans un contexte d'extension Chrome
  if (typeof chrome !== 'undefined' && chrome.runtime) {
    // Essayer d'abord la méthode par événement personnalisé (pour l'injection directe)
    try {
      const result = await new Promise((resolve, reject) => {
        // Fonction qui sera appelée quand les données sont reçues
        const handleImageData = (event) => {
          console.log('[apiService] Données reçues via événement personnalisé:', event.detail);
          document.removeEventListener('TTO_IMAGES_DATA', handleImageData);
          resolve(event.detail);
        };

        // Écouter l'événement personnalisé
        document.addEventListener('TTO_IMAGES_DATA', handleImageData);

        // Définir un timeout pour fallback vers la méthode chrome.tabs si nécessaire
        setTimeout(() => {
          document.removeEventListener('TTO_IMAGES_DATA', handleImageData);
          reject(new Error('Timeout waiting for custom event'));
        }, 2000);
      });

      return result;
    } catch (error) {
      console.log('[apiService] Fallback vers méthode chrome.tabs:', error);
      // Fallback vers la méthode chrome.tabs si l'événement personnalisé échoue
    }

    // Méthode originale via chrome.tabs
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

  // Si nous ne sommes ni en DEV ni dans une extension Chrome
  throw new Error('Environnement non supporté');
}
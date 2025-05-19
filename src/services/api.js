/**
 * Service API pour communiquer avec le content script et récupérer les images
 */

/**
 * Envoie un message au content script pour récupérer les images de la page
 * @returns {Promise<Array>} Tableau d'URLs d'images
 */
export const fetchImagesFromContentScript = () => {
  console.log('[api.js] Début fetchImagesFromContentScript');
  
  // Images de secours en cas d'échec
  const fallbackImages = [
    'https://picsum.photos/200/300',
    'https://picsum.photos/300/200',
    'https://picsum.photos/400/400'
  ];
  
  return new Promise((resolve, reject) => {
    try {
      // Vérifie si l'API chrome est disponible
      if (typeof chrome === 'undefined' || !chrome.tabs) {
        console.error('[api.js] Erreur: API chrome non disponible, utilisation du fallback');
        resolve(fallbackImages);
        return;
      }

      // Récupère l'onglet actif
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (!tabs || tabs.length === 0) {
          console.error('[api.js] Erreur: Aucun onglet actif trouvé, utilisation du fallback');
          resolve(fallbackImages);
          return;
        }

        const activeTab = tabs[0];
        console.log('[api.js] Onglet actif trouvé:', activeTab.id);

        // Définir un timeout pour la réponse du content script
        const timeoutId = setTimeout(() => {
          console.warn('[api.js] Timeout: Pas de réponse du content script après 5 secondes');
          resolve(fallbackImages);
        }, 5000);
        
        // Envoie un message au content script
        console.log('[api.js] Envoi du message au content script:', { type: 'SCRAPE_IMAGES' });
        chrome.tabs.sendMessage(
          activeTab.id,
          { type: 'SCRAPE_IMAGES' },
          (response) => {
            clearTimeout(timeoutId); // Annule le timeout si on a une réponse
            
            // Vérifie si une erreur de communication est survenue
            if (chrome.runtime.lastError) {
              console.error('[api.js] Erreur de communication:', chrome.runtime.lastError);
              console.log('[api.js] Détails de l\'erreur:', JSON.stringify(chrome.runtime.lastError));
              resolve(fallbackImages);
              return;
            }

            // Vérifie si la réponse est valide
            if (!response) {
              console.error('[api.js] Erreur: Réponse vide du content script');
              resolve(fallbackImages);
              return;
            }
            
            console.log('[api.js] Réponse reçue du content script:', response);
            
            // Vérifie si la propriété images existe
            if (!response.images) {
              console.error('[api.js] Erreur: Propriété images manquante dans la réponse', response);
              
              // Tente de traiter la réponse comme si elle était directement le tableau d'images
              if (Array.isArray(response)) {
                console.log('[api.js] La réponse est un tableau, on l\'utilise directement');
                resolve(response);
                return;
              }
              
              resolve(fallbackImages);
              return;
            }

            console.log('[api.js] Images récupérées avec succès:', response.images);
            resolve(response.images);
          }
        );
      });
    } catch (error) {
      console.error('[api.js] Erreur inattendue:', error);
      console.log('[api.js] Stack trace:', error.stack);
      resolve(fallbackImages); // Utiliser le fallback au lieu de rejeter
    }
  });
};

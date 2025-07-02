import { TIMEOUTS } from '../constants.js';

/**
 * Service de traitement d'images via l'API Pixian
 */
export class PixianService {
  /**
   * Traite une image avec Pixian SANS marges (PNG transparent bord à bord)
   * @param {string} imageUrl - URL de l'image à traiter
   * @returns {Promise<string>} URL de l'image traitée
   */
  static async processImageNoMargins(imageUrl) {
    try {
      console.log('[PixianService] Début du traitement Pixian SANS marges pour:', imageUrl);
      
      // Créer un message pour le background script - traitement PNG transparent bord à bord
      const message = {
        type: 'process_pixian_preview',
        imageUrl: imageUrl,
        productType: 'no_margins_png', // Type spécial pour PNG transparent sans marges
        customMargins: { top: 0, right: 0, bottom: 0, left: 0 }
      };

      // Envoyer le message au background script via un événement personnalisé
      return new Promise((resolve, reject) => {
        const handleResponse = (event) => {
          if (event.detail.success) {
            console.log('[PixianService] Traitement réussi:', event.detail.processedImageUrl);
            resolve(event.detail.processedImageUrl);
          } else {
            console.error('[PixianService] Erreur de traitement:', event.detail.error);
            reject(new Error(event.detail.error));
          }
          document.removeEventListener('TTO_PIXIAN_PREVIEW_RESPONSE', handleResponse);
        };

        document.addEventListener('TTO_PIXIAN_PREVIEW_RESPONSE', handleResponse);
        document.dispatchEvent(new CustomEvent('TTO_PIXIAN_PREVIEW_REQUEST', { detail: message }));

        // Timeout après 30 secondes
        setTimeout(() => {
          document.removeEventListener('TTO_PIXIAN_PREVIEW_RESPONSE', handleResponse);
          reject(new Error('Timeout lors du traitement Pixian'));
        }, TIMEOUTS.PIXIAN_PROCESSING);
      });
    } catch (error) {
      console.error('[PixianService] Erreur lors du traitement Pixian sans marges:', error);
      throw error;
    }
  }
} 
import { 
  CUSTOM_EVENTS, 
  MESSAGE_TYPES, 
  TIMEOUTS 
} from '../constants.js';

/**
 * Service pour gérer les interactions avec l'API Pixian
 */
export const pixianService = {
  /**
   * Traiter une image avec Pixian sans marges (PNG transparent)
   * @param {string} imageUrl - URL de l'image à traiter
   * @returns {Promise<string>} URL de l'image traitée
   */
  async processImageWithoutMargins(imageUrl) {
    try {
      console.log('[pixianService] Début du traitement Pixian SANS marges pour:', imageUrl);
      
      const message = {
        type: MESSAGE_TYPES.PROCESS_PIXIAN_PREVIEW,
        imageUrl: imageUrl,
        productType: MESSAGE_TYPES.PRODUCT_TYPE_NO_MARGINS,
        customMargins: { top: 0, right: 0, bottom: 0, left: 0 }
      };

      return new Promise((resolve, reject) => {
        const handleResponse = (event) => {
          if (event.detail.success) {
            resolve(event.detail.processedImageUrl);
          } else {
            reject(new Error(event.detail.error));
          }
          document.removeEventListener(CUSTOM_EVENTS.TTO_PIXIAN_PREVIEW_RESPONSE, handleResponse);
        };

        document.addEventListener(CUSTOM_EVENTS.TTO_PIXIAN_PREVIEW_RESPONSE, handleResponse);
        document.dispatchEvent(new CustomEvent(CUSTOM_EVENTS.TTO_PIXIAN_PREVIEW_REQUEST, { 
          detail: message 
        }));

        // Timeout après 30 secondes
        setTimeout(() => {
          document.removeEventListener(CUSTOM_EVENTS.TTO_PIXIAN_PREVIEW_RESPONSE, handleResponse);
          reject(new Error('Timeout lors du traitement Pixian'));
        }, TIMEOUTS.PIXIAN_PROCESSING);
      });
    } catch (error) {
      console.error('[pixianService] Erreur lors du traitement:', error);
      throw error;
    }
  }
}; 
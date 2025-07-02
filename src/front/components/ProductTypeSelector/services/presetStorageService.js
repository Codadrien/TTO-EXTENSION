import { 
  CUSTOM_EVENTS, 
  STORAGE_REQUEST_TYPES, 
  TIMEOUTS 
} from '../constants.js';

/**
 * Service pour gérer le stockage des presets
 */
export const presetStorageService = {
  /**
   * Charger les presets depuis le stockage
   * @returns {Promise<Array>} Liste des presets
   */
  async loadPresets() {
    try {
      return new Promise((resolve) => {
        const handleResponse = (event) => {
          if (event.detail.type === STORAGE_REQUEST_TYPES.LOAD_PRESETS_RESPONSE) {
            const presets = event.detail.presets || [];
            document.removeEventListener(CUSTOM_EVENTS.TTO_STORAGE_RESPONSE, handleResponse);
            resolve(presets);
          }
        };

        document.addEventListener(CUSTOM_EVENTS.TTO_STORAGE_RESPONSE, handleResponse);
        document.dispatchEvent(new CustomEvent(CUSTOM_EVENTS.TTO_STORAGE_REQUEST, { 
          detail: { type: STORAGE_REQUEST_TYPES.LOAD_PRESETS } 
        }));

        // Timeout de sécurité
        setTimeout(() => {
          document.removeEventListener(CUSTOM_EVENTS.TTO_STORAGE_RESPONSE, handleResponse);
          resolve([]);
        }, TIMEOUTS.STORAGE_OPERATION);
      });
    } catch (error) {
      console.error('[presetStorageService] Erreur lors du chargement:', error);
      return [];
    }
  },

  /**
   * Sauvegarder les presets dans le stockage
   * @param {Array} presets - Liste des presets à sauvegarder
   * @returns {Promise<void>}
   */
  async savePresets(presets) {
    try {
      return new Promise((resolve, reject) => {
        const handleResponse = (event) => {
          if (event.detail.type === STORAGE_REQUEST_TYPES.SAVE_PRESETS_RESPONSE) {
            document.removeEventListener(CUSTOM_EVENTS.TTO_STORAGE_RESPONSE, handleResponse);
            resolve();
          }
        };

        document.addEventListener(CUSTOM_EVENTS.TTO_STORAGE_RESPONSE, handleResponse);
        document.dispatchEvent(new CustomEvent(CUSTOM_EVENTS.TTO_STORAGE_REQUEST, { 
          detail: { 
            type: STORAGE_REQUEST_TYPES.SAVE_PRESETS, 
            presets: presets 
          } 
        }));

        // Timeout de sécurité
        setTimeout(() => {
          document.removeEventListener(CUSTOM_EVENTS.TTO_STORAGE_RESPONSE, handleResponse);
          reject(new Error('Timeout lors de la sauvegarde'));
        }, TIMEOUTS.STORAGE_OPERATION);
      });
    } catch (error) {
      console.error('[presetStorageService] Erreur lors de la sauvegarde:', error);
      throw error;
    }
  }
}; 
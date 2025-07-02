import { TIMEOUTS } from '../constants.js';

/**
 * Service de gestion du stockage des presets via messaging
 */
export class StorageService {
  /**
   * Charge les presets depuis le stockage
   * @returns {Promise<Array>} Liste des presets sauvegardés
   */
  static async loadPresets() {
    try {
      return new Promise((resolve) => {
        const handleResponse = (event) => {
          if (event.detail.type === 'LOAD_PRESETS_RESPONSE') {
            const presets = event.detail.presets || [];
            console.log('[StorageService] Presets chargés:', presets);
            document.removeEventListener('TTO_STORAGE_RESPONSE', handleResponse);
            resolve(presets);
          }
        };

        document.addEventListener('TTO_STORAGE_RESPONSE', handleResponse);
        document.dispatchEvent(new CustomEvent('TTO_STORAGE_REQUEST', { 
          detail: { type: 'LOAD_PRESETS' } 
        }));

        // Timeout de sécurité
        setTimeout(() => {
          document.removeEventListener('TTO_STORAGE_RESPONSE', handleResponse);
          resolve([]);
        }, TIMEOUTS.STORAGE_OPERATION);
      });
    } catch (error) {
      console.error('[StorageService] Erreur lors du chargement des presets:', error);
      return [];
    }
  }

  /**
   * Sauvegarde les presets dans le stockage
   * @param {Array} presets - Liste des presets à sauvegarder
   * @returns {Promise<boolean>} Succès de l'opération
   */
  static async savePresets(presets) {
    try {
      return new Promise((resolve) => {
        const handleResponse = (event) => {
          if (event.detail.type === 'SAVE_PRESETS_RESPONSE') {
            console.log('[StorageService] Presets sauvegardés avec succès');
            document.removeEventListener('TTO_STORAGE_RESPONSE', handleResponse);
            resolve(true);
          }
        };

        document.addEventListener('TTO_STORAGE_RESPONSE', handleResponse);
        document.dispatchEvent(new CustomEvent('TTO_STORAGE_REQUEST', { 
          detail: { type: 'SAVE_PRESETS', presets: presets } 
        }));

        // Timeout de sécurité
        setTimeout(() => {
          document.removeEventListener('TTO_STORAGE_RESPONSE', handleResponse);
          resolve(false);
        }, TIMEOUTS.STORAGE_OPERATION);
      });
    } catch (error) {
      console.error('[StorageService] Erreur lors de la sauvegarde des presets:', error);
      return false;
    }
  }
} 
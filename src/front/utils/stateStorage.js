/**
 * Utilitaire pour gérer la sauvegarde et restauration de l'état de l'extension
 * Sauvegarde automatiquement : preset sélectionné, marges custom, toggle shadow
 */

// Clés de stockage pour les différents états
export const STORAGE_KEYS = {
  SELECTED_PRESET: 'tto_selected_preset',
  CUSTOM_MARGINS: 'tto_custom_margins', 
  SHADOW_MODE_ENABLED: 'tto_shadow_mode_enabled'
};

/**
 * Sauvegarde un état spécifique dans chrome.storage.local via le système de messages
 * @param {string} key - Clé de stockage
 * @param {*} value - Valeur à sauvegarder
 */
export const saveState = async (key, value) => {
  try {
    return new Promise((resolve) => {
      const handleResponse = (event) => {
        if (event.detail.type === 'SAVE_STATE_RESPONSE') {
          console.log(`[stateStorage] État sauvegardé: ${key} =`, value);
          document.removeEventListener('TTO_STORAGE_RESPONSE', handleResponse);
          resolve();
        }
      };

      document.addEventListener('TTO_STORAGE_RESPONSE', handleResponse);
      document.dispatchEvent(new CustomEvent('TTO_STORAGE_REQUEST', { 
        detail: { 
          type: 'SAVE_STATE', 
          key: key,
          value: value
        } 
      }));

      // Timeout de sécurité
      setTimeout(() => {
        document.removeEventListener('TTO_STORAGE_RESPONSE', handleResponse);
        resolve();
      }, 2000);
    });
  } catch (error) {
    console.error(`[stateStorage] Erreur lors de la sauvegarde de ${key}:`, error);
  }
};

/**
 * Charge un état spécifique depuis chrome.storage.local via le système de messages
 * @param {string} key - Clé de stockage
 * @returns {Promise<*>} - Valeur chargée ou undefined
 */
export const loadState = async (key) => {
  try {
    return new Promise((resolve) => {
      const handleResponse = (event) => {
        if (event.detail.type === 'LOAD_STATE_RESPONSE') {
          const value = event.detail.value;
          console.log(`[stateStorage] État chargé: ${key} =`, value);
          document.removeEventListener('TTO_STORAGE_RESPONSE', handleResponse);
          resolve(value);
        }
      };

      document.addEventListener('TTO_STORAGE_RESPONSE', handleResponse);
      document.dispatchEvent(new CustomEvent('TTO_STORAGE_REQUEST', { 
        detail: { 
          type: 'LOAD_STATE',
          key: key
        } 
      }));

      // Timeout de sécurité
      setTimeout(() => {
        document.removeEventListener('TTO_STORAGE_RESPONSE', handleResponse);
        console.log(`[stateStorage] Timeout pour ${key} - retour undefined`);
        resolve(undefined);
      }, 2000);
    });
  } catch (error) {
    console.error(`[stateStorage] Erreur lors du chargement de ${key}:`, error);
    return undefined;
  }
};

/**
 * Charge tous les états sauvegardés via le système de messages
 * @returns {Promise<Object>} - Objet contenant tous les états
 */
export const loadAllStates = async () => {
  try {
    return new Promise((resolve) => {
      const handleResponse = (event) => {
        if (event.detail.type === 'LOAD_STATES_RESPONSE') {
          const states = event.detail.states || {};
          console.log('[stateStorage] Tous les états chargés:', states);
          document.removeEventListener('TTO_STORAGE_RESPONSE', handleResponse);
          resolve(states);
        }
      };

      document.addEventListener('TTO_STORAGE_RESPONSE', handleResponse);
      document.dispatchEvent(new CustomEvent('TTO_STORAGE_REQUEST', { 
        detail: { type: 'LOAD_STATES' } 
      }));

      // Timeout de sécurité
      setTimeout(() => {
        document.removeEventListener('TTO_STORAGE_RESPONSE', handleResponse);
        console.log('[stateStorage] Timeout - retour objet vide');
        resolve({});
      }, 2000);
    });
  } catch (error) {
    console.error('[stateStorage] Erreur lors du chargement de tous les états:', error);
    return {};
  }
};

/**
 * Efface tous les états sauvegardés
 */
export const clearAllStates = async () => {
  try {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      const keys = Object.values(STORAGE_KEYS);
      await chrome.storage.local.remove(keys);
      console.log('[stateStorage] Tous les états effacés');
    }
  } catch (error) {
    console.error('[stateStorage] Erreur lors de l\'effacement des états:', error);
  }
};

// Export par défaut pour la compatibilité
export default {
  saveState,
  loadState,
  loadAllStates,
  clearAllStates,
  STORAGE_KEYS
}; 
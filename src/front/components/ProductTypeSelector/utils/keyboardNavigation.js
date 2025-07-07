import { DOM_SELECTORS } from '../constants.js';

/**
 * Utilitaires pour la navigation au clavier
 */
export const keyboardNavigation = {
  /**
   * Gérer la navigation circulaire avec Tab dans les inputs de marges
   * @param {Event} e - Événement clavier
   * @param {string} currentInput - Input actuel ('top', 'right', 'bottom', 'left')
   */
  handleKeyDown(e, currentInput) {
    if (e.key === 'Tab' && !e.shiftKey) {
      // Tab normal (vers l'avant)
      if (currentInput === 'left') {
        e.preventDefault();
        // Revenir au premier input (top)
        const topInput = document.querySelector(DOM_SELECTORS.TOP_INPUT);
        if (topInput) topInput.focus();
      }
    } else if (e.key === 'Tab' && e.shiftKey) {
      // Shift+Tab (vers l'arrière)
      if (currentInput === 'top') {
        e.preventDefault();
        // Aller au dernier input (left)
        const leftInput = document.querySelector(DOM_SELECTORS.LEFT_INPUT);
        if (leftInput) leftInput.focus();
      }
    }
  }
}; 
import { 
  DOM_SELECTORS, 
  PROBLEMATIC_CSS_CLASSES 
} from '../constants.js';

/**
 * Service pour gérer l'injection d'images dans le DOM
 */
export const imageInjectionService = {
  /**
   * Injecter une image traitée sur le site
   * @param {string} processedImageUrl - URL de l'image traitée
   */
  injectImageOnSite(processedImageUrl) {
    try {
      const allImages = document.querySelectorAll(DOM_SELECTORS.SWIPER_IMAGES);
      
      // Filtrer pour exclure les images avec les classes problématiques
      const targetElements = Array.from(allImages).filter(img => {
        const classList = img.classList;
        const hasProblematicClasses = PROBLEMATIC_CSS_CLASSES.every(className => 
          classList.contains(className)
        );
        return !hasProblematicClasses;
      });
      
      if (targetElements.length === 0) {
        console.warn('[imageInjectionService] Aucun élément valide trouvé');
        return;
      }

      targetElements.forEach((img, index) => {
        const parent = img.parentElement;
        if (!parent) return;

        const parentPadding = window.getComputedStyle(parent).padding;

        // Créer le conteneur
        const container = document.createElement('div');
        container.className = 'tto-image-container';
        container.id = `tto-container-${index}`;
        container.style.padding = parentPadding;

        // Créer l'image détourée
        const overlayImg = document.createElement('img');
        overlayImg.src = processedImageUrl;
        overlayImg.className = 'tto-image-overlay';
        overlayImg.id = `tto-overlay-${index}`;
        
        // Styles pour le conteneur
        container.style.cssText += `
          position: absolute !important;
          top: 0 !important;
          left: 0 !important;
          width: 100% !important;
          height: 100% !important;
          pointer-events: none !important;
          z-index: 999 !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          transition: all 0.3s ease !important;
        `;

        // Styles pour l'image
        overlayImg.style.cssText = `
          max-width: 100% !important;
          max-height: 100% !important;
          width: 520px !important;
          height: auto !important;
          object-fit: contain !important;
          transition: all 0.3s ease !important;
          padding: 0% !important;
        `;

        container.appendChild(overlayImg);

        // Positionner le parent
        const parentStyle = window.getComputedStyle(parent);
        if (parentStyle.position === 'static') {
          parent.style.position = 'relative';
        }
        parent.appendChild(container);
      });

      console.log('[imageInjectionService] Image injectée sur', targetElements.length, 'éléments');
    } catch (error) {
      console.error('[imageInjectionService] Erreur lors de l\'injection:', error);
    }
  },

  /**
   * Afficher/masquer les superpositions d'images
   * @param {boolean} visible - True pour afficher, false pour masquer
   */
  toggleImageOverlaysVisibility(visible) {
    const containers = document.querySelectorAll(DOM_SELECTORS.TTO_CONTAINER);
    containers.forEach(container => {
      container.style.display = visible ? 'flex' : 'none';
    });
    
    console.log(`[imageInjectionService] Superpositions ${visible ? 'affichées' : 'masquées'}`);
  },

  /**
   * Supprimer définitivement les superpositions d'images
   */
  removeImageOverlays() {
    const containers = document.querySelectorAll(DOM_SELECTORS.TTO_CONTAINER);
    containers.forEach(container => container.remove());
    
    // Nettoyer les marges stockées
    delete window.ttoCurrentMargins;
    
    console.log('[imageInjectionService] Superpositions supprimées définitivement');
  },

  /**
   * Mettre à jour les marges des images injectées
   * @param {Object} margins - Nouvelles marges {top, right, bottom, left}
   */
  updateInjectedImageMargins(margins) {
    const overlayImages = document.querySelectorAll(DOM_SELECTORS.TTO_OVERLAY);
    overlayImages.forEach(overlayImg => {
      overlayImg.style.padding = `${margins.top || 0}% ${margins.right || 0}% ${margins.bottom || 0}% ${margins.left || 0}%`;
    });
    
    // Stocker les valeurs pour l'export final
    window.ttoCurrentMargins = {
      top: margins.top || 0,
      right: margins.right || 0,
      bottom: margins.bottom || 0,
      left: margins.left || 0
    };
    
    console.log('[imageInjectionService] Marges mises à jour:', margins);
  }
}; 
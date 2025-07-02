import { DOM_SELECTORS, PROBLEMATIC_CSS_CLASSES } from '../constants.js';

/**
 * Utilitaires pour la gestion des images injectées
 */
export class ImageUtils {
  /**
   * Obtient la première image sélectionnée (ordre #1)
   * @param {Array} images - Liste des images
   * @param {Object} selectedOrder - Ordre de sélection des images
   * @returns {Object|null} Première image sélectionnée ou null
   */
  static getFirstSelectedImage(images, selectedOrder) {
    // Trouve l'index de l'image avec l'ordre 1
    const firstImageIndex = Object.entries(selectedOrder)
      .find(([idx, order]) => order === 1)?.[0];
    
    if (firstImageIndex !== undefined) {
      const index = parseInt(firstImageIndex);
      return images[index];
    }
    return null;
  }

  /**
   * Obtient l'index de la première image sélectionnée
   * @param {Object} selectedOrder - Ordre de sélection des images
   * @returns {number|null} Index de la première image sélectionnée ou null
   */
  static getFirstSelectedImageIndex(selectedOrder) {
    const firstImageIndex = Object.entries(selectedOrder)
      .find(([idx, order]) => order === 1)?.[0];
    
    return firstImageIndex !== undefined ? parseInt(firstImageIndex) : null;
  }

  /**
   * Injecte une image sur le site avec un élément IMG réel
   * @param {string} processedImageUrl - URL de l'image traitée
   */
  static injectImageOnSite(processedImageUrl) {
    try {
      // Sélectionner tous les éléments .swiper-slide-active img
      const allImages = document.querySelectorAll(DOM_SELECTORS.SWIPER_IMAGES);
      
      // Filtrer pour exclure les images avec les classes problématiques
      const targetElements = Array.from(allImages).filter(img => {
        const classList = img.classList;
        // Exclure si l'image a les 3 classes problématiques ensemble
        const hasProblematicClasses = PROBLEMATIC_CSS_CLASSES.every(className => 
          classList.contains(className)
        );
        return !hasProblematicClasses;
      });
      
      if (targetElements.length === 0) {
        console.warn('[ImageUtils] Aucun élément valide trouvé pour l\'injection');
        return;
      }

      targetElements.forEach((img, index) => {
        // Parent swiper-slide-active
        const parent = img.parentElement;
        if (!parent) return;

        // Lire le padding du parent
        const parentPadding = window.getComputedStyle(parent).padding;

        // Créer un conteneur pour la superposition
        const container = document.createElement('div');
        container.className = 'tto-image-container';
        container.id = `tto-container-${index}`;

        // Appliquer le même padding que le parent
        container.style.padding = parentPadding;

        // Créer l'élément IMG détouré
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

        // Styles pour l'image injectée - SANS marges initialement
        overlayImg.style.cssText = `
          max-width: 100% !important;
          max-height: 100% !important;
          width: 520px !important;
          height: auto !important;
          object-fit: contain !important;
          transition: all 0.3s ease !important;
          padding: 0% !important;
        `;

        // Ajouter l'image dans le conteneur
        container.appendChild(overlayImg);

        // S'assurer que le parent est positionné
        const parentStyle = window.getComputedStyle(parent);
        if (parentStyle.position === 'static') {
          parent.style.position = 'relative';
        }
        parent.appendChild(container);
      });

      console.log('[ImageUtils] Image injectée sur', targetElements.length, 'éléments');
    } catch (error) {
      console.error('[ImageUtils] Erreur lors de l\'injection:', error);
    }
  }

  /**
   * Masque ou affiche les superpositions d'images
   * @param {boolean} visible - Visibilité des superpositions
   */
  static toggleImageOverlaysVisibility(visible) {
    const containers = document.querySelectorAll(DOM_SELECTORS.TTO_CONTAINER);
    containers.forEach(container => {
      container.style.display = visible ? 'flex' : 'none';
    });
    
    console.log(`[ImageUtils] Superpositions ${visible ? 'affichées' : 'masquées'}`);
  }

  /**
   * Supprime définitivement les superpositions (pour changement d'image)
   */
  static removeImageOverlays() {
    const containers = document.querySelectorAll(DOM_SELECTORS.TTO_CONTAINER);
    containers.forEach(container => container.remove());
    
    // Nettoyer les marges stockées
    delete window.ttoCurrentMargins;
    
    console.log('[ImageUtils] Superpositions supprimées définitivement');
  }

  /**
   * Met à jour les marges de l'image injectée
   * @param {Object} newMargins - Nouvelles marges {top, right, bottom, left}
   */
  static updateInjectedImageMargins(newMargins) {
    // Toujours mettre à jour le padding, même si pas visible (pour garder l'état)
    const overlayImages = document.querySelectorAll(DOM_SELECTORS.TTO_OVERLAY);
    overlayImages.forEach(overlayImg => {
      overlayImg.style.padding = `${newMargins.top || 0}% ${newMargins.right || 0}% ${newMargins.bottom || 0}% ${newMargins.left || 0}%`;
    });
    
    // Stocker les valeurs pour l'export final API Pixian
    window.ttoCurrentMargins = {
      top: newMargins.top || 0,
      right: newMargins.right || 0,
      bottom: newMargins.bottom || 0,
      left: newMargins.left || 0
    };
    
    console.log('[ImageUtils] PADDING mis à jour:', newMargins);
  }
} 
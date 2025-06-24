// Gestionnaire d'overlay pour la prévisualisation en temps réel
// Permet de superposer l'image traitée sur les images du carrousel produit

/**
 * Classe pour gérer l'overlay de prévisualisation d'image
 * Injecte l'image traitée sur les images du carrousel et permet l'ajustement des marges
 */
class OverlayManager {
  constructor() {
    // Image traitée à afficher en overlay
    this.processedImageUrl = null;
    
    // Marges actuelles (en décimal, 0-1)
    this.margins = {
      top: 0,     // Marge supérieure (0-1)
      right: 0.07, // Marge droite (0-1)
      bottom: 0.24, // Marge inférieure (0-1)
      left: 0.07   // Marge gauche (0-1)
    };
    
    // Éléments d'overlay créés
    this.overlayElements = [];
    
    // Panneau de contrôle des marges
    this.controlPanel = null;
    
    // État actuel de l'overlay
    this.isActive = false;
  }

  /**
   * Active l'overlay avec une image traitée
   * @param {string} imageUrl - URL de l'image traitée à afficher
   */
  activateOverlay(imageUrl) {
    console.log('[OverlayManager] Activation de l\'overlay avec image:', imageUrl);
    
    this.processedImageUrl = imageUrl;
    this.isActive = true;
    
    // Créer le panneau de contrôle des marges
    this.createControlPanel();
    
    // Injecter l'overlay sur toutes les images du carrousel
    this.injectOverlayOnCarouselImages();
    
    // Observer les changements du DOM pour les nouvelles images du carrousel
    this.startCarouselObserver();
  }

  /**
   * Désactive l'overlay et nettoie tous les éléments
   */
  deactivateOverlay() {
    console.log('[OverlayManager] Désactivation de l\'overlay');
    
    this.isActive = false;
    this.processedImageUrl = null;
    
    // Supprimer tous les overlays
    this.removeAllOverlays();
    
    // Supprimer le panneau de contrôle
    this.removeControlPanel();
    
    // Arrêter l'observation du carrousel
    this.stopCarouselObserver();
  }

  /**
   * Met à jour les marges et applique les changements
   * @param {Object} newMargins - Nouvelles valeurs de marges
   */
  updateMargins(newMargins = {}) {
    // Mettre à jour les marges avec les nouvelles valeurs
    this.margins = {
      ...this.margins,
      ...newMargins
    };
    
    console.log('[OverlayManager] Marges mises à jour:', this.margins);
    
    // Appliquer les nouvelles marges à l'overlay
    this.applyMarginsToOverlay();
    
    // Envoyer un événement avec les marges mises à jour
    const event = new CustomEvent('TTO_MARGINS_UPDATED', {
      detail: {
        margins: {
          top: this.margins.top,
          right: this.margins.right,
          bottom: this.margins.bottom,
          left: this.margins.left
        }
      }
    });
    document.dispatchEvent(event);
  }

  /**
   * Trouve l'image active du carrousel produit sur la page
   * @returns {NodeList} Liste contenant l'image active du carrousel (excluant celles avec la classe object-contain)
   */
  findCarouselImages() {
    // Sélecteur pour l'image active du carrousel produit sur tonton-outdoor.com
    // Exclut les images avec la classe object-contain
    return document.querySelectorAll('.swiper-slide-active img:not(.object-contain)');
  }

  /**
   * Injecte l'overlay sur toutes les images du carrousel
   */
  injectOverlayOnCarouselImages() {
    const carouselImages = this.findCarouselImages();
    console.log('[OverlayManager] Images du carrousel trouvées:', carouselImages.length);
    
    carouselImages.forEach((img, index) => {
      this.createOverlayForImage(img, index);
    });
  }

  /**
   * Crée un élément d'overlay pour une image spécifique
   * @param {HTMLImageElement} targetImage - Image cible sur laquelle superposer l'overlay
   * @param {number} index - Index de l'image pour l'identification
   */
  createOverlayForImage(targetImage, index) {
    // Créer l'élément d'overlay
    const overlay = document.createElement('div');
    overlay.className = 'tto-image-overlay';
    overlay.dataset.index = index;
    
    // Styles de base pour l'overlay
    overlay.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 1000;
      background-image: url(${this.processedImageUrl});
      background-size: contain;
      background-repeat: no-repeat;
      background-position: center;
      opacity: 0.8;
      transition: all 0.2s ease;
    `;
    
    // Positionner le conteneur parent en relatif si nécessaire
    const parent = targetImage.parentElement;
    if (getComputedStyle(parent).position === 'static') {
      parent.style.position = 'relative';
    }
    
    // Ajouter l'overlay au parent de l'image
    parent.appendChild(overlay);
    
    // Appliquer les marges actuelles
    this.applyMarginsToOverlay(overlay);
    
    // Stocker la référence
    this.overlayElements.push(overlay);
    
    console.log('[OverlayManager] Overlay créé pour l\'image', index);
  }

  /**
   * Applique les marges actuelles à l'overlay
   */
  applyMarginsToOverlay() {
    if (!this.overlayElements.length) return;
    
    // Appliquer les marges à tous les éléments d'overlay
    this.overlayElements.forEach(overlay => {
      // Récupérer les marges directement
      const { top, right, bottom, left } = this.margins;
      
      // Convertir les marges décimales en pourcentages pour le CSS
      const topPercent = top * 100;
      const rightPercent = right * 100;
      const bottomPercent = bottom * 100;
      const leftPercent = left * 100;
      
      // Calculer la largeur et hauteur disponibles après application des marges
      const availableWidth = 100 - (leftPercent + rightPercent);
      const availableHeight = 100 - (topPercent + bottomPercent);
      
      // Appliquer les marges via CSS
      overlay.style.top = `${topPercent}%`;
      overlay.style.left = `${leftPercent}%`;
      overlay.style.width = `${availableWidth}%`;
      overlay.style.height = `${availableHeight}%`;
    });
  }

  /**
   * Crée le panneau de contrôle des marges avec 4 valeurs (haut, droite, bas, gauche)
   */
  createControlPanel() {
    // Vérifier si le panneau existe déjà
    if (this.controlPanel) {
      return;
    }
    
    // Convertir les marges décimales en pourcentages pour l'affichage
    const topPercent = Math.round(this.margins.top * 100);
    const rightPercent = Math.round(this.margins.right * 100);
    const bottomPercent = Math.round(this.margins.bottom * 100);
    const leftPercent = Math.round(this.margins.left * 100);
    
    // Créer le panneau de contrôle HTML
    const panel = document.createElement('div');
    panel.id = 'tto-margin-control-panel';
    panel.style.cssText = `
      position: relative;
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      padding: 10px;
      background: #f8f9fa;
      border: 1px solid #dee2e6;
      border-radius: 4px;
      margin: 10px 0;
      box-shadow: 0 2px 5px rgba(0,0,0,0.1);
      font-family: Arial, sans-serif;
      max-width: 100%;
      gap: 8px;
    `;
    
    // Contenu HTML du panneau avec les contrôles
    panel.innerHTML = `
      <div style="width: 100%; margin-bottom: 8px; font-weight: bold; color: #495057; font-size: 14px;">
        Ajustement des marges
      </div>
      
      <div style="display: flex; flex-wrap: wrap; gap: 8px; width: 100%;">      
        <div style="display: flex; align-items: center; gap: 4px;">
          <label style="font-size: 12px; color: #666; white-space: nowrap;">
            Haut:
          </label>
          <input type="number" 
                 id="tto-top-input" 
                 min="0" 
                 max="50" 
                 value="${topPercent}" 
                 step="1"
                 style="width: 45px; padding: 4px; border: 1px solid #ccc; border-radius: 4px; font-size: 12px;">
        </div>
        
        <div style="display: flex; align-items: center; gap: 4px;">
          <label style="font-size: 12px; color: #666; white-space: nowrap;">
            Droite:
          </label>
          <input type="number" 
                 id="tto-right-input" 
                 min="0" 
                 max="50" 
                 value="${rightPercent}" 
                 step="1"
                 style="width: 45px; padding: 4px; border: 1px solid #ccc; border-radius: 4px; font-size: 12px;">
        </div>
        
        <div style="display: flex; align-items: center; gap: 4px;">
          <label style="font-size: 12px; color: #666; white-space: nowrap;">
            Bas:
          </label>
          <input type="number" 
                 id="tto-bottom-input" 
                 min="0" 
                 max="50" 
                 value="${bottomPercent}" 
                 step="1"
                 style="width: 45px; padding: 4px; border: 1px solid #ccc; border-radius: 4px; font-size: 12px;">
        </div>
        
        <div style="display: flex; align-items: center; gap: 4px;">
          <label style="font-size: 12px; color: #666; white-space: nowrap;">
            Gauche:
          </label>
          <input type="number" 
                 id="tto-left-input" 
                 min="0" 
                 max="50" 
                 value="${leftPercent}" 
                 step="1"
                 style="width: 45px; padding: 4px; border: 1px solid #ccc; border-radius: 4px; font-size: 12px;">
        </div>
      </div>
      
      <div style="display: flex; justify-content: flex-end; width: 100%; margin-top: 8px;">
        <button id="tto-reset-margins" style="
          background-color: #f8f9fa;
          border: 1px solid #ced4da;
          border-radius: 4px;
          padding: 4px 8px;
          font-size: 12px;
          cursor: pointer;
          color: #495057;
        ">🔄 Reset</button>
      </div>
    `;
    
    // Trouver l'emplacement où insérer le panneau de contrôle
    const targetElement = document.querySelector('.product-type-options');
    if (targetElement && targetElement.parentNode) {
      targetElement.parentNode.insertBefore(panel, targetElement.nextSibling);
      this.controlPanel = panel;
      
      // Configurer les écouteurs d'événements
      this.setupControlPanelEvents();
    } else {
      console.error('[OverlayManager] Impossible de trouver l\'emplacement pour le panneau de contrôle');
    }
  }

  /**
   * Configure les écouteurs d'événements du panneau de contrôle
   */
  setupControlPanelEvents() {
    const topInput = this.controlPanel.querySelector('#tto-top-input');
    const rightInput = this.controlPanel.querySelector('#tto-right-input');
    const bottomInput = this.controlPanel.querySelector('#tto-bottom-input');
    const leftInput = this.controlPanel.querySelector('#tto-left-input');
    const resetButton = this.controlPanel.querySelector('#tto-reset-margins');

    // Écouteur pour le champ haut
    topInput.addEventListener('input', (e) => {
      const value = parseFloat(e.target.value) || 0;
      this.updateMargins({ top: value / 100 });
    });

    // Écouteur pour le champ droite
    rightInput.addEventListener('input', (e) => {
      const value = parseFloat(e.target.value) || 0;
      this.updateMargins({ right: value / 100 });
    });
    
    // Écouteur pour le champ bas
    bottomInput.addEventListener('input', (e) => {
      const value = parseFloat(e.target.value) || 0;
      this.updateMargins({ bottom: value / 100 });
    });
    
    // Écouteur pour le champ gauche
    leftInput.addEventListener('input', (e) => {
      const value = parseFloat(e.target.value) || 0;
      this.updateMargins({ left: value / 100 });
    });

    // Bouton reset
    resetButton.addEventListener('click', () => {
      topInput.value = 0;
      rightInput.value = 0;
      bottomInput.value = 0;
      leftInput.value = 0;
      this.updateMargins({ top: 0, right: 0, bottom: 0, left: 0 });
    });
  }

  /**
   * Valide les marges et déclenche le téléchargement avec les paramètres choisis
   */
  validateAndDownload() {
    console.log('[OverlayManager] Validation des marges:', this.margins);
    
    // Envoyer les marges validées à l'extension React
    document.dispatchEvent(new CustomEvent('TTO_MARGINS_VALIDATED', {
      detail: {
        margins: this.margins,
        processedImageUrl: this.processedImageUrl
      }
    }));
    
    // Désactiver l'overlay après validation
    this.deactivateOverlay();
  }

  /**
   * Supprime le panneau de contrôle
   */
  removeControlPanel() {
    if (this.controlPanel && this.controlPanel.parentNode) {
      this.controlPanel.parentNode.removeChild(this.controlPanel);
      this.controlPanel = null;
    }
  }

  /**
   * Supprime tous les overlays
   */
  removeAllOverlays() {
    this.overlayElements.forEach(overlay => {
      if (overlay.parentNode) {
        overlay.parentNode.removeChild(overlay);
      }
    });
    this.overlayElements = [];
  }

  /**
   * Démarre l'observation du carrousel pour détecter les nouvelles images
   */
  startCarouselObserver() {
    // Observer les changements dans le conteneur du carrousel
    const carouselContainer = document.querySelector('.swiper-wrapper');
    if (!carouselContainer) return;

    this.carouselObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        // Vérifier s'il y a de nouvelles images ajoutées
        if (mutation.type === 'childList' && this.isActive) {
          // Réinjecter l'overlay sur toutes les images
          this.removeAllOverlays();
          this.injectOverlayOnCarouselImages();
        }
      });
    });

    this.carouselObserver.observe(carouselContainer, {
      childList: true,
      subtree: true
    });
  }

  /**
   * Arrête l'observation du carrousel
   */
  stopCarouselObserver() {
    if (this.carouselObserver) {
      this.carouselObserver.disconnect();
      this.carouselObserver = null;
    }
  }
}

// Instance globale du gestionnaire d'overlay
const overlayManager = new OverlayManager();

// Exporter l'instance pour utilisation dans d'autres modules
export default overlayManager;

import React, { useState } from 'react';
import '../styles/ProductTypeSelector.css';

/**
 * Composant ProductTypeSelector - Permet de sélectionner le type de produit et configurer les marges
 * @param {string} selectedType - Type de produit sélectionné
 * @param {function} onTypeChange - Fonction appelée lors du changement de type
 * @param {Object} customMargins - Marges personnalisées actuelles
 * @param {function} onMarginsChange - Fonction appelée lors du changement de marges
 * @param {Array} images - Liste des images disponibles
 * @param {Object} selectedOrder - Ordre de sélection des images
 * @param {Array} processImages - Images sélectionnées pour traitement Pixian
 * @param {function} onVisibleStateChange - Fonction appelée lors du changement d'état du bouton "Visible"
 */
function ProductTypeSelector({ 
  selectedType, 
  onTypeChange, 
  customMargins, 
  onMarginsChange,
  images = [],
  selectedOrder = {},
  processImages = [],
  onVisibleStateChange
}) {
  // Types de produits disponibles
  const productTypes = [
    { id: 'default', label: 'Standard' },
    { id: 'textile', label: 'Textile' },
    { id: 'pantalon', label: 'Pantalon' },
    { id: 'accessoires', label: 'Accessoires' },
    { id: 'shoes', label: 'Chaussures' },
    { id: 'custom', label: 'Custom' }
  ];

  // État local pour les marges personnalisées
  const [margins, setMargins] = useState(customMargins || {
    top: '',
    right: '',
    bottom: '',
    left: ''
  });

  // État pour le bouton "Visible"
  const [isVisible, setIsVisible] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [injectedImageUrl, setInjectedImageUrl] = useState(null);

  // Marges prédéfinies par type (synchronisées avec background/marginConfig.js)
  const predefinedMargins = {
    default: { top: 5, right: 5, bottom: 5, left: 5 },        // 0.05 * 100
    textile: { top: 8.5, right: 8.5, bottom: 8.5, left: 8.5 }, // 0.085 * 100
    pantalon: { top: 3.2, right: 3.2, bottom: 3.2, left: 3.2 }, // 0.032 * 100
    accessoires: { top: 16, right: 16, bottom: 16, left: 16 },  // 0.16 * 100
    shoes: { top: 0, right: 8, bottom: 26, left: 8 }           // 0.00, 0.08, 0.26, 0.08 * 100
  };

  // Gestion du changement de type de produit
  const handleTypeChange = (typeId) => {
    onTypeChange(typeId);
    
    // Si un type prédéfini est sélectionné, effacer les marges personnalisées
    if (typeId !== 'custom') {
      const resetMargins = { top: '', right: '', bottom: '', left: '' };
      setMargins(resetMargins);
      onMarginsChange && onMarginsChange(null);
    }

    // TOUJOURS appliquer les nouvelles marges visuellement (avec ou sans injection)
    // Passer explicitement le nouveau type pour éviter les problèmes de timing
    setTimeout(() => {
      applyVisualMargins(typeId);
    }, 50);
  };

  // Gestion du changement de marge
  const handleMarginChange = (side, value) => {
    // Convertir la valeur en nombre, ou utiliser 0 si vide/invalide
    const numericValue = value === '' ? 0 : parseFloat(value) || 0;
    const newMargins = { ...margins, [side]: numericValue };
    setMargins(newMargins);
    
    // Envoyer les marges au parent seulement si le type personnalisé est sélectionné
    if (selectedType === 'custom') {
      console.log(`[ProductTypeSelector] Marges personnalisées envoyées:`, newMargins);
      onMarginsChange && onMarginsChange(newMargins);
    }

    // Si l'image est visible, mettre à jour l'injection en temps réel
    if (isVisible && injectedImageUrl) {
      updateInjectedImageMargins(newMargins);
    }
  };

  // Fonction pour obtenir l'image sélectionnée #1
  const getFirstSelectedImage = () => {
    // Trouve l'index de l'image avec l'ordre 1
    const firstImageIndex = Object.entries(selectedOrder)
      .find(([idx, order]) => order === 1)?.[0];
    
    if (firstImageIndex !== undefined) {
      const index = parseInt(firstImageIndex);
      return images[index];
    }
    return null;
  };

  // Fonction pour traiter l'image avec Pixian SANS marges (premier export)
  const processImageWithPixianNoMargins = async (imageUrl) => {
    try {
      console.log('[ProductTypeSelector] Début du traitement Pixian SANS marges pour:', imageUrl);
      
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
            resolve(event.detail.processedImageUrl);
          } else {
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
        }, 30000);
      });
    } catch (error) {
      console.error('[ProductTypeSelector] Erreur lors du traitement Pixian sans marges:', error);
      throw error;
    }
  };

  // Fonction pour injecter l'image sur le site avec un élément IMG réel
  const injectImageOnSite = (processedImageUrl) => {
    try {
      // Sélectionner tous les éléments .swiper-slide-active img
      const allImages = document.querySelectorAll('.swiper-slide-active img');
      
      // Filtrer pour exclure les images avec les classes m-auto ET aspect-square ET object-contain
      const targetElements = Array.from(allImages).filter(img => {
        const classList = img.classList;
        // Exclure si l'image a les 3 classes problématiques ensemble
        const hasProblematicClasses = classList.contains('m-auto') && 
                                     classList.contains('aspect-square') && 
                                     classList.contains('object-contain');
        return !hasProblematicClasses;
      });
      
      if (targetElements.length === 0) {
        console.warn('[ProductTypeSelector] Aucun élément .swiper-slide-active img valide trouvé (exclusion: m-auto + aspect-square + object-contain)');
        return;
      }

      targetElements.forEach((img, index) => {
        // Parent swiper-slide-active
        const parent = img.parentElement;
        if (!parent) return;

        // Lire le padding du parent
        const parentPadding = getComputedStyle(parent).padding;

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
        const parentStyle = getComputedStyle(parent);
        if (parentStyle.position === 'static') {
          parent.style.position = 'relative';
        }
        parent.appendChild(container);
      });

      console.log('[ProductTypeSelector] Image IMG injectée sur', targetElements.length, 'éléments');
    } catch (error) {
      console.error('[ProductTypeSelector] Erreur lors de l\'injection:', error);
    }
  };

  // Fonction pour supprimer les superpositions
  const removeImageOverlays = () => {
    const containers = document.querySelectorAll('.tto-image-container');
    containers.forEach(container => container.remove());
    
    // Nettoyer les marges stockées
    delete window.ttoCurrentMargins;
    
    console.log('[ProductTypeSelector] Superpositions supprimées');
  };

  // Fonction pour appliquer les marges en temps réel avec CSS PADDING pour l'affichage
  const applyVisualMargins = (overrideType = null) => {
    // Obtenir les marges actuelles selon le type sélectionné (ou le type passé en paramètre)
    const typeToUse = overrideType || selectedType;
    let currentMargins;
    if (typeToUse === 'custom') {
      currentMargins = margins;
    } else {
      currentMargins = predefinedMargins[typeToUse] || predefinedMargins.default;
    }

    console.log('[ProductTypeSelector] Application des marges:', currentMargins);

    // CAS 1: Si l'image est injectée, appliquer le PADDING CSS visuel
    if (isVisible && injectedImageUrl) {
      const overlayImages = document.querySelectorAll('.tto-image-overlay');
      overlayImages.forEach(overlayImg => {
        overlayImg.style.padding = `${currentMargins.top || 0}% ${currentMargins.right || 0}% ${currentMargins.bottom || 0}% ${currentMargins.left || 0}%`;
      });
      console.log('[ProductTypeSelector] PADDING visuel appliqué sur images injectées');
    }

    // CAS 2: TOUJOURS stocker les valeurs pour l'export final API Pixian (format pourcentage)
    window.ttoCurrentMargins = {
      top: currentMargins.top || 0,    // Garder en % (ex: 8.5)
      right: currentMargins.right || 0,
      bottom: currentMargins.bottom || 0,
      left: currentMargins.left || 0
    };
    
    console.log('[ProductTypeSelector] Valeurs stockées pour export API (pourcentages):', window.ttoCurrentMargins);
  };

  // Fonction pour mettre à jour les marges de l'image injectée (appelée lors des changements)
  const updateInjectedImageMargins = (newMargins) => {
    if (!isVisible) return;
    
    // Appliquer le PADDING CSS pour l'affichage visuel
    const overlayImages = document.querySelectorAll('.tto-image-overlay');
    overlayImages.forEach(overlayImg => {
      overlayImg.style.padding = `${newMargins.top || 0}% ${newMargins.right || 0}% ${newMargins.bottom || 0}% ${newMargins.left || 0}%`;
    });
    
    // Stocker les valeurs comme MARGINS pour l'export final API Pixian (format pourcentage)
    window.ttoCurrentMargins = {
      top: newMargins.top || 0,    // Garder en % (ex: 10)
      right: newMargins.right || 0,
      bottom: newMargins.bottom || 0,
      left: newMargins.left || 0
    };
    
    console.log('[ProductTypeSelector] PADDING appliqué visuellement:', newMargins);
    console.log('[ProductTypeSelector] POURCENTAGES stockés pour API:', window.ttoCurrentMargins);
  };

  // Gestion du clic sur le bouton "Visible"
  const handleVisibleToggle = async () => {
    if (isVisible) {
      // Désactiver la visibilité
      setIsVisible(false);
      removeImageOverlays();
      setInjectedImageUrl(null);
      
      // Informer le parent que le bouton "Visible" est désactivé
      onVisibleStateChange && onVisibleStateChange(false);
      return;
    }

    // Vérifications avant d'activer
    const firstImage = getFirstSelectedImage();
    if (!firstImage) {
      alert('Veuillez d\'abord sélectionner une image (elle doit être marquée avec le numéro 1)');
      return;
    }

    // Vérifier si l'image est marquée pour traitement Pixian (bouton vert activé)
    const firstImageIndex = Object.entries(selectedOrder)
      .find(([idx, order]) => order === 1)?.[0];
    
    if (firstImageIndex === undefined || !processImages.includes(parseInt(firstImageIndex))) {
      alert('L\'image sélectionnée #1 doit avoir le traitement Pixian activé (bouton vert)');
      return;
    }

    try {
      setIsProcessing(true);
      
      // ÉTAPE 1: Traiter l'image avec Pixian SANS marges (premier export)
      console.log('[ProductTypeSelector] ÉTAPE 1: Traitement Pixian sans marges');
      const processedImageUrl = await processImageWithPixianNoMargins(firstImage.url);
      
      // ÉTAPE 2: Injecter l'image sur le site (sans marges)
      console.log('[ProductTypeSelector] ÉTAPE 2: Injection de l\'image sans marges');
      injectImageOnSite(processedImageUrl);
      
      setInjectedImageUrl(processedImageUrl);
      setIsVisible(true);
      
      // ÉTAPE 3: Appliquer les marges visuellement en temps réel
      console.log('[ProductTypeSelector] ÉTAPE 3: Application des marges visuelles');
      setTimeout(() => {
        applyVisualMargins();
      }, 100); // Petit délai pour s'assurer que l'injection est terminée
      
      // Informer le parent que le bouton "Visible" est maintenant actif
      onVisibleStateChange && onVisibleStateChange(true);
      
      console.log('[ProductTypeSelector] Image visible activée avec succès - marges appliquées visuellement');
    } catch (error) {
      console.error('[ProductTypeSelector] Erreur lors de l\'activation:', error);
      alert('Erreur lors du traitement de l\'image: ' + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="product-type-selector">
      <div className="product-type-label">Type de produit:</div>
      <div className="product-type-options">
        {productTypes.map(type => (
          <div 
            key={type.id}
            className={`product-type-option ${selectedType === type.id ? 'selected' : ''}`}
            onClick={() => handleTypeChange(type.id)}
          >
            {type.label}
          </div>
        ))}
      </div>

      {/* Bouton Visible */}
      <div className="visible-button-container">
        <button
          className={`visible-button ${isVisible ? 'active' : ''} ${isProcessing ? 'processing' : ''}`}
          onClick={handleVisibleToggle}
          disabled={isProcessing}
        >
          {isProcessing ? 'Traitement...' : isVisible ? 'Masquer' : 'Visible'}
        </button>
        {isVisible && (
          <span className="visible-status">Image injectée sur le site</span>
        )}
      </div>

      {/* Inputs pour marges personnalisées */}
      {selectedType === 'custom' && (
        <div className="custom-margins">
          <div className="custom-margins-label">Marges personnalisées (%):</div>
          <div className="margins-inputs">
            <div className="margin-input-group">
              <label>Haut:</label>
              <input
                type="number"
                min="0"
                max="100"
                value={margins.top}
                onChange={(e) => handleMarginChange('top', e.target.value)}
                placeholder="0"
              />
            </div>
            <div className="margin-input-group">
              <label>Droite:</label>
              <input
                type="number"
                min="0"
                max="100"
                value={margins.right}
                onChange={(e) => handleMarginChange('right', e.target.value)}
                placeholder="0"
              />
            </div>
            <div className="margin-input-group">
              <label>Bas:</label>
              <input
                type="number"
                min="0"
                max="100"
                value={margins.bottom}
                onChange={(e) => handleMarginChange('bottom', e.target.value)}
                placeholder="0"
              />
            </div>
            <div className="margin-input-group">
              <label>Gauche:</label>
              <input
                type="number"
                min="0"
                max="100"
                value={margins.left}
                onChange={(e) => handleMarginChange('left', e.target.value)}
                placeholder="0"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProductTypeSelector;

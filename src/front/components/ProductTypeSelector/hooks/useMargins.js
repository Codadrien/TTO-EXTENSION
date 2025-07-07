import { useState, useEffect } from 'react';
import { DEFAULT_MARGINS, PREDEFINED_MARGINS } from '../constants.js';

/**
 * Hook personnalisé pour gérer les marges
 * @param {Object} customMargins - Marges personnalisées initiales
 * @param {string} selectedType - Type de produit sélectionné
 * @param {function} onMarginsChange - Callback lors du changement de marges
 * @param {string} injectedImageUrl - URL de l'image injectée
 * @returns {Object} État et méthodes pour gérer les marges
 */
export function useMargins(customMargins, selectedType, onMarginsChange, injectedImageUrl) {
  const [margins, setMargins] = useState(customMargins || DEFAULT_MARGINS);

  // Gestion du changement de marge
  const handleMarginChange = (side, value) => {
    const numericValue = value === '' ? 0 : parseFloat(value) || 0;
    const newMargins = { ...margins, [side]: numericValue };
    setMargins(newMargins);
    
    // Envoyer les marges au parent seulement si le type personnalisé est sélectionné
    if (selectedType === 'custom') {
      console.log(`[useMargins] Marges personnalisées envoyées:`, newMargins);
      onMarginsChange && onMarginsChange(newMargins);
    }

    // Si l'image est injectée, mettre à jour le padding
    if (injectedImageUrl) {
      updateInjectedImageMargins(newMargins);
    }
  };

  // Fonction pour mettre à jour les marges de l'image injectée
  const updateInjectedImageMargins = (newMargins) => {
    const overlayImages = document.querySelectorAll('.tto-image-overlay');
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
    
    console.log('[useMargins] PADDING mis à jour:', newMargins);
  };

  // Obtenir les marges actuelles selon le type
  const getCurrentMargins = () => {
    if (selectedType === 'custom') {
      return margins;
    } else {
      return PREDEFINED_MARGINS[selectedType] || PREDEFINED_MARGINS.default;
    }
  };

  // Reset des marges pour les types prédéfinis
  const resetMargins = () => {
    const resetMargins = DEFAULT_MARGINS;
    setMargins(resetMargins);
    onMarginsChange && onMarginsChange(null);
  };

  return {
    margins,
    setMargins,
    handleMarginChange,
    updateInjectedImageMargins,
    getCurrentMargins,
    resetMargins
  };
} 
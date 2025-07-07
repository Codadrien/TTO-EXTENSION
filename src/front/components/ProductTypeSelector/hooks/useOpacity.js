import { useState, useCallback } from 'react';

/**
 * Hook pour gérer l'opacité de l'image injectée
 * @param {number} initialOpacity - Opacité initiale (0-100)
 * @returns {Object} Méthodes et état pour gérer l'opacité
 */
export function useOpacity(initialOpacity = 100) {
  const [opacity, setOpacity] = useState(initialOpacity);

  /**
   * Met à jour l'opacité de l'image injectée
   * @param {number} newOpacity - Nouvelle valeur d'opacité (0-100)
   */
  const updateImageOpacity = useCallback((newOpacity) => {
    const overlayImages = document.querySelectorAll('.tto-image-overlay');
    overlayImages.forEach(overlayImg => {
      overlayImg.style.opacity = newOpacity / 100;
    });
    console.log('[useOpacity] Opacité mise à jour:', newOpacity + '%');
  }, []);

  /**
   * Gère le changement d'opacité
   * @param {number} newOpacity - Nouvelle valeur d'opacité
   */
  const handleOpacityChange = useCallback((newOpacity) => {
    setOpacity(newOpacity);
    updateImageOpacity(newOpacity);
  }, [updateImageOpacity]);

  /**
   * Remet l'opacité à 100%
   */
  const resetOpacity = useCallback(() => {
    setOpacity(100);
    updateImageOpacity(100);
  }, [updateImageOpacity]);

  return {
    opacity,
    setOpacity,
    handleOpacityChange,
    updateImageOpacity,
    resetOpacity
  };
} 
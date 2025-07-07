import { useState, useEffect } from 'react';
import { imageInjectionService } from '../services/imageInjectionService.js';
import { pixianService } from '../services/pixianService.js';

/**
 * Hook personnalisé pour gérer l'injection d'images
 * @param {Array} images - Liste des images
 * @param {Object} selectedOrder - Ordre de sélection des images
 * @param {Array} processImages - Images sélectionnées pour traitement
 * @param {Array} shadowProcessImages - Images sélectionnées pour traitement shadow
 * @param {function} onVisibleStateChange - Callback lors du changement d'état de visibilité
 * @returns {Object} État et méthodes pour gérer l'injection d'images
 */
export function useImageInjection(images, selectedOrder, processImages, shadowProcessImages, onVisibleStateChange) {
  const [isVisible, setIsVisible] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [injectedImageUrl, setInjectedImageUrl] = useState(null);
  const [cachedImageData, setCachedImageData] = useState({
    processedUrl: null,
    sourceImageUrl: null,
    selectedIndex: null
  });

  // Fonction pour obtenir l'image sélectionnée #1
  const getFirstSelectedImage = () => {
    const firstImageIndex = Object.entries(selectedOrder)
      .find(([idx, order]) => order === 1)?.[0];
    
    if (firstImageIndex !== undefined) {
      const index = parseInt(firstImageIndex);
      return images[index];
    }
    return null;
  };

  // Nettoyer le cache quand l'image change
  const clearImageCache = () => {
    imageInjectionService.removeImageOverlays();
    setInjectedImageUrl(null);
    setCachedImageData({
      processedUrl: null,
      sourceImageUrl: null,
      selectedIndex: null
    });
    setIsVisible(false);
    console.log('[useImageInjection] Cache d\'image nettoyé');
  };

  // Vérifier si on peut réutiliser le cache
  const canReuseCache = (currentImageUrl, currentIndex) => {
    if (!cachedImageData.processedUrl) return false;
    if (cachedImageData.sourceImageUrl !== currentImageUrl) return false;
    if (cachedImageData.selectedIndex !== currentIndex) return false;
    
    // Vérifier si le mode de traitement (shadow vs pixian) est le même
    const currentIsShadowProcessing = shadowProcessImages.includes(currentIndex);
    const cachedIsShadowMode = cachedImageData.isShadowMode || false;
    
    if (currentIsShadowProcessing !== cachedIsShadowMode) {
      console.log('[useImageInjection] Mode de traitement changé, cache invalidé');
      return false;
    }
    
    return true;
  };

  // Effect pour détecter le changement d'image
  useEffect(() => {
    const firstImage = getFirstSelectedImage();
    const firstImageIndex = Object.entries(selectedOrder)
      .find(([idx, order]) => order === 1)?.[0];
    
    if (cachedImageData.processedUrl && firstImage && firstImageIndex !== undefined) {
      const currentImageUrl = firstImage.url;
      const currentIndex = parseInt(firstImageIndex);
      
      if (cachedImageData.sourceImageUrl !== currentImageUrl || 
          cachedImageData.selectedIndex !== currentIndex) {
        console.log('[useImageInjection] Changement d\'image détecté - nettoyage du cache');
        clearImageCache();
      }
    }
  }, [selectedOrder, images]);

  // Gestion du toggle de visibilité
  const handleVisibleToggle = async (getCurrentMargins) => {
    if (isVisible) {
      setIsVisible(false);
      imageInjectionService.toggleImageOverlaysVisibility(false);
      onVisibleStateChange && onVisibleStateChange(false);
      console.log('[useImageInjection] Image masquée');
      return;
    }

    // Vérifications
    const firstImage = getFirstSelectedImage();
    if (!firstImage) {
      alert('Veuillez d\'abord sélectionner une image (elle doit être marquée avec le numéro 1)');
      return;
    }

    const firstImageIndex = Object.entries(selectedOrder)
      .find(([idx, order]) => order === 1)?.[0];
    
    if (firstImageIndex === undefined || (!processImages.includes(parseInt(firstImageIndex)) && !shadowProcessImages.includes(parseInt(firstImageIndex)))) {
      alert('L\'image sélectionnée #1 doit avoir le traitement Pixian (bouton vert) ou PNG transparent (bouton violet) activé');
      return;
    }

    try {
      setIsProcessing(true);
      
      if (canReuseCache(firstImage.url, parseInt(firstImageIndex))) {
        // Image déjà injectée
        imageInjectionService.toggleImageOverlaysVisibility(true);
        setIsVisible(true);
        onVisibleStateChange && onVisibleStateChange(true);
      } else {
        // Première injection
        const isShadowProcessing = shadowProcessImages.includes(parseInt(firstImageIndex));
        
        if (isShadowProcessing) {
          // TRAITEMENT PNG TRANSPARENT (bouton violet) - injection directe sans API
          console.log('[useImageInjection] Mode PNG transparent - injection directe sans API');
          
          // Pour l'instant, utiliser l'image originale comme PNG transparent
          // TODO: Permettre à l'utilisateur de fournir une image PNG transparente
          const transparentImageUrl = firstImage.url;
          
          imageInjectionService.injectImageOnSite(transparentImageUrl);
          
          setInjectedImageUrl(transparentImageUrl);
          setIsVisible(true);
          
          setCachedImageData({
            processedUrl: transparentImageUrl,
            sourceImageUrl: firstImage.url,
            selectedIndex: parseInt(firstImageIndex),
            isShadowMode: true
          });
          
        } else {
          // TRAITEMENT PIXIAN STANDARD (bouton vert) - appel API
          console.log('[useImageInjection] Mode Pixian standard - appel API');
          
          const processedImageUrl = await pixianService.processImageWithoutMargins(firstImage.url);
          
          imageInjectionService.injectImageOnSite(processedImageUrl);
          
          setInjectedImageUrl(processedImageUrl);
          setIsVisible(true);
          
          setCachedImageData({
            processedUrl: processedImageUrl,
            sourceImageUrl: firstImage.url,
            selectedIndex: parseInt(firstImageIndex),
            isShadowMode: false
          });
        }
        
        // Appliquer les marges après injection
        setTimeout(() => {
          const currentMargins = getCurrentMargins();
          imageInjectionService.updateInjectedImageMargins(currentMargins);
        }, 100);
        
        onVisibleStateChange && onVisibleStateChange(true);
      }
      
    } catch (error) {
      console.error('[useImageInjection] Erreur lors de l\'activation:', error);
      alert('Erreur lors du traitement de l\'image: ' + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    isVisible,
    isProcessing,
    injectedImageUrl,
    handleVisibleToggle,
    clearImageCache,
    getFirstSelectedImage
  };
} 
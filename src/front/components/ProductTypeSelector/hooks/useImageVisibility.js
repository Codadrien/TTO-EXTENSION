import { useState, useEffect } from 'react';
import { ImageUtils } from '../utils/imageUtils.js';
import { PixianService } from '../services/pixianService.js';
import { PREDEFINED_MARGINS, TIMEOUTS } from '../constants.js';

/**
 * Hook personnalisé pour gérer la visibilité et l'injection d'images
 * @param {Object} params - Paramètres du hook
 * @returns {Object} État et fonctions pour gérer la visibilité
 */
export function useImageVisibility({
  images,
  selectedOrder,
  processImages,
  selectedType,
  margins,
  onVisibleStateChange
}) {
  const [isVisible, setIsVisible] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [injectedImageUrl, setInjectedImageUrl] = useState(null);
  
  // Cache pour éviter les appels API inutiles
  const [cachedImageData, setCachedImageData] = useState({
    processedUrl: null,
    sourceImageUrl: null,
    selectedIndex: null
  });

  /**
   * Fonction utilitaire pour vérifier si on peut réutiliser l'image en cache
   */
  const canReuseCache = (currentImageUrl, currentIndex) => {
    if (!cachedImageData.processedUrl) return false;
    if (cachedImageData.sourceImageUrl !== currentImageUrl) return false;
    if (cachedImageData.selectedIndex !== currentIndex) return false;
    return true;
  };

  /**
   * Fonction pour nettoyer le cache quand on change d'image
   */
  const clearImageCache = () => {
    ImageUtils.removeImageOverlays();
    setInjectedImageUrl(null);
    setCachedImageData({
      processedUrl: null,
      sourceImageUrl: null,
      selectedIndex: null
    });
    setIsVisible(false);
    console.log('[useImageVisibility] Cache d\'image nettoyé');
  };

  /**
   * Met à jour les marges de l'image injectée
   */
  const updateImageMargins = (newMargins) => {
    if (injectedImageUrl) {
      ImageUtils.updateInjectedImageMargins(newMargins);
    }
  };

  /**
   * Gestion du clic sur le bouton "Visible"
   */
  const handleVisibleToggle = async () => {
    if (isVisible) {
      // Masquer l'image (mais la garder injectée)
      setIsVisible(false);
      ImageUtils.toggleImageOverlaysVisibility(false);
      
      // Informer le parent que le bouton "Visible" est désactivé
      onVisibleStateChange && onVisibleStateChange(false);
      console.log('[useImageVisibility] Image masquée (gardée injectée)');
      return;
    }

    // Vérifications avant d'activer
    const firstImage = ImageUtils.getFirstSelectedImage(images, selectedOrder);
    if (!firstImage) {
      alert('Veuillez d\'abord sélectionner une image (elle doit être marquée avec le numéro 1)');
      return;
    }

    // Vérifier si l'image est marquée pour traitement Pixian (bouton vert activé)
    const firstImageIndex = ImageUtils.getFirstSelectedImageIndex(selectedOrder);
    
    if (firstImageIndex === null || !processImages.includes(firstImageIndex)) {
      alert('L\'image sélectionnée #1 doit avoir le traitement Pixian activé (bouton vert)');
      return;
    }

    try {
      setIsProcessing(true);
      
      // Vérifier si l'image est déjà injectée (cache)
      if (canReuseCache(firstImage.url, firstImageIndex)) {
        // L'image est déjà injectée, juste l'afficher
        console.log('[useImageVisibility] Image déjà injectée - affichage simple');
        
        ImageUtils.toggleImageOverlaysVisibility(true);
        setIsVisible(true);
        
        onVisibleStateChange && onVisibleStateChange(true);
        console.log('[useImageVisibility] Image réaffichée (déjà injectée)');
        
      } else {
        // Première injection - appel API nécessaire
        console.log('[useImageVisibility] Première injection - appel API');
        
        // ÉTAPE 1: Traiter l'image avec Pixian SANS marges
        const processedImageUrl = await PixianService.processImageNoMargins(firstImage.url);
        
        // ÉTAPE 2: Injecter l'image sur le site
        ImageUtils.injectImageOnSite(processedImageUrl);
        
        setInjectedImageUrl(processedImageUrl);
        setIsVisible(true);
        
        // Mettre à jour le cache
        setCachedImageData({
          processedUrl: processedImageUrl,
          sourceImageUrl: firstImage.url,
          selectedIndex: firstImageIndex
        });
        
        // ÉTAPE 3: Appliquer les marges courantes immédiatement
        setTimeout(() => {
          // Obtenir les marges actuelles
          let currentMargins;
          if (selectedType === 'custom') {
            currentMargins = margins;
          } else {
            currentMargins = PREDEFINED_MARGINS[selectedType] || PREDEFINED_MARGINS.default;
          }
          
          // Appliquer le padding
          ImageUtils.updateInjectedImageMargins(currentMargins);
          
          console.log('[useImageVisibility] Marges initiales appliquées:', currentMargins);
        }, TIMEOUTS.INITIAL_MARGIN_APPLICATION);
        
        onVisibleStateChange && onVisibleStateChange(true);
        console.log('[useImageVisibility] Image injectée avec succès');
      }
      
    } catch (error) {
      console.error('[useImageVisibility] Erreur lors de l\'activation:', error);
      alert('Erreur lors du traitement de l\'image: ' + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  // Effect pour détecter le changement d'image sélectionnée et nettoyer le cache
  useEffect(() => {
    const firstImage = ImageUtils.getFirstSelectedImage(images, selectedOrder);
    const firstImageIndex = ImageUtils.getFirstSelectedImageIndex(selectedOrder);
    
    // Si une nouvelle image est sélectionnée et qu'on a un cache
    if (cachedImageData.processedUrl && firstImage && firstImageIndex !== null) {
      const currentImageUrl = firstImage.url;
      
      // Si l'image ou l'index a changé, nettoyer le cache
      if (cachedImageData.sourceImageUrl !== currentImageUrl || 
          cachedImageData.selectedIndex !== firstImageIndex) {
        console.log('[useImageVisibility] Changement d\'image détecté - nettoyage du cache');
        clearImageCache();
      }
    }
  }, [selectedOrder, images, cachedImageData.processedUrl, cachedImageData.sourceImageUrl, cachedImageData.selectedIndex]);

  return {
    isVisible,
    isProcessing,
    injectedImageUrl,
    handleVisibleToggle,
    updateImageMargins,
    clearImageCache
  };
} 
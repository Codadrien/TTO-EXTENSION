import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Hourglass, Save, ChevronDown } from 'lucide-react';
import '../styles/ProductTypeSelector.css';
import OpacitySlider from './ProductTypeSelector/components/OpacitySlider.jsx';
import { useOpacity } from './ProductTypeSelector/hooks/useOpacity.js';
import { saveState, STORAGE_KEYS } from '../utils/stateStorage.js';

/**
 * Composant ProductTypeSelector - Permet de sélectionner le type de produit et configurer les marges
 * @param {string} selectedType - Type de produit sélectionné
 * @param {function} onTypeChange - Fonction appelée lors du changement de type
 * @param {Object} customMargins - Marges personnalisées actuelles
 * @param {function} onMarginsChange - Fonction appelée lors du changement de marges
 * @param {Array} images - Liste des images disponibles
 * @param {Object} selectedOrder - Ordre de sélection des images
 * @param {Array} processImages - Images sélectionnées pour traitement Pixian
 * @param {Array} shadowProcessImages - Images sélectionnées pour traitement Pixian (shadow)
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
  shadowProcessImages = [],
  shadowModeEnabled = false,
  onVisibleStateChange,
  onShadowModeChange
}) {
  // Types de produits disponibles (suppression de 'shoes')
  const productTypes = [
    { id: 'default', label: 'Standard' },
    { id: 'textile', label: 'Textile' },
    { id: 'pantalon', label: 'Pantalon' },
    { id: 'accessoires', label: 'Accessoires' },
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
  
  // Hook pour l'opacité
  const {
    opacity,
    handleOpacityChange,
    resetOpacity
  } = useOpacity(100);

  // Fonction pour gérer le toggle violet (verrouillage du mode shadow)
  const handleShadowToggleChange = (event) => {
    // Si l'événement vient de l'input, utiliser checked
    // Si l'événement vient du container, inverser l'état actuel
    const isChecked = event.target.type === 'checkbox' 
      ? event.target.checked 
      : !shadowModeEnabled;
    
    console.log('[ProductTypeSelector] Mode shadow verrouillé:', isChecked);
    
    if (onShadowModeChange) {
      onShadowModeChange(isChecked);
    }
  };

  // Cache pour éviter les appels API inutiles
  const [cachedImageData, setCachedImageData] = useState({
    processedUrl: null,
    sourceImageUrl: null,
    selectedIndex: null
  });

  // États pour la gestion des presets
  const [showCustomControls, setShowCustomControls] = useState(false);
  const [showPresetDropdown, setShowPresetDropdown] = useState(false);
  const [savedPresets, setSavedPresets] = useState([]);
  const [presetName, setPresetName] = useState('');
  const [showSaveDialog, setShowSaveDialog] = useState(false);



  // Marges prédéfinies par type (suppression de 'shoes')
  const predefinedMargins = {
    default: { top: 5, right: 5, bottom: 5, left: 5 },        // 0.05 * 100
    textile: { top: 8.5, right: 8.5, bottom: 8.5, left: 8.5 }, // 0.085 * 100
    pantalon: { top: 3.2, right: 3.2, bottom: 3.2, left: 3.2 }, // 0.032 * 100
    accessoires: { top: 16, right: 16, bottom: 16, left: 16 }  // 0.16 * 100
  };

  // Fonctions de gestion du stockage des presets via messaging
  const loadPresetsFromStorage = async () => {
    try {
      return new Promise((resolve) => {
        const handleResponse = (event) => {
          if (event.detail.type === 'LOAD_PRESETS_RESPONSE') {
            const presets = event.detail.presets || [];
            setSavedPresets(presets);
            console.log('[ProductTypeSelector] Presets chargés:', presets);
            document.removeEventListener('TTO_STORAGE_RESPONSE', handleResponse);
            resolve();
          }
        };

        document.addEventListener('TTO_STORAGE_RESPONSE', handleResponse);
        document.dispatchEvent(new CustomEvent('TTO_STORAGE_REQUEST', { 
          detail: { type: 'LOAD_PRESETS' } 
        }));

        // Timeout de sécurité
        setTimeout(() => {
          document.removeEventListener('TTO_STORAGE_RESPONSE', handleResponse);
          resolve();
        }, 2000);
      });
    } catch (error) {
      console.error('[ProductTypeSelector] Erreur lors du chargement des presets:', error);
    }
  };

  const savePresetsToStorage = async (presets) => {
    try {
      return new Promise((resolve) => {
        const handleResponse = (event) => {
          if (event.detail.type === 'SAVE_PRESETS_RESPONSE') {
            console.log('[ProductTypeSelector] Presets sauvegardés avec succès');
            document.removeEventListener('TTO_STORAGE_RESPONSE', handleResponse);
            resolve();
          }
        };

        document.addEventListener('TTO_STORAGE_RESPONSE', handleResponse);
        document.dispatchEvent(new CustomEvent('TTO_STORAGE_REQUEST', { 
          detail: { type: 'SAVE_PRESETS', presets: presets } 
        }));

        // Timeout de sécurité
        setTimeout(() => {
          document.removeEventListener('TTO_STORAGE_RESPONSE', handleResponse);
          resolve();
        }, 2000);
      });
    } catch (error) {
      console.error('[ProductTypeSelector] Erreur lors de la sauvegarde des presets:', error);
    }
  };

  // Charger les presets au démarrage
  useEffect(() => {
    loadPresetsFromStorage();
  }, []);

  // Debug: surveiller les changements de selectedType
  useEffect(() => {
    console.log('[ProductTypeSelector] selectedType reçu:', selectedType);
  }, [selectedType]);

  // Restaurer les marges custom quand le selectedType change vers 'custom'
  useEffect(() => {
    if (selectedType === 'custom') {
      // Afficher les contrôles custom
      setShowCustomControls(true);
      
      // Charger les marges custom sauvegardées
      const loadCustomMargins = async () => {
        try {
          if (typeof chrome !== 'undefined' && chrome.storage) {
            const result = await chrome.storage.local.get([STORAGE_KEYS.CUSTOM_MARGINS]);
            const savedMargins = result[STORAGE_KEYS.CUSTOM_MARGINS];
            if (savedMargins && typeof savedMargins === 'object') {
              console.log('[ProductTypeSelector] Marges custom restaurées:', savedMargins);
              setMargins(savedMargins);
              onMarginsChange && onMarginsChange(savedMargins);
            }
          }
        } catch (error) {
          console.error('[ProductTypeSelector] Erreur lors du chargement des marges custom:', error);
        }
      };
      
      loadCustomMargins();
    } else {
      // Masquer les contrôles custom pour les autres types
      setShowCustomControls(false);
    }
  }, [selectedType, onMarginsChange]);

  // Remettre l'opacité à 100% quand l'image n'est plus visible
  useEffect(() => {
    if (!isVisible) {
      resetOpacity();
    }
  }, [isVisible, resetOpacity]);

  // Gestion du changement de type de produit
  const handleTypeChange = (typeId) => {
    onTypeChange(typeId);
    
    // Sauvegarder automatiquement le type sélectionné
    saveState(STORAGE_KEYS.SELECTED_PRESET, typeId);
    
    // Afficher les contrôles custom si "custom" est sélectionné
    if (typeId === 'custom') {
      setShowCustomControls(true);
    } else {
      setShowCustomControls(false);
      setShowPresetDropdown(false);
      // Effacer les marges personnalisées pour les types prédéfinis
      const resetMargins = { top: '', right: '', bottom: '', left: '' };
      setMargins(resetMargins);
      onMarginsChange && onMarginsChange(null);
      // Effacer aussi les marges custom sauvegardées quand on quitte le mode custom
      saveState(STORAGE_KEYS.CUSTOM_MARGINS, null);
    }

    // Si l'image est injectée, appliquer les nouvelles marges immédiatement
    if (injectedImageUrl) {
      setTimeout(() => {
        // Obtenir les marges du nouveau type
        let newMargins;
        if (typeId === 'custom') {
          newMargins = margins; // Garder les marges custom actuelles
        } else {
          newMargins = predefinedMargins[typeId] || predefinedMargins.default;
        }
        
        updateInjectedImageMargins(newMargins);
        console.log('[ProductTypeSelector] Marges appliquées pour nouveau type:', typeId, newMargins);
      }, 50);
    }
  };

  // Gestion du changement de marge
  const handleMarginChange = (side, value) => {
    // Convertir la valeur en nombre, ou utiliser 0 si vide/invalide
    const numericValue = value === '' ? 0 : parseFloat(value) || 0;
    const newMargins = { ...margins, [side]: numericValue };
    setMargins(newMargins);
    
    // Sauvegarder automatiquement les marges custom
    if (selectedType === 'custom') {
      saveState(STORAGE_KEYS.CUSTOM_MARGINS, newMargins);
    }
    
    // Envoyer les marges au parent seulement si le type personnalisé est sélectionné
    if (selectedType === 'custom') {
      console.log(`[ProductTypeSelector] Marges personnalisées envoyées:`, newMargins);
      onMarginsChange && onMarginsChange(newMargins);
    }

    // Si l'image est injectée (peu importe si visible ou non), mettre à jour le padding
    if (injectedImageUrl) {
      updateInjectedImageMargins(newMargins);
    }
  };

  // Gestion de la navigation circulaire avec Tab
  const handleKeyDown = (e, currentInput) => {
    if (e.key === 'Tab' && !e.shiftKey) {
      // Tab normal (vers l'avant)
      if (currentInput === 'left') {
        e.preventDefault();
        // Revenir au premier input (top)
        const topInput = document.querySelector('input[tabindex="1"]');
        if (topInput) topInput.focus();
      }
    } else if (e.key === 'Tab' && e.shiftKey) {
      // Shift+Tab (vers l'arrière)
      if (currentInput === 'top') {
        e.preventDefault();
        // Aller au dernier input (left)
        const leftInput = document.querySelector('input[tabindex="4"]');
        if (leftInput) leftInput.focus();
      }
    }
  };

  // Sauvegarder un preset
  const handleSavePreset = async () => {
    if (!presetName.trim()) {
      alert('Veuillez entrer un nom pour le preset');
      return;
    }

    const newPreset = {
      id: Date.now(),
      name: presetName.trim(),
      margins: { ...margins }
    };

    const updatedPresets = [...savedPresets, newPreset];
    setSavedPresets(updatedPresets);
    await savePresetsToStorage(updatedPresets);
    
    setPresetName('');
    setShowSaveDialog(false);
    console.log('[ProductTypeSelector] Preset sauvegardé:', newPreset);
  };

  // Charger un preset
  const handleLoadPreset = (preset) => {
    setMargins(preset.margins);
    onMarginsChange && onMarginsChange(preset.margins);
    setShowPresetDropdown(false);
    
    // Si l'image est injectée, appliquer les nouvelles marges
    if (injectedImageUrl) {
      updateInjectedImageMargins(preset.margins);
    }
    
    console.log('[ProductTypeSelector] Preset chargé:', preset);
  };

  // Supprimer un preset
  const handleDeletePreset = async (presetId) => {
    const updatedPresets = savedPresets.filter(preset => preset.id !== presetId);
    setSavedPresets(updatedPresets);
    await savePresetsToStorage(updatedPresets);
    console.log('[ProductTypeSelector] Preset supprimé:', presetId);
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

      console.log('[ProductTypeSelector] Image IMG injectée sur', targetElements.length, 'éléments');
    } catch (error) {
      console.error('[ProductTypeSelector] Erreur lors de l\'injection:', error);
    }
  };

  // Fonction pour masquer/afficher les superpositions (sans les supprimer)
  const toggleImageOverlaysVisibility = (visible) => {
    const containers = document.querySelectorAll('.tto-image-container');
    containers.forEach(container => {
      container.style.display = visible ? 'flex' : 'none';
    });
    
    console.log(`[ProductTypeSelector] Superpositions ${visible ? 'affichées' : 'masquées'}`);
  };

  // Fonction pour supprimer définitivement les superpositions (pour changement d'image)
  const removeImageOverlays = () => {
    const containers = document.querySelectorAll('.tto-image-container');
    containers.forEach(container => container.remove());
    
    // Nettoyer les marges stockées
    delete window.ttoCurrentMargins;
    
    console.log('[ProductTypeSelector] Superpositions supprimées définitivement');
  };

  // Fonction pour nettoyer le cache quand on change d'image
  const clearImageCache = () => {
    removeImageOverlays();
    setInjectedImageUrl(null);
    setCachedImageData({
      processedUrl: null,
      sourceImageUrl: null,
      selectedIndex: null
    });
    setIsVisible(false);
    console.log('[ProductTypeSelector] Cache d\'image nettoyé');
  };

  // Effect pour détecter le changement d'image sélectionnée et nettoyer le cache
  useEffect(() => {
    const firstImage = getFirstSelectedImage();
    const firstImageIndex = Object.entries(selectedOrder)
      .find(([idx, order]) => order === 1)?.[0];
    
    // Si une nouvelle image est sélectionnée et qu'on a un cache
    if (cachedImageData.processedUrl && firstImage && firstImageIndex !== undefined) {
      const currentImageUrl = firstImage.url;
      const currentIndex = parseInt(firstImageIndex);
      
      // Si l'image ou l'index a changé, nettoyer le cache
      if (cachedImageData.sourceImageUrl !== currentImageUrl || 
          cachedImageData.selectedIndex !== currentIndex) {
        console.log('[ProductTypeSelector] Changement d\'image détecté - nettoyage du cache');
        clearImageCache();
      }
    }
  }, [selectedOrder, images]); // Surveiller les changements de sélection

  // Fonction pour mettre à jour les marges de l'image injectée (appelée lors des changements)
  const updateInjectedImageMargins = (newMargins) => {
    // Toujours mettre à jour le padding, même si pas visible (pour garder l'état)
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
    
    console.log('[ProductTypeSelector] PADDING mis à jour:', newMargins);
  };

  // Fonction utilitaire pour vérifier si on peut réutiliser l'image en cache
  const canReuseCache = (currentImageUrl, currentIndex) => {
    if (!cachedImageData.processedUrl) return false;
    
    // Vérifier si l'image source est la même
    if (cachedImageData.sourceImageUrl !== currentImageUrl) return false;
    
    // Vérifier si l'index sélectionné est le même
    if (cachedImageData.selectedIndex !== currentIndex) return false;
    
    // Vérifier si le mode de traitement (shadow vs pixian) est le même
    const currentIsShadowProcessing = shadowProcessImages.includes(currentIndex);
    const cachedIsShadowMode = cachedImageData.isShadowMode || false;
    
    if (currentIsShadowProcessing !== cachedIsShadowMode) {
      console.log('[ProductTypeSelector] Mode de traitement changé, cache invalidé');
      return false;
    }
    
    return true;
  };

  // Gestion du clic sur le bouton "Visible"
  const handleVisibleToggle = async () => {
    if (isVisible) {
      // Masquer l'image (mais la garder injectée)
      setIsVisible(false);
      toggleImageOverlaysVisibility(false);
      
      // Informer le parent que le bouton "Visible" est désactivé
      onVisibleStateChange && onVisibleStateChange(false);
      console.log('[ProductTypeSelector] Image masquée (gardée injectée)');
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
    
    if (firstImageIndex === undefined || (!processImages.includes(parseInt(firstImageIndex)) && !shadowProcessImages.includes(parseInt(firstImageIndex)))) {
      alert('L\'image sélectionnée #1 doit avoir le traitement Pixian (bouton vert) ou PNG transparent (bouton violet) activé');
      return;
    }

    try {
      setIsProcessing(true);
      
      // Vérifier si l'image est déjà injectée (cache)
      if (canReuseCache(firstImage.url, parseInt(firstImageIndex))) {
        // L'image est déjà injectée, juste l'afficher
        console.log('[ProductTypeSelector] Image déjà injectée - affichage simple');
        
        toggleImageOverlaysVisibility(true);
        setIsVisible(true);
        
        onVisibleStateChange && onVisibleStateChange(true);
        console.log('[ProductTypeSelector] Image réaffichée (déjà injectée)');
        
      } else {
        // Première injection - appel API nécessaire
        console.log('[ProductTypeSelector] Première injection - appel API');
        
        // Détecter si c'est un traitement PNG transparent (bouton violet) ou Pixian standard (bouton vert)
        const isShadowProcessing = shadowProcessImages.includes(parseInt(firstImageIndex));
        
        if (isShadowProcessing) {
          // TRAITEMENT PNG TRANSPARENT (bouton violet) - pas d'API, injection directe
          console.log('[ProductTypeSelector] Mode PNG transparent - injection directe sans API');
          
          // TODO: Demander à l'utilisateur de fournir l'image PNG transparente
          // Pour l'instant, on utilise l'image originale comme placeholder
          const transparentImageUrl = firstImage.url;
          
          // ÉTAPE 2: Injecter l'image PNG transparente sur le site
          injectImageOnSite(transparentImageUrl);
          
          setInjectedImageUrl(transparentImageUrl);
          setIsVisible(true);
          
          // Mettre à jour le cache
          setCachedImageData({
            processedUrl: transparentImageUrl,
            sourceImageUrl: firstImage.url,
            selectedIndex: parseInt(firstImageIndex),
            isShadowMode: true // Marqueur pour différencier du cache Pixian
          });
          
        } else {
          // TRAITEMENT PIXIAN STANDARD (bouton vert) - appel API
          console.log('[ProductTypeSelector] Mode Pixian standard - appel API');
          
          // ÉTAPE 1: Traiter l'image avec Pixian SANS marges
          const processedImageUrl = await processImageWithPixianNoMargins(firstImage.url);
          
          // ÉTAPE 2: Injecter l'image sur le site
          injectImageOnSite(processedImageUrl);
          
          setInjectedImageUrl(processedImageUrl);
          setIsVisible(true);
          
          // Mettre à jour le cache
          setCachedImageData({
            processedUrl: processedImageUrl,
            sourceImageUrl: firstImage.url,
            selectedIndex: parseInt(firstImageIndex),
            isShadowMode: false
          });
        }
        
        // ÉTAPE 3: Appliquer les marges courantes immédiatement
        setTimeout(() => {
          // Obtenir les marges actuelles
          let currentMargins;
          if (selectedType === 'custom') {
            currentMargins = margins;
          } else {
            currentMargins = predefinedMargins[selectedType] || predefinedMargins.default;
          }
          
          // Appliquer le padding
          updateInjectedImageMargins(currentMargins);
          
          console.log('[ProductTypeSelector] Marges initiales appliquées:', currentMargins);
        }, 100);
        
        onVisibleStateChange && onVisibleStateChange(true);
        console.log('[ProductTypeSelector] Image injectée avec succès');
      }
      
    } catch (error) {
      console.error('[ProductTypeSelector] Erreur lors de l\'activation:', error);
      alert('Erreur lors du traitement de l\'image: ' + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="product-type-selector">
      <div className="product-type-header">
        <div className="product-type-label-container">
          <div className="product-type-label">Type de produit:</div>
          {/* Toggle violet pour traitement sans détourage avec marge */}
          <div 
            className="shadow-toggle-container" 
            title="Sans détourage avec marge"
            onClick={handleShadowToggleChange}
          >
            <div className="shadow-toggle-switch">
              <input
                type="checkbox"
                className="shadow-toggle-input"
                checked={shadowModeEnabled}
                onChange={handleShadowToggleChange}
              />
              <span className="shadow-toggle-slider"></span>
            </div>
          </div>
        </div>
        {/* Bouton Visible */}
        <div className="visible-button-container">
          {isVisible && (
            <OpacitySlider 
              opacity={opacity}
              onOpacityChange={handleOpacityChange}
              disabled={false}
            />
          )}
          {isVisible && (
            <span className="visible-status">Image injectée</span>
          )}
          <button
            className={`visible-button ${isVisible ? 'active' : ''} ${isProcessing ? 'processing' : ''}`}
            onClick={handleVisibleToggle}
            disabled={isProcessing}
            title={isProcessing ? 'Traitement en cours...' : isVisible ? 'Masquer l\'image' : 'Afficher l\'image sur le site'}
          >
            {isProcessing ? (
              <Hourglass size={16} />
            ) : isVisible ? (
              <EyeOff size={16} />
            ) : (
              <Eye size={16} />
            )}
          </button>
        </div>
      </div>
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

      {/* Contrôles Custom étendus */}
      {showCustomControls && (
        <div className="custom-controls">

          {/* Liste déroulante des presets */}
          {showPresetDropdown && (
            <div className="preset-dropdown">
              {savedPresets.length === 0 ? (
                <div className="preset-item empty">Aucun preset sauvegardé</div>
              ) : (
                savedPresets.map(preset => (
                  <div key={preset.id} className="preset-item">
                    <span 
                      className="preset-name"
                      onClick={() => handleLoadPreset(preset)}
                    >
                      {preset.name}
                    </span>
                    <button
                      className="delete-preset-btn"
                      onClick={() => handleDeletePreset(preset.id)}
                      title="Supprimer ce preset"
                    >
                      ✕
                    </button>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Dialog de sauvegarde */}
          {showSaveDialog && (
            <div className="save-dialog">
              <div className="save-dialog-content">
                <label>Nom du preset:</label>
                <input
                  type="text"
                  value={presetName}
                  onChange={(e) => setPresetName(e.target.value)}
                  placeholder="Entrer le nom..."
                  onKeyPress={(e) => e.key === 'Enter' && handleSavePreset()}
                />
                <div className="save-dialog-buttons">
                  <button onClick={handleSavePreset}>Sauvegarder</button>
                  <button onClick={() => setShowSaveDialog(false)}>Annuler</button>
                </div>
              </div>
            </div>
          )}

          {/* Inputs pour marges personnalisées */}
          <div className="custom-margins">
            <div className="custom-margins-header">
              <div className="custom-margins-label">Marges personnalisées (%):</div>
              <div className="custom-controls-header">
                <button
                  className="save-preset-btn"
                  onClick={() => setShowSaveDialog(true)}
                  title="Sauvegarder ce preset"
                >
                  <Save size={16} />
                </button>
                <button
                  className={`dropdown-toggle-btn ${showPresetDropdown ? 'open' : ''}`}
                  onClick={() => setShowPresetDropdown(!showPresetDropdown)}
                  title="Liste des presets"
                >
                  <ChevronDown size={16} />
                </button>
              </div>
            </div>
            <div className="margins-inputs-inline">
              <span className="margin-label">Haut</span>
              <input
                type="number"
                min="0"
                max="100"
                value={margins.top}
                onChange={(e) => handleMarginChange('top', e.target.value)}
                onKeyDown={(e) => handleKeyDown(e, 'top')}
                placeholder="0"
                className="margin-input-compact"
                tabIndex={1}
              />
              <span className="margin-label">Droite</span>
              <input
                type="number"
                min="0"
                max="100"
                value={margins.right}
                onChange={(e) => handleMarginChange('right', e.target.value)}
                onKeyDown={(e) => handleKeyDown(e, 'right')}
                placeholder="0"
                className="margin-input-compact"
                tabIndex={2}
              />
              <span className="margin-label">Bas</span>
              <input
                type="number"
                min="0"
                max="100"
                value={margins.bottom}
                onChange={(e) => handleMarginChange('bottom', e.target.value)}
                onKeyDown={(e) => handleKeyDown(e, 'bottom')}
                placeholder="0"
                className="margin-input-compact"
                tabIndex={3}
              />
              <span className="margin-label">Gauche</span>
              <input
                type="number"
                min="0"
                max="100"
                value={margins.left}
                onChange={(e) => handleMarginChange('left', e.target.value)}
                onKeyDown={(e) => handleKeyDown(e, 'left')}
                placeholder="0"
                className="margin-input-compact"
                tabIndex={4}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProductTypeSelector;

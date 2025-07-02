import React, { useState } from 'react';
import '../../styles/ProductTypeSelector.css';

// Import des hooks personnalisés
import { useImageVisibility } from './hooks/useImageVisibility.js';
import { usePresets } from './hooks/usePresets.js';

// Import des composants
import VisibilityButton from './components/VisibilityButton.jsx';
import ProductTypeOptions from './components/ProductTypeOptions.jsx';
import CustomControls from './components/CustomControls.jsx';

// Import des constantes et utilitaires
import { DEFAULT_MARGINS, PREDEFINED_MARGINS, TIMEOUTS } from './constants.js';

/**
 * Composant ProductTypeSelector restructuré - Permet de sélectionner le type de produit et configurer les marges
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
  // État local pour les marges personnalisées
  const [margins, setMargins] = useState(customMargins || DEFAULT_MARGINS);
  
  // État pour afficher les contrôles custom
  const [showCustomControls, setShowCustomControls] = useState(selectedType === 'custom');

  // Hook pour la gestion de la visibilité des images
  const {
    isVisible,
    isProcessing,
    injectedImageUrl,
    handleVisibleToggle,
    updateImageMargins
  } = useImageVisibility({
    images,
    selectedOrder,
    processImages,
    selectedType,
    margins,
    onVisibleStateChange
  });

  // Hook pour la gestion des presets
  const {
    savedPresets,
    presetName,
    setPresetName,
    showSaveDialog,
    setShowSaveDialog,
    showPresetDropdown,
    setShowPresetDropdown,
    handleSavePreset,
    handleLoadPreset,
    handleDeletePreset
  } = usePresets(onMarginsChange);

  /**
   * Gestion du changement de type de produit
   */
  const handleTypeChange = (typeId) => {
    onTypeChange(typeId);
    
    // Afficher les contrôles custom si "custom" est sélectionné
    if (typeId === 'custom') {
      setShowCustomControls(true);
    } else {
      setShowCustomControls(false);
      setShowPresetDropdown(false);
      // Effacer les marges personnalisées pour les types prédéfinis
      const resetMargins = DEFAULT_MARGINS;
      setMargins(resetMargins);
      onMarginsChange && onMarginsChange(null);
    }

    // Si l'image est injectée, appliquer les nouvelles marges immédiatement
    if (injectedImageUrl) {
      setTimeout(() => {
        // Obtenir les marges du nouveau type
        let newMargins;
        if (typeId === 'custom') {
          newMargins = margins; // Garder les marges custom actuelles
        } else {
          newMargins = PREDEFINED_MARGINS[typeId] || PREDEFINED_MARGINS.default;
        }
        
        updateImageMargins(newMargins);
        console.log('[ProductTypeSelector] Marges appliquées pour nouveau type:', typeId, newMargins);
      }, TIMEOUTS.MARGIN_APPLICATION);
    }
  };

  /**
   * Gestion du changement de marge personnalisée
   */
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

    // Si l'image est injectée, mettre à jour le padding
    updateImageMargins(newMargins);
  };

  /**
   * Gestion de la navigation circulaire avec Tab
   */
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

  /**
   * Handlers pour les presets
   */
  const handlePresetSave = () => {
    handleSavePreset(margins);
  };

  const handlePresetLoad = (preset) => {
    handleLoadPreset(preset, setMargins, updateImageMargins);
  };

  const togglePresetDropdown = () => {
    setShowPresetDropdown(!showPresetDropdown);
  };

  const showSaveDialogHandler = () => {
    setShowSaveDialog(true);
  };

  const closeSaveDialog = () => {
    setShowSaveDialog(false);
  };

  return (
    <div className="product-type-selector">
      <div className="product-type-header">
        <div className="product-type-label">Type de produit:</div>
        
        {/* Bouton Visible */}
        <VisibilityButton
          isVisible={isVisible}
          isProcessing={isProcessing}
          onToggle={handleVisibleToggle}
        />
      </div>
      
      {/* Options de types de produits */}
      <ProductTypeOptions
        selectedType={selectedType}
        onTypeChange={handleTypeChange}
      />

      {/* Contrôles Custom étendus */}
      {showCustomControls && (
        <CustomControls
          margins={margins}
          onMarginChange={handleMarginChange}
          onKeyDown={handleKeyDown}
          showPresetDropdown={showPresetDropdown}
          onTogglePresetDropdown={togglePresetDropdown}
          showSaveDialog={showSaveDialog}
          onShowSaveDialog={showSaveDialogHandler}
          savedPresets={savedPresets}
          onLoadPreset={handlePresetLoad}
          onDeletePreset={handleDeletePreset}
          presetName={presetName}
          onPresetNameChange={setPresetName}
          onSavePreset={handlePresetSave}
          onCloseSaveDialog={closeSaveDialog}
        />
      )}
    </div>
  );
}

export default ProductTypeSelector; 
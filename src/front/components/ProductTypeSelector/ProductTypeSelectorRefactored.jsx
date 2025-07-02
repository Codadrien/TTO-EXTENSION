import React, { useState } from 'react';
import '../styles/ProductTypeSelector.css';

// Hooks personnalisés
import { useMargins } from './hooks/useMargins.js';
import { usePresets } from './hooks/usePresets.js';
import { useImageInjection } from './hooks/useImageInjection.js';
import { useOpacity } from './hooks/useOpacity.js';

// Composants
import VisibleButton from './components/VisibleButton.jsx';
import ProductTypeOptions from './components/ProductTypeOptions.jsx';
import CustomControls from './components/CustomControls.jsx';
import OpacitySlider from './components/OpacitySlider.jsx';

// Constantes
import { PREDEFINED_MARGINS, TIMEOUTS } from './constants.js';

/**
 * Composant ProductTypeSelector restructuré
 * @param {Object} props - Propriétés du composant
 * @returns {JSX.Element}
 */
function ProductTypeSelectorRefactored({ 
  selectedType, 
  onTypeChange, 
  customMargins, 
  onMarginsChange,
  images = [],
  selectedOrder = {},
  processImages = [],
  shadowProcessImages = [],
  onVisibleStateChange
}) {
  // État pour l'affichage des contrôles custom
  const [showCustomControls, setShowCustomControls] = useState(false);

  // Hook pour la gestion des marges
  const {
    margins,
    setMargins,
    handleMarginChange,
    updateInjectedImageMargins,
    getCurrentMargins,
    resetMargins
  } = useMargins(customMargins, selectedType, onMarginsChange, null);

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
    handleDeletePreset
  } = usePresets();

  // Hook pour l'injection d'images
  const {
    isVisible,
    isProcessing,
    injectedImageUrl,
    handleVisibleToggle
  } = useImageInjection(images, selectedOrder, processImages, shadowProcessImages, onVisibleStateChange);

  // Hook pour l'opacité
  const {
    opacity,
    handleOpacityChange,
    resetOpacity
  } = useOpacity(100);

  // Mettre à jour le hook des marges avec l'URL de l'image injectée
  React.useEffect(() => {
    // Cette logique devrait être dans le hook useMargins mais pour simplifier...
  }, [injectedImageUrl]);

  // Remettre l'opacité à 100% quand l'image n'est plus visible
  React.useEffect(() => {
    if (!isVisible) {
      resetOpacity();
    }
  }, [isVisible, resetOpacity]);

  // Gestion du changement de type de produit
  const handleTypeChange = (typeId) => {
    onTypeChange(typeId);
    
    // Afficher les contrôles custom si "custom" est sélectionné
    if (typeId === 'custom') {
      setShowCustomControls(true);
    } else {
      setShowCustomControls(false);
      setShowPresetDropdown(false);
      resetMargins();
    }

    // Si l'image est injectée, appliquer les nouvelles marges immédiatement
    if (injectedImageUrl) {
      setTimeout(() => {
        const newMargins = typeId === 'custom' 
          ? margins 
          : PREDEFINED_MARGINS[typeId] || PREDEFINED_MARGINS.default;
        
        updateInjectedImageMargins(newMargins);
        console.log('[ProductTypeSelectorRefactored] Marges appliquées pour nouveau type:', typeId, newMargins);
      }, TIMEOUTS.MARGIN_APPLICATION);
    }
  };

  // Gestion du chargement d'un preset
  const handleLoadPreset = (preset) => {
    setMargins(preset.margins);
    onMarginsChange && onMarginsChange(preset.margins);
    setShowPresetDropdown(false);
    
    // Si l'image est injectée, appliquer les nouvelles marges
    if (injectedImageUrl) {
      updateInjectedImageMargins(preset.margins);
    }
    
    console.log('[ProductTypeSelectorRefactored] Preset chargé:', preset);
  };

  // Wrapper pour la sauvegarde de preset
  const handleSavePresetWrapper = async () => {
    return await handleSavePreset(margins);
  };

  // Wrapper pour le toggle de visibilité
  const handleVisibleToggleWrapper = async () => {
    await handleVisibleToggle(getCurrentMargins);
  };

  return (
    <div className="product-type-selector">
      <div className="product-type-header">
        <div className="product-type-label">Type de produit:</div>
        <OpacitySlider 
          opacity={opacity}
          onOpacityChange={handleOpacityChange}
          disabled={!isVisible}
        />
        <VisibleButton 
          isVisible={isVisible}
          isProcessing={isProcessing}
          onToggle={handleVisibleToggleWrapper}
        />
      </div>
      
      <ProductTypeOptions 
        selectedType={selectedType}
        onTypeChange={handleTypeChange}
      />

      {/* Contrôles Custom */}
      {showCustomControls && (
        <CustomControls
          margins={margins}
          onMarginChange={handleMarginChange}
          savedPresets={savedPresets}
          presetName={presetName}
          setPresetName={setPresetName}
          showSaveDialog={showSaveDialog}
          setShowSaveDialog={setShowSaveDialog}
          showPresetDropdown={showPresetDropdown}
          setShowPresetDropdown={setShowPresetDropdown}
          onSavePreset={handleSavePresetWrapper}
          onLoadPreset={handleLoadPreset}
          onDeletePreset={handleDeletePreset}
        />
      )}
    </div>
  );
}

export default ProductTypeSelectorRefactored; 
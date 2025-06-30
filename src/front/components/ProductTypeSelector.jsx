import React, { useState } from 'react';
import './ProductTypeSelector.css';

/**
 * Composant ProductTypeSelector - Permet de sélectionner le type de produit et configurer les marges
 * @param {string} selectedType - Type de produit sélectionné
 * @param {function} onTypeChange - Fonction appelée lors du changement de type
 * @param {Object} customMargins - Marges personnalisées actuelles
 * @param {function} onMarginsChange - Fonction appelée lors du changement de marges
 */
function ProductTypeSelector({ selectedType, onTypeChange, customMargins, onMarginsChange }) {
  // Types de produits disponibles
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

  // Marges prédéfinies par type
  const predefinedMargins = {
    default: { top: 5, right: 5, bottom: 5, left: 5 },
    textile: { top: 8.5, right: 8.5, bottom: 8.5, left: 8.5 },
    pantalon: { top: 3.2, right: 3.2, bottom: 3.2, left: 3.2 },
    accessoires: { top: 16, right: 16, bottom: 16, left: 16 }
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

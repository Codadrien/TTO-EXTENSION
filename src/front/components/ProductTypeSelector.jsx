import React from 'react';

/**
 * Composant ProductTypeSelector - Permet de sélectionner le type de produit pour les marges
 * @param {string} selectedType - Type de produit sélectionné
 * @param {function} onTypeChange - Fonction appelée lors du changement de type
 */
function ProductTypeSelector({ selectedType, onTypeChange }) {
  // Types de produits disponibles
  const productTypes = [
    { id: 'default', label: 'Standard' },
    { id: 'textile', label: 'Textile' },
    { id: 'pantalon', label: 'Pantalon' },
    { id: 'accessoires', label: 'Accessoires' }
  ];

  return (
    <div className="product-type-selector">
      <div className="product-type-label">Type de produit:</div>
      <div className="product-type-options">
        {productTypes.map(type => (
          <div 
            key={type.id}
            className={`product-type-option ${selectedType === type.id ? 'selected' : ''}`}
            onClick={() => onTypeChange(type.id)}
          >
            {type.label}
          </div>
        ))}
      </div>
    </div>
  );
}

export default ProductTypeSelector;

import React from 'react';
import { PRODUCT_TYPES } from '../constants.js';

/**
 * Composant pour les options de type de produit
 * @param {string} selectedType - Type sélectionné
 * @param {function} onTypeChange - Fonction de changement de type
 * @returns {JSX.Element}
 */
function ProductTypeOptions({ selectedType, onTypeChange }) {
  return (
    <div className="product-type-options">
      {PRODUCT_TYPES.map(type => (
        <div 
          key={type.id}
          className={`product-type-option ${selectedType === type.id ? 'selected' : ''}`}
          onClick={() => onTypeChange(type.id)}
        >
          {type.label}
        </div>
      ))}
    </div>
  );
}

export default ProductTypeOptions; 
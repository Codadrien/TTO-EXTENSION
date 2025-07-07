import React from 'react';

/**
 * Composant pour contrôler l'opacité de l'image injectée
 * @param {Object} props - Propriétés du composant
 * @param {number} props.opacity - Valeur d'opacité actuelle (0-100)
 * @param {Function} props.onOpacityChange - Fonction appelée lors du changement d'opacité
 * @param {boolean} props.disabled - Si le slider est désactivé
 * @returns {JSX.Element}
 */
function OpacitySlider({ opacity = 100, onOpacityChange, disabled = false }) {
  const handleChange = (event) => {
    const newOpacity = parseInt(event.target.value, 10);
    onOpacityChange && onOpacityChange(newOpacity);
  };

  return (
    <input
      type="range"
      min="0"
      max="100"
      value={opacity}
      onChange={handleChange}
      disabled={disabled}
      className="opacity-slider"
      title={`Opacité: ${opacity}%`}
    />
  );
}

export default OpacitySlider; 
import React from 'react';

/**
 * Composant pour les champs de saisie des marges personnalisées
 * @param {Object} margins - Valeurs actuelles des marges
 * @param {Function} onMarginChange - Fonction appelée lors du changement d'une marge
 * @param {Function} onKeyDown - Fonction appelée lors de l'appui sur une touche
 * @returns {JSX.Element}
 */
function MarginInputs({ margins, onMarginChange, onKeyDown }) {
  const marginFields = [
    { key: 'top', label: 'Haut', tabIndex: 1 },
    { key: 'right', label: 'Droite', tabIndex: 2 },
    { key: 'bottom', label: 'Bas', tabIndex: 3 },
    { key: 'left', label: 'Gauche', tabIndex: 4 }
  ];

  return (
    <div className="margins-inputs-inline">
      {marginFields.map(({ key, label, tabIndex }) => (
        <React.Fragment key={key}>
          <span className="margin-label">{label}</span>
          <input
            type="number"
            min="0"
            max="100"
            value={margins[key]}
            onChange={(e) => onMarginChange(key, e.target.value)}
            onKeyDown={(e) => onKeyDown(e, key)}
            placeholder="0"
            className="margin-input-compact"
            tabIndex={tabIndex}
          />
        </React.Fragment>
      ))}
    </div>
  );
}

export default MarginInputs; 
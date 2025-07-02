import React from 'react';

/**
 * Composant liste déroulante pour afficher et gérer les presets
 * @param {Array} savedPresets - Liste des presets sauvegardés
 * @param {Function} onLoadPreset - Fonction appelée lors du chargement d'un preset
 * @param {Function} onDeletePreset - Fonction appelée lors de la suppression d'un preset
 * @returns {JSX.Element}
 */
function PresetDropdown({ savedPresets, onLoadPreset, onDeletePreset }) {
  return (
    <div className="preset-dropdown">
      {savedPresets.length === 0 ? (
        <div className="preset-item empty">Aucun preset sauvegardé</div>
      ) : (
        savedPresets.map(preset => (
          <div key={preset.id} className="preset-item">
            <span 
              className="preset-name"
              onClick={() => onLoadPreset(preset)}
            >
              {preset.name}
            </span>
            <button
              className="delete-preset-btn"
              onClick={() => onDeletePreset(preset.id)}
              title="Supprimer ce preset"
            >
              ✕
            </button>
          </div>
        ))
      )}
    </div>
  );
}

export default PresetDropdown; 
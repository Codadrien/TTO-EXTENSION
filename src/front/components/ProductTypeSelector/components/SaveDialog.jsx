import React from 'react';

/**
 * Composant dialog pour sauvegarder un nouveau preset
 * @param {string} presetName - Nom du preset en cours de saisie
 * @param {Function} onPresetNameChange - Fonction appelée lors du changement du nom
 * @param {Function} onSavePreset - Fonction appelée lors de la sauvegarde
 * @param {Function} onClose - Fonction appelée lors de la fermeture du dialog
 * @returns {JSX.Element}
 */
function SaveDialog({ presetName, onPresetNameChange, onSavePreset, onClose }) {
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      onSavePreset();
    }
  };

  return (
    <div className="save-dialog">
      <div className="save-dialog-content">
        <label>Nom du preset:</label>
        <input
          type="text"
          value={presetName}
          onChange={(e) => onPresetNameChange(e.target.value)}
          placeholder="Entrer le nom..."
          onKeyPress={handleKeyPress}
        />
        <div className="save-dialog-buttons">
          <button onClick={onSavePreset}>Sauvegarder</button>
          <button onClick={onClose}>Annuler</button>
        </div>
      </div>
    </div>
  );
}

export default SaveDialog; 
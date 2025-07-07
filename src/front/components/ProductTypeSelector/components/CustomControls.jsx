import React from 'react';
import { Save, ChevronDown } from 'lucide-react';
import { keyboardNavigation } from '../utils/keyboardNavigation.js';

/**
 * Composant pour les contrôles personnalisés (marges et presets)
 */
function CustomControls({
  margins,
  onMarginChange,
  savedPresets,
  presetName,
  setPresetName,
  showSaveDialog,
  setShowSaveDialog,
  showPresetDropdown,
  setShowPresetDropdown,
  onSavePreset,
  onLoadPreset,
  onDeletePreset
}) {
  return (
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
              onKeyPress={(e) => e.key === 'Enter' && onSavePreset()}
            />
            <div className="save-dialog-buttons">
              <button onClick={onSavePreset}>Sauvegarder</button>
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
            onChange={(e) => onMarginChange('top', e.target.value)}
            onKeyDown={(e) => keyboardNavigation.handleKeyDown(e, 'top')}
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
            onChange={(e) => onMarginChange('right', e.target.value)}
            onKeyDown={(e) => keyboardNavigation.handleKeyDown(e, 'right')}
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
            onChange={(e) => onMarginChange('bottom', e.target.value)}
            onKeyDown={(e) => keyboardNavigation.handleKeyDown(e, 'bottom')}
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
            onChange={(e) => onMarginChange('left', e.target.value)}
            onKeyDown={(e) => keyboardNavigation.handleKeyDown(e, 'left')}
            placeholder="0"
            className="margin-input-compact"
            tabIndex={4}
          />
        </div>
      </div>
    </div>
  );
}

export default CustomControls; 
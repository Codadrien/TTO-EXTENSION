import React from 'react';
import { Save, ChevronDown } from 'lucide-react';
import MarginInputs from './MarginInputs.jsx';
import PresetDropdown from './PresetDropdown.jsx';
import SaveDialog from './SaveDialog.jsx';

/**
 * Composant pour les contrôles personnalisés (marges custom + presets)
 * @param {Object} props - Propriétés du composant
 * @returns {JSX.Element}
 */
function CustomControls({
  margins,
  onMarginChange,
  onKeyDown,
  showPresetDropdown,
  onTogglePresetDropdown,
  showSaveDialog,
  onShowSaveDialog,
  savedPresets,
  onLoadPreset,
  onDeletePreset,
  presetName,
  onPresetNameChange,
  onSavePreset,
  onCloseSaveDialog
}) {
  return (
    <div className="custom-controls">
      {/* Liste déroulante des presets */}
      {showPresetDropdown && (
        <PresetDropdown
          savedPresets={savedPresets}
          onLoadPreset={onLoadPreset}
          onDeletePreset={onDeletePreset}
        />
      )}

      {/* Dialog de sauvegarde */}
      {showSaveDialog && (
        <SaveDialog
          presetName={presetName}
          onPresetNameChange={onPresetNameChange}
          onSavePreset={onSavePreset}
          onClose={onCloseSaveDialog}
        />
      )}

      {/* Inputs pour marges personnalisées */}
      <div className="custom-margins">
        <div className="custom-margins-header">
          <div className="custom-margins-label">Marges personnalisées (%):</div>
          <div className="custom-controls-header">
            <button
              className="save-preset-btn"
              onClick={onShowSaveDialog}
              title="Sauvegarder ce preset"
            >
              <Save size={16} />
            </button>
            <button
              className={`dropdown-toggle-btn ${showPresetDropdown ? 'open' : ''}`}
              onClick={onTogglePresetDropdown}
              title="Liste des presets"
            >
              <ChevronDown size={16} />
            </button>
          </div>
        </div>
        <MarginInputs
          margins={margins}
          onMarginChange={onMarginChange}
          onKeyDown={onKeyDown}
        />
      </div>
    </div>
  );
}

export default CustomControls; 
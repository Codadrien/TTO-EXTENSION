import { useState, useEffect } from 'react';
import { StorageService } from '../services/storageService.js';

/**
 * Hook personnalisé pour gérer les presets de marges
 * @param {Function} onMarginsChange - Callback appelé lors du changement de marges
 * @returns {Object} État et fonctions pour gérer les presets
 */
export function usePresets(onMarginsChange) {
  const [savedPresets, setSavedPresets] = useState([]);
  const [presetName, setPresetName] = useState('');
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showPresetDropdown, setShowPresetDropdown] = useState(false);

  /**
   * Charge les presets depuis le stockage au démarrage
   */
  useEffect(() => {
    const loadPresets = async () => {
      const presets = await StorageService.loadPresets();
      setSavedPresets(presets);
    };
    
    loadPresets();
  }, []);

  /**
   * Sauvegarde un nouveau preset
   * @param {Object} margins - Marges à sauvegarder
   */
  const handleSavePreset = async (margins) => {
    if (!presetName.trim()) {
      alert('Veuillez entrer un nom pour le preset');
      return;
    }

    const newPreset = {
      id: Date.now(),
      name: presetName.trim(),
      margins: { ...margins }
    };

    const updatedPresets = [...savedPresets, newPreset];
    setSavedPresets(updatedPresets);
    await StorageService.savePresets(updatedPresets);
    
    setPresetName('');
    setShowSaveDialog(false);
    console.log('[usePresets] Preset sauvegardé:', newPreset);
  };

  /**
   * Charge un preset existant
   * @param {Object} preset - Preset à charger
   * @param {Function} setMargins - Fonction pour mettre à jour les marges locales
   * @param {Function} updateImageMargins - Fonction pour mettre à jour l'image injectée
   */
  const handleLoadPreset = (preset, setMargins, updateImageMargins) => {
    setMargins(preset.margins);
    onMarginsChange && onMarginsChange(preset.margins);
    setShowPresetDropdown(false);
    
    // Si une image est injectée, appliquer les nouvelles marges
    if (updateImageMargins) {
      updateImageMargins(preset.margins);
    }
    
    console.log('[usePresets] Preset chargé:', preset);
  };

  /**
   * Supprime un preset
   * @param {number} presetId - ID du preset à supprimer
   */
  const handleDeletePreset = async (presetId) => {
    const updatedPresets = savedPresets.filter(preset => preset.id !== presetId);
    setSavedPresets(updatedPresets);
    await StorageService.savePresets(updatedPresets);
    console.log('[usePresets] Preset supprimé:', presetId);
  };

  return {
    savedPresets,
    presetName,
    setPresetName,
    showSaveDialog,
    setShowSaveDialog,
    showPresetDropdown,
    setShowPresetDropdown,
    handleSavePreset,
    handleLoadPreset,
    handleDeletePreset
  };
} 
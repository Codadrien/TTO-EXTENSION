import { useState, useEffect } from 'react';
import { presetStorageService } from '../services/presetStorageService.js';

/**
 * Hook personnalisé pour gérer les presets
 * @returns {Object} État et méthodes pour gérer les presets
 */
export function usePresets() {
  const [savedPresets, setSavedPresets] = useState([]);
  const [presetName, setPresetName] = useState('');
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showPresetDropdown, setShowPresetDropdown] = useState(false);

  // Charger les presets au démarrage
  useEffect(() => {
    loadPresets();
  }, []);

  // Charger les presets depuis le stockage
  const loadPresets = async () => {
    try {
      const presets = await presetStorageService.loadPresets();
      setSavedPresets(presets);
      console.log('[usePresets] Presets chargés:', presets);
    } catch (error) {
      console.error('[usePresets] Erreur lors du chargement des presets:', error);
    }
  };

  // Sauvegarder un preset
  const handleSavePreset = async (margins) => {
    if (!presetName.trim()) {
      alert('Veuillez entrer un nom pour le preset');
      return false;
    }

    try {
      const newPreset = {
        id: Date.now(),
        name: presetName.trim(),
        margins: { ...margins }
      };

      const updatedPresets = [...savedPresets, newPreset];
      await presetStorageService.savePresets(updatedPresets);
      
      setSavedPresets(updatedPresets);
      setPresetName('');
      setShowSaveDialog(false);
      
      console.log('[usePresets] Preset sauvegardé:', newPreset);
      return true;
    } catch (error) {
      console.error('[usePresets] Erreur lors de la sauvegarde:', error);
      return false;
    }
  };

  // Supprimer un preset
  const handleDeletePreset = async (presetId) => {
    try {
      const updatedPresets = savedPresets.filter(preset => preset.id !== presetId);
      await presetStorageService.savePresets(updatedPresets);
      
      setSavedPresets(updatedPresets);
      console.log('[usePresets] Preset supprimé:', presetId);
    } catch (error) {
      console.error('[usePresets] Erreur lors de la suppression:', error);
    }
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
    handleDeletePreset,
    loadPresets
  };
} 
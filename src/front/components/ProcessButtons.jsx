import React from 'react';
import '../styles/ProcessButtons.css';

/**
 * Composant affichant les boutons de traitement d'image en colonne
 * @param {Object} props - Les propriétés du composant
 * @param {Function} props.onProcessClick - Fonction appelée lors du clic sur le bouton de traitement standard
 * @param {boolean} props.shadowModeEnabled - Si le mode shadow est verrouillé (désactive le bouton vert)
 */
const ProcessButtons = ({ onProcessClick, shadowModeEnabled = false }) => {
  return (
    <div className="process-buttons-container">
      {/* Bouton vert déclenchant la sélection d'image avec traitement Pixian standard */}
      <button 
        className={`process-button ${shadowModeEnabled ? 'disabled' : ''}`}
        onClick={shadowModeEnabled ? undefined : onProcessClick}
        disabled={shadowModeEnabled}
        title={shadowModeEnabled ? "Mode shadow verrouillé" : "Traitement standard"}
      ></button>
    </div>
  );
};

export default ProcessButtons;

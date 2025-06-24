import React from 'react';
import '../styles/ProcessButtons.css';

/**
 * Composant affichant les boutons de traitement d'image en colonne
 * @param {Object} props - Les propriétés du composant
 * @param {Function} props.onProcessClick - Fonction appelée lors du clic sur le bouton de traitement standard
 * @param {Function} props.onShoesProcessClick - Fonction appelée lors du clic sur le bouton de traitement pour chaussures
 * @param {Function} props.onShadowProcessClick - Fonction appelée lors du clic sur le bouton de traitement avec ombre
 */
const ProcessButtons = ({ onProcessClick, onShoesProcessClick, onShadowProcessClick }) => {
  return (
    <div className="process-buttons-container">
      {/* Bouton vert déclenchant la sélection d'image avec traitement Pixian standard */}
      <button 
        className="process-button" 
        onClick={onProcessClick}
        title="Traitement standard"
      ></button>
      
      {/* Bouton orange déclenchant la sélection d'image avec traitement spécifique pour chaussures */}
      <button 
        className="process-button shoes-button" 
        onClick={onShoesProcessClick} 
        style={{ backgroundColor: '#FF9800' }}
        title="Traitement chaussures"
      ></button>
      
      {/* Bouton violet déclenchant la sélection d'image avec préservation d'ombre */}
      <button 
        className="process-button shadow-button" 
        onClick={onShadowProcessClick} 
        style={{ backgroundColor: '#9C27B0' }}
        title="Conserver l'ombre"
      ></button>
    </div>
  );
};

export default ProcessButtons;

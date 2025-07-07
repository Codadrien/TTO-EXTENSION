import React from 'react';
import { Eye, EyeOff, Hourglass } from 'lucide-react';

/**
 * Composant bouton Visible/Masquer
 * @param {boolean} isVisible - État de visibilité
 * @param {boolean} isProcessing - État de traitement en cours
 * @param {function} onToggle - Fonction de toggle
 * @returns {JSX.Element}
 */
function VisibleButton({ isVisible, isProcessing, onToggle }) {
  return (
    <div className="visible-button-container">
      {isVisible && (
        <span className="visible-status">Image injectée</span>
      )}
      <button
        className={`visible-button ${isVisible ? 'active' : ''} ${isProcessing ? 'processing' : ''}`}
        onClick={onToggle}
        disabled={isProcessing}
        title={
          isProcessing 
            ? 'Traitement en cours...' 
            : isVisible 
              ? 'Masquer l\'image' 
              : 'Afficher l\'image sur le site'
        }
      >
        {isProcessing ? (
          <Hourglass size={16} />
        ) : isVisible ? (
          <EyeOff size={16} />
        ) : (
          <Eye size={16} />
        )}
      </button>
    </div>
  );
}

export default VisibleButton; 
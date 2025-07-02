import React from 'react';
import { Eye, EyeOff, Hourglass } from 'lucide-react';

/**
 * Composant bouton de visibilité pour l'injection d'images
 * @param {boolean} isVisible - État de visibilité
 * @param {boolean} isProcessing - État de traitement en cours
 * @param {Function} onToggle - Fonction appelée lors du clic
 * @returns {JSX.Element}
 */
function VisibilityButton({ isVisible, isProcessing, onToggle }) {
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

export default VisibilityButton; 
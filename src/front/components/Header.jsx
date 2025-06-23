import React from 'react';

/**
 * Composant Header - Gère l'en-tête de l'application avec le titre et le bouton d'importation
 * @param {Function} onImportClick - Fonction appelée lors du clic sur le bouton d'importation
 */
function Header({ onImportClick }) {
  return (
    <div className="header-container drag-handle">
      <div id="header-tto" className="header-tto">
        Extension Photo TTO
      </div>
      {/* Bouton d'importation ZIP et input file caché */}
      <div className="zip-import-container">
        <button 
          className="zip-import-button" 
          onClick={onImportClick}
        >
          Importer des images
        </button>
      </div>
    </div>
  );
}

export default Header;

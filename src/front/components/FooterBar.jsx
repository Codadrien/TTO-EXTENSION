import React from 'react';

/**
 * Composant FooterBar - Barre fixe en bas avec input pour le nom du dossier et bouton de téléchargement
 * @param {string} folderName - Nom du dossier de téléchargement
 * @param {Function} onFolderNameChange - Fonction appelée lors du changement du nom du dossier
 * @param {Function} onDownload - Fonction appelée lors du clic sur le bouton de téléchargement
 */
function FooterBar({ folderName, onFolderNameChange, onDownload }) {
  return (
    <div className="footer-bar">
      <div className="footer-bar-input-wrapper">
        <input 
          type="text" 
          value={folderName} 
          onChange={(e) => onFolderNameChange(e.target.value)} 
          placeholder="Barcode" 
          className="folder-name-input" 
        />
      </div>
      <div className="footer-bar-button-wrapper">
        <button onClick={onDownload}>Télécharger les images</button>
      </div>
    </div>
  );
}

export default FooterBar;

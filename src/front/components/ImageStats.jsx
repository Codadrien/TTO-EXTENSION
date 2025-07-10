import React from 'react';

/**
 * Composant ImageStats - Affiche les statistiques des images (total et filtrées)
 * @param {number} totalCount - Nombre total d'images
 * @param {number} largeCount - Nombre d'images > 500px
 * @param {boolean} imagesFromZip - Indique si les images viennent d'un ZIP
 * @param {boolean} optimizedScrapingEnabled - État du scraper optimisé
 * @param {Function} onOptimizedScrapingChange - Fonction appelée lors du changement du toggle
 */
function ImageStats({ totalCount, largeCount, imagesFromZip, optimizedScrapingEnabled, onOptimizedScrapingChange }) {
  
  const handleToggleChange = (event) => {
    // Si l'événement vient de l'input, utiliser checked
    // Si l'événement vient du container, inverser l'état actuel
    const isChecked = event.target.type === 'checkbox' 
      ? event.target.checked 
      : !optimizedScrapingEnabled;
    
    console.log('[ImageStats] Toggle changé vers:', isChecked ? 'optimisé' : 'standard');
    onOptimizedScrapingChange(isChecked);
  };

  return (
    <div className="image-counts">
      <div className="stats-line">
        <span className="stats-text">
          <strong>{totalCount}</strong> images {imagesFromZip ? 'extraites du ZIP' : 'détectées'} et <strong>{largeCount}</strong> &gt; 500px
        </span>
        
        {/* Toggle pour le scraper amélioré - même structure que shadow-toggle */}
        {!imagesFromZip && (
                     <div 
             className="shadow-toggle-container" 
             title="Scraper optimisé"
             onClick={handleToggleChange}
           >
            <div className="shadow-toggle-switch">
                              <input
                  type="checkbox"
                  className="shadow-toggle-input"
                  checked={optimizedScrapingEnabled}
                  onChange={handleToggleChange}
                />
              <span className="shadow-toggle-slider"></span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ImageStats;

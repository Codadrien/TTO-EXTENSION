import React from 'react';

/**
 * Composant ImageStats - Affiche les statistiques des images (total et filtrées)
 * @param {number} totalCount - Nombre total d'images
 * @param {number} largeCount - Nombre d'images > 500px
 * @param {boolean} imagesFromZip - Indique si les images viennent d'un ZIP
 */
function ImageStats({ totalCount, largeCount, imagesFromZip }) {
  return (
    <div className="image-counts">
      <strong>{totalCount}</strong> images {imagesFromZip ? 'extraites du ZIP' : 'détectées'} et <strong>{largeCount}</strong> &gt; 500px
    </div>
  );
}

export default ImageStats;

import React from 'react';
import ImageCard from './ImageCard';

/**
 * Composant ImageGrid - Affiche la grille des images
 * @param {Array} images - Liste des images à afficher
 * @param {Object} imageInfos - Informations dynamiques des images
 * @param {Object} selectedOrder - Ordre de sélection des images
 * @param {Array} processImages - Images sélectionnées pour traitement Pixian
 * @param {Array} shoesProcessImages - Images sélectionnées pour traitement chaussures
 * @param {Array} shadowProcessImages - Images sélectionnées pour traitement avec ombre
 * @param {Function} onImageClick - Fonction appelée lors du clic sur une image
 * @param {Function} onProcessClick - Fonction appelée lors du clic sur le bouton vert
 * @param {Function} onShoesProcessClick - Fonction appelée lors du clic sur le bouton orange
 * @param {Function} onShadowProcessClick - Fonction appelée lors du clic sur le bouton violet
 */
function ImageGrid({ 
  images, 
  imageInfos, 
  selectedOrder, 
  processImages, 
  shoesProcessImages,
  shadowProcessImages,
  onImageClick,
  onProcessClick,
  onShoesProcessClick,
  onShadowProcessClick
}) {
  return (
    <div id="imageContainer" className="image-grid">
      {images.map((image, idx) => (
        <ImageCard
          key={idx}
          image={image}
          idx={idx}
          imageInfos={imageInfos}
          selectedOrder={selectedOrder}
          processImages={processImages}
          shoesProcessImages={shoesProcessImages}
          shadowProcessImages={shadowProcessImages}
          onImageClick={onImageClick}
          onProcessClick={onProcessClick}
          onShoesProcessClick={onShoesProcessClick}
          onShadowProcessClick={onShadowProcessClick}
        />
      ))}
    </div>
  );
}

export default ImageGrid;

import React from 'react';

/**
 * Composant ImageCard - Représente une carte d'image avec ses boutons et informations
 * @param {Object} image - Objet image avec url, format, weight
 * @param {number} idx - Index de l'image
 * @param {Object} imageInfos - Informations dynamiques des images (dimensions)
 * @param {Object} selectedOrder - Ordre de sélection des images
 * @param {Array} processImages - Images sélectionnées pour traitement Pixian
 * @param {Array} shoesProcessImages - Images sélectionnées pour traitement chaussures
 * @param {Function} onImageClick - Fonction appelée lors du clic sur l'image
 * @param {Function} onProcessClick - Fonction appelée lors du clic sur le bouton vert
 * @param {Function} onShoesProcessClick - Fonction appelée lors du clic sur le bouton orange
 */
function ImageCard({ 
  image, 
  idx, 
  imageInfos, 
  selectedOrder, 
  processImages, 
  shoesProcessImages,
  onImageClick,
  onProcessClick,
  onShoesProcessClick
}) {
  const { url, format, weight } = image;
  const isSelected = selectedOrder[idx];
  const isProcessSelected = processImages.includes(idx);
  const isShoesSelected = shoesProcessImages.includes(idx);

  // Détermine le type de traitement pour l'indicateur
  const getProcessingType = () => {
    if (isShoesSelected) return 'shoes-process';
    if (isProcessSelected) return 'pixian-process';
    return 'resize-process';
  };

  // Détermine le texte de l'indicateur
  const getProcessingText = () => {
    if (isShoesSelected) return 'Détourage + Shoes marges';
    if (isProcessSelected) return 'Détourage auto';
    return 'Resize + compression';
  };

  return (
    <div className="image-card">
      {/* Bouton vert déclenchant la sélection d'image avec traitement Pixian standard */}
      <button 
        className="process-button" 
        onClick={() => onProcessClick(idx)}
      ></button>
      
      {/* Bouton orange déclenchant la sélection d'image avec traitement spécifique pour chaussures */}
      <button 
        className="process-button shoes-button" 
        onClick={() => onShoesProcessClick(idx)} 
        style={{ right: '30px', backgroundColor: '#FF9800' }}
      ></button>
      
      {/* L'image */}
      <img
        className={`image-item ${isSelected ? 'selected-image' : ''} ${isProcessSelected ? 'selected-process' : ''} ${isShoesSelected ? 'selected-shoes' : ''}`}
        src={url}
        alt={`Image ${idx + 1}`}
        onClick={() => onImageClick(idx)}
      />
      
      {/* Indicateur visuel du type de traitement */}
      {isSelected && (
        <div className={`processing-indicator ${getProcessingType()}`}>
          {getProcessingText()}
        </div>
      )}
      
      {/* Détails sous l'image, superposés */}
      <div className="image-details">
        <div className="size">
          {/* Dimensions dynamiques si dispo, sinon "?" */}
          {imageInfos[url] ? `${imageInfos[url].width}x${imageInfos[url].height}` : '?x?'}
        </div>
        <div className="format">
          {/* Format détecté */}
          {format}
        </div>
        <div className="weight">
          {/* Poids non dispo côté client sans HEAD, donc "?" */}
          {weight ? `${weight} Ko` : '?'}
        </div>
      </div>
      
      {/* Badge d'ordre de sélection */}
      {isSelected && (
        <div className="order-badge">{isSelected}</div>
      )}
    </div>
  );
}

export default ImageCard;

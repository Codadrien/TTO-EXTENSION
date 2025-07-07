import React from 'react';
import ProcessButtons from './ProcessButtons';

/**
 * Composant ImageCard - Représente une carte d'image avec ses boutons et informations
 * @param {Object} image - Objet image avec url, format, weight
 * @param {number} idx - Index de l'image
 * @param {Object} imageInfos - Informations dynamiques des images (dimensions)
 * @param {Object} selectedOrder - Ordre de sélection des images
 * @param {Array} processImages - Images sélectionnées pour traitement Pixian
 * @param {Array} shadowProcessImages - Images sélectionnées pour traitement sans détourage avec marge
 * @param {Function} onImageClick - Fonction appelée lors du clic sur l'image
 * @param {Function} onProcessClick - Fonction appelée lors du clic sur le bouton vert
 */
function ImageCard({ 
  image, 
  idx, 
  imageInfos, 
  selectedOrder, 
  processImages, 
  shadowProcessImages = [], // Valeur par défaut pour la rétrocompatibilité
  shadowModeEnabled = false,
  onImageClick,
  onProcessClick
}) {
  const { url, format, weight } = image;
  const isSelected = selectedOrder[idx];
  const isProcessSelected = processImages.includes(idx);
  const isShadowSelected = shadowProcessImages.includes(idx);

  // Détermine le type de traitement pour l'indicateur
  const getProcessingType = () => {
    if (isShadowSelected) return 'shadow-process';
    if (isProcessSelected) return 'pixian-process';
    return 'resize-process';
  };

  // Détermine le texte de l'indicateur
  const getProcessingText = () => {
    if (isShadowSelected) return 'Sans détourage avec marge';
    if (isProcessSelected) return 'Détourage auto';
    return 'Resize + compression';
  };

  return (
    <div className="image-card">
      {/* Composant de boutons de traitement en colonne */}
      <div className="process-buttons-column">
        <ProcessButtons 
          onProcessClick={() => onProcessClick(idx)}
          shadowModeEnabled={shadowModeEnabled}
        />
      </div>
      
      {/* L'image */}
      <img
        className={`image-item ${isSelected ? 'selected-image' : ''} ${isProcessSelected ? 'selected-process' : ''} ${isShadowSelected ? 'selected-shadow' : ''}`}
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

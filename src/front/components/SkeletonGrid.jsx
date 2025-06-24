import React from 'react';
import '../styles/ProcessButtons.css';

/**
 * Composant SkeletonGrid - Affiche des placeholders qui reproduisent exactement les ImageCard
 * avec bordure noire, boutons, détails et badges, mais avec une image grise animée
 * @param {number} count - Nombre de skeletons à afficher (par défaut 6)
 */
function SkeletonGrid({ count = 6 }) {
  return (
    <div className="image-grid">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="image-card">
          {/* Conteneur des boutons de traitement en colonne */}
          <div className="process-buttons-column">
            <div className="process-buttons-container">
              {/* Bouton vert pour traitement standard */}
              <button className="process-button" title="Traitement standard"></button>
              
              {/* Bouton orange pour traitement chaussures */}
              <button 
                className="process-button shoes-button" 
                style={{ backgroundColor: '#FF9800' }}
                title="Traitement chaussures"
              ></button>
              
              {/* Bouton violet pour traitement avec ombre */}
              <button 
                className="process-button shadow-button" 
                style={{ backgroundColor: '#9C27B0' }}
                title="Conserver l'ombre"
              ></button>
            </div>
          </div>
          
          {/* Image placeholder avec animation */}
          <div className="skeleton-image-placeholder">
            <div className="skeleton-shimmer"></div>
          </div>
          
          {/* Détails sous l'image (même structure que ImageCard) */}
          <div className="image-details">
            <div className="size">
              <span className="skeleton-text skeleton-text-short">1920x1920</span>
            </div>
            <div className="format">
              <span className="skeleton-text skeleton-text-tiny">JPEG</span>
            </div>
            <div className="weight">
              <span className="skeleton-text skeleton-text-medium">
              295.62 Ko</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default SkeletonGrid;

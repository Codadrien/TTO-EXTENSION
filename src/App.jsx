import React, { useEffect, useState } from 'react'; // On importe useEffect ET useState
import './index.css'; // On importe le CSS principal
import { getImages } from './services/apiService';

function App() {
  // State pour stocker la liste des URLs d'images
  const [images, setImages] = useState([]);

  // State pour stocker les infos dynamiques de chaque image (dimensions)
  const [imageInfos, setImageInfos] = useState({});

  // State pour stocker le nombre d'images total et filtré
  const [totalCount, setTotalCount] = useState(0);
  const [largeCount, setLargeCount] = useState(0);

  useEffect(() => {
    getImages()
      .then(({ images: imgs, totalCount: total, largeCount: large }) => {
        setImages(imgs);
        setTotalCount(total);
        setLargeCount(large);
      })
      .catch(error => console.error('Erreur getImages:', error));
  }, []);

  // Pour chaque image, charger dynamiquement les dimensions (largeur/hauteur)
  useEffect(() => {
    images.forEach(({url}) => {
      // Si on n'a pas déjà les infos pour cette image
      if (!imageInfos[url]) {
        const img = new window.Image();
        img.onload = function () {
          setImageInfos(prev => ({
            ...prev,
            [url]: { width: img.naturalWidth, height: img.naturalHeight }
          }));
        };
        img.src = url;
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [images]);

  return (
    <div id="custom-side-panel-bis" className="custom-side-panel-bis visible">
      {/* Header du panneau */}
      <div id="header-tto" className="header-tto">
        Extension Photo TTO
      </div>
      {/* Affichage des compteurs */}
      <div className="image-counts">
        <strong>{totalCount}</strong> images détectées et <strong>{largeCount}</strong> &gt; 500px
      </div>
      {/* Grille d'images */}
      <div id="imageContainer" className="image-grid">
        {images.map(({url, format, weight}, idx) => (
          <div className="image-card" key={idx}>
            {/* L'image */}
            <img className="image-item" src={url} alt={`Image ${idx + 1}`} />
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
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;

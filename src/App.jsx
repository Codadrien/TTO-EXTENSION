import React, { useEffect, useState } from 'react'; // On importe useEffect ET useState
import './index.css'; // On importe le CSS principal

function App() {
  // State pour stocker la liste des URLs d'images
  const [images, setImages] = useState([]);

  // State pour stocker les infos dynamiques de chaque image (dimensions)
  const [imageInfos, setImageInfos] = useState({});

  // Charger le JSON une seule fois au montage
  useEffect(() => {
    fetch('/test-data.json')
      .then((response) => response.json())
      .then((data) => {
        setImages(data); // On stocke le tableau d'URLs dans le state
      })
      .catch((error) => {
        console.error('Erreur lors du chargement du fichier JSON :', error);
      });
  }, []);

  // Pour chaque image, charger dynamiquement les dimensions (largeur/hauteur)
  useEffect(() => {
    images.forEach((url) => {
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

  // Fonction utilitaire pour extraire l'extension du fichier à partir de l'URL
  function getExtension(url) {
    const match = url.match(/\.([a-zA-Z0-9]+)(?:\?|$)/);
    return match ? match[1] : '?';
  }

  return (
    <div id="custom-side-panel" className="custom-side-panel visible">
      {/* Header du panneau */}
      <div id="header-tto" className="header-tto">
        Extension TTO
      </div>
      {/* Grille d'images */}
      <div id="imageContainer" className="image-grid">
        {images.map((url, idx) => (
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
                {/* Extension du fichier */}
                {getExtension(url)}
              </div>
              <div className="weight">
                {/* Poids non dispo côté client sans HEAD, donc "?" */}
                ?
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;

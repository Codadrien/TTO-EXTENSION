import React, { useEffect, useState } from 'react'; // On importe useEffect ET useState
import './index.css'; // On importe le CSS principal
import { getImages } from './services/apiService';
import DownloadManager from './services/imagesDownloderManager';

function App() {
  // State pour stocker la liste des URLs d'images
  const [images, setImages] = useState([]);

  // State pour stocker les infos dynamiques de chaque image (dimensions)
  const [imageInfos, setImageInfos] = useState({});

  // State pour stocker le nombre d'images total et filtré
  const [totalCount, setTotalCount] = useState(0);
  const [largeCount, setLargeCount] = useState(0);

  // State pour images sélectionnées (plusieurs)
  const [selectedOrder, setSelectedOrder] = useState({});

  // State pour le nom du dossier de téléchargement
  const [folderName, setFolderName] = useState('');

  // Fonction pour gérer le clic sur une image et injecter une classe
  const handleImageClick = (idx) => {
    setSelectedOrder(prev => {
      const newOrder = { ...prev };
      if (newOrder[idx]) {
        const removedOrder = newOrder[idx];
        delete newOrder[idx];
        Object.keys(newOrder).forEach(key => {
          const k = Number(key);
          if (newOrder[k] > removedOrder) {
            newOrder[k] = newOrder[k] - 1;
          }
        });
      } else {
        const nextOrder = Object.keys(prev).length + 1;
        newOrder[idx] = nextOrder;
      }
      return newOrder;
    });
  };

  // Fonction pour télécharger les images sélectionnées
  const handleDownload = () => {
    const urlsWithNumber = Object.entries(selectedOrder)
      .sort((a, b) => a[1] - b[1])
      .map(([idx, order]) => ({
        url: images[idx].url,
        order,
      }));
    console.log('Images envoyées avec ordre:', urlsWithNumber);
    DownloadManager.downloadImages(urlsWithNumber, folderName);
  };

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

  // Écouter les mises à jour d'images et informer le script de contenu que l'UI React est prête
  useEffect(() => {
    // Informer le script de contenu que l'UI React est prête
    document.dispatchEvent(new CustomEvent('TTO_PANEL_OPENED'));
    
    // Fonction pour mettre à jour les données d'images
    const handleImagesUpdate = (event) => {
      console.log('[React] Reçu mise à jour des images:', event.detail);
      const { images: imgs, totalCount: total, largeCount: large } = event.detail;
      setImages(imgs);
      setTotalCount(total);
      setLargeCount(large);
    };
    
    // Ajouter l'écouteur d'événement
    document.addEventListener('TTO_IMAGES_DATA', handleImagesUpdate);
    
    // Nettoyer l'écouteur lors du démontage
    return () => {
      document.removeEventListener('TTO_IMAGES_DATA', handleImagesUpdate);
    };
  }, []);

  return (
    <>  {/* Wrapper pour panel + footer */}
      <div id="custom-side-panel" className="custom-side-panel visible">
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
              <img
                className={`image-item ${selectedOrder[idx] ? 'selected-image' : ''}`}
                src={url}
                alt={`Image ${idx + 1}`}
                onClick={() => handleImageClick(idx)}
              />
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
              {selectedOrder[idx] && (
                <div className="order-badge">{selectedOrder[idx]}</div>
              )}
            </div>
          ))}
        </div>
      </div>
      {/* Barre fixe en bas, hors du panel */}
      <div className="footer-bar">
        <div className="footer-bar-input-wrapper">
          <input 
            type="text" 
            value={folderName} 
            onChange={(e) => setFolderName(e.target.value)} 
            placeholder="Barcode" 
            className="folder-name-input" 
          />
        </div>
        <div className="footer-bar-button-wrapper">
          <button onClick={handleDownload}>Télécharger les images</button>
        </div>
      </div>
    </>
  );
}

export default App;

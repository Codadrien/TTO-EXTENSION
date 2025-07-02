import React, { useEffect, useState, useRef } from 'react';
import '../styles/index.css';
import '../styles/ProductTypeSelector.css';

// Import des composants modulaires
import Header from './Header';
import ImageStats from './ImageStats';
import ImageGrid from './ImageGrid';
import ProductTypeSelector from './ProductTypeSelector/index.jsx';
import FooterBar from './FooterBar';
import FileInput from './FileInput';
import SkeletonGrid from './SkeletonGrid';

// Import des services
import { extractImagesFromZip, releaseImageBlobUrls, processImageFiles } from '../services/zipService';
import { getImages } from '../services/apiService';

// Style pour les indicateurs de traitement
const styles = `
  .processing-indicator {
    position: absolute;
    bottom: 30px;
    left: 5px;
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 10px;
    font-weight: bold;
    color: white;
    z-index: 10;
  }
  .pixian-process {
    background-color: #4CAF50;
  }
  .resize-process {
    background-color: #2196F3;
  }
  .shoes-process {
    background-color: #FF9800; /* Orange pour le traitement shoes */
  }
  .shadow-process {
    background-color: #9C27B0; /* Violet pour le traitement avec ombre */
  }
  
  /* Style pour l'image sélectionnée avec préservation d'ombre */
  .selected-shadow {
    border: 2px solid #9C27B0;
  }
`;

function App() {
  // Mettre à true pour forcer
  //  le squelette, à false pour comportement normal
  const FORCE_SKELETON = false;
  // States pour la gestion des images
  const [images, setImages] = useState([]);
  const [imageInfos, setImageInfos] = useState({});
  const [imagesFromZip, setImagesFromZip] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [largeCount, setLargeCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // States pour la sélection et le traitement
  const [selectedOrder, setSelectedOrder] = useState({});
  const [processImages, setProcessImages] = useState([]);
  const [shoesProcessImages, setShoesProcessImages] = useState([]);
  const [shadowProcessImages, setShadowProcessImages] = useState([]);

  // State pour le nom du dossier
  const [folderName, setFolderName] = useState('');
  
  // State pour le type de produit sélectionné
  const [productType, setProductType] = useState('default');

  // State pour les marges personnalisées
  const [customMargins, setCustomMargins] = useState(null);

  // State pour l'état du bouton "Visible"
  const [isVisibleActive, setIsVisibleActive] = useState(false);

  // Référence pour l'input file
  const fileInputRef = useRef(null);

  // Fonction pour gérer le clic sur une image (sélection standard)
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

  /**
   * Gère l'importation de fichiers (images individuelles ou ZIP)
   */
  const handleFileImport = async (event) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    
    try {
      setIsLoading(true); // Démarrer le loading pendant l'importation
      
      // Si on avait déjà des images importées, on libère leur mémoire
      if (imagesFromZip && images.length > 0) {
        releaseImageBlobUrls(images);
      }
      
      let extractedImages = [];
      
      // Vérifie si c'est un fichier ZIP ou des images individuelles
      if (files.length === 1 && files[0].name.toLowerCase().endsWith('.zip')) {
        console.log('[App] Importation d\'un fichier ZIP');
        extractedImages = await extractImagesFromZip(files[0], 500);
      } else {
        console.log('[App] Importation de', files.length, 'images');
        extractedImages = await processImageFiles(files, 500);
      }
      
      // Met à jour les states
      setImages(extractedImages);
      setImagesFromZip(files.length === 1 && files[0].name.toLowerCase().endsWith('.zip'));
      setTotalCount(extractedImages.length);
      setLargeCount(extractedImages.filter(img => img.width > 500 && img.height > 500).length);
      
      // Reset des sélections
      setSelectedOrder({});
      setProcessImages([]);
      setShoesProcessImages([]);
      
      console.log('[App] Images importées avec succès:', extractedImages.length);
    } catch (error) {
      console.error('[App] Erreur lors de l\'importation:', error);
    } finally {
      setIsLoading(false); // Arrêter le loading dans tous les cas
    }
  };

  /**
   * Fonction pour télécharger et traiter les images via le background
   */
  const handleDownload = () => {
    // Récupère les indices des images sélectionnées dans l'ordre
    const selectedIndices = Object.entries(selectedOrder)
      .sort((a, b) => a[1] - b[1])
      .map(([idx]) => Number(idx));
    
    if (selectedIndices.length === 0) {
      alert('Veuillez sélectionner au moins une image');
      return;
    }
    
    // Déterminer les marges à utiliser : celles du bouton "Visible" si actif, sinon celles du state
    let marginsToUse = customMargins;
    if (isVisibleActive && window.ttoCurrentMargins) {
      marginsToUse = window.ttoCurrentMargins;
      console.log('[App] Utilisation des marges du bouton "Visible":', marginsToUse);
    }
    
    console.log('[App] Début du téléchargement de', selectedIndices.length, 'images avec productType:', productType, 'et marges:', marginsToUse);
    
    // Prépare les données pour le téléchargement
    const entries = selectedIndices.map(idx => ({
      ...images[idx],
      processType: processImages.includes(idx) ? 'pixian' : 
                   shoesProcessImages.includes(idx) ? 'shoes' : 
                   shadowProcessImages.includes(idx) ? 'shoes_with_shadow' : 'resize',
      productType: processImages.includes(idx) ? productType : 'default',
      customMargins: processImages.includes(idx) ? marginsToUse : null,
      order: selectedOrder[idx]
    }));
    
    console.log('[App] Données préparées pour le téléchargement:', entries);
    
    // Utilisation exclusive de la méthode CustomEvent pour éviter le double traitement
    // Cette méthode est plus fiable car elle ne dépend pas de l'API chrome.runtime
    try {
      const event = new CustomEvent('TTO_PROCESS_AND_DOWNLOAD', {
        detail: {
          entries: entries,
          folderName: folderName || 'TTO_Images'
        }
      });
      document.dispatchEvent(event);
      console.log('[App] Événement TTO_PROCESS_AND_DOWNLOAD dispatché');
    } catch (error) {
      console.error('[App] Erreur lors du dispatch de l\'événement:', error);
    }
  };

  /**
   * Fonction pour gérer le clic sur le bouton vert (traitement Pixian standard)
   */
  const handleProcessClick = (idx) => {
    console.log('[App] Traitement Pixian pour image', idx, 'avec type de produit:', productType);
    setProcessImages(prev => {
      const newProcessImages = [...prev];
      if (!newProcessImages.includes(idx)) {
        newProcessImages.push(idx);
      }
      return newProcessImages;
    });
    
    // Retire de shoesProcessImages si présent
    setShoesProcessImages(prev => prev.filter(i => i !== idx));
    
    // Sélectionne automatiquement l'image
    if (!selectedOrder[idx]) {
      handleImageClick(idx);
    }
  };

  /**
   * Fonction pour gérer le clic sur le bouton orange (traitement chaussures)
   */
  const handleShoesProcessClick = (idx) => {
    setShoesProcessImages(prev => {
      const newShoesImages = prev.includes(idx) 
        ? prev.filter(i => i !== idx)
        : [...prev, idx];
      return newShoesImages;
    });
    
    // Retire de processImages si présent
    setProcessImages(prev => prev.filter(i => i !== idx));
    // Retire de shadowProcessImages si présent
    setShadowProcessImages(prev => prev.filter(i => i !== idx));
    
    // Sélectionne automatiquement l'image
    if (!selectedOrder[idx]) {
      handleImageClick(idx);
    }
  };
  
  /**
   * Fonction pour gérer le clic sur le bouton violet (traitement avec préservation d'ombre)
   */
  const handleShadowProcessClick = (idx) => {
    setShadowProcessImages(prev => {
      const newShadowImages = prev.includes(idx) 
        ? prev.filter(i => i !== idx)
        : [...prev, idx];
      return newShadowImages;
    });
    
    // Retire de processImages si présent
    setProcessImages(prev => prev.filter(i => i !== idx));
    // Retire de shoesProcessImages si présent
    setShoesProcessImages(prev => prev.filter(i => i !== idx));
    
    // Sélectionne automatiquement l'image
    if (!selectedOrder[idx]) {
      handleImageClick(idx);
    }
  };

  /**
   * Gère le clic sur le bouton d'importation
   */
  const handleImportClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  /**
   * Fonction pour mettre à jour les données d'images depuis le content script
   */
  const handleImagesUpdate = (event) => {
    if (event.detail && event.detail.images) {
      const { images: newImages, totalCount: newTotal, largeCount: newLarge } = event.detail;
      setImages(newImages);
      setTotalCount(newTotal);
      setLargeCount(newLarge);
      setImagesFromZip(false);
      setIsLoading(false); // Arrêter le loading quand les images arrivent
    }
  };

  /**
   * Charge les images au démarrage de l'application
   */
  const loadInitialImages = async () => {
    try {
      setIsLoading(true); // Démarrer le loading
      const data = await getImages();
      if (data && data.images) {
        setImages(data.images);
        setTotalCount(data.totalCount || data.images.length);
        setLargeCount(data.largeCount || 0);
        setImagesFromZip(false);
      }
    } catch (error) {
      console.error('[App] Erreur lors du chargement initial des images:', error);
    } finally {
      setIsLoading(false); // Arrêter le loading dans tous les cas
    }
  };

  // Effect pour charger les images au démarrage et écouter les mises à jour
  useEffect(() => {
    // Injection des styles
    const styleElement = document.createElement('style');
    styleElement.textContent = styles;
    document.head.appendChild(styleElement);

    // Chargement initial
    loadInitialImages();

    // Écoute des mises à jour d'images via CustomEvent sur document
    document.addEventListener('TTO_IMAGES_DATA', handleImagesUpdate);

    // Nettoyage
    return () => {
      document.removeEventListener('TTO_IMAGES_DATA', handleImagesUpdate);
      document.head.removeChild(styleElement);
    };
  }, []);

  // Effect pour mettre à jour les informations d'images
  useEffect(() => {
    const updateImageInfos = () => {
      images.forEach(image => {
        if (image.url && !imageInfos[image.url]) {
          const img = new Image();
          img.onload = () => {
            setImageInfos(prev => ({
              ...prev,
              [image.url]: {
                width: img.naturalWidth,
                height: img.naturalHeight
              }
            }));
          };
          img.src = image.url;
        }
      });
    };

    if (images.length > 0) {
      updateImageInfos();
    }
  }, [images, imageInfos]);

  return (
    <>
      {/* Injection des styles */}
      <style>{styles}</style>
      
      {/* Input de fichier caché */}
      <FileInput ref={fileInputRef} onFileImport={handleFileImport} />
      
      {/* En-tête avec bouton d'importation */}
      <Header onImportClick={handleImportClick} />
      
      {/* Contenu principal */}
      <div className="main-content">
        {/* Statistiques des images */}
        <ImageStats 
          totalCount={totalCount}
          largeCount={largeCount}
          imagesFromZip={imagesFromZip}
        />
        
        {/* Sélecteur de type de produit */}
        <ProductTypeSelector 
          selectedType={productType}
          onTypeChange={setProductType}
          customMargins={customMargins}
          onMarginsChange={setCustomMargins}
          images={images}
          selectedOrder={selectedOrder}
          processImages={processImages}
          onVisibleStateChange={setIsVisibleActive}
        />
        
        {/* Grille d'images */}
        {FORCE_SKELETON || isLoading ? (
          <SkeletonGrid />
        ) : (
          <ImageGrid
            images={images}
            imageInfos={imageInfos}
            selectedOrder={selectedOrder}
            processImages={processImages}
            shoesProcessImages={shoesProcessImages}
            shadowProcessImages={shadowProcessImages}
            onImageClick={handleImageClick}
            onProcessClick={handleProcessClick}
            onShoesProcessClick={handleShoesProcessClick}
            onShadowProcessClick={handleShadowProcessClick}
          />
        )}
      </div>
      
      {/* Barre de pied intégrée */}
      <FooterBar
        folderName={folderName}
        onFolderNameChange={setFolderName}
        onDownload={handleDownload}
      />
    </>
  );
}

export default App;

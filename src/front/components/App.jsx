import React, { useEffect, useState, useRef } from 'react';
import '../styles/index.css';
import '../styles/ProductTypeSelector.css';

// Import des composants modulaires
import Header from './Header';
import ImageStats from './ImageStats';
import ImageGrid from './ImageGrid';
import ProductTypeSelector from './ProductTypeSelector';
import FooterBar from './FooterBar';
import FileInput from './FileInput';
import SkeletonGrid from './SkeletonGrid';

// Import des services
import { extractImagesFromZip, releaseImageBlobUrls, processImageFiles } from '../services/zipService';
import { getImages } from '../services/apiService';
import { saveState, loadAllStates, STORAGE_KEYS } from '../utils/stateStorage';

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
  const [originalImageFilenames, setOriginalImageFilenames] = useState({});
  const [imageInfos, setImageInfos] = useState({});
  const [imagesFromZip, setImagesFromZip] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [largeCount, setLargeCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  
  // État pour le scraper amélioré
  const [optimizedScrapingEnabled, setOptimizedScrapingEnabled] = useState(true);

  // States pour la sélection et le traitement
  const [selectedOrder, setSelectedOrder] = useState({});
  const [processImages, setProcessImages] = useState([]);
  const [shadowProcessImages, setShadowProcessImages] = useState([]);

  // State pour le nom du dossier
  const [folderName, setFolderName] = useState('');
  
  // State pour le type de produit sélectionné
  const [productType, setProductType] = useState('default');

  // State pour les marges personnalisées
  const [customMargins, setCustomMargins] = useState(null);

  // State pour l'état du bouton "Visible"
  const [isVisibleActive, setIsVisibleActive] = useState(false);

  // State pour le mode shadow verrouillé
  const [shadowModeEnabled, setShadowModeEnabled] = useState(false);

  // Référence pour l'input file
  const fileInputRef = useRef(null);

  // État pour indiquer si les états ont été restaurés
  const [statesRestored, setStatesRestored] = useState(false);

  // Fonction pour gérer le clic sur une image (sélection standard)
  const handleImageClick = (idx) => {
    setSelectedOrder(prev => {
      const newOrder = { ...prev };
      if (newOrder[idx]) {
        const removedOrder = newOrder[idx];
        delete newOrder[idx];
        
        // Si on désélectionne une image, la retirer aussi des traitements
        setProcessImages(prevProcess => prevProcess.filter(i => i !== idx));
        setShadowProcessImages(prevShadow => prevShadow.filter(i => i !== idx));
        
        Object.keys(newOrder).forEach(key => {
          const k = Number(key);
          if (newOrder[k] > removedOrder) {
            newOrder[k] = newOrder[k] - 1;
          }
        });
      } else {
        const nextOrder = Object.keys(prev).length + 1;
        newOrder[idx] = nextOrder;
        
        // Si le mode shadow est verrouillé, ajouter automatiquement en mode shadow
        if (shadowModeEnabled) {
          setShadowProcessImages(prevShadow => {
            if (!prevShadow.includes(idx)) {
              return [...prevShadow, idx];
            }
            return prevShadow;
          });
          // S'assurer qu'elle n'est pas dans processImages
          setProcessImages(prevProcess => prevProcess.filter(i => i !== idx));
        }
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
      
      // Stocker les filenames originaux pour les préserver
      const filenameMap = {};
      extractedImages.forEach((img, index) => {
        if (img.filename) {
          filenameMap[img.url] = img.filename;
        }
      });
      setOriginalImageFilenames(prev => ({ ...prev, ...filenameMap }));
      
      // Met à jour les states
      setImages(extractedImages);
      setImagesFromZip(files.length === 1 && files[0].name.toLowerCase().endsWith('.zip'));
      setTotalCount(extractedImages.length);
      setLargeCount(extractedImages.filter(img => img.width > 500 && img.height > 500).length);
      
      // Reset des sélections
      setSelectedOrder({});
      setProcessImages([]);
      setShadowProcessImages([]);
      
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
    // IMPORTANT: Toujours utiliser l'URL ORIGINALE de l'image, jamais l'URL blob du détourage préliminaire
    const entries = selectedIndices.map(idx => {
      const imageData = images[idx];
      const originalFilename = originalImageFilenames[imageData.url];
      
      return {
        ...imageData, // Contient l'URL originale de l'image
        filename: originalFilename || imageData.filename, // Préserve le filename original
        processType: processImages.includes(idx) ? 'pixian' : 
                     shadowProcessImages.includes(idx) ? 'shadow_transparent' : 'resize',
        productType: processImages.includes(idx) || shadowProcessImages.includes(idx) ? productType : 'default',
        customMargins: processImages.includes(idx) || shadowProcessImages.includes(idx) ? marginsToUse : null,
        order: selectedOrder[idx]
      };
    });
    
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
    // Si le mode shadow est verrouillé, ignorer les clics sur le bouton vert
    if (shadowModeEnabled) {
      console.log('[App] Mode shadow verrouillé - bouton vert désactivé');
      return;
    }
    
    console.log('[App] Traitement Pixian pour image', idx, 'avec type de produit:', productType);
    setProcessImages(prev => {
      const newProcessImages = [...prev];
      if (!newProcessImages.includes(idx)) {
        newProcessImages.push(idx);
      }
      return newProcessImages;
    });
    
    // Retire de shadowProcessImages si présent
    setShadowProcessImages(prev => prev.filter(i => i !== idx));
    
    // Sélectionne automatiquement l'image
    if (!selectedOrder[idx]) {
      handleImageClick(idx);
    }
  };
  


  /**
   * Fonction pour gérer le mode shadow verrouillé
   * Active/désactive le verrouillage du traitement violet
   */
  const handleShadowModeChange = (isEnabled) => {
    setShadowModeEnabled(isEnabled);
    console.log('[App] Mode shadow verrouillé:', isEnabled);
    
    // Sauvegarder automatiquement l'état du toggle
    saveState(STORAGE_KEYS.SHADOW_MODE_ENABLED, isEnabled);
    
    if (!isEnabled) {
      // Si on désactive le mode, retirer toutes les images du traitement shadow
      setShadowProcessImages([]);
      console.log('[App] Mode shadow désactivé - toutes les images retirées du traitement shadow');
    }
  };

  /**
   * Fonction pour gérer le toggle du scraper optimisé
   */
  const handleOptimizedScrapingChange = (isEnabled) => {
    console.log('[App] handleOptimizedScrapingChange appelé avec:', isEnabled);
    setOptimizedScrapingEnabled(isEnabled);
    console.log('[App] Scraper optimisé:', isEnabled ? 'activé' : 'désactivé');
    
    // Sauvegarder l'état automatiquement
    saveState('optimizedScrapingEnabled', isEnabled);
    
    // Déclencher l'événement pour informer le content script
    console.log('[App] Dispatch TTO_ENHANCED_SCRAPING_CHANGED avec enabled:', isEnabled);
    document.dispatchEvent(new CustomEvent('TTO_ENHANCED_SCRAPING_CHANGED', {
      detail: { enabled: isEnabled }
    }));
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
      
      // Préserver les filenames originaux lors des mises à jour depuis le content script
      const filenameMap = {};
      newImages.forEach((img) => {
        if (img.filename) {
          filenameMap[img.url] = img.filename;
        }
      });
      if (Object.keys(filenameMap).length > 0) {
        setOriginalImageFilenames(prev => ({ ...prev, ...filenameMap }));
      }
      
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

  // Restaurer l'état sauvegardé au démarrage
  useEffect(() => {
    const restoreStates = async () => {
      try {
        console.log('[App] Début de la restauration des états...');
        const savedStates = await loadAllStates();
        
        // Restaurer les états en une seule fois avec un setTimeout pour éviter les problèmes de timing
        setTimeout(() => {
          // Restaurer le type de produit sélectionné
          if (savedStates[STORAGE_KEYS.SELECTED_PRESET]) {
            console.log('[App] Restauration du type de produit:', savedStates[STORAGE_KEYS.SELECTED_PRESET]);
            setProductType(savedStates[STORAGE_KEYS.SELECTED_PRESET]);
          }
          
          // Restaurer les marges custom
          if (savedStates[STORAGE_KEYS.CUSTOM_MARGINS]) {
            console.log('[App] Restauration des marges custom:', savedStates[STORAGE_KEYS.CUSTOM_MARGINS]);
            setCustomMargins(savedStates[STORAGE_KEYS.CUSTOM_MARGINS]);
          }
          
          // Restaurer l'état du toggle shadow
          if (typeof savedStates[STORAGE_KEYS.SHADOW_MODE_ENABLED] === 'boolean') {
            console.log('[App] Restauration du toggle shadow:', savedStates[STORAGE_KEYS.SHADOW_MODE_ENABLED]);
            setShadowModeEnabled(savedStates[STORAGE_KEYS.SHADOW_MODE_ENABLED]);
          }
          
          // Restaurer l'état du scraper amélioré
                      if (typeof savedStates.optimizedScrapingEnabled === 'boolean') {
              console.log('[App] Restauration du scraper optimisé:', savedStates.optimizedScrapingEnabled);
              setOptimizedScrapingEnabled(savedStates.optimizedScrapingEnabled);
            }
          
          setStatesRestored(true);
          console.log('[App] États restaurés avec succès:', savedStates);
        }, 100); // Délai pour laisser le temps aux composants de se monter
        
      } catch (error) {
        console.error('[App] Erreur lors de la restauration des états:', error);
        setStatesRestored(true); // Permettre le démarrage même en cas d'erreur
      }
    };
    
    restoreStates();
  }, []);

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
          optimizedScrapingEnabled={optimizedScrapingEnabled}
          onOptimizedScrapingChange={handleOptimizedScrapingChange}
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
          shadowProcessImages={shadowProcessImages}
          shadowModeEnabled={shadowModeEnabled}
          onVisibleStateChange={setIsVisibleActive}
          onShadowModeChange={handleShadowModeChange}
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
            shadowProcessImages={shadowProcessImages}
            shadowModeEnabled={shadowModeEnabled}
            onImageClick={handleImageClick}
            onProcessClick={handleProcessClick}
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

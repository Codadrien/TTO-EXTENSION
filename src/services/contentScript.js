// src/services/contentScript.js

/**
 * Récupère les URLs des balises <img>.
 * @returns {string[]}
 */
function collectImgTagUrls() {
  const urls = Array.from(document.images)
    .map(img => img.currentSrc || img.src)
    .filter(Boolean);
  return urls;
}

/**
 * Récupère les URLs des background-image CSS.
 * @returns {string[]}
 */
function collectCssBackgroundUrls() {
  const urls = Array.from(document.querySelectorAll('*'))
    .flatMap(el => {
      const bg = getComputedStyle(el).backgroundImage;
      if (!bg || bg === 'none') return [];
      return Array.from(bg.matchAll(/url\(["']?(.*?)["']?\)/g)).map(m => m[1]);
    })
    .filter(Boolean);
  const unique = Array.from(new Set(urls));
  return unique;
}

/**
 * Récupère les URLs depuis l'attribut personnalisé backgroundimage.
 * @returns {string[]}
 */
function collectAttrUrls() {
  const urls = Array.from(document.querySelectorAll('[backgroundimage]'))
    .map(el => el.getAttribute('backgroundimage'))
    .filter(Boolean);
  const unique = Array.from(new Set(urls));
  return unique;
}

/**
 * Récupère toutes les URLs des images (balises, background CSS, attribut).
 * @returns {string[]}
 */
function collectAllUrls() {
  const imgUrls = collectImgTagUrls();
  const cssUrls = collectCssBackgroundUrls();
  const attrUrls = collectAttrUrls();
  const allUrls = Array.from(new Set([...imgUrls, ...cssUrls, ...attrUrls]));
  console.log(`[contentScript] liste url d'image de la page:`, allUrls);
  return allUrls;
}


/**
 * Fonction utilitaire pour détecter le format via signature binaire.
 * @param {string} url
 * @returns {Promise<string>}
 */
function getRealFormat(url) {
  return fetch(url, {
    method: 'GET',
    headers: {
      'Range': 'bytes=0-11',
      'Accept': 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8'
    }
  })
    .then(resp => resp.arrayBuffer())
    .then(buffer => {
      const bytes = new Uint8Array(buffer);
      if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47) {
        return 'png';
      } else if (bytes[0] === 0xFF && bytes[1] === 0xD8) {
        return 'jpeg';
      } else if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46) {
        return 'gif';
      } else if (
        bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
        bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50
      ) {
        return 'webp';
      } else if (
        bytes[4] === 0x66 && bytes[5] === 0x74 && bytes[6] === 0x79 && bytes[7] === 0x70 &&
        bytes[8] === 0x61 && bytes[9] === 0x76 && bytes[10] === 0x69 && bytes[11] === 0x66
      ) {
        return 'avif';
      } else {
        return 'unknown';
      }
    })
    .catch(err => {
      console.error('Erreur lecture signature :', err);
      return 'unknown';
    });
}

/**
 * Récupère le poids d'une image via HEAD pour lire Content-Length
 * @param {string} url
 * @returns {Promise<number|null>}
 */
function getImageWeight(url) {
  return fetch(url, { 
    method: 'HEAD', 
    headers: { 
      'Accept': 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8' 
    } 
  })
    .then(resp => {
      const len = resp.headers.get('content-length');
      return len ? parseInt(len, 10) : null;
    })
    .catch(err => {
      console.error('Erreur HEAD pour le poids :', err);
      return null;
    });
}

/**
 * Filtre les URLs selon la hauteur et enrichit avec format et poids.
 * @param {string[]} urls
 * @param {number} threshold
 * @returns {Promise<{url:string,format:string,weight:number|null}[]>}
 */
async function filterAndEnrichImages(urls, threshold = 500) {
  const measures = await Promise.all(urls.map(url =>
    new Promise(resolve => {
      const img = new Image(); img.src = url;
      img.onload = () => resolve({ url, height: img.naturalHeight });
      img.onerror = () => resolve(null);
    })
  ));
  const filtered = measures
    .filter(item => item && item.height > threshold)
    .sort((a, b) => b.height - a.height)
    .map(item => item.url);
  const enriched = await Promise.all(filtered.map(async url => {
    const format = await getRealFormat(url);
    const weightBytes = await getImageWeight(url);
    const weight = weightBytes != null ? Math.round((weightBytes/1024)*100)/100 : null;
    return { url, format, weight };
  }));
  console.log(`[contentScript] Liste d'url de plus de 500px avec metadonnée:`, enriched);
  return enriched;
}

/**
 * Listener pour messages Chrome, répond de manière asynchrone.
 */
function registerChromeMessageListener() {
  // Toujours garder le listener Chrome pour la compatibilité
  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.type === 'SCRAPE_IMAGES') {
      const allUrls = collectAllUrls();
      const totalCount = allUrls.length;
      filterAndEnrichImages(allUrls, msg.threshold || 500)
        .then(imagesWithFormat => {
          const largeCount = imagesWithFormat.length;
          const responsePayload = { images: imagesWithFormat, totalCount, largeCount };
          console.log(`[contentScript] Données envoyées à React:`, responsePayload);
          sendResponse(responsePayload);
        });
      return true;
    }
  });
  
  // Ajouter des écouteurs pour les événements personnalisés
  document.addEventListener('TTO_PANEL_OPENED', () => {
    console.log('[contentScript] Panneau ouvert, traitement des images...');
    // Traitement direct des images
    const allUrls = collectAllUrls();
    const totalCount = allUrls.length;
    filterAndEnrichImages(allUrls, 500)
      .then(imagesWithFormat => {
        const largeCount = imagesWithFormat.length;
        const responsePayload = { images: imagesWithFormat, totalCount, largeCount };
        console.log(`[contentScript] Données prêtes via événement:`, responsePayload);
        
        // Créer un événement personnalisé avec les données
        const event = new CustomEvent('TTO_IMAGES_DATA', { 
          detail: responsePayload 
        });
        
        // Envoyer les données à l'application React
        document.dispatchEvent(event);
      });
  });
  
  // Écouteur pour les événements de téléchargement
  listenForDownloadEvents();
  
  // Écouter les messages du background script pour le traitement ZIP
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    // Traiter les images extraites du ZIP envoyées par le background script
    if (message.type === 'zipImagesExtracted') {
      console.log('[contentScript] Images extraites du ZIP reçues:', message.images.length);
      
      try {
        // Créer les objets URL pour les images
        const imgs = message.images.map(img => ({
          url: URL.createObjectURL(new Blob([new Uint8Array(img.data)], { type: img.type })),
          format: img.format,
          weight: img.size
        }));
        
        // Envoyer les données à l'application React
        const responsePayload = { 
          images: imgs, 
          totalCount: imgs.length, 
          largeCount: imgs.length,
          source: 'zip',
          zipFilename: message.originalFilename
        };
        
        console.log('[contentScript] Préparation des données pour l\'interface:', responsePayload);
        
        // Si le panneau est ouvert, envoyer directement les données
        if (document.getElementById('tto-extension-container')) {
          console.log('[contentScript] Panneau déjà ouvert, envoi direct des données');
          document.dispatchEvent(new CustomEvent('TTO_IMAGES_DATA', { 
            detail: responsePayload 
          }));
        } else {
          // Sinon, ouvrir le panneau puis envoyer les données
          console.log('[contentScript] Ouverture du panneau avant envoi des données');
          chrome.runtime.sendMessage({ type: 'openPanel' }, () => {
            setTimeout(() => {
              document.dispatchEvent(new CustomEvent('TTO_IMAGES_DATA', { 
                detail: responsePayload 
              }));
              console.log('[contentScript] Données envoyées à l\'interface après ouverture du panneau');
            }, 500);
          });
        }
        
        // Répondre au background script pour confirmer la réception
        sendResponse({ success: true, message: 'Images ZIP reçues et traitées' });
      } catch (err) {
        console.error('[contentScript] Erreur lors du traitement des images ZIP:', err);
        sendResponse({ success: false, error: err.message });
      }
      
      return true;
    }
    
    // Pour compatibilité avec l'ancien système (au cas où)
    if (message.type === 'processZipData') {
      console.log('[contentScript] Demande de traitement ZIP reçue (ancien format), redirection vers le background');
      sendResponse({ success: true, message: 'Redirection vers le background script' });
      return true;
    }
  });
}

// Fonction pour écouter les événements de téléchargement d'images
function listenForDownloadEvents() {
  document.addEventListener('TTO_DOWNLOAD_IMAGES', (event) => {
    try {
      console.log('[contentScript] Événement de téléchargement reçu:', event.detail);
      
      // Vérifier si l'URL est valide
      if (!event.detail.url) {
        console.error('[contentScript] URL manquante dans l\'event de téléchargement');
        alert('URL manquante pour le téléchargement');
        return;
      }
      
      // Extraire le barcode du chemin de fichier
      // Format attendu: date/barcode/filename
      const pathParts = event.detail.filename.split('/');
      const barcode = pathParts.length >= 2 ? pathParts[1] : null;
      
      console.log('[contentScript] Barcode extrait:', barcode);
      
      if (!barcode) {
        console.error('[contentScript] Barcode manquant dans le chemin de fichier');
        alert('Barcode manquant. Veuillez saisir un barcode dans le champ prévu à cet effet.');
        return;
      }
      
      // Vérifier si l'URL est une URL d'objet (blob:)
      if (event.detail.url.startsWith('blob:')) {
        console.log('[contentScript] Détection d\'une URL blob, conversion en données binaires...');
        
        // Récupérer les données binaires de l'URL blob
        fetch(event.detail.url)
          .then(response => response.blob())
          .then(blob => {
            // Extraire le nom de fichier original
            const filename = event.detail.filename.split('/').pop() || 'image.jpg';
            
            // Créer un nouvel objet File avec le bon type MIME
            const file = new File([blob], filename, { type: blob.type || 'image/jpeg' });
            
            // Créer une URL pour le fichier
            const fileUrl = URL.createObjectURL(file);
            
            // Envoyer la demande de téléchargement au background script
            chrome.runtime.sendMessage({
              type: 'download',
              url: fileUrl,
              filename: event.detail.filename,
              barcode: barcode
            }, (response) => {
              if (chrome.runtime.lastError) {
                console.error('[contentScript] Erreur lors de l\'envoi du message:', chrome.runtime.lastError);
              } else {
                console.log('[contentScript] Réponse du background script:', response);
                // Libérer l'URL de l'objet après un court délai
                setTimeout(() => URL.revokeObjectURL(fileUrl), 5000);
              }
            });
          })
          .catch(error => {
            console.error('[contentScript] Erreur lors de la conversion de l\'URL blob:', error);
            alert('Erreur lors de la préparation de l\'image pour le téléchargement');
          });
      } else {
        // URL normale, envoyer directement au background script
        console.log('[contentScript] Envoi du message de téléchargement au background script');
        console.log('[contentScript] URL:', event.detail.url);
        console.log('[contentScript] Chemin de destination:', event.detail.filename);
        
        chrome.runtime.sendMessage({
          type: 'download',
          url: event.detail.url,
          filename: event.detail.filename,
          barcode: barcode
        }, (response) => {
          if (chrome.runtime.lastError) {
            console.error('[contentScript] Erreur lors de l\'envoi du message:', chrome.runtime.lastError);
          } else {
            console.log('[contentScript] Réponse du background script:', response);
          }
        });
      }
    } catch (error) {
      console.error('[contentScript] Exception lors de l\'envoi du message:', error);
    }
  });
}

/**
 * Analyse les images de la page et envoie les résultats à l'UI React
 */
function updateImagesData() {
  // Vérifier si le panneau est visible
  if (!document.getElementById('tto-extension-container')) return;
  
  console.log('[contentScript] Mise à jour des données d\'images...');
  const allUrls = collectAllUrls();
  const totalCount = allUrls.length;
  
  filterAndEnrichImages(allUrls, 500).then(imagesWithFormat => {
    const largeCount = imagesWithFormat.length;
    const responsePayload = { images: imagesWithFormat, totalCount, largeCount };
    
    // Envoyer les données à l'application React via un événement personnalisé
    document.dispatchEvent(new CustomEvent('TTO_IMAGES_DATA', { 
      detail: responsePayload 
    }));
  });
}

// Ajouter un écouteur pour les clics sur la page
let debounceTimer = null;
document.addEventListener('click', () => {
  // Utiliser un debounce pour éviter trop d'appels rapprochés
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    updateImagesData();
  }, 300); // Attendre 300ms après le dernier clic
}, { passive: true });

/**
 * Fonction pour traiter les données ZIP
 * @param {ArrayBuffer} zipData 
 * @param {string} originalFilename
 */
function processZipData(zipData, originalFilename) {
  console.log('[contentScript] Traitement du ZIP...');
  
  // Cette fonction est dépréciée, le traitement ZIP est maintenant fait dans le background script
  console.log('[contentScript] Cette fonction est dépréciée, le traitement ZIP est maintenant fait dans le background script');
  // Si JSZip est déjà disponible
  const JSZipLib = typeof JSZip !== 'undefined' ? JSZip : window.JSZip;
  processWithJSZip(JSZipLib);
  
  // Fonction interne pour traiter avec JSZip
  function processWithJSZip(zipLib) {
    zipLib.loadAsync(zipData)
      .then(zip => {
        console.log('[contentScript] ZIP chargé, extraction des images...');
        const imgs = [];
        const promises = [];
        
        // Extraire toutes les images du ZIP
        Object.values(zip.files).forEach(zipEntry => {
          if (!zipEntry.dir && /\.(jpe?g|png|gif)$/i.test(zipEntry.name)) {
            const promise = zipEntry.async('blob').then(blob => {
              const url = URL.createObjectURL(blob);
              imgs.push({ url, format: zipEntry.name.split('.').pop().toLowerCase(), weight: Math.round(blob.size / 1024) });
            });
            promises.push(promise);
          }
        });
        
        // Quand toutes les images sont extraites
        return Promise.all(promises).then(() => {
          if (imgs.length > 0) {
            console.log(`[contentScript] ${imgs.length} images extraites du ZIP`);
            
            // Envoyer les données à l'application React
            const responsePayload = { 
              images: imgs, 
              totalCount: imgs.length, 
              largeCount: imgs.length,
              source: 'zip',
              zipFilename: originalFilename
            };
            
            // Si le panneau est ouvert, envoyer directement les données
            if (document.getElementById('tto-extension-container')) {
              document.dispatchEvent(new CustomEvent('TTO_IMAGES_DATA', { 
                detail: responsePayload 
              }));
            } else {
              // Sinon, ouvrir le panneau puis envoyer les données
              if (window.chrome && window.chrome.runtime) {
                window.chrome.runtime.sendMessage({ type: 'openPanel' }, () => {
                  setTimeout(() => {
                    document.dispatchEvent(new CustomEvent('TTO_IMAGES_DATA', { 
                      detail: responsePayload 
                    }));
                  }, 500); // Délai pour laisser le temps au panneau de s'ouvrir
                });
              } else {
                console.error('[contentScript] chrome.runtime n\'est pas disponible');
              }
            }
          } else {
            console.log('[contentScript] Aucune image trouvée dans le ZIP');
          }
        });
      })
      .catch(err => {
        console.error('[contentScript] Erreur lors du traitement du ZIP:', err);
      });
  }
}

// Écouter les messages du background script pour le traitement ZIP
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Traiter les images extraites du ZIP envoyées par le background script
  if (message.type === 'zipImagesExtracted') {
    console.log('[contentScript] Images extraites du ZIP reçues:', message.images.length);
    
    try {
      // Créer les objets URL pour les images
      const imgs = message.images.map(img => ({
        url: URL.createObjectURL(new Blob([new Uint8Array(img.data)], { type: img.type })),
        format: img.format,
        weight: img.size
      }));
      
      // Envoyer les données à l'application React
      const responsePayload = { 
        images: imgs, 
        totalCount: imgs.length, 
        largeCount: imgs.length,
        source: 'zip',
        zipFilename: message.originalFilename
      };
      
      console.log('[contentScript] Préparation des données pour l\'interface:', responsePayload);
      
      // Si le panneau est ouvert, envoyer directement les données
      if (document.getElementById('tto-extension-container')) {
        console.log('[contentScript] Panneau déjà ouvert, envoi direct des données');
        document.dispatchEvent(new CustomEvent('TTO_IMAGES_DATA', { 
          detail: responsePayload 
        }));
      } else {
        // Sinon, ouvrir le panneau puis envoyer les données
        console.log('[contentScript] Ouverture du panneau avant envoi des données');
        chrome.runtime.sendMessage({ type: 'openPanel' }, () => {
          setTimeout(() => {
            document.dispatchEvent(new CustomEvent('TTO_IMAGES_DATA', { 
              detail: responsePayload 
            }));
            console.log('[contentScript] Données envoyées à l\'interface après ouverture du panneau');
          }, 500);
        });
      }
      
      // Répondre au background script pour confirmer la réception
      sendResponse({ success: true, message: 'Images ZIP reçues et traitées' });
    } catch (err) {
      console.error('[contentScript] Erreur lors du traitement des images ZIP:', err);
      sendResponse({ success: false, error: err.message });
    }
    
    return true;
  }
  
  // Pour compatibilité avec l'ancien système (au cas où)
  if (message.type === 'processZipData') {
    console.log('[contentScript] Demande de traitement ZIP reçue (ancien format), redirection vers le background');
    sendResponse({ success: true, message: 'Redirection vers le background script' });
    return true;
  }
});

// Initialisation du listener
registerChromeMessageListener();
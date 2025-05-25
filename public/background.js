// Fonction injectée dans la page pour toggler le panneau
function toggleTTO() {
  const containerId = 'tto-extension-container';
  const ANIMATION_DELAY = 50; // délai avant slide-in (ms)
  console.log('[tto] toggle panel, containerId:', containerId);

  // Ouvre le panneau
  function openPanel() {
    console.log('[tto] openPanel');

    const oldScript = document.querySelector('script[src*="main.js"]');
    if (oldScript) {
      oldScript.remove();
    }

    const oldStyle = document.querySelector('link[href*="index-"]');
    if (oldStyle) {
      oldStyle.remove();
    }

    const styleLink = document.createElement('link');
    styleLink.rel = 'stylesheet';
    // Charger le CSS sans hash généré index.css
    styleLink.href = chrome.runtime.getURL('assets/index.css');
    document.head.appendChild(styleLink);
    
    // Charger JSZip pour le traitement des fichiers ZIP
    const jsZipScript = document.createElement('script');
    jsZipScript.src = 'https://cdn.jsdelivr.net/npm/jszip@3.10.0/dist/jszip.min.js';
    document.head.appendChild(jsZipScript);

    const container = document.createElement('div');
    container.id = containerId;
    Object.assign(container.style, {
      position: 'fixed',
      top: '130px',
      right: '0',
      width: '515px',
      height: '70%',
      zIndex: '999999',
      backgroundColor: '#fff',
      borderRadius: '0px 0px 0px 15px',
      boxShadow: '-5px 5px 10px rgba(0, 0, 0, 0.15)',
      overflow: 'auto',
      transform: 'translateX(100%)',
      transition: 'transform 0.6s cubic-bezier(.5,1.6,.4,1)'
    });

    const appRoot = document.createElement('div');
    appRoot.id = 'tto-extension-root';
    container.appendChild(appRoot);

    // Placeholder de chargement
    const loader = document.createElement('div');
    loader.id = 'tto-loading';
    loader.textContent = 'Chargement...';
    appRoot.appendChild(loader);

    document.body.appendChild(container);

    // Lancer le slide-in après un délai, pendant que React charge
    setTimeout(() => {
      requestAnimationFrame(() => {
        container.style.transform = 'translateX(0%)';
      });
    }, ANIMATION_DELAY);

    const script = document.createElement('script');
    script.src = chrome.runtime.getURL('main.js') + '?t=' + Date.now();
    script.type = 'module';
    script.onload = () => {
      const l = document.getElementById('tto-loading');
      if (l) {
        l.remove();
      }
      if (window.initTTO) {
        window.initTTO();
      }
      setTimeout(() => {
        document.dispatchEvent(new CustomEvent('TTO_PANEL_OPENED'));
      }, 100);
    };
    document.head.appendChild(script);
  }

  // Ferme le panneau
  function closePanel(container) {
    console.log('[tto] closePanel');
    if (window.__ttoRoot) { try { window.__ttoRoot.unmount(); } catch {} }
    container.style.transition = 'transform 0.20s ease-in';
    container.style.transform = 'translateX(100%)';
    container.addEventListener('transitionend', () => {
      container.remove();
      document.dispatchEvent(new CustomEvent('TTO_PANEL_CLOSED'));
    }, { once: true });
  }

  // Toggle selon existence
  function togglePanel() {
    const existing = document.getElementById(containerId);
    if (existing) closePanel(existing);
    else openPanel();
  }

  // Exécution du toggle
  togglePanel();
}

// Listener principal appelant toggleTTO dans l'onglet actif
chrome.action.onClicked.addListener((tab) => {
  console.log('[background] icon clicked, tab:', tab.id);
  chrome.scripting.executeScript({ target: { tabId: tab.id }, func: toggleTTO });
});

// Listener pour ouvrir le panneau depuis le content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'openPanel') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.scripting.executeScript({ target: { tabId: tabs[0].id }, func: toggleTTO });
        sendResponse({ success: true });
      }
    });
    return true;
  }
});

// État global pour le mode d'interception ZIP
let zipInterceptMode = false;

// Activer le mode d'interception par défaut en mode développement
console.log('[background] Initialisation du mode d\'interception ZIP...');
zipInterceptMode = true;
console.log('[background] Mode interception ZIP activé par défaut');

// Importer JSZip depuis le fichier local
importScripts('jszip.min.js');

// Listener pour les messages de téléchargement
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'download') {
    console.log('[background] Demande de téléchargement reçue:', message);
    
    // Extraire les données du message
    const { url, filename, barcode } = message;
    
    // Vérifier si l'URL et le nom de fichier sont définis
    if (!url || !filename) {
      console.error('[background] URL ou nom de fichier manquant pour le téléchargement');
      sendResponse({ success: false, error: 'URL ou nom de fichier manquant' });
      return true;
    }
    
    // Vérifier si le barcode est défini
    if (!barcode) {
      console.error('[background] Barcode manquant pour le téléchargement');
      sendResponse({ success: false, error: 'Barcode manquant' });
      return true;
    }
    
    console.log(`[background] Téléchargement de ${url} vers ${filename} (barcode: ${barcode})`);
    
    // Télécharger l'image
    chrome.downloads.download({
      url: url,
      filename: filename,
      saveAs: false
    }, (downloadId) => {
      if (chrome.runtime.lastError) {
        console.error('[background] Erreur de téléchargement:', chrome.runtime.lastError);
        sendResponse({ success: false, error: chrome.runtime.lastError.message });
      } else {
        console.log('[background] Téléchargement réussi, ID:', downloadId);
        sendResponse({ success: true, downloadId });
      }
    });
    
    return true; // Indique que sendResponse sera appelé de manière asynchrone
  } else if (message.type === 'toggleZipInterceptMode') {
    zipInterceptMode = message.enabled;
    console.log(`[background] Mode interception ZIP ${zipInterceptMode ? 'activé' : 'désactivé'}`);
    sendResponse({ success: true, zipInterceptMode });
    return true;
  } else if (message.type === 'processZipInBackground') {
    console.log('[background] Traitement ZIP dans le background script...');
    
    try {
      // Convertir le tableau en ArrayBuffer
      const zipData = new Uint8Array(message.zipData).buffer;
      
      // Traiter le ZIP avec JSZip
      processZipInBackground(zipData, message.originalFilename)
        .then(result => {
          console.log('[background] Traitement ZIP terminé, images extraites:', result.images.length);
          sendResponse(result);
        })
        .catch(error => {
          console.error('[background] Erreur lors du traitement ZIP:', error);
          sendResponse({ success: false, error: error.message || 'Erreur lors du traitement du ZIP' });
        });
    } catch (error) {
      console.error('[background] Erreur lors de la conversion des données ZIP:', error);
      sendResponse({ success: false, error: error.message || 'Erreur lors de la conversion des données ZIP' });
    }
    
    return true; // Indique que sendResponse sera appelé de manière asynchrone
  } else if (message.type === 'openPanel') {
    // Ouvrir le panneau de l'extension
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        injectExtension(tabs[0].id);
        sendResponse({ success: true });
      } else {
        sendResponse({ success: false, error: 'Aucun onglet actif' });
      }
    });
    
    return true;
  }
});  

// Listener pour les messages de statut ZIP
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'getZipInterceptStatus') {
    sendResponse({ enabled: zipInterceptMode });
    return true;
  }
});

// Définir un handler pour intercepter les téléchargements de ZIP
function handleDownloadCreated(downloadItem) {
  console.log('[background] Téléchargement détecté:', downloadItem);
  
  if (!zipInterceptMode) {
    console.log('[background] Mode interception ZIP désactivé, ignorant le téléchargement');
    return;
  }
  
  // Vérifier si c'est un fichier ZIP
  if (downloadItem.url && downloadItem.url.match(/\.zip($|\?)/i)) {
    console.log('[background] ZIP détecté:', downloadItem.url);
    
    try {
      // Annuler le téléchargement initial
      chrome.downloads.cancel(downloadItem.id, () => {
        console.log('[background] Téléchargement ZIP annulé:', downloadItem.id);
        
        // Télécharger le ZIP en mémoire
        fetch(downloadItem.url)
          .then(response => {
            if (!response.ok) {
              throw new Error(`Erreur HTTP: ${response.status}`);
            }
            return response.arrayBuffer();
          })
          .then(zipBuffer => {
            console.log('[background] ZIP récupéré en mémoire, taille:', zipBuffer.byteLength);
            
            // Traiter directement le ZIP dans le background script
            processZipInBackground(zipBuffer, downloadItem.filename)
              .then(result => {
                if (result.success) {
                  console.log('[background] Traitement ZIP réussi, images extraites:', result.images.length);
                  
                  // Notifier le content script avec les images extraites
                  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                    if (tabs[0]) {
                      console.log('[background] Envoi des images extraites au content script:', tabs[0].id);
                      chrome.tabs.sendMessage(tabs[0].id, {
                        type: 'zipImagesExtracted',
                        images: result.images,
                        originalFilename: downloadItem.filename
                      }, response => {
                        if (chrome.runtime.lastError) {
                          console.error('[background] Erreur lors de l\'envoi des images au content script:', chrome.runtime.lastError);
                        } else {
                          console.log('[background] Content script a reçu les images:', response);
                        }
                      });
                    } else {
                      console.error('[background] Aucun onglet actif trouvé pour envoyer les images');
                    }
                  });
                } else {
                  console.error('[background] Échec du traitement ZIP:', result.error);
                }
              })
              .catch(error => {
                console.error('[background] Erreur lors du traitement ZIP:', error);
              });
          })
          .catch(error => {
            console.error('[background] Erreur lors de la récupération du ZIP:', error);
          });
      });
    } catch (error) {
      console.error('[background] Erreur interception ZIP:', error);
    }
  }
}

// Enregistrer le listener pour les téléchargements
chrome.downloads.onCreated.addListener(handleDownloadCreated);

// Ajouter un listener pour les erreurs de téléchargement
chrome.downloads.onChanged.addListener((downloadDelta) => {
  if (downloadDelta.error) {
    console.log('[background] Erreur de téléchargement:', downloadDelta);
  }
});

// Fonction pour traiter les fichiers ZIP dans le background
async function processZipInBackground(zipData, originalFilename) {
  console.log('[background] Traitement du ZIP dans le background...');
  
  try {
    // Utiliser JSZip pour extraire le contenu du ZIP
    const zip = new JSZip();
    const zipContent = await zip.loadAsync(zipData);
    
    // Rechercher les images dans le ZIP
    const imageFiles = [];
    const imageRegex = /\.(jpe?g|png|gif|webp|bmp|svg)$/i;
    
    // Parcourir tous les fichiers du ZIP
    const promises = [];
    
    Object.keys(zipContent.files).forEach(filename => {
      const file = zipContent.files[filename];
      
      // Ignorer les dossiers
      if (file.dir) return;
      
      // Vérifier si c'est une image
      if (imageRegex.test(filename)) {
        console.log('[background] Image trouvée dans le ZIP:', filename);
        
        // Extraire le contenu du fichier
        const promise = file.async('arraybuffer')
          .then(data => {
            // Déterminer le format de l'image
            const extension = filename.split('.').pop().toLowerCase();
            let format = extension;
            let mimeType = 'image/jpeg';
            
            switch (extension) {
              case 'jpg':
              case 'jpeg':
                format = 'jpg';
                mimeType = 'image/jpeg';
                break;
              case 'png':
                mimeType = 'image/png';
                break;
              case 'gif':
                mimeType = 'image/gif';
                break;
              case 'webp':
                mimeType = 'image/webp';
                break;
              case 'svg':
                mimeType = 'image/svg+xml';
                break;
              case 'bmp':
                mimeType = 'image/bmp';
                break;
            }
            
            // Ajouter l'image à la liste
            imageFiles.push({
              name: filename,
              data: Array.from(new Uint8Array(data)),
              size: data.byteLength,
              format,
              type: mimeType
            });
          });
        
        promises.push(promise);
      }
    });
    
    // Attendre que toutes les images soient extraites
    await Promise.all(promises);
    
    console.log('[background] Extraction terminée, images trouvées:', imageFiles.length);
    
    return {
      success: true,
      images: imageFiles,
      totalCount: imageFiles.length,
      originalFilename
    };
  } catch (error) {
    console.error('[background] Erreur lors du traitement du ZIP:', error);
    return {
      success: false,
      error: error.message || 'Erreur lors du traitement du ZIP'
    };
  }
}
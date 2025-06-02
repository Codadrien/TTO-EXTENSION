// Variables d’API Pixian (injectées par Vite à la compilation)
const PIXIAN_API_ID = import.meta.env.VITE_PIXIAN_API_ID;
const PIXIAN_API_SECRET = import.meta.env.VITE_PIXIAN_API_SECRET;

// Fonction pour traiter une image avec Pixian (suppression de fond)
async function processWithPixian(url, originalName) {
  console.log('[background] Traitement Pixian pour:', url);
  
  // 1. Récupère l'image originale
  const resp0 = await fetch(url);
  let blob0 = await resp0.blob();
  // Si format non supporté (AVIF), convertir en JPEG
  if (blob0.type === 'image/avif' || /\.avif$/i.test(originalName)) {
    blob0 = await convertAvifToJpeg(blob0);
    originalName = originalName.replace(/\.avif$/i, '.jpg');
  }
  
  // 2. Envoie à Pixian
  const form = new FormData();
  form.append('image', blob0, originalName);
  form.append('test', 'false'); // mode test, watermark gratuit
  form.append('result.crop_to_foreground', 'true'); // crop bord à bord
  form.append('result.margin', '5%'); // ajoute une marge de 5%
  form.append('background.color', '#ffffff'); // fond blanc
  form.append('result.target_size', '2000 2000'); // taille maximale en px
  form.append('output.jpeg_quality', '70'); // qualité 70%
  
  const headers = {
    'Authorization': 'Basic ' + btoa(`${PIXIAN_API_ID}:${PIXIAN_API_SECRET}`)
  };
  
  const resp1 = await fetch('https://api.pixian.ai/api/v2/remove-background', {
    method: 'POST', headers, body: form
  });
  
  if (!resp1.ok) throw new Error('Pixian ' + resp1.status);
  
  const blob1 = await resp1.blob();
  
  // 3. Convertit le Blob en DataURL pour chrome.downloads avec format forcé en JPG
  return await new Promise(resolve => {
    const reader = new FileReader();
    reader.onload = () => {
      // Force le format en JPG en remplaçant le type MIME dans le DataURL
      const dataUrl = reader.result;
      // S'assure que c'est bien un JPG dans le header du DataURL
      const jpgDataUrl = dataUrl.replace(/^data:image\/[^;]+;base64,/, 'data:image/jpeg;base64,');
      resolve(jpgDataUrl);
    };
    reader.readAsDataURL(blob1);
  });
}

// Conversion AVIF → JPEG via canvas (pour compatibilité Pixian)
async function convertAvifToJpeg(blob) {
  const imgBitmap = await createImageBitmap(blob);
  const canvas = new OffscreenCanvas(imgBitmap.width, imgBitmap.height);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(imgBitmap, 0, 0);
  return await canvas.convertToBlob({ type: 'image/jpeg', quality: 0.70 });
}

// Fonction pour traiter une image sans Pixian (place l'image dans un carré blanc)
async function processWithResize(url, originalName) {
  console.log('[background] Traitement simple pour:', url);
  
  // 1. Récupère l'image originale
  const resp = await fetch(url);
  const blob = await resp.blob();
  
  // 2. Crée l'image bitmap
  const img = await createImageBitmap(blob);
  
  // Dimensions maximales permises
  const MAX_SIZE = 2000;
  
  // Dimensions originales
  const origWidth = img.width;
  const origHeight = img.height;
  
  console.log(`[background] Dimensions originales: ${origWidth}x${origHeight}`);
  
  // Détermine le plus grand côté pour créer un carré
  let squareSize = Math.max(origWidth, origHeight);
  let needsResize = false;
  
  // Redimensionne si nécessaire pour respecter la taille maximale
  if (squareSize > MAX_SIZE) {
    const ratio = MAX_SIZE / squareSize;
    squareSize = MAX_SIZE;
    needsResize = true;
    console.log(`[background] Redimensionnement du carré à: ${squareSize}x${squareSize}`);
  } else {
    console.log(`[background] Utilisation d'un carré de: ${squareSize}x${squareSize}`);
  }
  
  // Calcule les dimensions proportionnelles de l'image dans le carré
  let width, height;
  if (needsResize) {
    width = Math.round(origWidth * (MAX_SIZE / squareSize));
    height = Math.round(origHeight * (MAX_SIZE / squareSize));
  } else {
    width = origWidth;
    height = origHeight;
  }
  
  // Création du canvas carré avec fond blanc
  const canvas = new OffscreenCanvas(squareSize, squareSize);
  const ctx = canvas.getContext('2d');
  
  // Remplissage du fond en blanc
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, squareSize, squareSize);
  
  // Calcul de la position pour centrer l'image dans le carré
  const x = (squareSize - width) / 2;
  const y = (squareSize - height) / 2;
  
  // Dessin de l'image centrée sur le fond blanc
  ctx.drawImage(img, x, y, width, height);
  
  console.log(`[background] Image placée dans un carré blanc de ${squareSize}x${squareSize}`);
  
  // Conversion en blob avec qualité 70% et format forcé en JPG
  const resizedBlob = await canvas.convertToBlob({
    type: 'image/jpeg',
    quality: 0.70 // Bonne qualité avec compression raisonnable
  });
  
  // 3. Convertit le Blob en DataURL avec format forcé en JPG
  return await new Promise(resolve => {
    const reader = new FileReader();
    reader.onload = () => {
      // Force le format en JPG en remplaçant le type MIME dans le DataURL
      const dataUrl = reader.result;
      // S'assure que c'est bien un JPG dans le header du DataURL
      const jpgDataUrl = dataUrl.replace(/^data:image\/[^;]+;base64,/, 'data:image/jpeg;base64,');
      resolve(jpgDataUrl);
    };
    reader.readAsDataURL(resizedBlob);
  });
}

// Fonction injectée dans la page pour toggler le panneau
function toggleTTO() {
  const containerId = 'tto-extension-container';
  const ANIMATION_DELAY = 50; // délai avant slide-in (ms)

  // Ouvre le panneau
  function openPanel() {

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

    const container = document.createElement('div');
    container.id = containerId;
    Object.assign(container.style, {
      position: 'fixed',
      top: '0',
      right: '0',
      width: '515px',
      maxHeight: '70%',
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

// Listener pour les messages de téléchargement
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'process_and_download') {
    console.log('[background] Téléchargement / traitement demandé');
    const { entries, folderName } = message;
    (async () => {
      for (const entry of entries) {
        const { url, order, needsProcessing } = entry;
        // Crée le chemin complet: date + folder + order
        const date = new Date();
        const dd = String(date.getDate()).padStart(2,'0');
        const mm = String(date.getMonth()+1).padStart(2,'0');
        const yyyy = date.getFullYear();
        const prefix = order>0? String(order).padStart(2,'0')+'-':'';
        
        // Récupération du nom original et conversion en .jpg
        let originalName = url.split('/').pop().split('?')[0] || 'image';
        
        // Force l'extension en .jpg
        originalName = originalName.replace(/\.[^.]+$/, '') + '.jpg';
        
        const filename = `${dd} ${mm} ${yyyy}/${folderName.trim()}/${prefix}${originalName}`;
        try {
          let downloadUrl;
          
          // Choix du traitement selon needsProcessing
          if (needsProcessing) {
            // Traitement avec Pixian (suppression de fond)
            downloadUrl = await processWithPixian(url, originalName);
          } else {
            // Traitement simple avec redimensionnement
            downloadUrl = await processWithResize(url, originalName);
          }
          
          // Télécharge l'image traitée
          chrome.downloads.download({ url: downloadUrl, filename }, () => {
            console.log(`[background] Image téléchargée: ${filename} (${needsProcessing ? 'Pixian' : 'Resize'})`);
          });
          
          // Petit délai humain
          await new Promise(r => setTimeout(r, Math.floor(Math.random()*200)+100));
        } catch(err) {
          console.error('[background] Erreur process/download', url, err);
          // Si code 402 (Payment Required), afficher une alert sur la page
          if (err.message && err.message.includes('Pixian 402')) {
            chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
              if (tabs[0]?.id) {
                chrome.scripting.executeScript({
                  target: {tabId: tabs[0].id},
                  func: () => alert('Mode test non activé : crédit Pixian épuisé ou paiement requis.')
                });
              }
            });
          }
        }
      }
    })();
    return true;
  }

  if (message.type === 'download') {
    console.log('[background] Téléchargement demandé pour:', message.url);
    console.log('[background] Chemin de destination:', message.filename);
    
    try {
      chrome.downloads.download({
        url: message.url,
        filename: message.filename,
        saveAs: false
      }, (downloadId) => {
        if (chrome.runtime.lastError) {
          console.error('[background] Erreur de téléchargement:', chrome.runtime.lastError);
          sendResponse({ success: false, error: chrome.runtime.lastError.message });
        } else {
          console.log('[background] Téléchargement démarré, ID:', downloadId);
          sendResponse({ success: true, downloadId: downloadId });
        }
      });
    } catch (error) {
      console.error('[background] Exception lors du téléchargement:', error);
      sendResponse({ success: false, error: error.message });
    }
    
    return true; // Indique que sendResponse sera appelé de manière asynchrone
  }
});
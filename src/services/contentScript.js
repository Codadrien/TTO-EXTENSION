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
      return null;
    });
}

/**
 * scrapCdn: retourne l'URL avec une dimension maximale pour divers CDN (Cloudinary, Scene7, etc.).
 * @param {string} urlString - URL originale du CDN.
 * @param {number} [maxSize=2000] - taille maximale souhaitée (largeur et hauteur).
 * @returns {string} URL modifiée avec la meilleure qualité possible.
 */
export function scrapCdn(urlString, maxSize = 2000) {
  let newUrl = urlString;
  // Remplace les dimensions de type `w_123` et `h_123` (Cloudinary, etc.)
  newUrl = newUrl.replace(/w_(\d+)/gi, `w_${maxSize}`);
  newUrl = newUrl.replace(/h_(\d+)/gi, `h_${maxSize}`);
  // Remplace les paramètres de requête style `width=123`, `height=123`, `wid=123`, `hei=123`, `w=123`, `h=123`, `sw=123`, `sh=123`
  newUrl = newUrl.replace(/(\b(?:width|wid|w)=)(\d+)/gi, `$1${maxSize}`);
  newUrl = newUrl.replace(/(\b(?:height|hei|h)=)(\d+)/gi, `$1${maxSize}`);
  newUrl = newUrl.replace(/(\bsw=)(\d+)/gi, `$1${maxSize}`); // Remplace `sw` (largeur)
  newUrl = newUrl.replace(/(\bsh=)(\d+)/gi, `$1${maxSize}`); // Remplace `sh` (hauteur)
  return newUrl;
}

/**
 * Filtre les URLs selon la hauteur et enrichit avec format et poids.
 * @param {string[]} urls
 * @param {number} threshold
 * @returns {Promise<{url:string,format:string,weight:number|null}[]>}
 */
async function filterAndEnrichImages(urls, threshold = 500) {
  // Appliquer scrapCdn à chaque URL pour optimiser la qualité
  const cdnUrls = urls.map(url => scrapCdn(url));
  const measures = await Promise.all(cdnUrls.map(url =>
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
  console.log('[contentScript] Liste d\'url de plus de 500px avec metadonnée:', enriched);
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
          document.dispatchEvent(new CustomEvent('TTO_IMAGES_DATA', { detail: responsePayload }));
        });
      return true;
    }
  });
  
  // Ajouter des écouteurs pour les événements personnalisés
  document.addEventListener('TTO_PANEL_OPENED', () => {
    const allUrls = collectAllUrls();
    const totalCount = allUrls.length;
    filterAndEnrichImages(allUrls, 500)
      .then(imagesWithFormat => {
        const largeCount = imagesWithFormat.length;
        const responsePayload = { images: imagesWithFormat, totalCount, largeCount };
        const event = new CustomEvent('TTO_IMAGES_DATA', { detail: responsePayload });
        document.dispatchEvent(event);
      });
  });
  
  // Écouteur pour les événements de téléchargement
  document.addEventListener('TTO_DOWNLOAD_IMAGES', (event) => {
    if (!event.detail || !event.detail.url || !event.detail.filename) {
      return;
    }
    try {
      chrome.runtime.sendMessage({
        type: 'download',
        url: event.detail.url,
        filename: event.detail.filename
      }, (response) => {
      });
    } catch (error) {
    }
  });

  // Écouteur pour lancer traitement + téléchargement depuis la page
  document.addEventListener('TTO_PROCESS_AND_DOWNLOAD', (event) => {
    const { entries, folderName } = event.detail || {};
    try {
      chrome.runtime.sendMessage({ type: 'process_and_download', entries, folderName });
    } catch (e) {
      console.error('[contentScript] Impossible d’envoyer process_and_download', e);
    }
  });
}

/**
 * Analyse les images de la page et envoie les résultats à l'UI React
 */
function updateImagesData() {
  if (!document.getElementById('tto-extension-container')) return;
  const allUrls = collectAllUrls();
  const totalCount = allUrls.length;
  filterAndEnrichImages(allUrls, 500).then(imagesWithFormat => {
    const largeCount = imagesWithFormat.length;
    const responsePayload = { images: imagesWithFormat, totalCount, largeCount };
    document.dispatchEvent(new CustomEvent('TTO_IMAGES_DATA', { detail: responsePayload }));
  });
}

// Ajouter un écouteur pour les clics sur la page
let debounceTimer = null;
document.addEventListener('click', () => {
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    updateImagesData();
  }, 300); // Attendre 300ms après le dernier clic
}, { passive: true });

// Initialisation du listener
registerChromeMessageListener();
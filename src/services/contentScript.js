// src/services/contentScript.js

/**
 * Récupère les URLs des balises <img>.
 * @returns {string[]}
 */
function collectImgTagUrls() {
  const urls = Array.from(document.images)
    .map(img => img.currentSrc || img.src)
    .filter(Boolean);
  // Affiche le tableau complet pour debug pédagogique
  console.log('[contentScript] collectImgTagUrls tableau:', urls);
  console.log(`[contentScript] collectImgTagUrls: ${urls.length} URLs`);
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
  // Affiche le tableau complet pour debug pédagogique
  console.log('[contentScript] collectCssBackgroundUrls tableau:', unique);
  console.log(`[contentScript] collectCssBackgroundUrls: ${unique.length} URLs`);
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
  // Affiche le tableau complet pour debug pédagogique
  console.log('[contentScript] collectAttrUrls tableau:', unique);
  console.log(`[contentScript] collectAttrUrls: ${unique.length} URLs`);
  return unique;
}

/**
 * Filtre les images dont la largeur naturelle dépasse le seuil.
 * @param {string[]} urls
 * @param {number} threshold
 * @returns {Promise<string[]>}
 */
function filterLargeImages(urls, threshold = 500) {
  console.log(`[contentScript] filterLargeImages: testing ${urls.length} URLs`);
  const promises = urls.map(url => new Promise(resolve => {
    const img = new Image();
    img.src = url;
    img.onload = () => resolve({ url, width: img.naturalWidth });
    img.onerror = () => resolve(null);
  }));
  return Promise.all(promises).then(results => {
    const filtered = results
      .filter(item => item && item.width > threshold)
      .map(item => item.url);
    console.log(`[contentScript] filterLargeImages: ${filtered.length} URLs > ${threshold}px`);
    return filtered;
  });
}

/**
 * Agrège toutes les URLs, dedupe, et filtre par largeur.
 * @param {number} threshold
 * @returns {Promise<string[]>}
 */
function collectAllImages(threshold = 500) {
  const imgUrls = collectImgTagUrls();
  const cssUrls = collectCssBackgroundUrls();
  const attrUrls = collectAttrUrls();
  const all = Array.from(new Set([...imgUrls, ...cssUrls, ...attrUrls]));
  console.log(`[contentScript] collectAllImages: total unique URLs = ${all.length}`);
  return filterLargeImages(all, threshold);
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
 * Listener pour messages Chrome, répond de manière asynchrone.
 */
function registerChromeMessageListener() {
  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    console.log(`[contentScript] onMessage received:`, msg);
    if (msg.type === 'SCRAPE_IMAGES') {
      const threshold = msg.threshold || 500;
      collectAllImages(threshold).then(images => {
        console.log(`[contentScript] Retrieved ${images.length} images, enriching with format and weight`);
        Promise.all(images.map(async url => {
          const format = await getRealFormat(url);
          const weightBytes = await getImageWeight(url);
          const weight = weightBytes !== null ? Math.round((weightBytes / 1024) * 100) / 100 : null; // ko arrondi à 2 déc.
          return { url, format, weight };
        })).then(imagesWithFormat => {
          console.log(`[contentScript] Sending ${imagesWithFormat.length} images with format & weight`, imagesWithFormat);
          sendResponse({ images: imagesWithFormat });
        });
      });
      return true;
    }
  });
}

// Initialisation du listener
registerChromeMessageListener();
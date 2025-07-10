// Image scraping utilities for content script
// Handles extraction and processing of images from web pages

/**
 * Récupère les URLs des balises <img>.
 * @returns {string[]}
 */
export function collectImgTagUrls() {
  const urls = Array.from(document.images)
    .map(img => img.currentSrc || img.src)
    .filter(Boolean);
  return urls;
}

/**
 * Récupère les URLs des background-image CSS.
 * @returns {string[]}
 */
export function collectCssBackgroundUrls() {
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
export function collectAttrUrls() {
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
export function collectAllUrls() {
  const imgUrls = collectImgTagUrls();
  const cssUrls = collectCssBackgroundUrls();
  const attrUrls = collectAttrUrls();
  const allUrls = Array.from(new Set([...imgUrls, ...cssUrls, ...attrUrls]));
  return allUrls;
}

/**
 * FONCTION PRINCIPALE - Collecte les images selon le mode choisi
 * @param {boolean} optimizedMode - true pour mode optimisé, false pour mode standard
 * @returns {string[]} - URLs selon le mode
 */
export function collectImagesByMode(optimizedMode = false) {
  const baseUrls = collectAllUrls();
  console.log(`[collectImagesByMode] Mode optimisé: ${optimizedMode}, URLs collectées: ${baseUrls.length}`);
  console.log(`[collectImagesByMode] Premières URLs:`, baseUrls.slice(0, 3));
  
  if (optimizedMode) {
    const optimized = optimizeFor2000px(baseUrls);
    console.log(`[collectImagesByMode] URLs après optimisation: ${optimized.length}`);
    console.log(`[collectImagesByMode] Premières URLs optimisées:`, optimized.slice(0, 3));
    return optimized;
  }
  
  // Mode standard : retourner les URLs brutes
  return baseUrls;
}

/**
 * Mode optimisé : force 2000px en modifiant les paramètres existants + supprime doublons
 * @param {string[]} urls - URLs originales
 * @returns {string[]} - URLs optimisées et dédoublonnées
 */
function optimizeFor2000px(urls) {
  const optimized = urls.map(url => {
    // NOUVELLE STRATÉGIE : modifier paramètres pour forcer 2000x2000px
    
    const questionMarkIndex = url.indexOf('?');
    if (questionMarkIndex !== -1) {
      // URL a des paramètres - les modifier pour forcer 2000px
      const result = scrapCdn(url, 2000);
      console.log(`[optimizeFor2000px] Paramètres modifiés pour 2000px: ${url} → ${result}`);
      return result;
    } else {
      // URL sans paramètres - essayer d'ajouter des paramètres 2000px
      const result = scrapCdn(url, 2000);
      if (result !== url) {
        console.log(`[optimizeFor2000px] Paramètres 2000px ajoutés: ${url} → ${result}`);
        return result;
      } else {
        console.log(`[optimizeFor2000px] Aucune optimisation possible: ${url}`);
        return url;
      }
    }
  });
  
  // Supprimer tous les doublons
  const unique = [...new Set(optimized)];
  console.log(`[optimizeFor2000px] ${urls.length} URLs → ${unique.length} après optimisation et dédoublonnage`);
  return unique;
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
  // CORRIGÉ: utiliser des regex plus précises pour éviter de capturer dans les noms de fichiers
  newUrl = newUrl.replace(/\bw_(\d+)/gi, `w_${maxSize}`);
  newUrl = newUrl.replace(/\bh_(\d+)/gi, `h_${maxSize}`);
  // Remplace les paramètres de requête style `width=123`, `height=123`, `wid=123`, `hei=123`, `w=123`, `h=123`, `sw=123`, `sh=123`
  // CORRIGÉ: inclut les décimales (\d+\.?\d*) pour éviter les height=2000.5
  newUrl = newUrl.replace(/(\b(?:width|wid|w)=)(\d+\.?\d*)/gi, `$1${maxSize}`);
  newUrl = newUrl.replace(/(\b(?:height|hei|h)=)(\d+\.?\d*)/gi, `$1${maxSize}`);
  newUrl = newUrl.replace(/(\bsw=)(\d+\.?\d*)/gi, `$1${maxSize}`); // Remplace `sw` (largeur)
  newUrl = newUrl.replace(/(\bsh=)(\d+\.?\d*)/gi, `$1${maxSize}`); // Remplace `sh` (hauteur)
  
  return newUrl;
}

/**
 * Fonction utilitaire pour détecter le format via signature binaire.
 * @param {string} url
 * @returns {Promise<string>}
 */
export function getRealFormat(url) {
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
    .catch(() => {
      return 'unknown';
    });
}

/**
 * Récupère le poids d'une image via HEAD pour lire Content-Length
 * @param {string} url
 * @returns {Promise<number|null>}
 */
export function getImageWeight(url) {
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
    .catch(() => {
      return null;
    });
}

/**
 * Filtre les URLs selon les dimensions et enrichit avec format et poids.
 * CORRIGÉ : système de fallback intelligent qui retourne l'URL qui fonctionne vraiment
 * @param {string[]} urls
 * @param {number} threshold - Seuil minimum pour les dimensions (défaut: 500)
 * @param {number} areaThreshold - Seuil minimum pour l'aire totale en pixels (défaut: 200000)
 * @returns {Promise<{url:string,format:string,weight:number|null}[]>}
 */
export async function filterAndEnrichImages(urls, threshold = 500, areaThreshold = 200000) {
  const measures = await Promise.all(urls.map((originalUrl, index) =>
    new Promise(resolve => {
      const img = new Image();
      
      img.onload = () => resolve({ 
        url: originalUrl, // Utiliser l'URL originale telle qu'elle arrive
        width: img.naturalWidth, 
        height: img.naturalHeight,
        area: img.naturalWidth * img.naturalHeight
      });
      
      img.onerror = () => resolve(null);
      
      // CORRIGÉ: utiliser directement l'URL originale (pas d'optimisation automatique ici)
      img.src = originalUrl;
    })
  ));
  
  // Filtrage : largeur OU hauteur > threshold ET aire > areaThreshold
  const filtered = measures
    .filter(item => {
      if (!item) return false;
      
      // Au moins une dimension doit dépasser le seuil
      const dimensionOk = item.width > threshold || item.height > threshold;
      
      // L'aire totale doit être suffisante (évite les images trop petites)
      const areaOk = item.area > areaThreshold;
      
      // Les deux conditions doivent être remplies
      return dimensionOk && areaOk;
    })
    .sort((a, b) => b.area - a.area) // TRI PAR AIRE DÉCROISSANTE (essentiel dans les 2 modes)
    .map(item => item.url);
    
  const enriched = await Promise.all(filtered.map(async url => {
    const format = await getRealFormat(url);
    const weightBytes = await getImageWeight(url);
    const weight = weightBytes != null ? Math.round((weightBytes/1024)*100)/100 : null;
    return { url, format, weight };
  }));
  
  console.log(`[contentScript] Liste d'images filtrées (seuil: ${threshold}px, aire: ${areaThreshold}px²):`, enriched);
  return enriched;
}

// === FONCTIONS DÉPRÉCIÉES À SUPPRIMER ===
// Les fonctions suivantes ont été remplacées par collectImagesByMode()

/**
 * @deprecated Utiliser collectImagesByMode(false) à la place
 */
export async function collectAllUrlsEnhanced() {
  console.warn('[DEPRECATED] collectAllUrlsEnhanced() est dépréciée. Utiliser collectImagesByMode(true)');
  return collectImagesByMode(true);
}

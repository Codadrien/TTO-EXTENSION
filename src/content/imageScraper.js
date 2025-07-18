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
 * Mode optimisé : force 2000px avec fond blanc pour Scene7, sinon utilise scrapCdn classique
 * NOUVEAU : Intègre generateWhiteBackgroundUrl pour les URLs Scene7
 * @param {string[]} urls - URLs originales
 * @returns {string[]} - URLs optimisées et dédoublonnées
 */
function optimizeFor2000px(urls) {
  const optimized = urls.map(url => {
    console.log(`[optimizeFor2000px] Traitement de: ${url}`);
    
    // STRATÉGIE 1 : Si c'est une URL Scene7, utiliser generateWhiteBackgroundUrl
    if (url.includes('scene7.com') || url.includes('/is/image/')) {
      const result = generateWhiteBackgroundUrl(url, 2000, 'FFFFFF');
      console.log(`[optimizeFor2000px] Scene7 avec fond blanc: ${url} → ${result}`);
      return result;
    }
    
    // STRATÉGIE 2 : Pour les autres CDN, utiliser la logique existante
    const questionMarkIndex = url.indexOf('?');
    if (questionMarkIndex !== -1) {
      // URL a des paramètres - les modifier pour forcer 2000px
      const result = scrapCdn(url, 2000);
      console.log(`[optimizeFor2000px] CDN classique modifié: ${url} → ${result}`);
      return result;
    } else {
      // URL sans paramètres - essayer d'ajouter des paramètres 2000px
      const result = scrapCdn(url, 2000);
      if (result !== url) {
        console.log(`[optimizeFor2000px] CDN classique paramètres ajoutés: ${url} → ${result}`);
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
  console.log(`[optimizeFor2000px] Premières URLs optimisées:`, unique.slice(0, 3));
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
  
  // === TRAITEMENT SPÉCIFIQUE CONTENTFUL ===
  // Pour les URLs Contentful, on génère une URL avec fond blanc, format JPG et dimensions 2000x2000
  // Détection : URLs contenant "ctfassets.net"
  if (newUrl.includes('ctfassets.net')) {
    // Supprime tous les paramètres existants et ajoute seulement ceux nécessaires
    const questionMarkIndex = newUrl.indexOf('?');
    const baseUrl = questionMarkIndex !== -1 ? newUrl.substring(0, questionMarkIndex) : newUrl;
    
    // Génère une URL avec les paramètres optimaux pour Contentful
    newUrl = `${baseUrl}?fm=jpg&w=${maxSize}&h=${maxSize}`;
    console.log(`[scrapCdn] Contentful - URL optimisée: ${urlString} → ${newUrl}`);
    return newUrl; // Retour immédiat pour Contentful, pas d'autres optimisations
  }
  
  // === TRAITEMENT SPÉCIFIQUE CLOUDINARY DECKERS ===
  // Pour les URLs Cloudinary Deckers, on ajoute un fond blanc automatiquement
  // Détection : URLs contenant "dms.deckers.com" et "/upload/"
  if (newUrl.includes('dms.deckers.com') && newUrl.includes('/upload/')) {
    // Ajoute "b_white," juste après "/upload/" pour forcer un fond blanc
    // Exemple : /upload/t_slider → /upload/b_white,t_slider
    newUrl = newUrl.replace(/\/upload\//, '/upload/b_white,');
    console.log(`[scrapCdn] Cloudinary Deckers - fond blanc ajouté: ${urlString} → ${newUrl}`);
  }
  
  // === OPTIMISATION DIMENSIONS POUR TOUS LES CDN ===
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
 * Génère une URL Scene7 optimisée pour obtenir une image 2000x2000px avec fond blanc
 * Utilise les paramètres Scene7 pour forcer le fond blanc et la taille
 * @param {string} originalUrl - URL Scene7 originale
 * @param {number} [targetSize=2000] - Taille cible en pixels (carré)
 * @param {string} [backgroundColor='FFFFFF'] - Couleur de fond en hexadécimal (sans #)
 * @returns {string} - URL modifiée avec fond blanc
 */
export function generateWhiteBackgroundUrl(originalUrl, targetSize = 2000, backgroundColor = 'FFFFFF') {
  try {
    console.log(`[generateWhiteBackgroundUrl] URL originale: ${originalUrl}`);
    
    // Étape 1 : Vérifier si c'est bien une URL Scene7
    if (!originalUrl.includes('scene7.com') && !originalUrl.includes('/is/image/')) {
      console.warn(`[generateWhiteBackgroundUrl] URL non-Scene7 détectée, retour de l'URL originale`);
      return originalUrl;
    }
    
    // Étape 2 : Séparer l'URL de base et les paramètres existants
    const [baseUrl, existingParams] = originalUrl.split('?');
    console.log(`[generateWhiteBackgroundUrl] URL de base: ${baseUrl}`);
    console.log(`[generateWhiteBackgroundUrl] Paramètres existants: ${existingParams || 'aucun'}`);
    
    // Étape 3 : Créer les nouveaux paramètres pour fond blanc + taille
    const params = [];
    
    // Paramètres Scene7 pour fond blanc et taille
    params.push(`wid=${targetSize}`);        // Largeur
    params.push(`hei=${targetSize}`);        // Hauteur
    params.push(`bgc=${backgroundColor}`);   // Couleur de fond (hex sans #)
    params.push(`fit=constrain`);            // Maintient les proportions, ajoute du fond
    params.push(`fmt=jpeg`);                 // Format JPEG
    
    // Étape 4 : Conserver certains paramètres existants si pertinents
    if (existingParams) {
      const existingPairs = existingParams.split('&');
      
      for (const pair of existingPairs) {
        const [key, value] = pair.split('=');
        if (!key) continue;
        
        // Conserver le format original si spécifié (sauf webp/avif)
        if (key === 'fmt' && value && !['webp', 'avif'].includes(value)) {
          // Remplacer le fmt=png par le format original
          const fmtIndex = params.findIndex(p => p.startsWith('fmt='));
          if (fmtIndex !== -1) {
            params[fmtIndex] = `fmt=${value}`;
          }
        }
        
        // Conserver d'autres paramètres utiles
        if (['layer', 'src', 'mask'].includes(key)) {
          params.push(`${key}=${value}`);
        }
      }
    }
    
    // Étape 5 : Construire l'URL finale
    const finalUrl = `${baseUrl}?${params.join('&')}`;
    console.log(`[generateWhiteBackgroundUrl] URL finale: ${finalUrl}`);
    
    return finalUrl;
    
  } catch (error) {
    console.error(`[generateWhiteBackgroundUrl] Erreur lors de la modification:`, error);
    console.log(`[generateWhiteBackgroundUrl] Fallback: retour de l'URL originale`);
    return originalUrl;
  }
}

/**
 * Fonction de fallback : supprime tous les paramètres après le '?' pour obtenir l'image brute
 * Utile si les paramètres Scene7 ne fonctionnent pas comme attendu
 * @param {string} originalUrl - URL avec paramètres
 * @returns {string} - URL sans paramètres
 */
export function getCleanImageUrl(originalUrl) {
  try {
    const [baseUrl] = originalUrl.split('?');
    console.log(`[getCleanImageUrl] URL nettoyée: ${baseUrl}`);
    return baseUrl;
  } catch (error) {
    console.error(`[getCleanImageUrl] Erreur:`, error);
    return originalUrl;
  }
}

/**
 * Fonction principale qui essaie d'abord les paramètres Scene7, puis le fallback
 * @param {string} originalUrl - URL Scene7 originale
 * @param {number} [targetSize=2000] - Taille cible
 * @returns {Promise<string>} - Meilleure URL disponible
 */
export async function getBestWhiteBackgroundUrl(originalUrl, targetSize = 2000) {
  console.log(`[getBestWhiteBackgroundUrl] Traitement de: ${originalUrl}`);
  
  // Stratégie 1 : Essayer avec les paramètres Scene7
  const urlWithWhiteBg = generateWhiteBackgroundUrl(originalUrl, targetSize);
  
  // Test rapide pour voir si l'URL fonctionne
  try {
    const response = await fetch(urlWithWhiteBg, { method: 'HEAD' });
    if (response.ok) {
      console.log(`[getBestWhiteBackgroundUrl] URL avec fond blanc validée`);
      return urlWithWhiteBg;
    }
  } catch (error) {
    console.warn(`[getBestWhiteBackgroundUrl] URL avec paramètres échouée:`, error.message);
  }
  
  // Stratégie 2 : Fallback vers URL nettoyée
  console.log(`[getBestWhiteBackgroundUrl] Fallback vers URL nettoyée`);
  const cleanUrl = getCleanImageUrl(originalUrl);
  
  return cleanUrl;
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
  const measures = await Promise.all(urls.map((originalUrl) =>
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

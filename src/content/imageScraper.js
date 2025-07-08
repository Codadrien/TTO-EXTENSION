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
 * Améliore les URLs d'images en supprimant les paramètres de redimensionnement/optimisation
 * pour obtenir les images en pleine qualité quand c'est possible.
 * @param {string[]} urls - Liste des URLs originales
 * @returns {Promise<string[]>} - Liste des URLs améliorées (seules les URLs valides sont ajoutées)
 */
export async function enhanceImageUrls(urls) {
  console.log(`[enhanceImageUrls] Début du traitement de ${urls.length} URLs`);
  const enhancedUrls = [];
  let processedCount = 0;
  let enhancedCount = 0;
  let validCount = 0;
  
  for (const url of urls) {
    processedCount++;
    console.log(`[enhanceImageUrls] ${processedCount}/${urls.length} - Traitement de: ${url}`);
    
    try {
      const enhancedUrl = getHighQualityUrl(url);
      
      // Si l'URL améliorée est différente de l'originale, vérifier qu'elle fonctionne
      if (enhancedUrl !== url) {
        enhancedCount++;
        console.log(`[enhanceImageUrls] ${processedCount}/${urls.length} - URL sans paramètres: ${enhancedUrl}`);
        
        console.log(`[enhanceImageUrls] ${processedCount}/${urls.length} - Vérification de la validité...`);
        const isValid = await isImageUrlValid(enhancedUrl);
        
        if (isValid) {
          validCount++;
          enhancedUrls.push(enhancedUrl);
          console.log(`✅ [enhanceImageUrls] ${processedCount}/${urls.length} - URL valide ajoutée: ${enhancedUrl}`);
        } else {
          console.log(`❌ [enhanceImageUrls] ${processedCount}/${urls.length} - URL invalide, ignorée: ${enhancedUrl}`);
        }
      } else {
        console.log(`[enhanceImageUrls] ${processedCount}/${urls.length} - Aucun paramètre trouvé, URL inchangée`);
      }
    } catch (error) {
      console.warn(`[enhanceImageUrls] ${processedCount}/${urls.length} - Erreur lors de l'amélioration de ${url}:`, error);
    }
  }
  
  console.log(`[enhanceImageUrls] ✅ Traitement terminé:`);
  console.log(`  - URLs traitées: ${processedCount}`);
  console.log(`  - URLs avec paramètres trouvées: ${enhancedCount}`);
  console.log(`  - URLs valides ajoutées: ${validCount}`);
  console.log(`  - URLs finales retournées: ${enhancedUrls.length}`);
  
  return enhancedUrls;
}

/**
 * Génère une URL haute qualité en supprimant tous les paramètres d'URL.
 * @param {string} url - URL originale
 * @returns {string} - URL sans paramètres
 */
function getHighQualityUrl(url) {
  try {
    // Simple : supprimer tout ce qui vient après le "?"
    const questionMarkIndex = url.indexOf('?');
    if (questionMarkIndex !== -1) {
      const cleanUrl = url.substring(0, questionMarkIndex);
      console.log(`[getHighQualityUrl] Paramètres détectés et supprimés:`);
      console.log(`  - Originale: ${url}`);
      console.log(`  - Nettoyée: ${cleanUrl}`);
      return cleanUrl;
    }
    console.log(`[getHighQualityUrl] Aucun paramètre détecté dans: ${url}`);
    return url;
  } catch (error) {
    console.warn(`[getHighQualityUrl] Erreur lors du nettoyage de l'URL ${url}:`, error);
    return url;
  }
}

/**
 * Vérifie si une URL d'image est valide et accessible.
 * @param {string} url - URL à vérifier
 * @returns {Promise<boolean>} - true si l'image est accessible
 */
async function isImageUrlValid(url) {
  try {
    console.log(`[isImageUrlValid] Test de validité: ${url}`);
    const response = await fetch(url, { 
      method: 'HEAD',
      headers: { 
        'Accept': 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8' 
      }
    });
    
    // Vérifier que c'est bien une image et que le statut est OK
    const contentType = response.headers.get('content-type');
    const isValid = response.ok && contentType && contentType.startsWith('image/');
    
    console.log(`[isImageUrlValid] Résultat:`);
    console.log(`  - Status: ${response.status} ${response.statusText}`);
    console.log(`  - Content-Type: ${contentType || 'non défini'}`);
    console.log(`  - Valide: ${isValid ? '✅ OUI' : '❌ NON'}`);
    
    return isValid;
  } catch (error) {
    console.log(`[isImageUrlValid] ❌ Erreur de connexion: ${error.message}`);
    return false;
  }
}

/**
 * Version améliorée de collectAllUrls qui inclut les URLs haute qualité quand disponibles.
 * @returns {Promise<string[]>}
 */
export async function collectAllUrlsEnhanced() {
  // Récupérer toutes les URLs de base
  const baseUrls = collectAllUrls();
  
  // Essayer d'améliorer la qualité des URLs
  const enhancedUrls = await enhanceImageUrls(baseUrls);
  
  // Combiner les URLs originales et améliorées (en évitant les doublons)
  const allUrls = Array.from(new Set([...baseUrls, ...enhancedUrls]));
  
  console.log(`[collectAllUrlsEnhanced] URLs de base: ${baseUrls.length}, URLs améliorées: ${enhancedUrls.length}, Total: ${allUrls.length}`);
  
  return allUrls;
}

/**
 * Filtre les URLs selon les dimensions et enrichit avec format et poids.
 * @param {string[]} urls
 * @param {number} threshold - Seuil minimum pour les dimensions (défaut: 300)
 * @param {number} areaThreshold - Seuil minimum pour l'aire totale en pixels (défaut: 150000)
 * @returns {Promise<{url:string,format:string,weight:number|null}[]>}
 */
export async function filterAndEnrichImages(urls, threshold = 300, areaThreshold = 150000) {
  const measures = await Promise.all(urls.map((originalUrl, index) =>
    new Promise(resolve => {
      const optimizedUrl = scrapCdn(originalUrl);
      const img = new Image();
      
      img.onload = () => resolve({ 
        url: originalUrl, 
        width: img.naturalWidth, 
        height: img.naturalHeight,
        area: img.naturalWidth * img.naturalHeight 
      });
      
      img.onerror = () => {
        // Si l'URL optimisée échoue ET qu'elle est différente de l'originale, essayer l'originale
        if (optimizedUrl !== originalUrl) {
          console.log(`[filterAndEnrichImages] URL optimisée échouée, essai URL originale pour l'item ${index + 1}`);
          const imgFallback = new Image();
          
          imgFallback.onload = () => resolve({ 
            url: originalUrl, 
            width: imgFallback.naturalWidth, 
            height: imgFallback.naturalHeight,
            area: imgFallback.naturalWidth * imgFallback.naturalHeight 
          });
          
          imgFallback.onerror = () => resolve(null);
          imgFallback.src = originalUrl;
        } else {
          resolve(null);
        }
      };
      
      img.src = optimizedUrl;
    })
  ));
  
  // Filtrage amélioré : largeur OU hauteur > threshold ET aire > areaThreshold
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
    .sort((a, b) => b.area - a.area) // Trier par aire décroissante
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

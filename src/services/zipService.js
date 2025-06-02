// src/services/zipService.js

/**
 * Service pour extraire et traiter les images depuis un fichier ZIP
 * Ce service utilise JSZip pour extraire les fichiers et créer des URLs blob
 */

import JSZip from 'jszip';

/**
 * Formats d'image supportés
 * @type {string[]}
 */
const SUPPORTED_IMAGE_FORMATS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'avif', 'svg'];

/**
 * Vérifie si un fichier est une image supportée basée sur son extension
 * @param {string} filename - Nom du fichier à vérifier
 * @returns {boolean} - True si c'est une image supportée
 */
function isImageFile(filename) {
  // Récupère l'extension du fichier (tout ce qui suit le dernier point)
  const extension = filename.split('.').pop().toLowerCase();
  return SUPPORTED_IMAGE_FORMATS.includes(extension);
}

/**
 * Crée une URL blob à partir d'un objet Blob
 * @param {Blob} blob - L'objet Blob contenant les données de l'image
 * @returns {string} - L'URL blob créée
 */
function createBlobUrl(blob) {
  // Crée une URL qui pointe vers l'objet Blob en mémoire
  return URL.createObjectURL(blob);
}

/**
 * Obtient les dimensions d'une image à partir de son URL
 * @param {string} url - L'URL de l'image (peut être une URL blob)
 * @returns {Promise<{width: number, height: number}>} - Les dimensions de l'image
 */
function getImageDimensions(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    
    // Quand l'image est chargée, on récupère ses dimensions
    img.onload = () => {
      resolve({
        width: img.naturalWidth,
        height: img.naturalHeight
      });
    };
    
    // En cas d'erreur, on rejette la promesse
    img.onerror = () => {
      reject(new Error(`Impossible de charger l'image: ${url}`));
    };
    
    // Déclenche le chargement de l'image
    img.src = url;
  });
}

/**
 * Détecte le format d'une image à partir de son nom de fichier
 * @param {string} filename - Nom du fichier
 * @returns {string} - Format détecté (extension sans le point)
 */
function detectImageFormat(filename) {
  const extension = filename.split('.').pop().toLowerCase();
  
  // Normalise certaines extensions
  if (extension === 'jpg') return 'jpeg';
  
  return extension;
}

/**
 * Extrait les images d'un fichier ZIP
 * @param {File} zipFile - Le fichier ZIP à traiter
 * @param {number} minHeight - Hauteur minimale des images à conserver (en pixels)
 * @returns {Promise<Array<{url: string, format: string, weight: number, filename: string}>>} - Liste des images extraites
 */
export async function extractImagesFromZip(zipFile, minHeight = 500) {
  try {
    // Charge le fichier ZIP avec JSZip
    const zip = await JSZip.loadAsync(zipFile);
    
    // Filtre les fichiers pour ne garder que les images
    const imageFiles = Object.keys(zip.files).filter(filename => 
      !zip.files[filename].dir && isImageFile(filename)
    );
    
    console.log(`[zipService] ${imageFiles.length} images trouvées dans le ZIP`);
    
    // Traite chaque image
    const processedImages = await Promise.all(
      imageFiles.map(async (filename) => {
        try {
          // Extrait le contenu binaire de l'image
          const content = await zip.files[filename].async('blob');
          
          // Crée une URL blob pour l'image
          const url = createBlobUrl(content);
          
          // Récupère les dimensions de l'image
          const dimensions = await getImageDimensions(url);
          
          // Détecte le format de l'image
          const format = detectImageFormat(filename);
          
          // Calcule le poids de l'image en Ko
          const weight = Math.round((content.size / 1024) * 100) / 100;
          
          return {
            url,
            format,
            weight,
            filename,
            dimensions
          };
        } catch (error) {
          console.error(`[zipService] Erreur lors du traitement de ${filename}:`, error);
          return null;
        }
      })
    );
    
    // Filtre les images nulles (en cas d'erreur) et celles trop petites
    const validImages = processedImages
      .filter(img => img !== null && img.dimensions.height >= minHeight)
      // Tri par hauteur décroissante
      .sort((a, b) => b.dimensions.height - a.dimensions.height)
      // Transforme le format pour correspondre à l'API existante
      .map(img => ({
        url: img.url,
        format: img.format,
        weight: img.weight,
        filename: img.filename
      }));
    
    console.log(`[zipService] ${validImages.length} images valides (hauteur >= ${minHeight}px)`);
    
    return validImages;
  } catch (error) {
    console.error('[zipService] Erreur lors de l\'extraction du ZIP:', error);
    throw error;
  }
}

/**
 * Libère les ressources des URLs blob
 * @param {Array<{url: string}>} images - Liste des images avec des URLs blob
 */
export function releaseImageBlobUrls(images) {
  if (!images || !Array.isArray(images)) return;
  
  // Pour chaque image, on révoque l'URL blob pour libérer la mémoire
  images.forEach(image => {
    if (image.url && image.url.startsWith('blob:')) {
      URL.revokeObjectURL(image.url);
    }
  });
}

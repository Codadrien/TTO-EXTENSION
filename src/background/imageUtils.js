// Utilitaires pour la manipulation d'images
// Gère les conversions de format et les transformations de base

/**
 * Convertit un blob AVIF en JPEG via canvas
 * @param {Blob} blob - Blob AVIF à convertir
 * @returns {Promise<Blob>} - Blob JPEG converti
 */
export async function convertAvifToJpeg(blob) {
  const imgBitmap = await createImageBitmap(blob);
  const canvas = new OffscreenCanvas(imgBitmap.width, imgBitmap.height);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(imgBitmap, 0, 0);
  return await canvas.convertToBlob({ type: 'image/jpeg', quality: 0.70 });
}

/**
 * Vérifie si une image est au format AVIF
 * @param {Blob} blob - Blob à vérifier
 * @param {string} originalName - Nom original du fichier
 * @returns {boolean} - True si AVIF
 */
export function isAvifFormat(blob, originalName) {
  return blob.type === 'image/avif' || /\.avif$/i.test(originalName);
}

/**
 * Prépare une image en convertissant AVIF si nécessaire
 * @param {Blob} blob - Blob image
 * @param {string} originalName - Nom original
 * @returns {Promise<{blob: Blob, name: string}>} - Image préparée
 */
export async function prepareImageBlob(blob, originalName) {
  if (isAvifFormat(blob, originalName)) {
    const convertedBlob = await convertAvifToJpeg(blob);
    const convertedName = originalName.replace(/\.avif$/i, '.jpg');
    return { blob: convertedBlob, name: convertedName };
  }
  return { blob, name: originalName };
}

/**
 * Convertit un Blob en DataURL avec format JPEG forcé
 * @param {Blob} blob - Blob à convertir
 * @returns {Promise<string>} - DataURL en format JPEG
 */
export async function blobToJpegDataUrl(blob) {
  return await new Promise(resolve => {
    const reader = new FileReader();
    reader.onload = () => {
      // Force le format en JPG en remplaçant le type MIME dans le DataURL
      const dataUrl = reader.result;
      // S'assure que c'est bien un JPG dans le header du DataURL
      const jpgDataUrl = dataUrl.replace(/^data:image\/[^;]+;base64,/, 'data:image/jpeg;base64,');
      resolve(jpgDataUrl);
    };
    reader.readAsDataURL(blob);
  });
}

/**
 * Récupère une image depuis une URL
 * @param {string} url - URL de l'image
 * @returns {Promise<Blob>} - Blob de l'image
 */
export async function fetchImageBlob(url) {
  const response = await fetch(url);
  return await response.blob();
}

/**
 * Traite le nom de fichier pour forcer l'extension JPG
 * @param {string} url - URL originale
 * @returns {string} - Nom de fichier avec extension .jpg
 */
export function processFileName(url) {
  let originalName = url.split('/').pop().split('?')[0] || 'image';
  // Force l'extension en .jpg
  return originalName.replace(/\.[^.]+$/, '') + '.jpg';
} 
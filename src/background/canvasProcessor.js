// Point d'entrée pour les traitements canvas
// Réexporte les fonctions des modules spécialisés du dossier canvas/

export { processWithShadowPreservation } from './canvas/shadowProcessor.js';
export { processWithResize } from './canvas/simpleProcessor.js';
export { detectObjectBounds } from './canvas/objectDetection.js';
export { calculateShoeDimensions, calculatePlacementPosition } from './canvas/dimensionCalculator.js';

/**
 * Traite un PNG transparent en appliquant les marges spécifiées
 * @param {ImageBitmap} img - Image bitmap source (PNG transparent)
 * @param {Object} margins - Marges à appliquer {top, right, bottom, left} en décimal
 * @param {number} maxSize - Taille maximale du carré de sortie
 * @returns {Promise<Blob>} - Image traitée en format JPEG
 */
export async function processTransparentPngWithMargins(img, margins, maxSize = 2000) {
  console.log('[canvasProcessor] Traitement PNG transparent avec marges:', margins);

  const canvas = new OffscreenCanvas(maxSize, maxSize);
  const ctx = canvas.getContext('2d');

  // Remplissage du fond en blanc
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, maxSize, maxSize);

  // Calculer les dimensions avec marges
  const marginTop = margins.top * maxSize;
  const marginRight = margins.right * maxSize;
  const marginBottom = margins.bottom * maxSize;
  const marginLeft = margins.left * maxSize;

  // Zone disponible après marges
  const availableWidth = maxSize - marginLeft - marginRight;
  const availableHeight = maxSize - marginTop - marginBottom;

  console.log(`[canvasProcessor] Zone disponible: ${availableWidth}x${availableHeight}`);

  // Calculer les dimensions de l'image pour s'adapter à la zone disponible
  const imgRatio = img.width / img.height;
  const availableRatio = availableWidth / availableHeight;

  let drawWidth, drawHeight, drawX, drawY;

  if (imgRatio > availableRatio) {
    // L'image est plus large proportionnellement
    drawWidth = availableWidth;
    drawHeight = availableWidth / imgRatio;
    drawX = marginLeft;
    drawY = marginTop + (availableHeight - drawHeight) / 2; // Centrer verticalement
  } else {
    // L'image est plus haute proportionnellement
    drawHeight = availableHeight;
    drawWidth = availableHeight * imgRatio;
    drawX = marginLeft + (availableWidth - drawWidth) / 2; // Centrer horizontalement
    drawY = marginTop;
  }

  console.log(`[canvasProcessor] Dessin de l'image: ${drawWidth}x${drawHeight} à (${drawX}, ${drawY})`);

  // Dessiner l'image PNG transparente avec les marges
  ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);

  // Conversion en blob JPEG avec qualité 70%
  return await canvas.convertToBlob({
    type: 'image/jpeg',
    quality: 0.70
  });
} 
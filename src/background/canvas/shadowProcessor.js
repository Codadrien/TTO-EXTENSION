// Module de traitement avec préservation d'ombre
// Traite les images en conservant les ombres et en appliquant des marges spécifiques

import { detectObjectBounds } from './objectDetection.js';
import { calculateShoeDimensions, calculatePlacementPosition } from './dimensionCalculator.js';

/**
 * Traite une image avec préservation d'ombre et marges pour chaussures
 * @param {ImageBitmap} img - Image bitmap source
 * @param {number} maxSize - Taille maximale du carré de sortie
 * @returns {Promise<Blob>} - Image traitée en format JPEG
 */
export async function processWithShadowPreservation(img, maxSize = 2000) {
  const origWidth = img.width;
  const origHeight = img.height;

  console.log(`[shadowProcessor] Dimensions originales: ${origWidth}x${origHeight}`);

  // Analyser l'image pour détecter l'objet
  const tempCanvas = new OffscreenCanvas(origWidth, origHeight);
  const tempCtx = tempCanvas.getContext('2d');
  tempCtx.drawImage(img, 0, 0);

  const imageData = tempCtx.getImageData(0, 0, origWidth, origHeight);
  const objectBounds = detectObjectBounds(imageData, origWidth, origHeight);

  // Calculer les dimensions finales
  const dimensions = calculateShoeDimensions(objectBounds, maxSize);
  const position = calculatePlacementPosition(dimensions);

  // Créer le canvas final
  const canvas = new OffscreenCanvas(dimensions.squareSize, dimensions.squareSize);
  const ctx = canvas.getContext('2d');

  // Remplissage du fond en blanc
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, dimensions.squareSize, dimensions.squareSize);

  // Dessiner l'objet détecté dans le canvas final
  ctx.drawImage(
    img,
    objectBounds.minX, objectBounds.minY, dimensions.objectWidth, dimensions.objectHeight,
    position.x, position.y, dimensions.finalObjectWidth, dimensions.finalObjectHeight
  );

  // Conversion en blob JPEG avec qualité 70%
  return await canvas.convertToBlob({
    type: 'image/jpeg',
    quality: 0.70
  });
} 
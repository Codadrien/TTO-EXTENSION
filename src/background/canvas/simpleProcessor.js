// Module de traitement simple d'images
// Redimensionne et centre les images dans un carré blanc

/**
 * Traite une image simple avec redimensionnement dans un carré blanc
 * @param {ImageBitmap} img - Image bitmap source
 * @param {number} maxSize - Taille maximale du carré de sortie
 * @returns {Promise<Blob>} - Image traitée en format JPEG
 */
export async function processWithResize(img, maxSize = 2000) {
  const origWidth = img.width;
  const origHeight = img.height;

  console.log(`[simpleProcessor] Dimensions originales: ${origWidth}x${origHeight}`);

  // Détermine le plus grand côté pour créer un carré
  let squareSize = Math.max(origWidth, origHeight);
  let needsResize = false;

  // Redimensionne si nécessaire pour respecter la taille maximale
  if (squareSize > maxSize) {
    squareSize = maxSize;
    needsResize = true;
    console.log(`[simpleProcessor] Redimensionnement du carré à: ${squareSize}x${squareSize}`);
  } else {
    console.log(`[simpleProcessor] Utilisation d'un carré de: ${squareSize}x${squareSize}`);
  }

  // Calcule les dimensions proportionnelles de l'image dans le carré
  let width, height;
  if (needsResize) {
    const ratio = maxSize / Math.max(origWidth, origHeight);
    width = Math.round(origWidth * ratio);
    height = Math.round(origHeight * ratio);
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

  console.log(`[simpleProcessor] Image placée dans un carré blanc de ${squareSize}x${squareSize}`);

  // Conversion en blob JPEG avec qualité 70%
  return await canvas.convertToBlob({
    type: 'image/jpeg',
    quality: 0.70
  });
} 
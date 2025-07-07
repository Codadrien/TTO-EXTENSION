// Module de détection d'objets dans les images
// Analyse les pixels pour détecter les contours des objets

/**
 * Détecte les bords d'un objet dans une image
 * @param {ImageData} imageData - Données de pixels de l'image
 * @param {number} width - Largeur de l'image
 * @param {number} height - Hauteur de l'image
 * @returns {Object} - Coordonnées des bords détectés {minX, minY, maxX, maxY}
 */
export function detectObjectBounds(imageData, width, height) {
  const data = imageData.data;
  
  // Seuils de détection
  const ALPHA_THRESHOLD = 5;  // Détecter même les pixels légèrement opaques
  const COLOR_THRESHOLD = 245; // Seuil plus élevé pour détecter même les pixels presque blancs
  
  // Initialiser les limites
  let minX = width;
  let minY = height;
  let maxX = 0;
  let maxY = 0;

  // 1. Détection du bas (de bas en haut)
  maxY = 0;
  for (let y = height - 1; y >= 0; y--) {
    let rowHasContent = false;
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const alpha = data[idx + 3];
      // Détection très sensible pour le bas
      if (alpha > ALPHA_THRESHOLD) {
        maxY = y;
        rowHasContent = true;
        break;
      }
    }
    if (rowHasContent) break;
  }

  // 2. Détection du haut (de haut en bas)
  minY = height;
  for (let y = 0; y < height; y++) {
    let rowHasContent = false;
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const alpha = data[idx + 3];
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      // Pour le haut, on veut des pixels plus significatifs
      if (alpha > ALPHA_THRESHOLD && (r < COLOR_THRESHOLD || g < COLOR_THRESHOLD || b < COLOR_THRESHOLD)) {
        minY = y;
        rowHasContent = true;
        break;
      }
    }
    if (rowHasContent) break;
  }

  // 3. Détection de la gauche (de gauche à droite)
  minX = width;
  for (let x = 0; x < width; x++) {
    let colHasContent = false;
    for (let y = 0; y < height; y++) {
      const idx = (y * width + x) * 4;
      const alpha = data[idx + 3];
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      if (alpha > ALPHA_THRESHOLD && (r < COLOR_THRESHOLD || g < COLOR_THRESHOLD || b < COLOR_THRESHOLD)) {
        minX = x;
        colHasContent = true;
        break;
      }
    }
    if (colHasContent) break;
  }

  // 4. Détection de la droite (de droite à gauche)
  maxX = 0;
  for (let x = width - 1; x >= 0; x--) {
    let colHasContent = false;
    for (let y = 0; y < height; y++) {
      const idx = (y * width + x) * 4;
      const alpha = data[idx + 3];
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      if (alpha > ALPHA_THRESHOLD && (r < COLOR_THRESHOLD || g < COLOR_THRESHOLD || b < COLOR_THRESHOLD)) {
        maxX = x;
        colHasContent = true;
        break;
      }
    }
    if (colHasContent) break;
  }

  // S'assurer que nous avons détecté quelque chose
  if (minX > maxX || minY > maxY) {
    // Si aucun pixel significatif n'est trouvé, utiliser l'image entière
    minX = 0;
    minY = 0;
    maxX = width - 1;
    maxY = height - 1;
  }

  return { minX, minY, maxX, maxY };
} 
// Module de calcul des dimensions et marges
// Gère les calculs de positionnement et de taille pour les objets détectés

/**
 * Calcule les dimensions finales avec marges pour chaussures
 * @param {Object} objectBounds - Limites de l'objet détecté
 * @param {number} maxSize - Taille maximale autorisée
 * @returns {Object} - Dimensions et positions calculées
 */
export function calculateShoeDimensions(objectBounds, maxSize = 2000) {
  const { minX, minY, maxX, maxY } = objectBounds;
  
  const objectWidth = maxX - minX + 1;
  const objectHeight = maxY - minY + 1;
  const objectRatio = objectWidth / objectHeight;

  console.log(`[dimensionCalculator] Objet détecté: ${objectWidth}x${objectHeight} aux coordonnées (${minX},${minY})-(${maxX},${maxY})`);

  // Marges spécifiques pour chaussures: haut droite bas gauche = 0% 7% 24% 7%
  const marginTop = 0;
  const marginRight = 0.07;
  const marginBottom = 0.24;
  const marginLeft = 0.07;

  // Calcul des dimensions finales avec les marges
  const availableWidthRatio = 1 - (marginLeft + marginRight);
  const availableHeightRatio = 1 - (marginTop + marginBottom);

  // Détermination de la dimension contraignante
  let finalObjectWidth, finalObjectHeight;
  const availableRatio = (availableWidthRatio / availableHeightRatio) * objectRatio;

  if (availableRatio > 1) {
    // La largeur est contraignante
    finalObjectWidth = Math.min(maxSize * availableWidthRatio, objectWidth);
    finalObjectHeight = finalObjectWidth / objectRatio;
  } else {
    // La hauteur est contraignante
    finalObjectHeight = Math.min(maxSize * availableHeightRatio, objectHeight);
    finalObjectWidth = finalObjectHeight * objectRatio;
  }

  // Calculer la taille du carré final
  const maxDimWithMargin = Math.max(
    finalObjectWidth / availableWidthRatio,
    finalObjectHeight / availableHeightRatio
  );
  const squareSize = Math.min(maxSize, Math.ceil(maxDimWithMargin));

  // Arrondir les dimensions
  finalObjectWidth = Math.round(finalObjectWidth);
  finalObjectHeight = Math.round(finalObjectHeight);

  console.log(`[dimensionCalculator] Taille du carré final: ${squareSize}x${squareSize}`);
  console.log(`[dimensionCalculator] Dimensions finales de l'objet: ${finalObjectWidth}x${finalObjectHeight}`);

  return {
    squareSize,
    finalObjectWidth,
    finalObjectHeight,
    objectWidth,
    objectHeight,
    marginTop,
    marginRight,
    marginBottom,
    marginLeft
  };
}

/**
 * Calcule la position de placement avec les marges spécifiées
 * @param {Object} dimensions - Dimensions calculées
 * @returns {Object} - Position {x, y} pour le placement
 */
export function calculatePlacementPosition(dimensions) {
  const {
    squareSize,
    finalObjectWidth,
    finalObjectHeight,
    marginLeft,
    marginBottom
  } = dimensions;

  // Calcul de la position pour placer l'objet avec les marges spécifiées
  const availableWidth = squareSize * (1 - marginLeft - dimensions.marginRight);

  // Centrer horizontalement si l'objet est plus petit que l'espace disponible
  let x;
  if (finalObjectWidth < availableWidth) {
    x = Math.round(squareSize * marginLeft + (availableWidth - finalObjectWidth) / 2);
  } else {
    x = Math.round(squareSize * marginLeft);
  }

  // Positionner verticalement avec marge en bas
  const y = Math.round((1 - marginBottom) * squareSize - finalObjectHeight);

  return { x, y };
} 
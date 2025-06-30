// Point d'entrée pour les traitements canvas
// Réexporte les fonctions des modules spécialisés du dossier canvas/

export { processWithShadowPreservation } from './canvas/shadowProcessor.js';
export { processWithResize } from './canvas/simpleProcessor.js';
export { detectObjectBounds } from './canvas/objectDetection.js';
export { calculateShoeDimensions, calculatePlacementPosition } from './canvas/dimensionCalculator.js'; 
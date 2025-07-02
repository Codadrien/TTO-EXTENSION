// Export du composant principal restructuré
export { default } from './ProductTypeSelectorRefactored.jsx';

// Export des hooks pour une utilisation externe si nécessaire
export { useMargins } from './hooks/useMargins.js';
export { usePresets } from './hooks/usePresets.js';
export { useImageInjection } from './hooks/useImageInjection.js';

// Export des services pour une utilisation externe si nécessaire
export { presetStorageService } from './services/presetStorageService.js';
export { pixianService } from './services/pixianService.js';
export { imageInjectionService } from './services/imageInjectionService.js';

// Export des constantes
export * from './constants.js';

// Export des utilitaires
export { keyboardNavigation } from './utils/keyboardNavigation.js'; 
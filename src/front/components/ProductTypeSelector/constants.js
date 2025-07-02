/**
 * Types de produits disponibles
 */
export const PRODUCT_TYPES = [
  { id: 'default', label: 'Standard' },
  { id: 'textile', label: 'Textile' },
  { id: 'pantalon', label: 'Pantalon' },
  { id: 'accessoires', label: 'Accessoires' },
  { id: 'custom', label: 'Custom' }
];

/**
 * Marges prédéfinies par type de produit (en pourcentage)
 */
export const PREDEFINED_MARGINS = {
  default: { top: 5, right: 5, bottom: 5, left: 5 },        // 0.05 * 100
  textile: { top: 8.5, right: 8.5, bottom: 8.5, left: 8.5 }, // 0.085 * 100
  pantalon: { top: 3.2, right: 3.2, bottom: 3.2, left: 3.2 }, // 0.032 * 100
  accessoires: { top: 16, right: 16, bottom: 16, left: 16 }  // 0.16 * 100
};

/**
 * Marges par défaut pour un nouveau preset
 */
export const DEFAULT_MARGINS = {
  top: '',
  right: '',
  bottom: '',
  left: ''
};

/**
 * Classes CSS problématiques à exclure lors de l'injection d'images
 */
export const PROBLEMATIC_CSS_CLASSES = ['m-auto', 'aspect-square', 'object-contain'];

/**
 * Sélecteurs DOM pour l'injection d'images
 */
export const DOM_SELECTORS = {
  SWIPER_IMAGES: '.swiper-slide-active img',
  TTO_CONTAINER: '.tto-image-container',
  TTO_OVERLAY: '.tto-image-overlay'
};

/**
 * Configuration des timeouts (en millisecondes)
 */
export const TIMEOUTS = {
  STORAGE_OPERATION: 2000,
  PIXIAN_PROCESSING: 30000,
  MARGIN_APPLICATION: 50,
  INITIAL_MARGIN_APPLICATION: 100
}; 
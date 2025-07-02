/**
 * Types de produits disponibles (suppression de 'shoes')
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
  TTO_OVERLAY: '.tto-image-overlay',
  TOP_INPUT: 'input[tabindex="1"]',
  LEFT_INPUT: 'input[tabindex="4"]'
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

/**
 * Types de messages pour la communication avec le background script
 */
export const MESSAGE_TYPES = {
  PROCESS_PIXIAN_PREVIEW: 'process_pixian_preview',
  PRODUCT_TYPE_NO_MARGINS: 'no_margins_png'
};

/**
 * Types d'événements personnalisés
 */
export const CUSTOM_EVENTS = {
  TTO_STORAGE_REQUEST: 'TTO_STORAGE_REQUEST',
  TTO_STORAGE_RESPONSE: 'TTO_STORAGE_RESPONSE',
  TTO_PIXIAN_PREVIEW_REQUEST: 'TTO_PIXIAN_PREVIEW_REQUEST',
  TTO_PIXIAN_PREVIEW_RESPONSE: 'TTO_PIXIAN_PREVIEW_RESPONSE'
};

/**
 * Types de requêtes de stockage
 */
export const STORAGE_REQUEST_TYPES = {
  LOAD_PRESETS: 'LOAD_PRESETS',
  SAVE_PRESETS: 'SAVE_PRESETS',
  LOAD_PRESETS_RESPONSE: 'LOAD_PRESETS_RESPONSE',
  SAVE_PRESETS_RESPONSE: 'SAVE_PRESETS_RESPONSE'
}; 
// Service pour gérer les appels à l'API Pixian
// Gère l'authentification et les requêtes de suppression de fond

import { getMarginConfig, validateCustomMargins } from './marginConfig.js';

// Variables d'API Pixian (injectées par Vite à la compilation)
const PIXIAN_API_ID = import.meta.env.VITE_PIXIAN_API_ID;
const PIXIAN_API_SECRET = import.meta.env.VITE_PIXIAN_API_SECRET;

/**
 * Convertit les marges depuis le format objet vers le format string Pixian
 * @param {Object} margins - Marges au format {top, right, bottom, left}
 * @returns {string} - Marges au format Pixian "top% right% bottom% left%"
 */
function formatMarginsForPixian(margins) {
  const top = Math.round(margins.top * 100);
  const right = Math.round(margins.right * 100);
  const bottom = Math.round(margins.bottom * 100);
  const left = Math.round(margins.left * 100);
  
  return `${top}% ${right}% ${bottom}% ${left}%`;
}

/**
 * Envoie une image à l'API Pixian pour suppression de fond
 * @param {Blob} imageBlob - L'image à traiter
 * @param {string} originalName - Nom original du fichier
 * @param {Object} options - Options de traitement
 * @returns {Promise<Blob>} - Image traitée
 */
export async function callPixianAPI(imageBlob, originalName, options = {}) {
  const {
    margin = '5%',
    verticalAlignment = null,
    backgroundColor = '#ffffff',
    targetSize = '2000 2000',
    jpegQuality = '70',
    cropToForeground = 'true',
    testMode = 'false'
  } = options;

  console.log('[pixianService] Envoi à Pixian avec marge:', margin);

  const form = new FormData();
  form.append('image', imageBlob, originalName);
  form.append('test', testMode);
  form.append('result.crop_to_foreground', cropToForeground);
  
  if (verticalAlignment) {
    form.append('result.vertical_alignment', verticalAlignment);
  }
  
  form.append('result.margin', margin);
  form.append('background.color', backgroundColor);
  form.append('result.target_size', targetSize);
  form.append('output.jpeg_quality', jpegQuality);

  const headers = {
    'Authorization': 'Basic ' + btoa(`${PIXIAN_API_ID}:${PIXIAN_API_SECRET}`)
  };

  const response = await fetch('https://api.pixian.ai/api/v2/remove-background', {
    method: 'POST',
    headers,
    body: form
  });

  if (!response.ok) {
    throw new Error(`Pixian ${response.status}`);
  }

  return await response.blob();
}

/**
 * Traite une image avec Pixian selon le type de produit et les marges optionnelles
 * @param {Blob} imageBlob - Image à traiter
 * @param {string} originalName - Nom original
 * @param {string} productType - Type de produit
 * @param {Object} customMargins - Marges personnalisées optionnelles
 * @returns {Promise<Blob>} - Image traitée
 */
export async function processWithPixianByProductType(imageBlob, originalName, productType = 'default', customMargins = null) {
  console.log(`[pixianService] Traitement Pixian pour type: ${productType}`);
  console.log(`[pixianService] Marges personnalisées reçues:`, customMargins);
  
  // Obtenir la configuration de marges (la validation se fait dans getMarginConfig)
  const margins = getMarginConfig(productType, customMargins);
  
  // Convertir au format Pixian
  const marginString = formatMarginsForPixian(margins);
  
  console.log(`[pixianService] Marges appliquées: ${marginString}`);
  
  return await callPixianAPI(imageBlob, originalName, { margin: marginString });
}

/**
 * Traite une image de chaussures avec des marges spécifiques
 * @param {Blob} imageBlob - Image à traiter
 * @param {string} originalName - Nom original
 * @returns {Promise<Blob>} - Image traitée
 */
export async function processWithPixianShoes(imageBlob, originalName) {
  console.log('[pixianService] Traitement Pixian Shoes');
  
  // Utiliser la configuration spécifique aux chaussures
  const margins = getMarginConfig('shoes');
  const marginString = formatMarginsForPixian(margins);
  
  const options = {
    margin: marginString,
    verticalAlignment: 'bottom'
  };

  console.log(`[pixianService] Marges chaussures appliquées: ${marginString}`);
  
  return await callPixianAPI(imageBlob, originalName, options);
} 
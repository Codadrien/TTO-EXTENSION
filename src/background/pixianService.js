// Service pour gérer les appels à l'API Pixian
// Gère l'authentification et les requêtes de suppression de fond

import { getMarginConfig, validateCustomMargins } from './marginConfig.js';

// Variables d'API Pixian (injectées par Vite à la compilation)
const PIXIAN_API_ID = import.meta.env.VITE_PIXIAN_API_ID;
const PIXIAN_API_SECRET = import.meta.env.VITE_PIXIAN_API_SECRET;

/**
 * Convertit les marges depuis le format objet vers le format string Pixian
 * @param {Object} margins - Marges au format {top, right, bottom, left}
 * @returns {string} - Marges au format Pixian "top% right% bottom% left%" (avec unités %)
 */
function formatMarginsForPixian(margins) {
  // Vérifier que l'objet margins existe et a les bonnes propriétés
  if (!margins || typeof margins !== 'object') {
    console.warn('[formatMarginsForPixian] Objet margins invalide, utilisation de marges par défaut');
    return '5% 5% 5% 5%'; // Marges par défaut de 5%
  }
  
  // Extraire les valeurs avec des valeurs par défaut pour éviter NaN
  const top = typeof margins.top === 'number' ? Math.round(margins.top * 100) : 5;
  const right = typeof margins.right === 'number' ? Math.round(margins.right * 100) : 5;
  const bottom = typeof margins.bottom === 'number' ? Math.round(margins.bottom * 100) : 5;
  const left = typeof margins.left === 'number' ? Math.round(margins.left * 100) : 5;
  
  // Vérifier que toutes les valeurs sont valides
  const values = [top, right, bottom, left];
  const hasInvalidValue = values.some(val => isNaN(val) || val < 0 || val > 100);
  
  if (hasInvalidValue) {
    console.warn('[formatMarginsForPixian] Valeurs de marges invalides détectées:', { top, right, bottom, left });
    return '5% 5% 5% 5%'; // Marges par défaut de 5%
  }
  
  // Retourner les valeurs avec le symbole % (format requis par l'API Pixian)
  const result = `${top}% ${right}% ${bottom}% ${left}%`;
  console.log('[formatMarginsForPixian] Marges formatées pour Pixian:', result);
  return result;
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
    targetSize = null, // Ne plus forcer une taille par défaut
    jpegQuality = '70',
    cropToForeground = 'true',
    testMode = 'false',
    outputFormat = 'auto'
  } = options;

  console.log('[pixianService] Envoi à Pixian avec marge:', margin, 'format:', outputFormat, backgroundColor ? 'avec fond' : 'transparent');

  const form = new FormData();
  form.append('image', imageBlob, originalName);
  form.append('test', testMode);
  form.append('result.crop_to_foreground', cropToForeground);
  
  if (verticalAlignment) {
    form.append('result.vertical_alignment', verticalAlignment);
  }
  
  form.append('result.margin', margin);
  
  // N'ajouter background.color que si on ne veut pas un fond transparent
  if (backgroundColor && outputFormat !== 'png') {
    form.append('background.color', backgroundColor);
  }
  
  // N'ajouter target_size que s'il est explicitement spécifié
  if (targetSize) {
    form.append('result.target_size', targetSize);
  }
  
  form.append('output.format', outputFormat);
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
    // Essayer de lire le message d'erreur de Pixian
    let errorMessage = `Pixian ${response.status}`;
    try {
      const errorText = await response.text();
      console.error(`[pixianService] Erreur Pixian ${response.status}:`, errorText);
      if (errorText) {
        errorMessage += `: ${errorText}`;
      }
    } catch (e) {
      console.error(`[pixianService] Impossible de lire l'erreur Pixian:`, e);
    }
    throw new Error(errorMessage);
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
  console.log(`[pixianService] Image blob size: ${imageBlob.size} bytes, type: ${imageBlob.type}`);
  console.log(`[pixianService] Marges personnalisées reçues:`, customMargins);
  
  // Obtenir la configuration de marges (la validation se fait dans getMarginConfig)
  const margins = getMarginConfig(productType, customMargins);
  
  // Convertir au format Pixian
  const marginString = formatMarginsForPixian(margins);
  
  console.log(`[pixianService] Marges appliquées: ${marginString}`);
  
  const options = { 
    margin: marginString,
    targetSize: '2000 2000' // Taille forcée pour les traitements normaux
  };
  
  return await callPixianAPI(imageBlob, originalName, options);
} 
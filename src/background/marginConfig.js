// Configuration des marges par type de produit
// Gère les différents types de marges appliquées lors du traitement Pixian

/**
 * Configuration des marges par type de produit
 * Format: { top, right, bottom, left } en pourcentages (0.0 à 1.0)
 */
export const MARGIN_CONFIGS = {
  default: {
    top: 0.05,     // 5%
    right: 0.05,   // 5%
    bottom: 0.05,  // 5%
    left: 0.05     // 5%
  },
  textile: {
    top: 0.085,    // 8.5% (valeur originale)
    right: 0.085,  // 8.5%
    bottom: 0.085, // 8.5%
    left: 0.085    // 8.5%
  },
  pantalon: {
    top: 0.032,    // 3.2% (valeur originale)
    right: 0.032,  // 3.2%
    bottom: 0.032, // 3.2%
    left: 0.032    // 3.2%
  },
  accessoires: {
    top: 0.16,     // 16% (valeur originale)
    right: 0.16,   // 16%
    bottom: 0.16,  // 16%
    left: 0.16     // 16%
  },
  shoes: {
    top: 0.00,     // 0%
    right: 0.08,   // 8% (valeur originale)
    bottom: 0.26,  // 26% (valeur originale)
    left: 0.08     // 8%
  }
};

/**
 * Obtient la configuration de marges pour un type de produit
 * @param {string} productType - Type de produit
 * @param {Object} customMargins - Marges personnalisées optionnelles
 * @returns {Object} - Configuration des marges {top, right, bottom, left}
 */
export function getMarginConfig(productType, customMargins = null) {
  console.log(`[marginConfig] Récupération des marges pour: ${productType}`);
  
  // Si des marges personnalisées sont fournies, les utiliser
  if (customMargins && typeof customMargins === 'object') {
    console.log(`[marginConfig] Marges personnalisées reçues:`, customMargins);
    
    // Valider et convertir les marges personnalisées
    const validatedMargins = validateCustomMargins(customMargins);
    if (validatedMargins) {
      console.log(`[marginConfig] Utilisation de marges personnalisées validées:`, validatedMargins);
      return validatedMargins;
    } else {
      console.log(`[marginConfig] Marges personnalisées invalides, utilisation des marges par défaut`);
    }
  }
  
  // Utiliser la configuration prédéfinie
  const config = MARGIN_CONFIGS[productType] || MARGIN_CONFIGS.default;
  console.log(`[marginConfig] Utilisation de marges prédéfinies pour ${productType}:`, config);
  
  return config;
}

/**
 * Valide et normalise les marges personnalisées
 * @param {Object} customMargins - Objet contenant les marges personnalisées
 * @returns {Object|null} - Marges validées en format décimal ou null
 */
export function validateCustomMargins(customMargins) {
  console.log('[validateCustomMargins] Données reçues:', customMargins);
  
  if (!customMargins || typeof customMargins !== 'object') {
    console.log('[validateCustomMargins] Pas d\'objet valide reçu');
    return null;
  }

  const validatedMargins = {};
  const sides = ['top', 'right', 'bottom', 'left'];
  let hasValidMargins = false;

  for (const side of sides) {
    const value = customMargins[side];
    console.log(`[validateCustomMargins] ${side}: ${value} (type: ${typeof value})`);
    
    // Convertir en nombre si c'est une string ou déjà un nombre
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    
    // Vérifier si c'est un nombre valide entre 0 et 100
    if (typeof numValue === 'number' && !isNaN(numValue) && numValue >= 0 && numValue <= 100) {
      validatedMargins[side] = numValue / 100; // Convertir en décimal
      hasValidMargins = true;
      console.log(`[validateCustomMargins] ${side} validé: ${validatedMargins[side]}`);
    } else {
      console.log(`[validateCustomMargins] ${side} invalide, ignoré`);
    }
  }

  const result = hasValidMargins ? validatedMargins : null;
  console.log('[validateCustomMargins] Résultat final:', result);
  return result;
}

/**
 * Formate les marges pour l'affichage (en pourcentages)
 * @param {Object} margins - Marges en format décimal
 * @returns {Object} - Marges formatées en pourcentages
 */
export function formatMarginsForDisplay(margins) {
  const formatted = {};
  for (const [side, value] of Object.entries(margins)) {
    formatted[side] = Math.round(value * 100);
  }
  return formatted;
} 
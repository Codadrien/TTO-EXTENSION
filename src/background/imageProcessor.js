// Image processing services for background script
// Handles Pixian API integration and image transformations

// Variables d'API Pixian (injectées par Vite à la compilation)
const PIXIAN_API_ID = import.meta.env.VITE_PIXIAN_API_ID;
const PIXIAN_API_SECRET = import.meta.env.VITE_PIXIAN_API_SECRET;

// Fonction pour traiter une image avec Pixian (suppression de fond)
export async function processWithPixian(url, originalName, productType = 'default') {
  console.log('[background] Traitement Pixian pour:', url, 'Type de produit:', productType);
  
  // 1. Récupère l'image originale
  const resp0 = await fetch(url);
  let blob0 = await resp0.blob();
  // Si format non supporté (AVIF), convertir en JPEG
  if (blob0.type === 'image/avif' || /\.avif$/i.test(originalName)) {
    blob0 = await convertAvifToJpeg(blob0);
    originalName = originalName.replace(/\.avif$/i, '.jpg');
  }
  
  // 2. Envoie à Pixian
  const form = new FormData();
  form.append('image', blob0, originalName);
  form.append('test', 'false'); // mode test, watermark gratuit
  form.append('result.crop_to_foreground', 'true'); // crop bord à bord
  
  // Définition des marges selon le type de produit
  let margin;
  switch (productType) {
    case 'textile':
      margin = '8.5%'; // Marge spécifique pour textile
      console.log('[background] Traitement avec marge pour textile:', margin);
      break;
    case 'pantalon':
      margin = '3.2%'; // Marge spécifique pour pantalon (haut droite bas gauche)
      console.log('[background] Traitement avec marge pour pantalon:', margin);
      break;
    case 'accessoires':
      margin = '16%'; // Marge spécifique pour accessoires
      console.log('[background] Traitement avec marge pour accessoires:', margin);
      break;
    default:
      margin = '5%'; // Marge par défaut
      console.log('[background] Traitement avec marge par défaut:', margin);
  }
  
  form.append('result.margin', margin);
  form.append('background.color', '#ffffff'); // fond blanc
  form.append('result.target_size', '2000 2000'); // taille maximale en px
  form.append('output.jpeg_quality', '70'); // qualité 70%
  
  const headers = {
    'Authorization': 'Basic ' + btoa(`${PIXIAN_API_ID}:${PIXIAN_API_SECRET}`)
  };
  
  const resp1 = await fetch('https://api.pixian.ai/api/v2/remove-background', {
    method: 'POST', headers, body: form
  });
  
  if (!resp1.ok) throw new Error('Pixian ' + resp1.status);
  
  const blob1 = await resp1.blob();
  
  // 3. Convertit le Blob en DataURL pour chrome.downloads avec format forcé en JPG
  return await new Promise(resolve => {
    const reader = new FileReader();
    reader.onload = () => {
      // Force le format en JPG en remplaçant le type MIME dans le DataURL
      const dataUrl = reader.result;
      // S'assure que c'est bien un JPG dans le header du DataURL
      const jpgDataUrl = dataUrl.replace(/^data:image\/[^;]+;base64,/, 'data:image/jpeg;base64,');
      resolve(jpgDataUrl);
    };
    reader.readAsDataURL(blob1);
  });
}

// Fonction pour traiter une image avec Pixian spécifiquement pour les chaussures (marges spéciales)
export async function processWithPixianShoes(url, originalName) {
  console.log('[background] Traitement Pixian Shoes pour:', url);
  
  // 1. Récupère l'image originale
  const resp0 = await fetch(url);
  let blob0 = await resp0.blob();
  // Si format non supporté (AVIF), convertir en JPEG
  if (blob0.type === 'image/avif' || /\.avif$/i.test(originalName)) {
    blob0 = await convertAvifToJpeg(blob0);
    originalName = originalName.replace(/\.avif$/i, '.jpg');
  }
  
  // 2. Envoie à Pixian avec des paramètres spécifiques pour les chaussures
  const form = new FormData();
  form.append('image', blob0, originalName);
  form.append('test', 'false'); // mode test, watermark gratuit
  form.append('result.crop_to_foreground', 'true'); // crop bord à bord
  form.append('result.vertical_alignment', 'bottom');
  form.append('result.margin', '0% 8% 26% 8%'); // marges spécifiques: haut droite bas gauche
  form.append('background.color', '#ffffff'); // fond blanc
  form.append('result.target_size', '2000 2000'); // taille maximale en px
  form.append('output.jpeg_quality', '70'); // qualité 70%
  
  const headers = {
    'Authorization': 'Basic ' + btoa(`${PIXIAN_API_ID}:${PIXIAN_API_SECRET}`)
  };
  
  const resp1 = await fetch('https://api.pixian.ai/api/v2/remove-background', {
    method: 'POST', headers, body: form
  });
  
  if (!resp1.ok) throw new Error('Pixian ' + resp1.status);
  
  const blob1 = await resp1.blob();
  
  // 3. Convertit le Blob en DataURL pour chrome.downloads avec format forcé en JPG
  return await new Promise(resolve => {
    const reader = new FileReader();
    reader.onload = () => {
      // Force le format en JPG en remplaçant le type MIME dans le DataURL
      const dataUrl = reader.result;
      // S'assure que c'est bien un JPG dans le header du DataURL
      const jpgDataUrl = dataUrl.replace(/^data:image\/[^;]+;base64,/, 'data:image/jpeg;base64,');
      resolve(jpgDataUrl);
    };
    reader.readAsDataURL(blob1);
  });
}

// Conversion AVIF → JPEG via canvas (pour compatibilité Pixian)
export async function convertAvifToJpeg(blob) {
  const imgBitmap = await createImageBitmap(blob);
  const canvas = new OffscreenCanvas(imgBitmap.width, imgBitmap.height);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(imgBitmap, 0, 0);
  return await canvas.convertToBlob({ type: 'image/jpeg', quality: 0.70 });
}

// Fonction pour traiter une image de chaussure en conservant l'ombre et en appliquant des marges
// Les marges sont exprimées en pourcentage (0-1)
// customMargins = { horizontal, vertical, width } ou { top, right, bottom, left }
export async function processWithShadowPreservation(url, originalName, customMargins = null) {
  console.log('[background] Traitement avec préservation d\'ombre pour:', url);
  
  // 1. Récupère l'image originale
  const resp = await fetch(url);
  let blob = await resp.blob();
  
  // Si format non supporté (AVIF), convertir en JPEG
  if (blob.type === 'image/avif' || /\.avif$/i.test(originalName)) {
    blob = await convertAvifToJpeg(blob);
    originalName = originalName.replace(/\.avif$/i, '.jpg');
  }
  
  // 2. Crée l'image bitmap
  const img = await createImageBitmap(blob);
  
  // Dimensions maximales permises
  const MAX_SIZE = 2000;
  
  // Dimensions originales
  const origWidth = img.width;
  const origHeight = img.height;
  
  console.log(`[background] Dimensions originales: ${origWidth}x${origHeight}`);
  
  // 3. Détection des bords réels de l'objet (chaussure)
  // Créer un canvas temporaire pour analyser l'image
  const tempCanvas = new OffscreenCanvas(origWidth, origHeight);
  const tempCtx = tempCanvas.getContext('2d');
  tempCtx.drawImage(img, 0, 0);
  
  // Récupérer les données de pixels
  const imageData = tempCtx.getImageData(0, 0, origWidth, origHeight);
  const data = imageData.data;
  
  // Initialiser les limites
  let minX = origWidth;
  let minY = origHeight;
  let maxX = 0;
  let maxY = 0;
  
  // Stratégie de détection plus précise: parcourir depuis les bords vers le centre
  // Pour détecter le bas avec précision (important pour l'alignement)
  
  // Seuil de détection plus strict pour les pixels significatifs
  const ALPHA_THRESHOLD = 5;  // Détecter même les pixels légèrement opaques
  const COLOR_THRESHOLD = 245; // Seuil plus élevé pour détecter même les pixels presque blancs
  
  // 1. Détection du bas (de bas en haut)
  maxY = 0;
  for (let y = origHeight - 1; y >= 0; y--) {
    let rowHasContent = false;
    for (let x = 0; x < origWidth; x++) {
      const idx = (y * origWidth + x) * 4;
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
  minY = origHeight;
  for (let y = 0; y < origHeight; y++) {
    let rowHasContent = false;
    for (let x = 0; x < origWidth; x++) {
      const idx = (y * origWidth + x) * 4;
      const alpha = data[idx + 3];
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      // Pour le haut, on veut des pixels plus significatifs (pas juste légèrement transparents)
      if (alpha > ALPHA_THRESHOLD && (r < COLOR_THRESHOLD || g < COLOR_THRESHOLD || b < COLOR_THRESHOLD)) {
        minY = y;
        rowHasContent = true;
        break;
      }
    }
    if (rowHasContent) break;
  }
  
  // 3. Détection de la gauche (de gauche à droite)
  minX = origWidth;
  for (let x = 0; x < origWidth; x++) {
    let colHasContent = false;
    for (let y = 0; y < origHeight; y++) {
      const idx = (y * origWidth + x) * 4;
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
  for (let x = origWidth - 1; x >= 0; x--) {
    let colHasContent = false;
    for (let y = 0; y < origHeight; y++) {
      const idx = (y * origWidth + x) * 4;
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
    maxX = origWidth - 1;
    maxY = origHeight - 1;
  }
  
  // Calculer les dimensions de l'objet détecté
  const objectWidth = maxX - minX + 1;
  const objectHeight = maxY - minY + 1;
  const objectRatio = objectWidth / objectHeight;
  
  console.log(`[background] Objet détecté: ${objectWidth}x${objectHeight} aux coordonnées (${minX},${minY})-(${maxX},${maxY})`);
  
  // Définition des marges en pourcentage
  // Valeurs par défaut: haut droite bas gauche = 0% 7% 24% 7%
  let marginTop = 0;
  let marginRight = 0.07;
  let marginBottom = 0.24;
  let marginLeft = 0.07;
  
  // Utiliser les marges personnalisées si elles sont fournies
  if (customMargins) {
    console.log('[background] Utilisation de marges personnalisées:', customMargins);
    
    // Si les marges sont fournies au format {top, right, bottom, left}
    if (customMargins.top !== undefined) {
      marginTop = customMargins.top;
      marginRight = customMargins.right;
      marginBottom = customMargins.bottom;
      marginLeft = customMargins.left;
    }
    // Si les marges sont fournies au format {horizontal, vertical, width}
    else if (customMargins.horizontal !== undefined) {
      // Conversion des valeurs de l'interface vers les marges finales
      // horizontal: valeur entre -50 et +50 (pourcentage)
      // vertical: valeur entre -50 et +50 (pourcentage)
      // width: valeur entre 50 et 150 (pourcentage)
      
      // Calcul des marges latérales basées sur la largeur
      // Si width = 100%, pas de marges latérales
      // Si width = 80%, 10% de marge de chaque côté
      const sideMargin = customMargins.sideMargin || (100 - (customMargins.width || 100)) / 2 / 100;
      
      // Conversion des valeurs horizontales (-50 à +50) en marges gauche/droite
      // Une valeur positive décale vers la droite (augmente la marge gauche)
      const horizontalShift = (customMargins.horizontal || 0) / 100;
      
      // Marges latérales de base + décalage horizontal
      marginLeft = Math.max(0, Math.min(0.5, sideMargin + horizontalShift));
      marginRight = Math.max(0, Math.min(0.5, sideMargin - horizontalShift));
      
      // Conversion des valeurs verticales (-50 à +50) en marges haut/bas
      // Une valeur positive décale vers le bas (augmente la marge supérieure)
      const verticalShift = (customMargins.vertical || 0) / 100;
      
      // Par défaut, on garde 0% en haut et 24% en bas
      // On ajuste ces valeurs en fonction du décalage vertical
      marginTop = Math.max(0, Math.min(0.5, 0 + verticalShift));
      marginBottom = Math.max(0, Math.min(0.5, 0.24 - verticalShift));
    }
    
    console.log(`[background] Marges appliquées: haut=${marginTop*100}%, droite=${marginRight*100}%, bas=${marginBottom*100}%, gauche=${marginLeft*100}%`);
  }
  
  // Calcul des dimensions finales avec les marges
  const availableWidthRatio = 1 - (marginLeft + marginRight);
  const availableHeightRatio = 1 - (marginTop + marginBottom);
  
  // Détermination de la dimension contraignante (largeur ou hauteur)
  let finalObjectWidth, finalObjectHeight;
  
  // Si le ratio de l'objet est plus grand que le ratio de l'espace disponible,
  // alors la largeur est contraignante
  const availableRatio = (availableWidthRatio / availableHeightRatio) * objectRatio;
  
  if (availableRatio > 1) {
    // La largeur est contraignante
    finalObjectWidth = Math.min(MAX_SIZE * availableWidthRatio, objectWidth);
    finalObjectHeight = finalObjectWidth / objectRatio;
  } else {
    // La hauteur est contraignante
    finalObjectHeight = Math.min(MAX_SIZE * availableHeightRatio, objectHeight);
    finalObjectWidth = finalObjectHeight * objectRatio;
  }
  
  // Créer un canvas carré pour le résultat final
  // Calculer la taille du carré en fonction des marges et des dimensions de l'objet
  const maxDimWithMargin = Math.max(
    finalObjectWidth / availableWidthRatio,
    finalObjectHeight / availableHeightRatio
  );
  
  // Assurer que la taille finale ne dépasse pas MAX_SIZE
  const squareSize = Math.min(MAX_SIZE, Math.ceil(maxDimWithMargin));
  
  // Arrondir les dimensions
  finalObjectWidth = Math.round(finalObjectWidth);
  finalObjectHeight = Math.round(finalObjectHeight);
  
  console.log(`[background] Taille du carré final: ${squareSize}x${squareSize}`);
  console.log(`[background] Dimensions finales de l'objet: ${finalObjectWidth}x${finalObjectHeight}`);
  
  // Création du canvas carré
  const canvas = new OffscreenCanvas(squareSize, squareSize);
  const ctx = canvas.getContext('2d');
  
  // Remplissage du fond en blanc
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, squareSize, squareSize);
  
  // Calcul de la position pour placer l'objet avec les marges spécifiées
  // Centrer horizontalement avec 7% de marge de chaque côté
  const availableWidth = squareSize * (1 - marginLeft - marginRight); // Largeur disponible après marges
  
  // Calculer le facteur d'échelle pour l'objet détecté
  const scale = finalObjectWidth / objectWidth;
  
  // Si l'objet est plus petit que l'espace disponible, on le centre
  let x;
  if (finalObjectWidth < availableWidth) {
    // Centrer horizontalement dans l'espace disponible
    x = Math.round(squareSize * marginLeft + (availableWidth - finalObjectWidth) / 2);
  } else {
    // Sinon, on applique simplement la marge gauche
    x = Math.round(squareSize * marginLeft);
  }
  
  // Positionner verticalement avec 24% de marge en bas
  // On calcule la position Y pour que le bas de l'objet soit à (1 - marginBottom) * squareSize
  const y = Math.round((1 - marginBottom) * squareSize - finalObjectHeight);
  
  // Calculer les coordonnées de l'objet dans l'image originale, ajustées selon l'échelle
  // Dessiner uniquement la partie de l'image qui contient l'objet détecté
  ctx.drawImage(
    img,
    minX, minY, objectWidth, objectHeight,  // Source: coordonnées de l'objet détecté
    x, y, finalObjectWidth, finalObjectHeight  // Destination: position et taille dans le canvas final
  );
  
  // Conversion en blob avec qualité 70% et format forcé en JPG
  const processedBlob = await canvas.convertToBlob({
    type: 'image/jpeg',
    quality: 0.70 // Bonne qualité avec compression raisonnable
  });
  
  // 3. Convertit le Blob en DataURL avec format forcé en JPG
  return await new Promise(resolve => {
    const reader = new FileReader();
    reader.onload = () => {
      // Force le format en JPG en remplaçant le type MIME dans le DataURL
      const dataUrl = reader.result;
      // S'assure que c'est bien un JPG dans le header du DataURL
      const jpgDataUrl = dataUrl.replace(/^data:image\/[^;]+;base64,/, 'data:image/jpeg;base64,');
      // Le nom original est déjà géré dans index.js, on retourne simplement le dataURL
      resolve(jpgDataUrl);
    };
    reader.readAsDataURL(processedBlob);
  });
}

// Fonction pour traiter une image sans Pixian (place l'image dans un carré blanc)
export async function processWithResize(url) {
  console.log('[background] Traitement simple pour:', url);
  
  // 1. Récupère l'image originale
  const resp = await fetch(url);
  const blob = await resp.blob();
  
  // 2. Crée l'image bitmap
  const img = await createImageBitmap(blob);
  
  // Dimensions maximales permises
  const MAX_SIZE = 2000;
  
  // Dimensions originales
  const origWidth = img.width;
  const origHeight = img.height;
  
  console.log(`[background] Dimensions originales: ${origWidth}x${origHeight}`);
  
  // Détermine le plus grand côté pour créer un carré
  let squareSize = Math.max(origWidth, origHeight);
  let needsResize = false;
  
  // Redimensionne si nécessaire pour respecter la taille maximale
  if (squareSize > MAX_SIZE) {
    squareSize = MAX_SIZE;
    needsResize = true;
    console.log(`[background] Redimensionnement du carré à: ${squareSize}x${squareSize}`);
  } else {
    console.log(`[background] Utilisation d'un carré de: ${squareSize}x${squareSize}`);
  }
  
  // Calcule les dimensions proportionnelles de l'image dans le carré
  let width, height;
  if (needsResize) {
    // Calcul correct du ratio pour préserver les proportions
    const ratio = MAX_SIZE / Math.max(origWidth, origHeight);
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
  
  console.log(`[background] Image placée dans un carré blanc de ${squareSize}x${squareSize}`);
  
  // Conversion en blob avec qualité 70% et format forcé en JPG
  const resizedBlob = await canvas.convertToBlob({
    type: 'image/jpeg',
    quality: 0.70 // Bonne qualité avec compression raisonnable
  });
  
  // 3. Convertit le Blob en DataURL avec format forcé en JPG
  return await new Promise(resolve => {
    const reader = new FileReader();
    reader.onload = () => {
      // Force le format en JPG en remplaçant le type MIME dans le DataURL
      const dataUrl = reader.result;
      // S'assure que c'est bien un JPG dans le header du DataURL
      const jpgDataUrl = dataUrl.replace(/^data:image\/[^;]+;base64,/, 'data:image/jpeg;base64,');
      resolve(jpgDataUrl);
    };
    reader.readAsDataURL(resizedBlob);
  });
}

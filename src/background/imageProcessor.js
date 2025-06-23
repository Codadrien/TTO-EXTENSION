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

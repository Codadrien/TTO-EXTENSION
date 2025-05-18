// src/apiService.js

/**
 * Récupère les images depuis le fichier JSON local.
 * @returns {Promise<Array>} Un tableau d'images (URLs ou objets selon le JSON)
 */
export async function fetchDefaultImages() {
  console.log('fetchDefaultImages: starting fetch');
  try {
    const response = await fetch('/test-data.json');
    if (!response.ok) {
      throw new Error('Erreur HTTP : ' + response.status);
    }
    const data = await response.json();
    console.log(`fetchDefaultImages: fetched ${Array.isArray(data) ? data.length : 'unknown'} images`);
    return data;
  } catch (error) {
    console.error('Erreur lors du chargement du fichier JSON :', error);
    throw error;
  }
}

/**
 * Scrape toutes les images (balises <img> et backgrounds CSS) de la page courante.
 * @returns {string[]} Tableau d'URLs d'images trouvées sur la page
 */
export function scrapeImagesFromPage() {
  console.log('scrapeImagesFromPage: start scraping images');
  // Récupérer les src des balises <img>
  const imgTags = Array.from(document.querySelectorAll('img'));
  const imgSrcs = imgTags.map(img => img.src).filter(Boolean);
  console.log(`scrapeImagesFromPage: found ${imgSrcs.length} <img> sources`);

  // Récupérer les URLs d'images de background CSS
  const allElements = Array.from(document.querySelectorAll('*'));
  const bgImages = allElements
    .map(el => getComputedStyle(el).backgroundImage)
    .filter(bg => bg && bg !== 'none')
    .map(bg => {
      const matches = Array.from(bg.matchAll(/url\(["']?(.*?)["']?\)/g));
      return matches.map(m => m[1]);
    })
    .flat();
  console.log(`scrapeImagesFromPage: found ${bgImages.length} background images`);

  // Récupérer les URLs depuis l'attribut `backgroundimage`
  const attrElements = Array.from(document.querySelectorAll('[backgroundimage]'));
  const attrImages = attrElements
    .map(el => el.getAttribute('backgroundimage'))
    .filter(Boolean);
  console.log(`scrapeImagesFromPage: found ${attrImages.length} attribute backgroundimage images`);

  // Fusionner et dédupliquer
  const allUrls = Array.from(new Set([...imgSrcs, ...attrImages, ...bgImages]));
  console.log(`scrapeImagesFromPage: total unique images = ${allUrls.length}`);
  return allUrls;
}

/**
 * Renvoie les images selon l'URL courante :
 * - Sur http://localhost:5173/ -> fetchDefaultImages()
 * - Sinon -> scrapeImagesFromPage()
 * @returns {Promise<string[]> | Promise<any[]>}
 */
export async function getImages() {
  // Communiquer avec le content script pour récupérer les images de la page active
  return new Promise((resolve, reject) => {
    chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
      if (!tab?.id) {
        return reject(new Error('No active tab'));
      }
      chrome.tabs.sendMessage(
        tab.id,
        { type: 'SCRAPE_IMAGES' },
        (response) => {
          if (chrome.runtime.lastError) {
            return reject(chrome.runtime.lastError);
          }
          resolve(response.images || []);
        }
      );
    });
  });
}

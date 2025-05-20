// src/services/contentScript.js

/**
 * Récupère les URLs des balises <img>.
 * @returns {string[]}
 */
function collectImgTagUrls() {
  const urls = Array.from(document.images)
    .map(img => img.src)
    .filter(Boolean);
  // Affiche le tableau complet pour debug pédagogique
  console.log('[contentScript] collectImgTagUrls tableau:', urls);
  console.log(`[contentScript] collectImgTagUrls: ${urls.length} URLs`);
  return urls;
}

/**
 * Récupère les URLs des background-image CSS.
 * @returns {string[]}
 */
function collectCssBackgroundUrls() {
  const urls = Array.from(document.querySelectorAll('*'))
    .flatMap(el => {
      const bg = getComputedStyle(el).backgroundImage;
      if (!bg || bg === 'none') return [];
      return Array.from(bg.matchAll(/url\(["']?(.*?)["']?\)/g)).map(m => m[1]);
    })
    .filter(Boolean);
  const unique = Array.from(new Set(urls));
  // Affiche le tableau complet pour debug pédagogique
  console.log('[contentScript] collectCssBackgroundUrls tableau:', unique);
  console.log(`[contentScript] collectCssBackgroundUrls: ${unique.length} URLs`);
  return unique;
}

/**
 * Récupère les URLs depuis l'attribut personnalisé backgroundimage.
 * @returns {string[]}
 */
function collectAttrUrls() {
  const urls = Array.from(document.querySelectorAll('[backgroundimage]'))
    .map(el => el.getAttribute('backgroundimage'))
    .filter(Boolean);
  const unique = Array.from(new Set(urls));
  // Affiche le tableau complet pour debug pédagogique
  console.log('[contentScript] collectAttrUrls tableau:', unique);
  console.log(`[contentScript] collectAttrUrls: ${unique.length} URLs`);
  return unique;
}

/**
 * Filtre les images dont la largeur naturelle dépasse le seuil.
 * @param {string[]} urls
 * @param {number} threshold
 * @returns {Promise<string[]>}
 */
function filterLargeImages(urls, threshold = 500) {
  console.log(`[contentScript] filterLargeImages: testing ${urls.length} URLs`);
  const promises = urls.map(url => new Promise(resolve => {
    const img = new Image();
    img.src = url;
    img.onload = () => resolve({ url, width: img.naturalWidth });
    img.onerror = () => resolve(null);
  }));
  return Promise.all(promises).then(results => {
    const filtered = results
      .filter(item => item && item.width > threshold)
      .map(item => item.url);
    console.log(`[contentScript] filterLargeImages: ${filtered.length} URLs > ${threshold}px`);
    return filtered;
  });
}

/**
 * Agrège toutes les URLs, dedupe, et filtre par largeur.
 * @param {number} threshold
 * @returns {Promise<string[]>}
 */
function collectAllImages(threshold = 500) {
  const imgUrls = collectImgTagUrls();
  const cssUrls = collectCssBackgroundUrls();
  const attrUrls = collectAttrUrls();
  const all = Array.from(new Set([...imgUrls, ...cssUrls, ...attrUrls]));
  console.log(`[contentScript] collectAllImages: total unique URLs = ${all.length}`);
  return filterLargeImages(all, threshold);
}

/**
 * Listener pour messages Chrome, répond de manière asynchrone.
 */
function registerChromeMessageListener() {
  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    console.log(`[contentScript] onMessage received:`, msg);
    if (msg.type === 'SCRAPE_IMAGES') {
      const threshold = msg.threshold || 500;
      collectAllImages(threshold).then(images => {
        console.log(`[contentScript] Sending ${images.length} images`, images);
        sendResponse({ images });
      });
      return true;
    }
  });
}

// Initialisation du listener
registerChromeMessageListener();
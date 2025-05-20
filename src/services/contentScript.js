// src/contentScript.js

function collectPageImages() {
    // 1) <img>
    const imgSrcs = Array.from(document.images)
      .map(img => img.src)
      .filter(Boolean);
  
    // 2) CSS background-image
    const bgImages = Array.from(document.querySelectorAll('*'))
      .flatMap(el => {
        const bg = getComputedStyle(el).backgroundImage;
        if (!bg || bg === 'none') return [];
        return Array.from(bg.matchAll(/url\(["']?(.*?)["']?\)/g))
                    .map(m => m[1]);
      });
  
    // 3) attribut HTML personnalisé
    const attrImages = Array.from(document.querySelectorAll('[backgroundimage]'))
      .map(el => el.getAttribute('backgroundimage'))
      .filter(Boolean);
  
    // Dedup
    return Array.from(new Set([...imgSrcs, ...bgImages, ...attrImages]));
  }
  
  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.type === 'SCRAPE_IMAGES') {
      sendResponse({ images: collectPageImages() });
    }
    // return true si async, pas utile ici
  });
  
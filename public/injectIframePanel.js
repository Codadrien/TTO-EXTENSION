function injectIframePanel() {
    const existingIframe = document.getElementById('custom-side-panel');
  
    if (existingIframe) {
      // Si l'iframe existe déjà, on la retire
      existingIframe.remove();
      return;
    }
  
    // Sinon, on la crée et on l'affiche
    const iframe = document.createElement('iframe');
    iframe.id = 'custom-side-panel';
    iframe.className = 'custom-side-panel';
    iframe.src = chrome.runtime.getURL('index.html');
  
    document.body.appendChild(iframe);
  
    requestAnimationFrame(() => {
      iframe.classList.add('visible');
    });
  }
  
  injectIframePanel();
  
chrome.action.onClicked.addListener((tab) => {
  console.log('[background] action icon clicked, tab:', tab.id);
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: () => {
      const containerId = 'tto-extension-container';
      console.log('[tto] toggle panel, containerId:', containerId);

      // Vérifier si le panneau est déjà ouvert
      const existing = document.getElementById(containerId);
      
      if (existing) {
        // Si le panneau est ouvert, on le ferme
        console.log('[tto] removing panel');
        
        // Unmount React root pour clean
        if (window.__ttoRoot) {
          try { window.__ttoRoot.unmount(); } catch (e) { console.warn('Unmount error', e); }
        }
        
        // Supprimer le container
        existing.remove();
        
        // Notifier le script de contenu que le panneau est fermé
        document.dispatchEvent(new CustomEvent('TTO_PANEL_CLOSED'));
        
      } else {
        // Si le panneau est fermé, on l'ouvre
        console.log('[tto] injecting React UI directly (no iframe)');
        
        // RESET COMPLET : Supprimer toute trace de l'ancienne instance
        // Supprimer l'ancien script s'il existe
        const oldScript = document.querySelector('script[src*="main.js"]');
        if (oldScript) {
          console.log('[tto] Removing old script');
          oldScript.remove();
        }
        
        // Créer le container
        const container = document.createElement('div');
        container.id = containerId;
        
        // Appliquer les styles
        Object.assign(container.style, {
          position: 'fixed',
          top: '0',
          right: '0',
          width: '500px',
          height: '100%',
          zIndex: '999999',
          backgroundColor: '#fff',
          boxShadow: '-4px 0 16px rgba(0,0,0,0.15)',
          overflow: 'auto'
        });
        
        // Ajouter l'élément racine pour React
        const appRoot = document.createElement('div');
        appRoot.id = 'tto-extension-root';
        container.appendChild(appRoot);
        document.body.appendChild(container);
        
        // S'assurer que les styles sont chargés
        const oldStyle = document.querySelector('link[href*="index-"]');
        if (oldStyle) {
          console.log('[tto] Removing old style');
          oldStyle.remove();
        }
        
        // Ajouter le style CSS
        const styleLink = document.createElement('link');
        styleLink.rel = 'stylesheet';
        styleLink.href = chrome.runtime.getURL('assets/index-1b1a0eab.css');
        document.head.appendChild(styleLink);
        
        // Charger un nouveau script à chaque fois
        console.log('[tto] Loading fresh main.js script');
        const script = document.createElement('script');
        script.src = chrome.runtime.getURL('main.js') + '?t=' + Date.now(); // Ajouter un timestamp pour éviter le cache
        script.type = 'module';
        script.onload = () => {
          console.log('[tto] Script loaded, calling initTTO');
          // Une fois le script chargé, on appelle initTTO
          if (window.initTTO) {
            window.initTTO();
            
            // Dispatcher l'événement pour lancer la collecte d'images
            // seulement après que React soit monté
            setTimeout(() => {
              document.dispatchEvent(new CustomEvent('TTO_PANEL_OPENED'));
            }, 100);
          } else {
            console.error('[tto] window.initTTO not found after script load!');
          }
        };
        document.head.appendChild(script);
      }
    }
  });
});
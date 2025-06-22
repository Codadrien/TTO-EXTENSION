// Panel manager - Gère l'injection et le toggle du panneau dans la page web

// Fonction injectée dans la page pour toggler le panneau
export function toggleTTO() {
  const containerId = 'tto-extension-container';

  // Configuration
  const PANEL_WIDTH = 515;
  const PANEL_HEIGHT_RATIO = 0.7;
  const MAX_PANEL_HEIGHT = 600;

  // Ouvre le panneau
  function openPanel() {
    console.debug('[TTO_DEBUG] openPanel called');
    const existing = document.getElementById(containerId);
    if (existing) {
      console.debug('[TTO_DEBUG] Panel exists, state:', existing._ttoClosing ? 'closing' : 'open');
      
      // Interrompt toute fermeture en cours
      if (existing._ttoClosing) {
        console.debug('[TTO_DEBUG] Interrupting close animation');
        
        // Invalide l'ID de fermeture pour que les événements transitionend soient ignorés
        existing._ttoCloseId = null;
        
        // Nettoie l'ancien handler
        if (existing._ttoTransitionHandler) {
          existing.removeEventListener('transitionend', existing._ttoTransitionHandler, { capture: true });
          existing._ttoTransitionHandler = null;
        }
        
        // Réactive le panneau
        existing.classList.add('tto-panel-visible');
        existing._ttoClosing = false;
      }
      
      return;
    }

    const oldScript = document.querySelector('script[src*="main.js"]');
    if (oldScript) {
      oldScript.remove();
    }

    const oldStyle = document.querySelector('link[href*="index-"]');
    if (oldStyle) {
      oldStyle.remove();
    }

    const styleLink = document.createElement('link');
    styleLink.rel = 'stylesheet';
    // Charger le CSS sans hash généré index.css
    styleLink.href = chrome.runtime.getURL('assets/index.css');
    document.head.appendChild(styleLink);

    const container = document.createElement('div');
    container.id = containerId;
    Object.assign(container.style, {
      position: 'fixed',
      left: (window.innerWidth - PANEL_WIDTH) + 'px',
      top: '0',
      width: PANEL_WIDTH + 'px',
      height: Math.min(window.innerHeight * PANEL_HEIGHT_RATIO, MAX_PANEL_HEIGHT) + 'px',
      zIndex: '999999',
      backgroundColor: '#fff',
      borderRadius: '0px 0px 0px 15px',
      boxShadow: '-5px 5px 10px rgba(0, 0, 0, 0.15)',
      overflow: 'auto',
      right: 'auto', // Important pour permettre le drag horizontal
      maxHeight: 'none',
      transform: 'translateX(100%)'
      // Suppression du style inline de transition pour éviter les conflits avec le CSS
    });

    const appRoot = document.createElement('div');
    appRoot.id = 'tto-extension-root';
    container.appendChild(appRoot);

    // Placeholder de chargement
    const loader = document.createElement('div');
    loader.id = 'tto-loading';
    loader.textContent = 'Chargement...';
    appRoot.appendChild(loader);

    document.body.appendChild(container);

    // SÉQUENCE CRITIQUE pour l'animation :
    // 1. État initial caché (déjà défini dans les styles)
    // 2. Ajout au DOM (fait ci-dessus)
    // 3. Forcer le navigateur à peindre l'état initial
    window.getComputedStyle(container).transform; // Force un reflow
    
    // 4. Dans la prochaine frame, déclencher la transition
    // Attendre un peu plus longtemps pour s'assurer que le DOM est bien peint
    setTimeout(() => {
      // Ajouter une classe pour déclencher l'animation plutôt que de modifier le style directement
      container.classList.add('tto-panel-visible');
    }, 50);

    const script = document.createElement('script');
    script.src = chrome.runtime.getURL('main.js') + '?t=' + Date.now();
    script.type = 'module';
    script.onload = () => {
      const l = document.getElementById('tto-loading');
      if (l) {
        l.remove();
      }
      if (window.initTTO) {
        window.initTTO();
      }
      setTimeout(() => {
        document.dispatchEvent(new CustomEvent('TTO_PANEL_OPENED'));
      }, 100);
    };
    document.head.appendChild(script);

    // Le conteneur est maintenant draggable/resizable via le composant React DraggableContainer
  }

  // Ferme le panneau
  function closePanel(container) {
    console.debug('[TTO_DEBUG] closePanel', container.id);
    if (window.__ttoRoot) { 
      try { 
        window.__ttoRoot.unmount(); 
      } catch (err) { 
        console.debug('[TTO_DEBUG] Error unmounting React root:', err);
      }
    }
    container.classList.remove('tto-panel-visible');
    container._ttoClosing = true;
    // Nettoie l'ancien handler si besoin
    if (container._ttoTransitionHandler) {
      container.removeEventListener('transitionend', container._ttoTransitionHandler, { capture: true });
      container._ttoTransitionHandler = null;
    }
    
    // Création d'un nouvel identifiant unique pour cette fermeture
    const closeId = Date.now();
    container._ttoCloseId = closeId;
    
    container._ttoTransitionHandler = function (event) {
      console.debug('[TTO_DEBUG] transitionend', 'target=', event.target, 'prop=', event.propertyName, 'closing=', container._ttoClosing, 'closeId=', closeId);
      
      // Vérifie que l'événement vient bien du conteneur et concerne transform
      if (event.target !== container || event.propertyName !== 'transform') {
        return; // Ignore les événements des enfants ou d'autres propriétés
      }
      
      // Vérifie que cette fermeture est toujours valide
      if (container._ttoCloseId !== closeId) {
        console.debug('[TTO_DEBUG] Ignoring stale transition event for closeId', closeId);
        return;
      }
      
      // Ne ferme que si le panneau est encore en fermeture ET que la classe n'est plus là (pas rouvert)
      if (container._ttoClosing && !container.classList.contains('tto-panel-visible')) {
        // Nettoyage avant suppression
        container.removeEventListener('transitionend', container._ttoTransitionHandler, { capture: true });
        container._ttoTransitionHandler = null;
        container._ttoClosing = false;
        
        // Suppression effective
        container.remove();
        document.dispatchEvent(new CustomEvent('TTO_PANEL_CLOSED'));
      }
    };
    
    container.addEventListener('transitionend', container._ttoTransitionHandler, { capture: true });
  }

  // Toggle selon existence
  function togglePanel() {
    const existing = document.getElementById(containerId);
    if (existing) {
      if (existing._ttoClosing) {
        // Interrompt la fermeture et rouvre instantanément
        openPanel();
      } else {
        closePanel(existing);
      }
    } else {
      openPanel();
    }
  }

  // Exécution du toggle
  togglePanel();
}

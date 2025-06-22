// Panel manager - Gère l'injection et le toggle du panneau dans la page web

// Fonction injectée dans la page pour toggler le panneau
export function toggleTTO() {
  // Utiliser uniquement des classes pour la cohérence
  const containerClass = 'tto-extension-container';
  const containerId = 'tto-extension-container'; // Garder l'ID pour la sélection

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

    // Créer le conteneur avec l'ID et les classes nécessaires
    const container = document.createElement('div');
    container.id = containerId;
    container.classList.add(containerClass); // Classe pour les animations
    Object.assign(container.style, {
      position: 'fixed',
      right: '0',
      left: 'auto',
      top: '0',
      width: PANEL_WIDTH + 'px',
      height: Math.min(window.innerHeight * PANEL_HEIGHT_RATIO, MAX_PANEL_HEIGHT) + 'px',
      zIndex: '999999',
      backgroundColor: '#fff',
      borderRadius: '0px 0px 0px 15px',
      boxShadow: '-5px 5px 10px rgba(0, 0, 0, 0.15)',
      overflow: 'auto',
      maxHeight: 'none'
      // Suppression du style inline de transition pour éviter les conflits avec le CSS
    });

    // Placeholder de chargement directement dans le conteneur
    const loader = document.createElement('div');
    loader.id = 'tto-loading';
    loader.textContent = 'Chargement...';
    loader.style.cssText = 'padding: 20px; text-align: center; color: #666;';
    container.appendChild(loader);

    document.body.appendChild(container);

    // SÉQUENCE CRITIQUE pour l'animation :
    // 1. Appliquer explicitement l'état initial caché avant l'ajout au DOM
    container.style.transform = 'translateX(100%)';
    
    // 2. Ajout au DOM (fait ci-dessus)
    // 3. Forcer le navigateur à peindre l'état initial
    window.getComputedStyle(container).transform; // Force un reflow
    
    // 4. Supprimer le style inline pour laisser le CSS prendre le relais
    container.style.transform = '';
    
    // 5. Dans la prochaine frame, déclencher la transition avec un délai suffisant
    setTimeout(() => {
      // Ajouter une classe pour déclencher l'animation plutôt que de modifier le style directement
      container.classList.add('tto-panel-visible');
    }, 100); // Délai augmenté pour s'assurer que tout est bien initialisé

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
    // Nouvelle logique: fermeture fluide jusqu'au bord droit, même après drag
    // Vérifie si le panneau a été déplacé via l'attribut data-dragged ou le style left
    const hasBeenDragged = container.getAttribute('data-dragged') === 'true';
    const hasLeftPosition = container.style.left && container.style.left !== 'auto' && container.style.left !== '0px';
    const isDocked = !hasBeenDragged && (!hasLeftPosition || container.style.right === '0px' || container.style.right === '0');

    if (!isDocked) {
      console.debug('[TTO_DEBUG] Panneau déplacé détecté:', { hasBeenDragged, hasLeftPosition, left: container.style.left });
      
      // Solution simplifiée avec transition très longue
      container.style.transition = 'transform 2s cubic-bezier(.5,1.6,.4,1)';
      container.style.right = 'auto';
      
      // Distance exagérée pour garantir la sortie complète
      // 3000px devrait être suffisant pour tous les écrans
      container.style.transform = 'translateX(3000px)';
      
      console.debug('[TTO_DEBUG] Animation de sortie simplifiée');

      // Handler de fin de transition
      const onTransformEnd = (event) => {
        if (event.target === container && event.propertyName === 'transform') {
          console.debug('[TTO_DEBUG] Fin de l\'animation de sortie');
          container.removeEventListener('transitionend', onTransformEnd);
          // Suppression effective
          container.remove();
          document.dispatchEvent(new CustomEvent('TTO_PANEL_CLOSED'));
        }
      };
      container.addEventListener('transitionend', onTransformEnd);
      return;
    }
    // Sinon: logique standard (panel docké à droite, animation CSS)
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

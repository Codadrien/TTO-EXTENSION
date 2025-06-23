// Gestionnaire de drag simple pour le conteneur principal
export function initDragHandler() {
  const container = document.getElementById('tto-extension-container');
  if (!container) return;

  let isDragging = false;
  let dragStart = { x: 0, y: 0 };
  let containerStart = { x: 0, y: 0 };

  // Fonction pour démarrer le drag
  function startDrag(e) {
    // Vérifier si on clique sur l'en-tête ou un élément avec la classe drag-handle
    const target = e.target;
    const isHeader = target.closest('.header-container') || target.closest('.drag-handle');
    
    if (!isHeader) return;

    e.preventDefault();
    isDragging = true;
    
    dragStart.x = e.clientX;
    dragStart.y = e.clientY;
    
    const rect = container.getBoundingClientRect();
    containerStart.x = rect.left;
    containerStart.y = rect.top;
    
    // Appliquer les border-radius et l'ombre lorsqu'on commence à déplacer l'extension
    container.style.borderRadius = '10px';
    container.style.boxShadow = 'rgba(0, 0, 0, 0.60) 0px 5px 15px';
    const dragHandle = container.querySelector('.drag-handle') || container.querySelector('.header-container');
    if (dragHandle) {
      dragHandle.style.borderRadius = '5px 5px 0 0';
    }
    
    // Marquer le conteneur comme déplacé
    container.setAttribute('data-dragged', 'true');
    
    container.style.transition = 'none';
    document.addEventListener('mousemove', handleDrag);
    document.addEventListener('mouseup', stopDrag);
    document.body.style.userSelect = 'none';
  }

  // Fonction pour gérer le drag
  function handleDrag(e) {
    if (!isDragging) return;
    
    const deltaX = e.clientX - dragStart.x;
    const deltaY = e.clientY - dragStart.y;
    
    let newX = containerStart.x + deltaX;
    let newY = containerStart.y + deltaY;
    
    // Contraintes pour rester dans la fenêtre
    const containerRect = container.getBoundingClientRect();
    const maxX = window.innerWidth - containerRect.width;
    const maxY = window.innerHeight - containerRect.height;
    
    newX = Math.max(0, Math.min(newX, maxX));
    newY = Math.max(0, Math.min(newY, maxY));
    
    container.style.left = newX + 'px';
    container.style.top = newY + 'px';
    container.style.right = 'auto'; // S'assurer que right est auto quand on déplace
  }

  // Fonction pour arrêter le drag
  function stopDrag() {
    if (!isDragging) return;
    
    isDragging = false;
    
    // Réinitialiser les border-radius lorsqu'on arrête de déplacer l'extension
    // On ne les réinitialise pas pour garder l'apparence arrondie après le déplacement
    // container.style.borderRadius = '';
    // const dragHandle = container.querySelector('.drag-handle') || container.querySelector('.header-container');
    // if (dragHandle) {
    //   dragHandle.style.borderRadius = '';
    // }
    
    container.style.transition = '';
    document.removeEventListener('mousemove', handleDrag);
    document.removeEventListener('mouseup', stopDrag);
    document.body.style.userSelect = '';
  }

  // Ajouter l'écouteur d'événement
  container.addEventListener('mousedown', startDrag);

  // Fonction de nettoyage
  return () => {
    container.removeEventListener('mousedown', startDrag);
    document.removeEventListener('mousemove', handleDrag);
    document.removeEventListener('mouseup', stopDrag);
  };
}

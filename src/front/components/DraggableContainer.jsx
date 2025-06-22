import React, { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Composant qui rend tout le conteneur de l'extension draggable
 * Ce composant doit être utilisé au niveau le plus haut de l'application
 */
const DraggableContainer = ({ children }) => {
  // État pour position et taille
  const [state, setState] = useState({
    x: window.innerWidth - 515,
    y: 0,
    width: 515,
    height: Math.min(window.innerHeight * 0.7, 600),
    isDragging: false
  });

  // Références pour le drag
  const containerRef = useRef(null);
  const dragStartRef = useRef({ x: 0, y: 0 });


  // Appliquer les styles au conteneur parent DOM et au footer
  useEffect(() => {
    const container = document.getElementById('tto-extension-container');
    const footer = document.querySelector('.footer-bar');
    
    if (container) {
      container.style.position = 'fixed';
      container.style.top = `${state.y}px`;
      container.style.left = `${state.x}px`;
      container.style.width = `${state.width}px`;
      container.style.height = `${state.height}px`;
      container.style.right = 'auto';
      container.style.maxHeight = 'none';
      container.style.transition = state.isDragging || state.isResizing ? 'none' : '';
      container.style.zIndex = '999999';
      
      // Ajuster la position du footer pour qu'il suive le panneau
      if (footer) {
        footer.style.right = `${window.innerWidth - state.x - state.width}px`;
      }
    }
  }, [state]);

  // Démarrer le drag
  const startDrag = useCallback((e) => {
    // Vérifier si on clique sur le header
    const header = e.target.closest('.drag-handle, .header-container');
    if (!header) return;
    
    // Ignorer si on clique sur un handle de resize
    if (e.target.closest('.resize-handle')) return;
    
    setState(prev => ({ ...prev, isDragging: true }));
    dragStartRef.current = {
      x: e.clientX - state.x,
      y: e.clientY - state.y
    };
    
    e.preventDefault();
  }, [state.x, state.y]);



  // Gérer le mouvement (drag)
  const handleMouseMove = useCallback((e) => {
    if (!state.isDragging) return;
    
    // Calculer nouvelle position
    const newX = e.clientX - dragStartRef.current.x;
    const newY = e.clientY - dragStartRef.current.y;
    
    // Contraintes
    const maxX = window.innerWidth - 100;
    const maxY = window.innerHeight - 50;
    
    setState(prev => ({
      ...prev,
      x: Math.max(0, Math.min(newX, maxX)),
      y: Math.max(0, Math.min(newY, maxY))
    }));
  }, [state]);

  // Arrêter drag
  const stopDrag = useCallback(() => {
    if (state.isDragging) {
      setState(prev => ({ 
        ...prev, 
        isDragging: false
      }));
    }
  }, [state.isDragging]);

  // Ajouter/supprimer les event listeners
  useEffect(() => {
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', stopDrag);
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', stopDrag);
    };
  }, [handleMouseMove, stopDrag]);



  return (
    <div 
      ref={containerRef}
      className="draggable-container"
      onMouseDown={startDrag}
      style={{ 
        width: '100%', 
        height: '100%',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      <div style={{ width: '100%', height: '100%', overflow: 'auto' }}>
        {children}
      </div>
    </div>
  );
};

export default DraggableContainer;

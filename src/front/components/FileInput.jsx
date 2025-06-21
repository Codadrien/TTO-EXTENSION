import React, { useRef, forwardRef, useImperativeHandle } from 'react';

/**
 * Composant FileInput - Input de fichier caché avec méthodes exposées
 * @param {Function} onFileImport - Fonction appelée lors de la sélection de fichiers
 */
const FileInput = forwardRef(({ onFileImport }, ref) => {
  const fileInputRef = useRef(null);

  // Expose la méthode click pour le composant parent
  useImperativeHandle(ref, () => ({
    click: () => {
      if (fileInputRef.current) {
        fileInputRef.current.click();
      }
    }
  }));

  return (
    <input 
      type="file" 
      ref={fileInputRef} 
      onChange={onFileImport} 
      accept=".zip,.jpg,.jpeg,.png,.gif,.webp,.avif,.svg" 
      style={{ display: 'none' }}
      multiple 
    />
  );
});

FileInput.displayName = 'FileInput';

export default FileInput;

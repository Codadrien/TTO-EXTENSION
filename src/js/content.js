// Point d'entrée de l'application
console.log('[TTO-EXTENSION] Initialisation du content script');

// Vérifie si l'extension a les permissions nécessaires
chrome.runtime.sendMessage({ type: 'checkPermissions' }, response => {
    console.log('[TTO-EXTENSION] État des permissions:', response);
});

// Crée une instance de la barre latérale
const sidebar = new Sidebar();
console.log('[TTO-EXTENSION] Barre latérale initialisée');

// Crée une instance du gestionnaire d'événements et lui passe la barre latérale
const eventHandlers = new EventHandlers(sidebar);
console.log('[TTO-EXTENSION] Gestionnaire d\'événements initialisé');

// Configure le bouton de téléchargement pour utiliser le DownloadManager
sidebar.downloadButton.addEventListener('click', () => {
    console.log('[TTO-EXTENSION] Tentative de téléchargement des images');
    const images = sidebar.getSelectedImages();
    console.log('[TTO-EXTENSION] Nombre d\'images à télécharger:', images.length);
    DownloadManager.downloadImages(images);
});
// Point d'entrée de l'application
// Crée une instance de la barre latérale
const sidebar = new Sidebar();

// Crée une instance du gestionnaire d'événements et lui passe la barre latérale
const eventHandlers = new EventHandlers(sidebar);

// Configure le bouton de téléchargement pour utiliser le DownloadManager
sidebar.downloadButton.addEventListener('click', () => {
    DownloadManager.downloadImages(sidebar.getSelectedImages());
});
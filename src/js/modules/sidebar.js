// Classe gérant la barre latérale et la collection d'images
class Sidebar {
    constructor() {
        // Initialisation des propriétés de la classe
        this.sidebar = null; // Élément DOM de la barre latérale
        this.sidebarContent = null; // Conteneur des images dans la barre
        this.toggleButton = null; // Bouton pour afficher/masquer la barre
        this.downloadButton = null; // Bouton pour télécharger les images
        this.selectedImages = []; // Tableau des images sélectionnées
        this.init(); // Initialisation de la barre
    }

    // Méthode d'initialisation qui crée tous les éléments nécessaires
    init() {
        this.createSidebar();
        this.createToggleButton();
        this.createDownloadButton();
        this.setupEventListeners();
    }

    // Crée l'élément de la barre latérale et son conteneur
    createSidebar() {
        this.sidebar = document.createElement('div');
        this.sidebar.id = Constants.SIDEBAR_ID;
        this.sidebar.className = 'sidebar';
        document.body.appendChild(this.sidebar);

        this.sidebarContent = document.createElement('div');
        this.sidebarContent.className = Constants.SIDEBAR_CONTENT_CLASS;
        this.sidebar.appendChild(this.sidebarContent);
    }

    // Crée le bouton pour afficher/masquer la barre latérale
    createToggleButton() {
        this.toggleButton = document.createElement('button');
        this.toggleButton.id = Constants.TOGGLE_BUTTON_ID;
        this.toggleButton.textContent = 'Toggle Sidebar';
        document.body.appendChild(this.toggleButton);
    }

    // Crée le bouton pour télécharger toutes les images
    createDownloadButton() {
        this.downloadButton = document.createElement('button');
        this.downloadButton.className = Constants.DOWNLOAD_BUTTON_CLASS;
        this.downloadButton.innerText = 'Télécharger toutes les images';
        this.sidebar.appendChild(this.downloadButton);
    }

    // Configure les écouteurs d'événements pour les boutons
    setupEventListeners() {
        this.toggleButton.addEventListener('click', () => {
            this.sidebar.classList.toggle('open');
        });
    }

    // Ajoute une nouvelle image à la collection
    addImage(src) {
        this.selectedImages.push(src);
        this.updateContent();
    }

    // Supprime une image de la collection par son index
    removeImage(index) {
        this.selectedImages.splice(index, 1);
        this.updateContent();
    }

    // Met à jour l'affichage du contenu de la barre latérale
    updateContent() {
        this.sidebarContent.innerHTML = '';

        // Pour chaque image sélectionnée, crée un élément dans la barre
        this.selectedImages.forEach((src, index) => {
            const wrapper = document.createElement('div');
            wrapper.className = Constants.COLLECTED_IMAGE_CLASS;

            // Crée l'élément image
            const img = document.createElement('img');
            img.src = src;
            img.style.width = '100%';

            // Crée le bouton de suppression
            const deleteBtn = document.createElement('button');
            deleteBtn.className = Constants.DELETE_BUTTON_CLASS;
            deleteBtn.textContent = 'X';
            deleteBtn.onclick = () => this.removeImage(index);

            // Assemble les éléments
            wrapper.appendChild(img);
            wrapper.appendChild(deleteBtn);
            this.sidebarContent.appendChild(wrapper);
        });

        // Affiche ou cache la barre selon qu'il y a des images ou non
        this.sidebar.style.display = this.selectedImages.length > 0 ? 'block' : 'none';
    }

    // Retourne le tableau des images sélectionnées
    getSelectedImages() {
        return this.selectedImages;
    }

    // Vide la collection d'images
    clearSelectedImages() {
        this.selectedImages = [];
        this.updateContent();
    }
}
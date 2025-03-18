// Variable pour suivre si la touche Ctrl est enfoncée
let isCtrlPressed = false;

// Variable pour suivre le dernier élément surligné
let lastHighlightedElement = null;

// Variable pour suivre l'état actif
let isActive = false;

// Tableau pour stocker les images sélectionnées
let selectedImages = [];

// Création du panneau latéral
const sidebar = document.createElement('div');
sidebar.id = 'image-sidebar';
sidebar.className = 'sidebar'; // Ajout de la classe 'sidebar'
document.body.appendChild(sidebar);

const sidebarContent = document.createElement('div');
sidebarContent.className = 'sidebar-content';
sidebar.appendChild(sidebarContent);

// Création du bouton toggle
const toggleButton = document.createElement('button');
toggleButton.id = 'toggle-sidebar';
toggleButton.textContent = 'Toggle Sidebar';
document.body.appendChild(toggleButton);

toggleButton.addEventListener('click', () => {
    sidebar.classList.toggle('open');
});

// Bouton pour télécharger toutes les images
const downloadButton = document.createElement('button');
downloadButton.className = 'dl-button';
downloadButton.innerText = 'Télécharger toutes les images';
sidebar.appendChild(downloadButton);

downloadButton.addEventListener('click', downloadImages);

// Événement pour détecter quand la touche Ctrl est enfoncée
document.addEventListener('keydown', function (e) {
    if (e.key === 'Control') {
        isCtrlPressed = true;
        isActive = true;
        document.body.classList.add('inspection-mode');
    } else if (e.key === 'x' && e.ctrlKey) {
        downloadImages();
    }
});

// Événement pour détecter quand la touche Ctrl est relâchée
document.addEventListener('keyup', function (e) {
    if (e.key === 'Control') {
        isCtrlPressed = false;
        isActive = false;
        document.body.classList.remove('inspection-mode');
        if (lastHighlightedElement) {
            lastHighlightedElement.classList.remove('highlight');
            lastHighlightedElement = null;
        }
        removeHighlights();
    }
});

// Événement pour détecter le mouvement de la souris
document.addEventListener('mousemove', function (e) {
    if (!isCtrlPressed) return;

    const element = document.elementFromPoint(e.clientX, e.clientY);
    if (element && (element.tagName === 'IMG' || element.tagName === 'CANVAS')) {
        if (lastHighlightedElement) {
            lastHighlightedElement.classList.remove('highlight');
        }
        element.classList.add('highlight');
        lastHighlightedElement = element;
    }
});

document.addEventListener('mouseover', (e) => {
    if (isActive) {
        removeHighlights();
        if (e.target.tagName === 'IMG') {
            e.target.classList.add('highlight-element');
        }
    }
});

document.addEventListener('click', (e) => {
    if (isActive && e.target.tagName === 'IMG') {
        e.preventDefault();
        addImageToSidebar(e.target.src);
    }
});

function removeHighlights() {
    document.querySelectorAll('.highlight-element').forEach(el => {
        el.classList.remove('highlight-element');
    });
}

function addImageToSidebar(src) {
    selectedImages.push(src);
    updateSidebar();
}

function updateSidebar() {
    sidebarContent.innerHTML = '';

    selectedImages.forEach((src, index) => {
        const wrapper = document.createElement('div');
        wrapper.className = 'collected-image';

        const img = document.createElement('img');
        img.src = src;
        img.style.width = '100%'; // L'image prend 100% de la largeur du volet

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-btn';
        deleteBtn.textContent = 'X';
        deleteBtn.onclick = () => {
            selectedImages.splice(index, 1);
            updateSidebar();
        };

        wrapper.appendChild(img);
        wrapper.appendChild(deleteBtn);
        sidebarContent.appendChild(wrapper);
    });

    // Afficher le volet si des images sont présentes
    sidebar.style.display = selectedImages.length > 0 ? 'block' : 'none';
}

async function downloadImages() {
    if (selectedImages.length === 0) return;

    const baseName = prompt('Entrez le nom de base pour les fichiers:', 'image');
    if (!baseName) return;

    for (let i = 0; i < selectedImages.length; i++) {
        const extension = selectedImages[i].split('.').pop().split('?')[0];
        const filename = `${baseName}_${i + 1}.${extension}`;

        try {
            const response = await fetch(selectedImages[i]);
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);

            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error(`Erreur lors du téléchargement de l'image ${i + 1}:`, error);
        }
    }
}
// Classe gérant tous les événements de l'application (clavier, souris)
class EventHandlers {
    constructor(sidebar) {
        this.sidebar = sidebar; // Référence à l'instance de Sidebar
        this.isCtrlPressed = false; // État de la touche Ctrl
        this.isActive = false; // État du mode sélection
        this.lastHighlightedElement = null; // Dernier élément surligné
        this.setupEventListeners(); // Configuration des écouteurs
    }

    // Configure tous les écouteurs d'événements
    setupEventListeners() {
        document.addEventListener('keydown', this.handleKeyDown.bind(this));
        document.addEventListener('keyup', this.handleKeyUp.bind(this));
        document.addEventListener('mousemove', this.handleMouseMove.bind(this));
        document.addEventListener('mouseover', this.handleMouseOver.bind(this));
        document.addEventListener('click', this.handleClick.bind(this));
    }

    // Gère les événements de touche enfoncée
    handleKeyDown(e) {
        if (e.key === 'Control') {
            // Active le mode sélection quand Ctrl est enfoncé
            this.isCtrlPressed = true;
            this.isActive = true;
            document.body.classList.add('inspection-mode');
        } else if (e.key === 'x' && e.ctrlKey) {
            // Déclenche le téléchargement avec Ctrl+X
            this.sidebar.downloadButton.click();
        }
    }

    // Gère les événements de touche relâchée
    handleKeyUp(e) {
        if (e.key === 'Control') {
            // Désactive le mode sélection quand Ctrl est relâché
            this.isCtrlPressed = false;
            this.isActive = false;
            document.body.classList.remove('inspection-mode');
            if (this.lastHighlightedElement) {
                this.lastHighlightedElement.classList.remove(Constants.HIGHLIGHT_CLASS);
                this.lastHighlightedElement = null;
            }
            this.removeHighlights();
        }
    }

    // Gère le mouvement de la souris
    handleMouseMove(e) {
        if (!this.isCtrlPressed) return;

        // Trouve l'élément sous le curseur
        const element = document.elementFromPoint(e.clientX, e.clientY);
        if (element && (element.tagName === 'IMG' || element.tagName === 'CANVAS')) {
            // Retire la surbrillance de l'élément précédent
            if (this.lastHighlightedElement) {
                this.lastHighlightedElement.classList.remove(Constants.HIGHLIGHT_CLASS);
            }
            // Ajoute la surbrillance au nouvel élément
            element.classList.add(Constants.HIGHLIGHT_CLASS);
            this.lastHighlightedElement = element;
        }
    }

    // Gère le survol des éléments
    handleMouseOver(e) {
        if (this.isActive) {
            this.removeHighlights();
            // Ajoute une surbrillance aux images survolées
            if (e.target.tagName === 'IMG') {
                e.target.classList.add(Constants.HIGHLIGHT_ELEMENT_CLASS);
            }
        }
    }

    // Gère les clics sur les images
    handleClick(e) {
        if (this.isActive && e.target.tagName === 'IMG') {
            e.preventDefault();
            // Ajoute l'image cliquée à la barre latérale
            this.sidebar.addImage(e.target.src);
        }
    }

    // Retire toutes les surlignages
    removeHighlights() {
        document.querySelectorAll(`.${Constants.HIGHLIGHT_ELEMENT_CLASS}`).forEach(el => {
            el.classList.remove(Constants.HIGHLIGHT_ELEMENT_CLASS);
        });
    }
}
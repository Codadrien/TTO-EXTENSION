// Classe gérant le téléchargement des images
class DownloadManager {
    // Constantes pour la gestion des téléchargements
    static MAX_IMAGES_PER_SESSION = 50; // Limite le nombre d'images par session
    static MIN_DELAY = 100; // Délai minimum entre les téléchargements
    static MAX_DELAY = 300; // Délai maximum entre les téléchargements
    static ERROR_DELAY = 500; // Délai en cas d'erreur

    // Méthode pour obtenir la date du jour au format DD MM YYYY
    static getCurrentDate() {
        const today = new Date();
        const day = String(today.getDate()).padStart(2, '0');
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const year = today.getFullYear();
        return `${day} ${month} ${year}`;
    }

    // Méthode pour obtenir un délai aléatoire
    static getRandomDelay() {
        return Math.floor(Math.random() * (this.MAX_DELAY - this.MIN_DELAY + 1)) + this.MIN_DELAY;
    }

    // Méthode pour attendre un délai
    static async delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Méthode statique pour télécharger un tableau d'images
    static async downloadImages(images) {
        if (images.length === 0) return;

        // Vérifie la limite d'images
        if (images.length > this.MAX_IMAGES_PER_SESSION) {
            alert(`Pour éviter le bannissement IP, vous ne pouvez pas télécharger plus de ${this.MAX_IMAGES_PER_SESSION} images à la fois.`);
            return;
        }

        // Demande le nom du dossier pour les images
        const baseName = prompt('Entrez le nom du dossier:', 'images');
        if (!baseName) return;

        // Crée le chemin du dossier avec la date
        const date = this.getCurrentDate();
        const folderPath = `${date}/${baseName}`;

        // Télécharge chaque image avec un délai
        for (let i = 0; i < images.length; i++) {
            try {
                // Extrait l'extension du fichier
                const extension = images[i].split('.').pop().split('?')[0];
                // Ajoute un tiret entre le nom et le numéro
                const filename = `${baseName}-${i + 1}.${extension}`;

                // Utilise l'API chrome.downloads pour télécharger l'image
                chrome.runtime.sendMessage({
                    type: 'download',
                    url: images[i],
                    filename: `${folderPath}/${filename}`
                });

                // Attend un délai aléatoire entre chaque téléchargement
                // Cela simule un comportement plus humain et évite les patterns détectables
                await this.delay(this.getRandomDelay());

            } catch (error) {
                console.error(`Erreur lors du téléchargement de l'image ${i + 1}:`, error);
                // En cas d'erreur, on attend plus longtemps avant de continuer
                await this.delay(this.ERROR_DELAY);
            }
        }
    }
}
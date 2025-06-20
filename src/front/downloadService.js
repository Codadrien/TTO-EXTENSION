// Download service for frontend
// Handles image download management and coordination

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
    static async downloadImages(images, folderName) {
        console.log(`[DownloadManager] Début du téléchargement de ${images.length} images avec le nom de dossier: ${folderName}`);
        
        if (images.length === 0) {
            console.log('[DownloadManager] Aucune image à télécharger');
            return;
        }

        // Vérifie la limite d'images
        if (images.length > this.MAX_IMAGES_PER_SESSION) {
            console.log(`[DownloadManager] Trop d'images: ${images.length} > ${this.MAX_IMAGES_PER_SESSION}`);
            alert(`Pour éviter le bannissement IP, vous ne pouvez pas télécharger plus de ${this.MAX_IMAGES_PER_SESSION} images à la fois.`);
            return;
        }

        // Vérifie si un nom de dossier a été fourni
        if (!folderName || folderName.trim() === '') {
            console.log('[DownloadManager] Nom de dossier manquant');
            alert('Barcode manquant, veuillez saisir le barcode du produit');
            return;
        }
        
        const baseName = folderName.trim();
        console.log(`[DownloadManager] Nom de dossier utilisé: ${baseName}`);

        // Crée le chemin du dossier avec la date
        const date = this.getCurrentDate();
        const folderPath = `${date}/${baseName}`;
        console.log(`[DownloadManager] Chemin du dossier: ${folderPath}`);

        // Télécharge chaque image avec un délai
        for (let i = 0; i < images.length; i++) {
            try {
                const entry = images[i];
                const url = typeof entry === 'object' ? entry.url : entry;
                const order = entry.order || 0;
                const urlObj = new URL(url);
                const originalFilename = urlObj.pathname.split('/').pop() || `image-${i + 1}`;
                
                // Extrait l'extension du fichier
                const extension = originalFilename.split('.').pop().split('?')[0] || 'jpg';
                
                const prefix = order > 0 ? String(order).padStart(2, '0') + '-' : '';
                const filename = `${prefix}${originalFilename}`;

                console.log(`[DownloadManager] Téléchargement de l'image ${i+1}/${images.length}: ${url}`);
                console.log(`[DownloadManager] Chemin de destination: ${folderPath}/${filename}`);
                
                // Utilise uniquement l'événement personnalisé pour le téléchargement
                // Le contentScript.js écoutera cet événement et utilisera chrome.runtime.sendMessage
                document.dispatchEvent(new CustomEvent('TTO_DOWNLOAD_IMAGES', {
                    detail: {
                        url: url,
                        filename: `${folderPath}/${filename}`
                    }
                }));
                
                // Ne pas utiliser chrome.runtime.sendMessage directement depuis l'application injectée
                // car cela nécessite de spécifier l'ID de l'extension

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

export default DownloadManager;

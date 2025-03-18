// Classe gérant le téléchargement des images
class DownloadManager {
    // Méthode pour obtenir la date du jour au format DD MM YYYY
    static getCurrentDate() {
        const today = new Date();
        const day = String(today.getDate()).padStart(2, '0');
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const year = today.getFullYear();
        return `${day} ${month} ${year}`;
    }

    // Méthode statique pour télécharger un tableau d'images
    static async downloadImages(images) {
        if (images.length === 0) return;

        // Demande le nom du dossier pour les images
        const baseName = prompt('Entrez le nom du dossier:', 'images');
        if (!baseName) return;

        // Crée le chemin du dossier avec la date
        const date = this.getCurrentDate();
        const folderPath = `${date}/${baseName}`;

        // Télécharge chaque image
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
            } catch (error) {
                console.error(`Erreur lors du téléchargement de l'image ${i + 1}:`, error);
            }
        }
    }
}
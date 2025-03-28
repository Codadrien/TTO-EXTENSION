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
        console.log('[TTO-EXTENSION] Début du processus de téléchargement');
        if (images.length === 0) {
            console.log('[TTO-EXTENSION] Aucune image à télécharger');
            return;
        }

        // Demande le nom du dossier pour les images
        const baseName = prompt('Entrez le nom du dossier:', 'images');
        if (!baseName) {
            console.log('[TTO-EXTENSION] Téléchargement annulé par l\'utilisateur');
            return;
        }

        // Crée le chemin du dossier avec la date
        const date = this.getCurrentDate();
        const folderPath = `${date}/${baseName}`;
        console.log('[TTO-EXTENSION] Chemin de destination:', folderPath);

        // Télécharge chaque image
        for (let i = 0; i < images.length; i++) {
            try {
                // Extrait l'extension du fichier
                const extension = images[i].split('.').pop().split('?')[0];
                // Ajoute un tiret entre le nom et le numéro
                const filename = `${baseName}-${i + 1}.${extension}`;
                console.log('[TTO-EXTENSION] Téléchargement de l\'image', i + 1, ':', filename);

                // Utilise l'API chrome.downloads pour télécharger l'image
                chrome.runtime.sendMessage({
                    type: 'download',
                    url: images[i],
                    filename: `${folderPath}/${filename}`
                });
            } catch (error) {
                console.error('[TTO-EXTENSION] Erreur lors du téléchargement de l\'image', i + 1, ':', error);
            }
        }
        console.log('[TTO-EXTENSION] Processus de téléchargement terminé');
    }
}
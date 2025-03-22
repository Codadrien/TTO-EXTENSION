// Classe gérant le téléchargement des images
class DownloadManager {
    // Constantes pour la gestion des téléchargements
    static MAX_IMAGES_PER_SESSION = 50; // Limite le nombre d'images par session
    static MIN_DELAY = 100; // Délai minimum entre les téléchargements
    static MAX_DELAY = 300; // Délai maximum entre les téléchargements
    static ERROR_DELAY = 500; // Délai en cas d'erreur
    static BACKGROUND_THRESHOLD = 20; // Seuil pour la détection du fond
    static EDGE_SAMPLE_SIZE = 5; // Nombre de pixels à échantillonner sur les bords
    static GRAY_THRESHOLD = 10; // Seuil pour détecter si un pixel est gris
    static BRIGHTNESS_THRESHOLD = 200; // Seuil pour la luminosité (pour préserver les objets sombres)

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

    // Méthode pour détecter la couleur du fond
    static detectBackgroundColor(imageData, width, height) {
        const data = imageData.data;
        const edgePixels = [];

        // Échantillonner les pixels des bords
        for (let i = 0; i < width; i += this.EDGE_SAMPLE_SIZE) {
            // Bord supérieur
            const topIndex = (i + 0 * width) * 4;
            edgePixels.push({
                r: data[topIndex],
                g: data[topIndex + 1],
                b: data[topIndex + 2]
            });

            // Bord inférieur
            const bottomIndex = (i + (height - 1) * width) * 4;
            edgePixels.push({
                r: data[bottomIndex],
                g: data[bottomIndex + 1],
                b: data[bottomIndex + 2]
            });
        }

        for (let j = 0; j < height; j += this.EDGE_SAMPLE_SIZE) {
            // Bord gauche
            const leftIndex = (0 + j * width) * 4;
            edgePixels.push({
                r: data[leftIndex],
                g: data[leftIndex + 1],
                b: data[leftIndex + 2]
            });

            // Bord droit
            const rightIndex = ((width - 1) + j * width) * 4;
            edgePixels.push({
                r: data[rightIndex],
                g: data[rightIndex + 1],
                b: data[rightIndex + 2]
            });
        }

        // Calculer la couleur moyenne des bords
        const avgColor = edgePixels.reduce((acc, pixel) => {
            acc.r += pixel.r;
            acc.g += pixel.g;
            acc.b += pixel.b;
            return acc;
        }, {
            r: 0,
            g: 0,
            b: 0
        });

        avgColor.r = Math.round(avgColor.r / edgePixels.length);
        avgColor.g = Math.round(avgColor.g / edgePixels.length);
        avgColor.b = Math.round(avgColor.b / edgePixels.length);

        return avgColor;
    }

    // Méthode pour calculer la luminosité d'un pixel
    static getBrightness(r, g, b) {
        return (r + g + b) / 3;
    }

    // Méthode pour détecter si un pixel est gris
    static isGrayPixel(r, g, b) {
        const avgColor = (r + g + b) / 3;
        const variance = Math.max(
            Math.abs(r - avgColor),
            Math.abs(g - avgColor),
            Math.abs(b - avgColor)
        );

        // Si le pixel est très sombre, ne pas le considérer comme gris
        if (avgColor < 100) return false;

        return variance <= this.GRAY_THRESHOLD;
    }

    // Méthode pour détecter si un pixel fait partie du fond
    static isBackgroundPixel(r, g, b, backgroundColor) {
        // Ne pas toucher aux pixels sombres (préserver la chaussure noire)
        const brightness = this.getBrightness(r, g, b);
        if (brightness < 100) return false;

        // Si le pixel est gris clair, le considérer comme fond
        if (this.isGrayPixel(r, g, b) && brightness > 180) {
            return true;
        }

        // Sinon on compare avec la couleur de fond détectée
        const threshold = this.BACKGROUND_THRESHOLD;
        const isSimilarToBackground = Math.abs(r - backgroundColor.r) <= threshold &&
            Math.abs(g - backgroundColor.g) <= threshold &&
            Math.abs(b - backgroundColor.b) <= threshold;

        return isSimilarToBackground && brightness > 180;
    }

    // Méthode pour créer un élément de chargement
    static createLoadingElement() {
        const loading = document.createElement('div');
        loading.id = 'tto-loading';
        loading.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 20px;
            border-radius: 10px;
            z-index: 10000;
            font-family: Arial, sans-serif;
            text-align: center;
        `;
        return loading;
    }

    // Méthode pour traiter l'image (carré et centrage)
    static async processImage(imageUrl) {
        return new Promise((resolve, reject) => {
            try {
                const img = new Image();
                img.crossOrigin = "Anonymous";

                img.onerror = () => {
                    reject(new Error("Impossible de charger l'image"));
                };

                img.onload = () => {
                    try {
                        const canvas = document.createElement('canvas');
                        const ctx = canvas.getContext('2d');

                        // Déterminer la taille du carré
                        const size = Math.max(img.width, img.height);
                        canvas.width = size;
                        canvas.height = size;

                        // Remplir le fond en blanc
                        ctx.fillStyle = '#FFFFFF';
                        ctx.fillRect(0, 0, size, size);

                        // Calculer la position pour centrer l'image
                        const x = (size - img.width) / 2;
                        const y = (size - img.height) / 2;

                        // Dessiner l'image centrée
                        ctx.drawImage(img, x, y);

                        // Obtenir les données de l'image
                        const imageData = ctx.getImageData(0, 0, size, size);
                        const backgroundColor = this.detectBackgroundColor(imageData, size, size);

                        // Parcourir tous les pixels
                        const data = imageData.data;
                        for (let i = 0; i < data.length; i += 4) {
                            const r = data[i];
                            const g = data[i + 1];
                            const b = data[i + 2];

                            // Si c'est un pixel de fond, le rendre blanc
                            if (this.isBackgroundPixel(r, g, b, backgroundColor)) {
                                data[i] = 255; // R
                                data[i + 1] = 255; // G
                                data[i + 2] = 255; // B
                                data[i + 3] = 255; // A
                            }
                        }

                        // Remettre les données modifiées sur le canvas
                        ctx.putImageData(imageData, 0, 0);

                        // Deuxième passe pour nettoyer les pixels isolés
                        const cleanedImageData = ctx.getImageData(0, 0, size, size);
                        const cleanedData = cleanedImageData.data;
                        for (let y = 1; y < size - 1; y++) {
                            for (let x = 1; x < size - 1; x++) {
                                const i = (y * size + x) * 4;
                                // Si le pixel n'est pas blanc
                                if (cleanedData[i] !== 255 || cleanedData[i + 1] !== 255 || cleanedData[i + 2] !== 255) {
                                    // Compter les voisins blancs
                                    let whiteNeighbors = 0;
                                    for (let dy = -1; dy <= 1; dy++) {
                                        for (let dx = -1; dx <= 1; dx++) {
                                            if (dx === 0 && dy === 0) continue;
                                            const ni = ((y + dy) * size + (x + dx)) * 4;
                                            if (cleanedData[ni] === 255 && cleanedData[ni + 1] === 255 && cleanedData[ni + 2] === 255) {
                                                whiteNeighbors++;
                                            }
                                        }
                                    }
                                    // Si le pixel est entouré de blanc, le rendre blanc aussi
                                    if (whiteNeighbors >= 7) {
                                        cleanedData[i] = 255;
                                        cleanedData[i + 1] = 255;
                                        cleanedData[i + 2] = 255;
                                        cleanedData[i + 3] = 255;
                                    }
                                }
                            }
                        }
                        ctx.putImageData(cleanedImageData, 0, 0);

                        resolve(canvas.toDataURL('image/png'));
                    } catch (error) {
                        console.error("Erreur détaillée:", error);
                        reject(new Error("Erreur lors du traitement de l'image"));
                    }
                };

                img.src = imageUrl;
            } catch (error) {
                console.error("Erreur détaillée:", error);
                reject(error);
            }
        });
    }

    // Méthode statique pour télécharger un tableau d'images
    static async downloadImages(images) {
        if (images.length === 0) {
            alert("Aucune image à télécharger");
            return;
        }

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

        // Créer et afficher l'élément de chargement
        const loading = this.createLoadingElement();
        document.body.appendChild(loading);

        // Télécharge chaque image avec un délai
        for (let i = 0; i < images.length; i++) {
            try {
                // Mettre à jour le message de chargement
                loading.textContent = `Traitement de l'image ${i + 1}/${images.length}...`;

                // Extrait l'extension du fichier
                const extension = images[i].split('.').pop().split('?')[0];
                // Ajoute un tiret entre le nom et le numéro
                const filename = `${baseName}-${i + 1}.${extension}`;

                try {
                    // Traite l'image
                    const processedImageUrl = await this.processImage(images[i]);

                    // Utilise l'API chrome.downloads pour télécharger l'image traitée
                    chrome.runtime.sendMessage({
                        type: 'download',
                        url: processedImageUrl,
                        filename: `${folderPath}/${filename}`
                    });

                    // Attend un délai aléatoire entre chaque téléchargement
                    await this.delay(this.getRandomDelay());
                } catch (error) {
                    console.error(`Erreur lors du traitement de l'image ${i + 1}:`, error);
                    alert(`Erreur lors du traitement de l'image ${i + 1}: ${error.message}`);
                }

            } catch (error) {
                console.error(`Erreur lors du téléchargement de l'image ${i + 1}:`, error);
                alert(`Erreur lors du téléchargement de l'image ${i + 1}: ${error.message}`);
                await this.delay(this.ERROR_DELAY);
            }
        }

        // Supprimer l'élément de chargement
        document.body.removeChild(loading);
        alert("Traitement terminé !");
    }
}
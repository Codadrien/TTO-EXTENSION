// Vérification des permissions au démarrage
chrome.runtime.onInstalled.addListener(() => {
    console.log('[TTO-EXTENSION] Extension installée/mise à jour');
    chrome.permissions.getAll(permissions => {
        console.log('[TTO-EXTENSION] Permissions actuelles:', permissions);
    });
    
    // Vérifie le dossier de téléchargement par défaut
    chrome.downloads.getFileIcon(0, {size: 16}, (iconUrl) => {
        console.log('[TTO-EXTENSION] Dossier de téléchargement par défaut:', chrome.downloads.getFileIcon);
    });
});

// Fonction pour vérifier le dossier parent
async function checkParentDirectory(filename) {
    try {
        // Extrait le chemin du dossier parent
        const parentDir = filename.split('/').slice(0, -1).join('/');
        console.log('[TTO-EXTENSION] Chemin du dossier parent:', parentDir);
        
        // Extrait les composants du chemin
        const pathComponents = parentDir.split('/');
        console.log('[TTO-EXTENSION] Composants du chemin:', pathComponents);
        
        // Vérifie le dossier de la date
        const dateDir = pathComponents[0];
        console.log('[TTO-EXTENSION] Dossier date:', dateDir);
        
        // Vérifie le dossier du produit
        const productDir = pathComponents[1];
        console.log('[TTO-EXTENSION] Dossier produit:', productDir);

        // Vérifie si le dossier existe dans le dossier de téléchargement
        const result = await chrome.downloads.search({
            filename: parentDir + '/*'
        });
        
        if (result.length === 0) {
            console.log('[TTO-EXTENSION] ATTENTION: Le dossier n\'existe pas dans le dossier de téléchargement');
        } else {
            console.log('[TTO-EXTENSION] Le dossier existe dans le dossier de téléchargement');
        }
        
        return true;
    } catch (error) {
        console.error('[TTO-EXTENSION] Erreur lors de la vérification du dossier parent:', error);
        return true; // On continue même en cas d'erreur
    }
}

// Écoute les messages du content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'download') {
        console.log('[TTO-EXTENSION] Tentative de téléchargement:', message);
        // Vérifie les permissions avant le téléchargement
        chrome.permissions.contains({
            permissions: ['downloads']
        }, async hasPermission => {
            console.log('[TTO-EXTENSION] Permission de téléchargement:', hasPermission);
            if (hasPermission) {
                // Vérifie le dossier parent sans bloquer
                await checkParentDirectory(message.filename);

                // Télécharge le fichier avec le chemin spécifié
                chrome.downloads.download({
                    url: message.url,
                    filename: message.filename,
                    saveAs: false,
                    conflictAction: 'uniquify'
                }, downloadId => {
                    if (chrome.runtime.lastError) {
                        console.error('[TTO-EXTENSION] Erreur de téléchargement:', chrome.runtime.lastError);
                        console.error('[TTO-EXTENSION] Détails de l\'erreur:', {
                            message: chrome.runtime.lastError.message,
                            stack: chrome.runtime.lastError.stack
                        });
                    } else {
                        console.log('[TTO-EXTENSION] Téléchargement initié, ID:', downloadId);
                        
                        // Surveille l'état du téléchargement
                        const checkDownloadStatus = (id) => {
                            chrome.downloads.search({id: id}, (downloads) => {
                                if (downloads && downloads[0]) {
                                    const download = downloads[0];
                                    console.log('[TTO-EXTENSION] État du téléchargement:', {
                                        id: download.id,
                                        state: download.state,
                                        error: download.error,
                                        filename: download.filename,
                                        bytesReceived: download.bytesReceived,
                                        totalBytes: download.totalBytes,
                                        danger: download.danger,
                                        mimeType: download.mimeType
                                    });

                                    // Continue de surveiller si le téléchargement est en cours
                                    if (download.state === 'in_progress') {
                                        setTimeout(() => checkDownloadStatus(id), 1000);
                                    }
                                }
                            });
                        };

                        // Démarrer la surveillance
                        checkDownloadStatus(downloadId);
                    }
                });
            } else {
                console.error('[TTO-EXTENSION] Permission de téléchargement manquante');
            }
        });
    }
});
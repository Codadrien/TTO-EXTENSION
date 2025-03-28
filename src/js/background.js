// Vérification des permissions au démarrage
chrome.runtime.onInstalled.addListener(() => {
    console.log('[TTO-EXTENSION] Extension installée/mise à jour');
    chrome.permissions.getAll(permissions => {
        console.log('[TTO-EXTENSION] Permissions actuelles:', permissions);
    });
});

// Fonction pour créer le dossier parent
async function createParentDirectory(filename) {
    try {
        // Extrait le chemin du dossier parent
        const parentDir = filename.split('/').slice(0, -1).join('/');
        console.log('[TTO-EXTENSION] Tentative de création du dossier parent:', parentDir);
        
        // Vérifie si le dossier existe déjà
        const result = await chrome.downloads.search({
            filename: parentDir + '/*'
        });
        
        if (result.length === 0) {
            console.log('[TTO-EXTENSION] Création du dossier parent:', parentDir);
            // Crée un fichier .folder pour marquer le dossier
            await chrome.downloads.download({
                url: 'data:text/plain;base64,',
                filename: parentDir + '/.folder',
                saveAs: false
            });
        } else {
            console.log('[TTO-EXTENSION] Le dossier parent existe déjà:', parentDir);
        }
        return true;
    } catch (error) {
        console.error('[TTO-EXTENSION] Erreur lors de la création du dossier parent:', error);
        return false;
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
                // Crée d'abord le dossier parent
                const dirCreated = await createParentDirectory(message.filename);
                if (!dirCreated) {
                    console.error('[TTO-EXTENSION] Impossible de créer le dossier parent, téléchargement annulé');
                    return;
                }

                // Télécharge le fichier avec le chemin spécifié
                chrome.downloads.download({
                    url: message.url,
                    filename: message.filename,
                    saveAs: false,
                    conflictAction: 'uniquify'
                }, downloadId => {
                    if (chrome.runtime.lastError) {
                        console.error('[TTO-EXTENSION] Erreur de téléchargement:', chrome.runtime.lastError);
                    } else {
                        console.log('[TTO-EXTENSION] Téléchargement initié, ID:', downloadId);
                    }
                });
            } else {
                console.error('[TTO-EXTENSION] Permission de téléchargement manquante');
            }
        });
    }
});
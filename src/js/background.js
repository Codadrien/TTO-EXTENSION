// Vérification des permissions au démarrage
chrome.runtime.onInstalled.addListener(() => {
    console.log('[TTO-EXTENSION] Extension installée/mise à jour');
    chrome.permissions.getAll(permissions => {
        console.log('[TTO-EXTENSION] Permissions actuelles:', permissions);
    });
});

// Fonction pour vérifier le dossier parent
async function checkParentDirectory(filename) {
    try {
        // Extrait le chemin du dossier parent
        const parentDir = filename.split('/').slice(0, -1).join('/');
        console.log('[TTO-EXTENSION] Vérification du dossier parent:', parentDir);
        
        // Vérifie si le dossier existe déjà
        const result = await chrome.downloads.search({
            filename: parentDir + '/*'
        });
        
        console.log('[TTO-EXTENSION] État du dossier parent:', result.length > 0 ? 'existe' : 'n\'existe pas');
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
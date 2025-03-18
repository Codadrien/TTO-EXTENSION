// Écoute les messages du content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'download') {
        // Télécharge le fichier avec le chemin spécifié
        chrome.downloads.download({
            url: message.url,
            filename: message.filename,
            saveAs: false,
            conflictAction: 'uniquify' // Si le fichier existe déjà, ajoute un numéro unique
        });
    }
});
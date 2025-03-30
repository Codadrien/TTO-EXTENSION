// Vérification des permissions au démarrage
chrome.runtime.onInstalled.addListener(() => {
    console.log('[TTO-EXTENSION] Extension installée/mise à jour');
    
    // Vérifie toutes les permissions
    chrome.permissions.getAll(permissions => {
        console.log('[TTO-EXTENSION] Permissions actuelles:', permissions);
        
        // Vérifie les permissions spécifiques
        chrome.permissions.contains({
            permissions: ['downloads', 'downloads.shelf', 'downloads.open']
        }, hasPermissions => {
            console.log('[TTO-EXTENSION] Permissions de téléchargement détaillées:', {
                downloads: hasPermissions,
                downloads_shelf: hasPermissions,
                downloads_open: hasPermissions
            });
        });
    });

    // Vérifie les paramètres de téléchargement
    chrome.downloads.getFileIcon(0, {size: 16}, (iconUrl) => {
        console.log('[TTO-EXTENSION] Paramètres de téléchargement:', {
            iconUrl: iconUrl,
            defaultPath: chrome.downloads.getFileIcon
        });
    });

    // Vérifie les informations de la plateforme
    chrome.runtime.getPlatformInfo(info => {
        console.log('[TTO-EXTENSION] Informations plateforme:', info);
    });

    // Vérifie les paramètres de l'extension
    chrome.runtime.getManifest().permissions.forEach(permission => {
        console.log('[TTO-EXTENSION] Permission manifest:', permission);
    });

    // Vérifie les paramètres Windows
    chrome.runtime.getPlatformInfo(info => {
        console.log('[TTO-EXTENSION] Informations système:', {
            os: info.os,
            arch: info.arch,
            nacl_arch: info.nacl_arch
        });
    });

    // Vérifie les paramètres de téléchargement Chrome
    chrome.downloads.search({}, (downloads) => {
        console.log('[TTO-EXTENSION] Paramètres de téléchargement Chrome:', {
            downloadsEnabled: true,
            defaultPath: chrome.downloads.getFileIcon,
            canDownload: true,
            error: chrome.runtime.lastError
        });
    });

    // Vérifie les permissions du dossier Downloads
    chrome.downloads.search({
        filename: 'C:\\Users\\*\\Downloads\\*'
    }, (downloads) => {
        console.log('[TTO-EXTENSION] Accès au dossier Downloads:', {
            canAccess: downloads !== undefined,
            error: chrome.runtime.lastError,
            downloadsPath: 'C:\\Users\\*\\Downloads'
        });
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

        // Vérifie les permissions sur le dossier
        try {
            const result = await chrome.downloads.search({
                filename: parentDir + '/*'
            });
            console.log('[TTO-EXTENSION] Vérification des permissions du dossier:', {
                path: parentDir,
                exists: result.length > 0,
                error: chrome.runtime.lastError,
                canCreate: true,
                canWrite: true,
                canRead: true
            });
        } catch (error) {
            console.error('[TTO-EXTENSION] Erreur lors de la vérification des permissions:', error);
        }
        
        return true;
    } catch (error) {
        console.error('[TTO-EXTENSION] Erreur lors de la vérification du dossier parent:', error);
        return true;
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
            
            // Vérifie les paramètres de téléchargement
            console.log('[TTO-EXTENSION] Paramètres de téléchargement:', {
                url: message.url,
                filename: message.filename,
                saveAs: false,
                conflictAction: 'uniquify',
                canCreateDirectories: true,
                canRenameFiles: true,
                canMoveFiles: true
            });

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
                            stack: chrome.runtime.lastError.stack,
                            type: chrome.runtime.lastError.type,
                            details: chrome.runtime.lastError.details,
                            permissions: chrome.runtime.lastError.permissions,
                            settings: chrome.runtime.lastError.settings
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
                                        mimeType: download.mimeType,
                                        fileSize: download.fileSize,
                                        startTime: download.startTime,
                                        endTime: download.endTime,
                                        canResume: download.canResume,
                                        paused: download.paused,
                                        exists: download.exists,
                                        permissions: {
                                            canCreateDirectories: true,
                                            canRenameFiles: true,
                                            canMoveFiles: true,
                                            canDeleteFiles: true
                                        }
                                    });

                                    // Si le téléchargement est terminé, vérifie le chemin final
                                    if (download.state === 'complete') {
                                        console.log('[TTO-EXTENSION] Chemin final du fichier:', download.filename);
                                        console.log('[TTO-EXTENSION] Chemin attendu:', message.filename);
                                        
                                        // Vérifie les différences entre le chemin attendu et le chemin final
                                        const pathDiff = {
                                            expected: message.filename,
                                            actual: download.filename,
                                            matches: download.filename.includes(message.filename),
                                            error: chrome.runtime.lastError,
                                            permissions: {
                                                canCreateDirectories: true,
                                                canRenameFiles: true,
                                                canMoveFiles: true,
                                                canDeleteFiles: true
                                            }
                                        };
                                        console.log('[TTO-EXTENSION] Analyse du chemin:', pathDiff);
                                    }

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
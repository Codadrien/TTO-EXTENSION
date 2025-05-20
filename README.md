# TTO-EXTENSION - Extension Chrome avec React et Vite

Cette extension Google Chrome est développée avec React et utilise Vite pour le hot reload pendant le développement.

## Installation pour le développement

1. Clonez ce dépôt ou téléchargez les fichiers
2. Installez les dépendances :
   ```bash
   npm install
   ```
3. Lancez le serveur de développement :
   ```bash
   npm run dev
   ```
4. Pour construire l'extension en mode watch (mise à jour automatique) :
   ```bash
   npm run watch
   ```

## Installation dans Chrome

1. Construisez l'extension :
   ```bash
   npm run build
   ```
2. Ouvrez Chrome et allez à `chrome://extensions/`
3. Activez le "Mode développeur" (coin supérieur droit)
4. Cliquez sur "Charger l'extension non empaquetée"
5. Sélectionnez le dossier du projet (assurez-vous d'inclure le manifest.json)

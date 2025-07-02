# Modifications du Bouton Violet - Fonctionnement PNG Transparent

## Résumé des Changements

Le bouton violet a été modifié pour fonctionner avec des **images PNG transparentes** au lieu du traitement Canvas avec préservation d'ombre. Le nouveau workflow est :

1. **Image PNG transparente fournie** (pas de traitement API)
2. **Injection directe sur la page** avec système de marges partagé
3. **Visualisation en temps réel** des marges/padding
4. **Téléchargement avec composition Canvas** (PNG transparent + fond blanc + marges)

## Fonctionnement Détaillé

### Frontend (Bouton Violet)

#### Logique d'injection
- **Même système que le bouton vert** : injection via `imageInjectionService`
- **Pas d'appel API** : utilise directement l'image fournie comme PNG transparent
- **Cache intelligent** : différencie les modes Pixian (vert) et PNG transparent (violet)
- **Marges en temps réel** : utilise `marginConfig.js` partagé avec le bouton vert

#### Vérifications
- Image #1 sélectionnée + bouton violet activé OU bouton vert activé
- Système de cache qui tient compte du mode de traitement

### Backend (Téléchargement)

#### Nouveau type de process : `shadow_transparent`
- **Input** : Image PNG transparente + marges configurées
- **Traitement** : Composition Canvas locale
  - Fond blanc 2000x2000px
  - Application des marges via `getMarginConfig()`
  - Centrage intelligent de l'image
  - Compression JPEG 70%

#### Function `processTransparentPngWithMargins()`
```javascript
// Calcul des zones avec marges
const marginTop = margins.top * maxSize;
const marginLeft = margins.left * maxSize;
// ... etc

// Composition finale
ctx.fillStyle = '#FFFFFF';  // Fond blanc
ctx.fillRect(0, 0, maxSize, maxSize);
ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
```

## Système de Marges Unifié

### Configuration partagée (`marginConfig.js`)
- **Types prédéfinis** : default, textile, pantalon, accessoires  
- **Marges personnalisées** : validation et conversion automatique
- **Format uniforme** : décimal (0.0 - 1.0) pour frontend/backend

### Application en temps réel
- **Frontend** : padding CSS via `imageInjectionService.updateInjectedImageMargins()`
- **Backend** : composition Canvas via `processTransparentPngWithMargins()`

## Différences Bouton Vert vs Violet

| Aspect | Bouton Vert (Pixian) | Bouton Violet (PNG Transparent) |
|--------|---------------------|----------------------------------|
| **Source** | Image originale | PNG transparent fourni |
| **Traitement API** | Oui (Pixian) | Non (direct) |
| **Injection** | PNG transparent généré | PNG transparent fourni |
| **Marges** | Configurables (système partagé) | Configurables (système partagé) |
| **Téléchargement** | API Pixian + marges | Canvas local + marges |
| **Cache** | Par image source + API | Par image source + mode |

## Fichiers Modifiés

### Frontend
- `src/front/components/App.jsx` : Logique bouton violet + props
- `src/front/components/ProductTypeSelector.jsx` : Support bouton violet  
- `src/front/components/ProductTypeSelector/ProductTypeSelectorRefactored.jsx` : Props shadow
- `src/front/components/ProductTypeSelector/hooks/useImageInjection.js` : Logique PNG transparent

### Backend  
- `src/background/index.js` : Traitement `shadow_transparent` + function `processTransparentPng()`
- `src/background/canvasProcessor.js` : Function `processTransparentPngWithMargins()`

### Système de marges (inchangé mais partagé)
- `src/background/marginConfig.js` : Configuration unifiée

## Utilisation

1. **Sélectionner une image** (ordre #1)
2. **Activer le bouton violet** (traitement PNG transparent)
3. **Choisir le type de produit** ou marges personnalisées
4. **Cliquer "Visible"** pour injection avec preview des marges
5. **Ajuster les marges** en temps réel si nécessaire
6. **Télécharger** : composition finale PNG transparent + fond blanc + marges

## TODO / Améliorations

- [ ] **Interface pour upload PNG** : permettre à l'utilisateur de fournir son propre PNG transparent
- [ ] **Validation PNG** : vérifier que le fichier fourni est bien un PNG avec transparence
- [ ] **Preview avant injection** : afficher l'image PNG avant injection sur la page
- [ ] **Gestion erreurs** : messages spécifiques pour les échecs PNG transparent

## Migration

Le changement est **rétrocompatible** :
- L'ancien traitement `shoes_with_shadow` est toujours disponible
- Le nouveau traitement `shadow_transparent` fonctionne en parallèle
- Les composants existants continuent de fonctionner

Pour adopter le nouveau système, il suffit de :
1. Mettre à jour les imports avec `shadowProcessImages`
2. Utiliser le bouton violet avec des PNG transparents
3. Profiter du système de marges unifié 
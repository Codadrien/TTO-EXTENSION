# Architecture du dossier Background

Cette restructuration sépare les différentes logiques de traitement d'images en modules spécialisés pour améliorer la maintenabilité et la lisibilité du code.

## Structure des fichiers

### 📁 Point d'entrée
- **`index.js`** - Point d'entrée principal de l'extension Chrome
  - Gère les listeners des messages Chrome
  - Coordonne les téléchargements et traitements
  - Interface avec `imageProcessor.js`

### 🖼️ Orchestrateur principal
- **`imageProcessor.js`** - Orchestrateur des traitements d'images (119 lignes)
  - Point d'entrée public pour tous les traitements
  - Coordonne les appels vers les services spécialisés
  - Maintient l'interface publique existante
  - **Exports :** `processWithPixian()`, `processWithPixianShoes()`, `processWithShadowPreservation()`, `processWithResize()`, `convertAvifToJpeg()`

### 🎨 Services spécialisés

#### **`pixianService.js`** - Service API Pixian (105 lignes)
- Gestion des appels à l'API Pixian
- Configuration des paramètres selon le type de produit
- Authentification et gestion des erreurs
- **Fonctions principales :**
  - `callPixianAPI()` - Appel générique à l'API
  - `processWithPixianByProductType()` - Traitement selon le type de produit
  - `processWithPixianShoes()` - Traitement spécifique chaussures

#### **`imageUtils.js`** - Utilitaires d'images (80 lignes)
- Conversions de format (AVIF → JPEG)
- Manipulation des blobs et DataURLs
- Récupération d'images depuis URLs
- **Fonctions principales :**
  - `convertAvifToJpeg()` - Conversion AVIF vers JPEG
  - `prepareImageBlob()` - Préparation d'image avec conversion si nécessaire
  - `blobToJpegDataUrl()` - Conversion blob vers DataURL JPEG
  - `fetchImageBlob()` - Récupération d'image depuis URL

#### **`canvasProcessor.js`** - Traitements canvas avancés (312 lignes)
- Détection automatique d'objets dans les images
- Calculs de marges et positionnement précis
- Traitements canvas complexes (préservation d'ombre, redimensionnement)
- **Fonctions principales :**
  - `detectObjectBounds()` - Détection des bords d'objets
  - `calculateShoeDimensions()` - Calculs de dimensions pour chaussures
  - `processWithShadowPreservation()` - Traitement avec préservation d'ombre
  - `processWithResize()` - Redimensionnement simple

### 🔧 Autres modules
- **`panelManager.js`** - Gestion des panneaux de l'interface (inchangé)

## Flux de traitement

```
index.js (listener) 
    ↓
imageProcessor.js (orchestrateur)
    ↓
┌─────────────────┬─────────────────┬─────────────────┐
│   pixianService │   canvasProcessor │   imageUtils    │
│   (API calls)   │   (advanced      │   (conversions) │
│                 │    processing)   │                 │
└─────────────────┴─────────────────┴─────────────────┘
```

## Avantages de cette architecture

### ✅ **Séparation des responsabilités**
- Chaque module a une responsabilité claire et définie
- Plus facile de localiser et modifier une fonctionnalité spécifique

### ✅ **Maintenabilité améliorée**
- Code plus modulaire et réutilisable
- Tests unitaires plus faciles à implémenter
- Réduction des lignes de code par fichier (de 461 à ~100-300 lignes max)

### ✅ **Facilité d'évolution**
- Ajout de nouveaux types de traitement sans modifier l'existant
- Possibilité d'optimiser un service spécifique indépendamment
- Interface publique préservée (pas de breaking changes)

### ✅ **Lisibilité du code**
- Noms de fichiers explicites selon leur fonction
- Documentation JSDoc intégrée
- Séparation claire entre logique métier et utilitaires

## Types de traitement supportés

1. **Pixian standard** - Suppression de fond avec marges par type de produit
2. **Pixian chaussures** - Suppression de fond avec marges spécifiques chaussures
3. **Préservation d'ombre** - Traitement canvas avec détection d'objet et marges
4. **Redimensionnement simple** - Placement dans un carré blanc

## Migration

La restructuration est **transparente** pour le reste de l'application :
- L'interface publique de `imageProcessor.js` reste inchangée
- Aucune modification nécessaire dans `index.js`
- Toutes les fonctions exportées gardent la même signature 
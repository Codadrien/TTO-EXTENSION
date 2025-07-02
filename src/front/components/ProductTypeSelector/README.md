# ProductTypeSelector - Architecture refactorisée

## Vue d'ensemble

Le composant `ProductTypeSelector` a été restructuré pour améliorer la maintenabilité, la réutilisabilité et la séparation des responsabilités. Le fichier monolithique de 732 lignes a été divisé en plusieurs modules spécialisés.

## Structure du projet

```
ProductTypeSelector/
├── components/                 # Sous-composants UI
│   ├── VisibleButton.jsx      # Bouton visible/masquer
│   ├── ProductTypeOptions.jsx # Options de types de produits
│   └── CustomControls.jsx     # Contrôles des marges personnalisées
├── hooks/                     # Hooks personnalisés React
│   ├── useMargins.js         # Gestion des marges
│   ├── usePresets.js         # Gestion des presets
│   └── useImageInjection.js  # Gestion de l'injection d'images
├── services/                  # Services de logique métier
│   ├── presetStorageService.js    # Stockage des presets
│   ├── pixianService.js          # API Pixian
│   └── imageInjectionService.js  # Injection DOM
├── utils/                     # Utilitaires
│   └── keyboardNavigation.js # Navigation clavier
├── constants.js              # Constantes partagées
├── ProductTypeSelectorRefactored.jsx # Composant principal
├── index.js                  # Point d'entrée
└── README.md                 # Cette documentation
```

## Composants

### ProductTypeSelectorRefactored.jsx
Le composant principal orchestrant tous les sous-modules. Il reste simple et délègue les responsabilités spécifiques aux hooks et services appropriés.

### components/
- **VisibleButton.jsx** : Bouton pour afficher/masquer l'image injectée
- **ProductTypeOptions.jsx** : Interface de sélection des types de produits  
- **CustomControls.jsx** : Interface pour les marges personnalisées et presets

## Hooks personnalisés

### useMargins.js
Gère l'état et la logique des marges :
- État des marges personnalisées
- Calcul des marges selon le type de produit
- Mise à jour des marges sur les images injectées

### usePresets.js  
Gère les presets sauvegardés :
- Chargement depuis le stockage
- Sauvegarde de nouveaux presets
- Suppression de presets existants

### useImageInjection.js
Gère l'injection d'images dans le DOM :
- Traitement via API Pixian
- Injection dans les éléments cibles
- Cache pour éviter les appels API redondants
- Gestion de la visibilité

## Services

### presetStorageService.js
Service pour la communication avec le système de stockage via des événements personnalisés.

### pixianService.js
Service pour les appels à l'API Pixian de traitement d'images.

### imageInjectionService.js
Service pour manipuler le DOM et injecter/supprimer les images traitées.

## Avantages de cette architecture

1. **Séparation des responsabilités** : Chaque module a une responsabilité claire
2. **Réutilisabilité** : Les hooks et services peuvent être réutilisés ailleurs
3. **Testabilité** : Chaque module peut être testé indépendamment
4. **Maintenabilité** : Plus facile de localiser et modifier du code spécifique
5. **Lisibilité** : Code plus facile à comprendre et à suivre

## Migration

Le composant original `ProductTypeSelector.jsx` reste intact. La version refactorisée est accessible via `ProductTypeSelectorRefactored.jsx` ou directement via l'index.

Pour migrer vers la nouvelle version, remplacez simplement l'import :

```javascript
// Ancien
import ProductTypeSelector from './ProductTypeSelector.jsx';

// Nouveau  
import ProductTypeSelector from './ProductTypeSelector/index.js';
```

## Extensibilité

Cette architecture facilite l'ajout de nouvelles fonctionnalités :
- Nouveaux types de produits : modifier `constants.js`
- Nouveaux services : ajouter dans `services/`
- Nouvelle logique métier : créer un hook dans `hooks/`
- Nouveaux composants UI : ajouter dans `components/` 
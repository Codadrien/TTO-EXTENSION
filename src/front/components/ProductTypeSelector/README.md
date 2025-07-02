# ProductTypeSelector - Structure Modulaire

Ce dossier contient la refactorisation du composant `ProductTypeSelector` qui était initialement un fichier monolithique de 732 lignes. La nouvelle architecture est organisée de manière modulaire pour améliorer la maintenabilité, la réutilisabilité et la lisibilité du code.

## 📁 Structure des dossiers

```
ProductTypeSelector/
├── index.jsx                 # Composant principal (point d'entrée)
├── constants.js              # Constantes et configurations
├── components/               # Sous-composants UI
│   ├── VisibilityButton.jsx     # Bouton de visibilité d'image
│   ├── ProductTypeOptions.jsx   # Sélecteur de types de produits
│   ├── CustomControls.jsx       # Contrôles personnalisés
│   ├── MarginInputs.jsx         # Champs de saisie des marges
│   ├── PresetDropdown.jsx       # Liste déroulante des presets
│   └── SaveDialog.jsx           # Dialog de sauvegarde de preset
├── hooks/                    # Hooks personnalisés React
│   ├── useImageVisibility.js    # Gestion de l'injection d'images
│   └── usePresets.js            # Gestion des presets
├── services/                 # Services externes
│   ├── storageService.js        # Service de stockage des presets
│   └── pixianService.js         # Service API Pixian
├── utils/                    # Fonctions utilitaires
│   └── imageUtils.js            # Utilitaires de manipulation d'images
└── README.md                 # Cette documentation
```

## 🧩 Responsabilités des modules

### **index.jsx** - Composant Principal
- Orchestration générale du composant
- Gestion des états locaux
- Coordination entre les hooks et les sous-composants
- Logique métier principale (changement de type, marges)

### **constants.js** - Configuration
- Types de produits disponibles
- Marges prédéfinies par type
- Sélecteurs DOM
- Configuration des timeouts
- Classes CSS problématiques

### **Components/** - Interface Utilisateur

#### `VisibilityButton.jsx`
- Bouton œil/œil barré pour l'injection d'images
- États : visible, processing, masqué
- Gestion des tooltips et icônes

#### `ProductTypeOptions.jsx`
- Affichage des options de types de produits
- Gestion de la sélection active
- Interface simple et réutilisable

#### `CustomControls.jsx`
- Conteneur pour tous les contrôles custom
- Orchestration des presets et marges
- Gestion de l'affichage conditionnel

#### `MarginInputs.jsx`
- Champs de saisie numériques pour les marges
- Navigation clavier circulaire (Tab)
- Validation et formatage des valeurs

#### `PresetDropdown.jsx`
- Liste déroulante des presets sauvegardés
- Actions : charger, supprimer
- Gestion des états vides

#### `SaveDialog.jsx`
- Modal de saisie du nom de preset
- Validation et sauvegarde
- Gestion des raccourcis clavier (Enter)

### **Hooks/** - Logique Métier

#### `useImageVisibility.js`
- Gestion complète de l'injection d'images
- Cache intelligent pour éviter les appels API redondants
- Traitement Pixian et application des marges
- Détection des changements d'images sélectionnées

#### `usePresets.js`
- CRUD complet des presets
- Persistance via StorageService
- Gestion des états UI (dropdowns, dialogs)

### **Services/** - Services Externes

#### `storageService.js`
- Abstraction du système de stockage
- Communication via events personnalisés
- Gestion des timeouts et erreurs
- Interface Promise pour les opérations async

#### `pixianService.js`
- Interface avec l'API Pixian
- Traitement d'images sans marges
- Gestion des erreurs et timeouts
- Communication avec le background script

### **Utils/** - Utilitaires

#### `imageUtils.js`
- Manipulation du DOM pour l'injection
- Gestion des superpositions d'images
- Calculs de marges et padding CSS
- Nettoyage et cache des éléments injectés

## 🔄 Flux de données

1. **Sélection de type** → `index.jsx` → Mise à jour état + marges prédéfinies
2. **Marges custom** → `MarginInputs.jsx` → `index.jsx` → `useImageVisibility`
3. **Visibilité image** → `VisibilityButton.jsx` → `useImageVisibility` → `PixianService` + `ImageUtils`
4. **Presets** → `CustomControls.jsx` → `usePresets` → `StorageService`

## 🚀 Avantages de cette architecture

### **Séparation des responsabilités**
- Chaque module a une responsabilité claire et unique
- Facilite les tests unitaires et la maintenance
- Réduit la complexité cognitive

### **Réutilisabilité**
- Les hooks peuvent être réutilisés dans d'autres composants
- Les services sont indépendants du framework UI
- Les utilitaires sont fonctions pures

### **Maintenabilité**
- Modifications isolées par domaine fonctionnel
- Debug plus facile avec des modules spécialisés
- Documentation claire de chaque module

### **Performance**
- Optimisations ciblées possibles
- Cache intelligent dans les hooks
- Évite les re-rendus inutiles

### **Évolutivité**
- Nouveaux types de produits faciles à ajouter
- Extension des presets sans impact sur le reste
- Services externes facilement remplaçables

## 📝 Usage

```jsx
import ProductTypeSelector from './ProductTypeSelector';

<ProductTypeSelector 
  selectedType={productType}
  onTypeChange={setProductType}
  customMargins={customMargins}
  onMarginsChange={setCustomMargins}
  images={images}
  selectedOrder={selectedOrder}
  processImages={processImages}
  onVisibleStateChange={setIsVisibleActive}
/>
```

L'interface publique reste identique, garantissant la compatibilité avec le code existant. 
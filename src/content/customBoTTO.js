// Auto-fill sylius_product[images][0][type] = "main" on tonton-outdoor admin
// et duplication du bouton "Valider les modifications"
let injected = false;
let buttonDuplicated = false;
let detailsButtonDuplicated = false;

/**
 * Fonction utilitaire pour vérifier si on est sur une page d'édition de produit tonton-outdoor
 * Point d'entrée commun pour éviter la duplication de code
 * @returns {boolean} true si on est sur la bonne page
 */
function isOnProductEditPage() {
  return window.location.href.match(/tonton-outdoor\.com\/admin\/products\/\d+\/edit/);
}

/**
 * Duplique le bouton "Valider les modifications" et l'insère au-dessus de la div .product-medias
 * Cette fonction améliore l'UX en rendant le bouton de validation plus accessible
 */
function duplicateButton() {
  // Vérifier qu'on est sur la bonne page (point d'entrée commun)
  if (!isOnProductEditPage()) {
    return false;
  }
  
  // Éviter les doublons
  if (buttonDuplicated) {
    return false;
  }
  
  // Rechercher le bouton original "Valider les modifications"
  const originalButton = document.getElementById('sylius_save_changes_button');
  
  // Rechercher la div avec la classe "product-medias"
  const productMediasDiv = document.querySelector('.product-medias');
  
  // Vérifier que les deux éléments existent avant de procéder
  if (!originalButton || !productMediasDiv) {
    console.log('[customBoTTO] Bouton original ou div product-medias non trouvés');
    return false;
  }
  
  // Vérifier si le bouton dupliqué existe déjà pour éviter les doublons
  const existingDuplicate = document.getElementById('tto_duplicated_save_button');
  if (existingDuplicate) {
    console.log('[customBoTTO] Bouton dupliqué déjà présent');
    buttonDuplicated = true;
    return true;
  }
  
  // Cloner le bouton original (true = clonage profond avec tous les enfants)
  const duplicatedButton = originalButton.cloneNode(true);
  
  // Modifier l'ID du bouton dupliqué pour éviter les conflits
  duplicatedButton.id = 'tto_duplicated_save_button';
  
  // Ajouter une classe CSS pour identifier le bouton dupliqué
  duplicatedButton.classList.add('tto-duplicated-button');
  
  // Ajouter un style pour distinguer visuellement le bouton (optionnel)
  duplicatedButton.style.marginBottom = '10px';
  
  // Insérer le bouton dupliqué juste avant la div product-medias
  productMediasDiv.parentNode.insertBefore(duplicatedButton, productMediasDiv);
  
  console.log('[customBoTTO] ✅ Bouton "Valider les modifications" dupliqué avec succès');
  buttonDuplicated = true;
  return true;
}

/**
 * Duplique le bouton "Valider les modifications" sous le header dès que possible
 * Cette fonction améliore l'UX en rendant le bouton accessible rapidement
 */
function duplicateButtonInDetailsTab() {
  // Vérifier qu'on est sur la bonne page (point d'entrée commun)
  if (!isOnProductEditPage()) {
    return false;
  }
  
  // Éviter les doublons
  if (detailsButtonDuplicated) {
    return false;
  }
  
  // Rechercher le bouton original "Valider les modifications"
  const originalButton = document.getElementById('sylius_save_changes_button');
  
  // Rechercher l'élément avec la classe "ui top attached header"
  const headerElement = document.querySelector('.ui.top.attached.header');
  
  // Vérifier que les deux éléments existent avant de procéder
  if (!originalButton || !headerElement) {
    console.log('[customBoTTO] Bouton original ou header non trouvés');
    return false;
  }
  
  // Vérifier si le bouton dupliqué existe déjà pour éviter les doublons
  const existingDuplicate = document.getElementById('tto_details_duplicated_save_button');
  if (existingDuplicate) {
    console.log('[customBoTTO] Bouton dupliqué dans details déjà présent');
    detailsButtonDuplicated = true;
    return true;
  }
  
  // Cloner le bouton original (true = clonage profond avec tous les enfants)
  const duplicatedButton = originalButton.cloneNode(true);
  
  // Modifier l'ID du bouton dupliqué pour éviter les conflits
  duplicatedButton.id = 'tto_details_duplicated_save_button';
  
  // Ajouter une classe CSS pour identifier le bouton dupliqué
  duplicatedButton.classList.add('tto-details-duplicated-button');
  
  // Ajouter un style pour distinguer visuellement le bouton
  duplicatedButton.style.marginTop = '10px';
  duplicatedButton.style.marginBottom = '10px';
  
  // Insérer le bouton dupliqué juste après le header
  headerElement.parentNode.insertBefore(duplicatedButton, headerElement.nextSibling);
  
  console.log('[customBoTTO] ✅ Bouton "Valider les modifications" dupliqué dans l\'onglet details avec succès');
  detailsButtonDuplicated = true;
  return true;
}

/**
 * Observe les changements du DOM pour détecter l'apparition des éléments nécessaires
 * Utilise le point d'entrée commun pour la vérification d'URL
 */
function observeForCustomButton() {
  // Vérifier qu'on est sur la bonne page (point d'entrée commun)
  if (!isOnProductEditPage()) {
    return;
  }
  
  // Créer un observateur de mutations DOM
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      // Vérifier si de nouveaux nœuds ont été ajoutés
      if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
        // Essayer de dupliquer le bouton à chaque changement
        duplicateButton();
        // Essayer aussi de dupliquer le bouton dans l'onglet details
        duplicateButtonInDetailsTab();
      }
    });
  });
  
  // Commencer à observer le document entier
  observer.observe(document.body, {
    childList: true,    // Observer l'ajout/suppression d'éléments enfants
    subtree: true       // Observer tous les descendants
  });
  
  console.log('[customBoTTO] Observateur DOM activé pour la duplication du bouton');
}

/**
 * Fonction pour remplir automatiquement les champs du formulaire
 * Utilise le point d'entrée commun pour la vérification d'URL
 */
function tryInject() {
  // Vérifier qu'on est sur la bonne page et éviter les doublons (point d'entrée commun)
  if (injected || !isOnProductEditPage()) {
    return false;
  }
  
  let success = false;
  
  // 1. Remplir le champ type avec "main"
  const typeSelectors = [
    'input[name="sylius_product[images][0][type]"]',
    '#sylius_product_images_0_type',
    'select[name="sylius_product[images][0][type]"]'
  ];
  
  for (const selector of typeSelectors) {
    const el = document.querySelector(selector);
    if (el && !el.value) {
      el.value = 'main';
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
      console.log('[customBoTTO] ✅ Type rempli:', selector);
      success = true;
    }
  }
  
  // 2. Sélectionner automatiquement la couleur s'il n'y en a qu'une
  const colorSelect = document.querySelector('select[name="sylius_product[images][0][productVariants][]"]');
  if (colorSelect) {
    const options = colorSelect.querySelectorAll('option[value]:not([value=""])');
    if (options.length === 1 && !colorSelect.value) {
      const option = options[0];
      option.selected = true;
      colorSelect.value = option.value;
      colorSelect.dispatchEvent(new Event('change', { bubbles: true }));
      console.log('[customBoTTO] ✅ Couleur sélectionnée automatiquement:', option.value);
      success = true;
    } else if (options.length > 1) {
      console.log('[customBoTTO] ⚠️ Plusieurs couleurs détectées, pas de sélection automatique');
    }
  }
  
  if (success) {
    injected = true;
    document.removeEventListener('click', tryInject);
  }
  
  return success;
}

/**
 * Fonction principale d'initialisation
 * Utilise le point d'entrée commun pour toutes les vérifications
 */
export function startCustomBoTTO() {
  // Point d'entrée commun - une seule vérification d'URL pour tout le module
  if (isOnProductEditPage()) {
    // Activer l'onglet Media immédiatement au chargement
    const activateMediaTab = () => {
      const mediaTab = document.querySelector('a.item[data-tab="media"]');
      if (mediaTab && !mediaTab.classList.contains('active')) {
        mediaTab.click();
        console.log('[customBoTTO] ✅ Onglet Media activé au chargement');
      }
    };
    
    // Essayer immédiatement et sinon attendre un peu
    activateMediaTab();
    setTimeout(activateMediaTab, 500);
    
    // Essayer de dupliquer le bouton immédiatement
    duplicateButton();
    
    // Essayer aussi de dupliquer le bouton dans l'onglet details
    duplicateButtonInDetailsTab();
    
    // Activer l'observateur DOM pour les changements dynamiques
    observeForCustomButton();
    
    // Garder le système de clic pour les autres actions
    document.addEventListener('click', tryInject);
    window.addEventListener('beforeunload', () => {
      injected = false;
      buttonDuplicated = false; // Réinitialiser aussi le flag du bouton
      detailsButtonDuplicated = false; // Réinitialiser le flag du bouton details
    });
  }
}

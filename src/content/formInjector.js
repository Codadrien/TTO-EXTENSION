// Auto-fill sylius_product[images][0][type] = "main" on tonton-outdoor admin
let injected = false;

function tryInject() {
  if (injected || !window.location.href.match(/tonton-outdoor\.com\/admin\/products\/\d+\/edit/)) return false;
  
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
      console.log('[formInjector] ✅ Type rempli:', selector);
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
      console.log('[formInjector] ✅ Couleur sélectionnée automatiquement:', option.value);
      success = true;
    } else if (options.length > 1) {
      console.log('[formInjector] ⚠️ Plusieurs couleurs détectées, pas de sélection automatique');
    }
  }
  
  if (success) {
    injected = true;
    document.removeEventListener('click', tryInject);
  }
  
  return success;
}

export function startFormInjector() {
  if (window.location.href.match(/tonton-outdoor\.com\/admin\/products\/\d+\/edit/)) {
    // Activer l'onglet Media immédiatement au chargement
    const activateMediaTab = () => {
      const mediaTab = document.querySelector('a.item[data-tab="media"]');
      if (mediaTab && !mediaTab.classList.contains('active')) {
        mediaTab.click();
        console.log('[formInjector] ✅ Onglet Media activé au chargement');
      }
    };
    
    // Essayer immédiatement et sinon attendre un peu
    activateMediaTab();
    setTimeout(activateMediaTab, 500);
    
    // Garder le système de clic pour les autres actions
    document.addEventListener('click', tryInject);
    window.addEventListener('beforeunload', () => injected = false);
  }
} 
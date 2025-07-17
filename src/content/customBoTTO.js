// Système d'automatisation TTO - Version simplifiée
const AUTOMATION_STATE_KEY = 'tto-automation-state';
const LOCALHOST_PORT = 3333;

// Variables globales
let injected = false;
let buttonsCreated = false;
let automationActive = false;

// Vérification de la page
const isProductEditPage = () => window.location.href.match(/tonton-outdoor\.com\/admin\/products\/\d+\/edit/);

// === GESTION D'ÉTAT SIMPLIFIÉE ===
const createState = () => ({
  isActive: false,
  isCompleted: false,
  currentStep: 1,
  url: window.location.href,
  productUrl: null,
  steps: Array.from({length: 6}, (_, i) => ({ completed: false, name: `step_${i+1}` })),
  timestamp: Date.now()
});

const getState = () => {
  return new Promise((resolve) => {
    chrome.storage.local.get([AUTOMATION_STATE_KEY], (result) => {
      resolve(result[AUTOMATION_STATE_KEY] || null);
    });
  });
};

const saveState = (state) => {
  chrome.storage.local.set({ [AUTOMATION_STATE_KEY]: state });
  
  // Communication rapide via localhost
  fetch(`http://localhost:${LOCALHOST_PORT}/automation-state`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(state)
  }).catch(() => {});
};

const clearState = () => {
  chrome.storage.local.remove([AUTOMATION_STATE_KEY]);
  automationActive = false;
  console.log('[customBoTTO] 🧹 État nettoyé');
};

const markCompleted = (state, step) => {
  state.steps[step - 1].completed = true;
  state.steps[step - 1].timestamp = Date.now();
  
  // Vérifier si toutes les étapes sont terminées
  if (state.steps.every(s => s.completed)) {
    state.isCompleted = true;
    state.isActive = false;
    automationActive = false;
    console.log('[customBoTTO] 🎉 Automatisation terminée');
  }
  
  saveState(state);
};

// === CRÉATION DES BOUTONS DUPLIQUÉS ===
const createButtons = () => {
  if (buttonsCreated || !isProductEditPage()) return;
  
  const original = document.getElementById('sylius_save_changes_button');
  if (!original) return;
  
  // Bouton dans l'onglet média
  const mediaDiv = document.querySelector('.product-medias');
  if (mediaDiv && !document.getElementById('tto_media_button')) {
    const btn = original.cloneNode(true);
    btn.id = 'tto_media_button';
    btn.classList.add('tto-duplicated-button');
    btn.style.marginBottom = '10px';
    mediaDiv.parentNode.insertBefore(btn, mediaDiv);
    console.log('[customBoTTO] ✅ Bouton média créé');
  }
  
  // Bouton dans l'onglet détails
  const header = document.querySelector('.ui.top.attached.header');
  if (header && !document.getElementById('tto_details_button')) {
    const btn = original.cloneNode(true);
    btn.id = 'tto_details_button';
    btn.classList.add('tto-duplicated-button');
    btn.style.margin = '10px 0';
    header.parentNode.insertBefore(btn, header.nextSibling);
    console.log('[customBoTTO] ✅ Bouton détails créé');
  }
  
  buttonsCreated = true;
};

// === AUTO-FILL DES CHAMPS ===
const autoFill = () => {
  if (injected || !isProductEditPage()) return;
  
  let success = false;
  
  // Type = "main"
  const typeField = document.querySelector('input[name="sylius_product[images][0][type]"], #sylius_product_images_0_type');
  if (typeField && !typeField.value) {
    typeField.value = 'main';
    typeField.dispatchEvent(new Event('change', { bubbles: true }));
    console.log('[customBoTTO] ✅ Type = main');
    success = true;
  }
  
  // Couleur unique
  const colorSelect = document.querySelector('select[name="sylius_product[options][0][values][0]"]');
  if (colorSelect) {
    const options = Array.from(colorSelect.options).filter(o => o.value);
    if (options.length === 1 && !colorSelect.value) {
      options[0].selected = true;
      colorSelect.value = options[0].value;
      colorSelect.dispatchEvent(new Event('change', { bubbles: true }));
      console.log('[customBoTTO] ✅ Couleur auto:', options[0].value);
      success = true;
    }
  }
  
  if (success) {
    injected = true;
    document.removeEventListener('click', autoFill);
  }
};

// === AUTOMATISATION SIMPLIFIÉE ===
const runAutomation = async (existingState = null) => {
  console.log('[customBoTTO] 🎯 runAutomation appelée - existingState:', !!existingState, 'automationActive:', automationActive);
  
  // Vérifier seulement si c'est un nouveau démarrage (pas une continuation)
  if (!existingState && automationActive) {
    console.log('[customBoTTO] ⚠️ Automatisation déjà active');
    return;
  }
  
  const state = existingState || createState();
  state.isActive = true;
  automationActive = true;
  
  console.log('[customBoTTO] 🚀 Démarrage automatisation, étape:', state.currentStep);
  console.log('[customBoTTO] 🚀 État complet:', state);
  
  try {
    switch (state.currentStep) {
      case 1: await step1_activateToggle(state); break;
      case 2: await step2_saveForm(state); break;
      case 3: await step3_getProductUrl(state); break;
      case 4: await step4_openProduct(state); break;
      case 5: await step5_deactivateToggle(state); break;
      case 6: await step6_saveForm(state); break;
      default:
        console.log('[customBoTTO] Étape inconnue:', state.currentStep);
        clearState();
    }
  } catch (error) {
    console.error('[customBoTTO] Erreur automatisation:', error);
    clearState();
  }
};

const step1_activateToggle = async (state) => {
  const toggle = document.getElementById('sylius_product_enabled');
  if (!toggle) throw new Error('Toggle non trouvé');
  
  if (!toggle.checked) {
    toggle.checked = true;
    toggle.dispatchEvent(new Event('change', { bubbles: true }));
    console.log('[customBoTTO] ✅ Toggle activé');
  }
  
  markCompleted(state, 1);
  state.currentStep = 2;
  saveState(state);
  
  setTimeout(() => runAutomation(state), 500);
};

const step2_saveForm = async (state) => {
  const saveBtn = document.querySelector('.tto-duplicated-button');
  if (!saveBtn) throw new Error('Bouton sauvegarde non trouvé');
  
  markCompleted(state, 2);
  state.currentStep = 3;
  saveState(state);
  
  console.log('[customBoTTO] 💾 Sauvegarde 1/2...');
  saveBtn.click(); // Recharge la page
};

const step3_getProductUrl = async (state) => {
  // Attendre que le lien produit apparaisse
  const waitForLink = () => {
    return new Promise((resolve, reject) => {
      let attempts = 0;
      const check = () => {
        // Sélecteur spécifique pour le bouton "Afficher le produit dans la boutique"
        const link = document.querySelector('a.ui.labeled.icon.button[href*="/p/"]');
        // Fallback par texte si le sélecteur CSS ne fonctionne pas
        const linkByText = Array.from(document.querySelectorAll('a')).find(a => 
          a.textContent.trim().includes('Afficher le produit dans la boutique')
        );
        const foundLink = link || linkByText;
        if (foundLink) {
          resolve(foundLink.href);
        } else if (attempts++ < 20) {
          setTimeout(check, 500);
        } else {
          reject(new Error('Lien produit non trouvé'));
        }
      };
      check();
    });
  };
  
  const productUrl = await waitForLink();
  state.productUrl = productUrl;
  markCompleted(state, 3);
  state.currentStep = 4;
  saveState(state);
  
  console.log('[customBoTTO] 🔗 URL produit:', productUrl);
  setTimeout(() => runAutomation(state), 500);
};

const step4_openProduct = async (state) => {
  if (!state.productUrl) throw new Error('URL produit manquante');
  
  // Vérifier si cette étape a déjà été exécutée (index 3 = étape 4)
  if (state.steps[3] && state.steps[3].completed) {
    console.log('[customBoTTO] Étape 4 déjà exécutée, passage direct à l\'étape 5');
    state.currentStep = 5;
    saveState(state);
    setTimeout(() => runAutomation(state), 500);
    return;
  }
  
  console.log('[customBoTTO] Exécution étape 4 - Ouverture produit');
  console.log('[customBoTTO] URL:', state.productUrl);
  console.log('[customBoTTO] Timestamp:', new Date().toISOString());
  
  // Marquer comme terminée AVANT l'ouverture pour éviter la double exécution
  markCompleted(state, 4);
  state.currentStep = 5;
  saveState(state);
  
  window.open(state.productUrl, '_blank');
  
  setTimeout(() => runAutomation(state), 500);
};

const step5_deactivateToggle = async (state) => {
  const toggle = document.getElementById('sylius_product_enabled');
  if (!toggle) throw new Error('Toggle non trouvé');
  
  if (toggle.checked) {
    toggle.checked = false;
    toggle.dispatchEvent(new Event('change', { bubbles: true }));
    console.log('[customBoTTO] ❌ Toggle désactivé');
  }
  
  markCompleted(state, 5);
  state.currentStep = 6;
  saveState(state);
  
  setTimeout(() => runAutomation(state), 500);
};

const step6_saveForm = async (state) => {
  const saveBtn = document.querySelector('.tto-duplicated-button');
  if (!saveBtn) throw new Error('Bouton sauvegarde non trouvé');
  
  markCompleted(state, 6);
  // Marquer l'automatisation comme terminée
  state.isCompleted = true;
  state.isActive = false;
  saveState(state);
  
  console.log('[customBoTTO] 💾 Sauvegarde 2/2...');
  console.log('[customBoTTO] 🎉 Automatisation terminée');
  
  // Nettoyer l'état après un délai
  setTimeout(() => {
    clearState();
  }, 2000);
  
  saveBtn.click(); // Recharge la page
};

// === REPRISE AUTOMATIQUE ===
const checkResume = async () => {
  const state = await getState();
  console.log('[customBoTTO] 🔍 Vérification reprise - État:', state);
  
  if (!state || !state.isActive || state.isCompleted) {
    console.log('[customBoTTO] ❌ Pas de reprise nécessaire');
    return;
  }
  
  if (state.url === window.location.href) {
    console.log('[customBoTTO] 🔄 Reprise automatisation, étape:', state.currentStep);
    console.log('[customBoTTO] 🔄 État des étapes:', state.steps.map((s, i) => `${i+1}:${s.completed}`));
    setTimeout(() => runAutomation(state), 1000);
  } else {
    console.log('[customBoTTO] ❌ URL différente, pas de reprise');
  }
};

// === EVENT LISTENERS ===
const handleClick = async (event) => {
  if (event.ctrlKey && event.target.classList.contains('tto-duplicated-button')) {
    event.preventDefault();
    event.stopPropagation();
    
    const state = await getState();
    console.log('[customBoTTO] 🔍 État actuel:', state);
    
    // Permettre un nouveau démarrage si l'automatisation est terminée
    if (state && state.isActive && !state.isCompleted) {
      console.log('[customBoTTO] ⚠️ Automatisation déjà en cours');
      return;
    }
    
    // Si l'automatisation est terminée, nettoyer l'état pour permettre un redémarrage
    if (state && state.isCompleted) {
      console.log('[customBoTTO] 🧹 Nettoyage état terminé pour redémarrage');
      clearState();
    }
    
    console.log('[customBoTTO] 🎯 Ctrl+Click détecté - Démarrage automatisation');
    runAutomation();
  }
};

// === INITIALISATION ===
const init = () => {
  if (!isProductEditPage()) return;
  
  console.log('[customBoTTO] 🚀 Initialisation');
  
  // Observer pour créer les boutons
  const observer = new MutationObserver(() => {
    createButtons();
  });
  observer.observe(document.body, { childList: true, subtree: true });
  
  // Event listeners
  document.addEventListener('click', autoFill);
  document.addEventListener('click', handleClick);
  
  // Créer les boutons initiaux
  createButtons();
  
  // Vérifier reprise automatisation
  checkResume();
};

// Démarrer quand le DOM est prêt
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

// Export pour compatibilité avec l'ancien système
export const startCustomBoTTO = init;

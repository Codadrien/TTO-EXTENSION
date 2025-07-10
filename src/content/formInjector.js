// Auto-fill sylius_product[images][0][type] = "main" on tonton-outdoor admin
let injected = false;

function tryInject() {
  if (injected || !window.location.href.includes('tonton-outdoor.com/admin/products')) return false;
  
  const selectors = [
    'input[name="sylius_product[images][0][type]"]',
    '#sylius_product_images_0_type',
    'select[name="sylius_product[images][0][type]"]'
  ];
  
  for (const selector of selectors) {
    const el = document.querySelector(selector);
    if (el && !el.value) {
      el.value = 'main';
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
      console.log('[formInjector] ✅ Champ rempli:', selector);
      injected = true;
      document.removeEventListener('click', tryInject);
      return true;
    }
  }
  return false;
}

export function startFormInjector() {
  if (window.location.href.includes('tonton-outdoor.com/admin/products')) {
    document.addEventListener('click', tryInject);
    window.addEventListener('beforeunload', () => injected = false);
  }
} 
/* Shared across every page of the Power Cool site: currency, product data,
   cart, quick view, account menu, WhatsApp CTA, and scroll animations.
   Loaded once at the bottom of <body>, after all markup, so every
   getElementById below finds its element. Page-specific scripts (hero
   animation, the shop page's own product-filtering) load right after this
   file and can call anything defined here. */

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
gsap.registerPlugin(ScrollTrigger);

const WHATSAPP_NUMBER = '971508854100';

/* ---------------- Toast ---------------- */

let toastTimer;
function showToast(msg) {
  const el = document.getElementById('toast');
  if (!el) return;
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2600);
}

/* ---------------- Currency ----------------
   Display-only conversion so prospects browsing from outside the UAE see a
   familiar currency. Real orders are still confirmed and invoiced in AED —
   we say so at checkout rather than pretending this is a live FX rate. */

const CURRENCY_RATES = { AED: 1, USD: 0.2723, EUR: 0.2508, GBP: 0.2149 };
const CURRENCY_SYMBOLS = { AED: 'AED', USD: '$', EUR: '€', GBP: '£' };
let currentCurrency = localStorage.getItem('pc_currency') || 'AED';

function formatPrice(aed) {
  const rate = CURRENCY_RATES[currentCurrency] ?? 1;
  const val = aed * rate;
  const symbol = CURRENCY_SYMBOLS[currentCurrency];
  if (currentCurrency === 'AED') return `AED ${Math.round(val)}`;
  return `${symbol}${val.toFixed(2)}`;
}

function setCurrency(code) {
  currentCurrency = code;
  localStorage.setItem('pc_currency', code);
  document.querySelectorAll('.currency-select').forEach((sel) => { sel.value = code; });
  document.dispatchEvent(new CustomEvent('currencychange'));
}

document.querySelectorAll('.currency-select').forEach((sel) => {
  sel.value = currentCurrency;
  sel.addEventListener('change', (e) => setCurrency(e.target.value));
});

document.addEventListener('currencychange', () => {
  renderCart();
  if (typeof renderProducts === 'function') renderProducts();
  if (typeof renderFeatured === 'function') renderFeatured();
  if (typeof qvProduct !== 'undefined' && qvProduct) openQuickView(qvProduct, true);
  if (typeof refreshCheckoutTotals === 'function') refreshCheckoutTotals();
});

/* ---------------- Data: brands, categories, products ----------------
   Brand names, specs and compatibility below are realistic placeholders for
   the demo. Before this goes live, confirm with Power Cool exactly which
   brands they're authorized to claim as stockist. */

const BRANDS = ['Copeland', 'Danfoss', 'Bristol', 'Tecumseh', 'LG', 'Samsung', 'Panasonic', 'Honeywell', 'Genetron', 'Briton', 'DuPont', 'Forane', 'Mafron', 'Maksal', 'Mueller', 'Klima', 'Siemens', 'Omron', 'Rothenberger', 'Uniweld', 'AO Smith', 'EBM', 'Sporlan', 'Mitsubishi'];

const CATEGORY_META = {
  'Compressors': { icon: '<circle cx="12" cy="12" r="4"/><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/>', brands: ['Copeland', 'Danfoss', 'Bristol', 'Tecumseh'] },
  'Capacitors & Relays': { icon: '<path d="M13 2 3 14h7l-1 8 10-12h-7l1-8z"/>', brands: ['Danfoss', 'Mueller', 'Omron'] },
  'Refrigerant Gas': { icon: '<path d="M12 2.7l5.7 5.7a8 8 0 11-11.4 0z"/>', brands: ['Honeywell Genetron', 'Briton', 'DuPont', 'Forane'] },
  'Fan Motors': { icon: '<circle cx="12" cy="12" r="2"/><ellipse cx="12" cy="7" rx="2" ry="4"/><ellipse cx="17" cy="12" rx="4" ry="2"/><ellipse cx="12" cy="17" rx="2" ry="4"/><ellipse cx="7" cy="12" rx="4" ry="2"/>', brands: ['AO Smith', 'EBM'] },
  'Control Boards': { icon: '<rect x="5" y="5" width="14" height="14" rx="2"/><rect x="9" y="9" width="6" height="6"/><path d="M9 2v3M15 2v3M9 19v3M15 19v3M2 9h3M2 15h3M19 9h3M19 15h3"/>', brands: ['Honeywell', 'Siemens'] },
  'Filters & Driers': { icon: '<path d="M22 4H2l8 9v6l4 2v-8z"/>', brands: ['Sporlan', 'Danfoss'] },
  'Thermostats': { icon: '<path d="M14 14.8V4a2 2 0 00-4 0v10.8a4 4 0 104 0z"/>', brands: ['Siemens', 'Honeywell', 'Omron'] },
  'Copper & Fittings': { icon: '<circle cx="8" cy="12" r="4"/><circle cx="16" cy="12" r="4"/>', brands: ['Maksal', 'Mueller', 'Klima'] },
};

const PRODUCTS = [
  { id: 'compressor', brand: 'Copeland', sku: 'ZR125KCE-TFD', name: 'Copeland Scroll Compressor 3TR', price: 2450, img: 'images/product-compressor.jpg', category: 'Compressors', rating: 4.9, reviews: 21, stock: 'in-stock',
    description: 'Genuine 3-ton scroll compressor for residential and light commercial split systems. R-410A compatible.',
    specs: { 'Capacity': '3 Ton (36,000 BTU)', 'Refrigerant': 'R-410A', 'Voltage': '208-230V / 1-Phase', 'Displacement': '12.62 cc/rev' },
    compatibility: ['Split systems', 'Package units', 'Commercial A/C'] },
  { id: 'capacitor', brand: 'Danfoss', sku: 'CAP-3505-370', name: 'Run Capacitor 35+5 MFD', price: 45, img: 'images/product-capacitor.jpg', category: 'Capacitors & Relays', rating: 4.6, reviews: 58, stock: 'in-stock',
    description: 'Dual-rated run capacitor for compressor and fan motor circuits. 370/440V rated.',
    specs: { 'Capacitance': '35+5 MFD', 'Voltage': '370/440V', 'Type': 'Dual round can' },
    compatibility: ['Split systems', 'Package units'] },
  { id: 'gas', brand: 'Honeywell Genetron', sku: 'R410A-11.3KG', name: 'R-410A Refrigerant Gas 11.3kg', price: 320, img: 'images/product-gas.jpg', category: 'Refrigerant Gas', rating: 4.7, reviews: 39, stock: 'low-stock',
    description: 'Virgin R-410A refrigerant, 11.3kg disposable cylinder. Sealed, batch-tested.',
    specs: { 'Refrigerant': 'R-410A', 'Cylinder': '11.3kg disposable', 'Purity': '99.98%' },
    compatibility: ['Split systems', 'Ducted systems', 'Commercial A/C'] },
  { id: 'fanmotor', brand: 'AO Smith', sku: 'FM-14-208', name: 'Condenser Fan Motor 1/4 HP', price: 210, img: 'images/product-fanmotor.jpg', category: 'Fan Motors', rating: 4.5, reviews: 17, stock: 'in-stock',
    description: 'Weatherproof condenser fan motor, 1/4 HP, single-phase. Fits most split and package units.',
    specs: { 'Power': '1/4 HP', 'Voltage': '208-230V', 'Speed': '1075 RPM', 'Rating': 'IP54 weatherproof' },
    compatibility: ['Split systems', 'Package units'] },
  { id: 'pcb', brand: 'Honeywell', sku: 'PCB-UNI-24V', name: 'Universal AC Control Board', price: 380, img: 'images/product-pcb.jpg', category: 'Control Boards', rating: 4.4, reviews: 12, stock: 'in-stock',
    description: 'Universal indoor unit control board with configurable DIP settings for major brands.',
    specs: { 'Voltage': '24V control / 230V line', 'Compatibility': 'Multi-brand DIP config', 'Outputs': '4-speed fan control' },
    compatibility: ['Ducted systems', 'Split systems'] },
  { id: 'filterdrier', brand: 'Sporlan', sku: 'FD-38-5PK', name: 'Filter Drier 3/8" (Pack of 5)', price: 95, img: 'images/product-filterdrier.jpg', category: 'Filters & Driers', rating: 4.8, reviews: 26, stock: 'in-stock',
    description: 'Bi-flow filter drier, 3/8" solder connections. Removes moisture and particulates from the refrigerant line.',
    specs: { 'Connection': '3/8" solder (ODF)', 'Flow': 'Bi-flow', 'Pack size': '5 units' },
    compatibility: ['Refrigeration', 'Split systems', 'Commercial A/C'] },
  { id: 'thermostat', brand: 'Siemens', sku: 'TH-DIG-24V', name: 'Digital Room Thermostat', price: 120, img: 'images/product-thermostat.jpg', category: 'Thermostats', rating: 4.6, reviews: 33, stock: 'in-stock',
    description: 'Programmable digital thermostat with backlit display, compatible with most split unit systems.',
    specs: { 'Display': 'Backlit LCD', 'Power': '24V / battery backup', 'Programs': '7-day scheduling' },
    compatibility: ['Split systems', 'Ducted systems'] },
  { id: 'copperpipe', brand: 'Maksal', sku: 'CU-3/8-15M', name: 'Copper Refrigerant Pipe 3/8" (15m)', price: 260, img: 'images/product-copperpipe.jpg', category: 'Copper & Fittings', rating: 4.7, reviews: 39, stock: 'in-stock',
    description: 'Refrigeration-grade soft copper coil, 3/8" OD, 15m length, nitrogen-purged.',
    specs: { 'Outer Diameter': '3/8" (9.5mm)', 'Length': '15m', 'Purity': '99.9% Cu', 'Origin': 'South Africa' },
    compatibility: ['Package units', 'Ducted systems', 'Commercial A/C'] },
];

const CATEGORIES = [...new Set(PRODUCTS.map((p) => p.category))];
const PRODUCT_BRANDS = [...new Set(PRODUCTS.map((p) => p.brand))].sort();

/* ---------------- Shared render helpers ---------------- */

function renderBrandPills() {
  const el = document.getElementById('brand-pills');
  if (!el) return;
  el.innerHTML = BRANDS.map((b) => `<span class="category-pill">${b}</span>`).join('');
}

function renderCategoryGrid() {
  const el = document.getElementById('category-grid');
  if (!el) return;
  el.innerHTML = CATEGORIES.map((cat) => `
    <a href="shop.html?category=${encodeURIComponent(cat)}" class="category-cell block hover:bg-[--paper] transition-colors">
      <div class="category-icon"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">${CATEGORY_META[cat].icon}</svg></div>
      <h3 class="font-display font-bold text-base mb-1">${cat}</h3>
      <p class="text-xs text-[--ink-soft]">${CATEGORY_META[cat].brands.join(', ')}</p>
    </a>`).join('');
}

function renderFooterCatalogLinks() {
  const el = document.getElementById('footer-catalog-links');
  if (!el) return;
  el.innerHTML = CATEGORIES.map((cat) =>
    `<li><a href="shop.html?category=${encodeURIComponent(cat)}" class="text-sm">${cat}</a></li>`
  ).join('');
}

function productCardHTML(p) {
  return `
    <div class="product-img-wrap relative">
      <img src="${p.img}" alt="${p.name}" loading="lazy" />
      ${p.stock === 'low-stock' ? '<span class="stock-badge">Low Stock</span>' : ''}
      <span class="rating-badge"><span class="star">★</span>${p.rating}</span>
      <button class="quick-add-btn add-to-cart" data-id="${p.id}" aria-label="Add to cart">+</button>
    </div>
    <div class="p-5 flex flex-col gap-1 flex-1">
      <p class="text-[11px] font-semibold uppercase tracking-wide text-[--ink-soft]">${p.brand}</p>
      <h3 class="font-display font-semibold text-sm leading-snug mb-1">${p.name}</h3>
      <span class="font-bold tabular mt-auto price-value" data-aed="${p.price}">${formatPrice(p.price)}</span>
    </div>`;
}

function makeProductCard(p) {
  const card = document.createElement('div');
  card.className = 'product-card reveal-up cursor-pointer';
  card.innerHTML = productCardHTML(p);
  card.addEventListener('click', () => openQuickView(p));
  card.querySelector('.add-to-cart').addEventListener('click', (e) => {
    e.stopPropagation();
    addToCart(p.id);
    showToast(`Added "${p.name}" to cart`);
  });
  return card;
}

/* ---------------- Quick view ---------------- */

let qvProduct = null;
let qvQty = 1;
function openQuickView(p, keepQty = false) {
  qvProduct = p;
  if (!keepQty) qvQty = 1;
  document.getElementById('qv-img').src = p.img;
  document.getElementById('qv-img').alt = p.name;
  document.getElementById('qv-brand').textContent = p.brand;
  document.getElementById('qv-sku').textContent = p.sku;
  document.getElementById('qv-name').textContent = p.name;
  document.getElementById('qv-rating').textContent = `${p.rating} · ${p.reviews} reviews`;
  document.getElementById('qv-desc').textContent = p.description;
  document.getElementById('qv-price').textContent = formatPrice(p.price);
  document.getElementById('qv-qty').textContent = qvQty;

  document.getElementById('qv-badges').innerHTML = [
    'Dubai Warehouse', 'In-Store Pickup', 'Delivery Available',
    p.stock === 'low-stock' ? 'Low Stock' : 'In Stock',
  ].map((b) => `<span class="badge-pill">${b}</span>`).join('');

  document.getElementById('qv-specs').innerHTML = Object.entries(p.specs)
    .map(([k, v]) => `<div class="spec-row"><span>${k}</span><span class="font-medium">${v}</span></div>`).join('');

  document.getElementById('qv-compat').innerHTML = p.compatibility
    .map((c) => `<span class="compat-pill">✓ ${c}</span>`).join('');

  document.getElementById('quickview-overlay').classList.add('open-qv');
  document.getElementById('quickview-modal').classList.add('open-qv');
}
function closeQuickView() {
  document.getElementById('quickview-overlay').classList.remove('open-qv');
  document.getElementById('quickview-modal').classList.remove('open-qv');
}
document.getElementById('quickview-close')?.addEventListener('click', closeQuickView);
document.getElementById('quickview-overlay')?.addEventListener('click', closeQuickView);
document.getElementById('qv-inc')?.addEventListener('click', () => { qvQty++; document.getElementById('qv-qty').textContent = qvQty; });
document.getElementById('qv-dec')?.addEventListener('click', () => { qvQty = Math.max(1, qvQty - 1); document.getElementById('qv-qty').textContent = qvQty; });
document.getElementById('qv-add')?.addEventListener('click', () => {
  if (!qvProduct) return;
  addToCart(qvProduct.id, qvQty);
  showToast(`Added "${qvProduct.name}" to cart`);
  closeQuickView();
});

/* ---------------- Cart ---------------- */

let cart = JSON.parse(localStorage.getItem('pc_cart') || '{}');
function saveCart() { localStorage.setItem('pc_cart', JSON.stringify(cart)); }
function cartLines() {
  return Object.entries(cart).map(([id, qty]) => ({ ...PRODUCTS.find((p) => p.id === id), qty }));
}
function cartSubtotal() { return cartLines().reduce((sum, l) => sum + l.price * l.qty, 0); }

function renderCart() {
  const count = Object.values(cart).reduce((a, b) => a + b, 0);
  const countEl = document.getElementById('cart-count');
  if (countEl) countEl.textContent = count;

  const itemsEl = document.getElementById('cart-items');
  if (!itemsEl) return;
  const lines = cartLines();
  itemsEl.innerHTML = lines.length ? '' : '<p class="text-sm text-[--ink-soft]">Your cart is empty.</p>';
  lines.forEach((l) => {
    const row = document.createElement('div');
    row.className = 'flex gap-4 items-center';
    row.innerHTML = `
      <img src="${l.img}" class="w-16 h-16 rounded-lg object-cover border border-[--line]" />
      <div class="flex-1">
        <p class="text-sm font-semibold leading-snug">${l.name}</p>
        <p class="text-xs text-[--ink-soft] tabular">${formatPrice(l.price)}</p>
      </div>
      <div class="flex items-center gap-2">
        <button class="qty-btn dec" data-id="${l.id}">−</button>
        <span class="w-5 text-center text-sm tabular">${l.qty}</span>
        <button class="qty-btn inc" data-id="${l.id}">+</button>
      </div>`;
    itemsEl.appendChild(row);
  });
  document.getElementById('cart-subtotal').textContent = formatPrice(cartSubtotal());

  itemsEl.querySelectorAll('.inc').forEach((b) => b.addEventListener('click', () => { cart[b.dataset.id]++; saveCart(); renderCart(); }));
  itemsEl.querySelectorAll('.dec').forEach((b) => b.addEventListener('click', () => {
    cart[b.dataset.id]--;
    if (cart[b.dataset.id] <= 0) delete cart[b.dataset.id];
    saveCart(); renderCart();
  }));
}

function addToCart(id, qty = 1) {
  cart[id] = (cart[id] || 0) + qty;
  saveCart(); renderCart(); openCart();
  gsap.fromTo('#cart-count', { scale: 1.5 }, { scale: 1, duration: 0.35, ease: 'back.out(3)' });
}

function openCart() { document.getElementById('cart-drawer').classList.add('open'); document.getElementById('cart-overlay').classList.add('open'); }
function closeCart() { document.getElementById('cart-drawer').classList.remove('open'); document.getElementById('cart-overlay').classList.remove('open'); }
document.getElementById('cart-toggle')?.addEventListener('click', () => document.getElementById('cart-drawer').classList.contains('open') ? closeCart() : openCart());
document.getElementById('cart-close')?.addEventListener('click', closeCart);
document.getElementById('cart-overlay')?.addEventListener('click', closeCart);

document.getElementById('cart-checkout-btn')?.addEventListener('click', () => {
  if (document.getElementById('checkout-section')) {
    if (typeof showCheckout === 'function') showCheckout();
  } else {
    window.location.href = 'index.html#open-checkout';
  }
});

/* ---------------- Account menu (UI only — no backend) ---------------- */

const accountToggle = document.getElementById('account-toggle');
const accountDropdown = document.getElementById('account-dropdown');
if (accountToggle && accountDropdown) {
  accountToggle.addEventListener('click', (e) => {
    e.stopPropagation();
    accountDropdown.classList.toggle('open');
  });
  document.addEventListener('click', (e) => {
    if (!accountDropdown.contains(e.target) && e.target !== accountToggle) accountDropdown.classList.remove('open');
  });
  accountDropdown.querySelectorAll('[data-account-action]').forEach((btn) => {
    btn.addEventListener('click', () => {
      accountDropdown.classList.remove('open');
      showToast('Customer accounts are coming soon — order via WhatsApp for now.');
    });
  });
}

/* ---------------- Nav search icon ---------------- */

document.getElementById('nav-search-toggle')?.addEventListener('click', () => {
  const input = document.getElementById('search-input');
  if (input) {
    input.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
    setTimeout(() => input.focus(), reduceMotion ? 0 : 400);
  } else {
    window.location.href = 'shop.html?focus=search';
  }
});

/* ---------------- Shared scroll UI: nav state, reveals, counters, magnets ---------------- */

document.querySelectorAll('a[href^="#"]').forEach((a) => {
  a.addEventListener('click', (e) => {
    const target = document.querySelector(a.getAttribute('href'));
    if (!target) return;
    e.preventDefault();
    closeCart();
    target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
  });
});

const nav = document.getElementById('site-nav');
if (nav) {
  ScrollTrigger.create({ start: 0, end: 99999, onUpdate: (self) => nav.classList.toggle('scrolled', self.scroll() > 40) });
}

gsap.utils.toArray('.reveal-up').forEach((el) => {
  gsap.fromTo(el, { opacity: 0, y: 28 }, { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out', scrollTrigger: { trigger: el, start: 'top 85%' } });
});
gsap.utils.toArray('.reveal-card').forEach((el, i) => {
  gsap.fromTo(el, { opacity: 0, y: 34, clipPath: 'inset(0 0 100% 0)' }, {
    opacity: 1, y: 0, clipPath: 'inset(0 0 0% 0)', duration: 0.8, ease: 'power3.out', delay: (i % 4) * 0.07,
    scrollTrigger: { trigger: el, start: 'top 88%' },
  });
});
gsap.utils.toArray('.clip-reveal').forEach((el) => {
  if (el.id === 'hero-image-wrap') return;
  gsap.fromTo(el, { clipPath: 'inset(0 0 100% 0)' }, { clipPath: 'inset(0 0 0% 0)', duration: 1, ease: 'power4.inOut', scrollTrigger: { trigger: el, start: 'top 85%' } });
});
document.querySelectorAll('[data-counter]').forEach((el) => {
  const target = parseFloat(el.dataset.counter);
  const isDecimal = !Number.isInteger(target);
  const obj = { val: 0 };
  ScrollTrigger.create({
    trigger: el, start: 'top 90%', once: true,
    onEnter: () => gsap.to(obj, { val: target, duration: 1.4, ease: 'power2.out', onUpdate: () => { el.textContent = isDecimal ? obj.val.toFixed(1) : Math.round(obj.val); } }),
  });
});
document.querySelectorAll('.magnetic').forEach((btn) => {
  btn.addEventListener('mousemove', (e) => {
    const r = btn.getBoundingClientRect();
    gsap.to(btn, { x: (e.clientX - r.left - r.width / 2) * 0.25, y: (e.clientY - r.top - r.height / 2) * 0.35, duration: 0.4, ease: 'power3.out' });
  });
  btn.addEventListener('mouseleave', () => gsap.to(btn, { x: 0, y: 0, duration: 0.6, ease: 'elastic.out(1, 0.4)' }));
});

/* ---------------- Back to top ---------------- */
document.getElementById('back-to-top')?.addEventListener('click', () => window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' }));

/* ---------------- Initial paint ---------------- */
renderBrandPills();
renderCategoryGrid();
renderFooterCatalogLinks();
renderCart();

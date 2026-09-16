/* Shared across every page of the {{BUSINESS_NAME}} site: currency, product
   data, cart, quick view, account menu, WhatsApp CTA, and scroll animations.
   Loaded once at the bottom of <body>, after all markup, so every
   getElementById below finds its element. Page-specific scripts (hero
   animation, the shop page's own product-filtering) load right after this
   file and can call anything defined here. */

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
gsap.registerPlugin(ScrollTrigger);

const WHATSAPP_NUMBER = '{{WHATSAPP_NUMBER}}';

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
   Display-only conversion so prospects browsing from outside the home
   market see a familiar currency. Real orders are still confirmed and
   invoiced in {{BASE_CURRENCY}} — say so at checkout rather than pretending
   this is a live FX rate.

   This template ships with {{BASE_CURRENCY}} as the base (rate 1) and three
   illustrative alternates. If {{BASE_CURRENCY}} is one of USD/EUR/GBP,
   delete that duplicate entry below AND its <option> in both page headers
   before shipping. */

const CURRENCY_RATES = { {{BASE_CURRENCY}}: 1, USD: 0.2723, EUR: 0.2508, GBP: 0.2149 };
const CURRENCY_SYMBOLS = { {{BASE_CURRENCY}}: '{{BASE_CURRENCY}}', USD: '$', EUR: '€', GBP: '£' };
let currentCurrency = localStorage.getItem('site_currency') || '{{BASE_CURRENCY}}';

function formatPrice(base) {
  const rate = CURRENCY_RATES[currentCurrency] ?? 1;
  const val = base * rate;
  const symbol = CURRENCY_SYMBOLS[currentCurrency];
  if (currentCurrency === '{{BASE_CURRENCY}}') return `{{BASE_CURRENCY}} ${Math.round(val)}`;
  return `${symbol}${val.toFixed(2)}`;
}

function setCurrency(code) {
  currentCurrency = code;
  localStorage.setItem('site_currency', code);
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

/* ==================================================================
   DATA: brands, categories, products — REPLACE ALL OF THIS.

   Everything below is placeholder sample data shaped to show the pattern.
   There is no token for a product catalog — catalogs vary too much in
   shape (specs, compatibility, sizing) to substitute generically. Before
   this goes live, delete every sample entry and replace it with the real
   catalog: real category names, real brand names the business is actually
   authorized to claim, and real products with real prices, specs and
   photos. Leaving any sample product on a live site is the one mistake
   that must never ship — it is more damaging than a leftover {{TOKEN}}
   because it looks like a real (wrong) offer, not an obvious placeholder.
   ================================================================== */

const BRANDS = ['Sample Brand One', 'Sample Brand Two', 'Sample Brand Three', 'Sample Brand Four'];

const CATEGORY_META = {
  'Sample Category A': { icon: '<circle cx="12" cy="12" r="4"/><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/>', brands: ['Sample Brand One', 'Sample Brand Two'] },
  'Sample Category B': { icon: '<path d="M13 2 3 14h7l-1 8 10-12h-7l1-8z"/>', brands: ['Sample Brand Two', 'Sample Brand Three'] },
  'Sample Category C': { icon: '<path d="M12 2.7l5.7 5.7a8 8 0 11-11.4 0z"/>', brands: ['Sample Brand Three', 'Sample Brand Four'] },
};

const PRODUCTS = [
  { id: 'sample-1', brand: 'Sample Brand One', sku: 'SKU-0001', name: 'Sample Product One', price: 100, img: 'images/product-1.jpg', category: 'Sample Category A', rating: 4.8, reviews: 12, stock: 'in-stock',
    description: 'One or two sentences describing this product for real — what it is, who it is for, why it is genuine/quality.',
    specs: { 'Spec label': 'Spec value', 'Another spec': 'Another value' },
    compatibility: ['Use case one', 'Use case two'] },
  { id: 'sample-2', brand: 'Sample Brand Two', sku: 'SKU-0002', name: 'Sample Product Two', price: 60, img: 'images/product-2.jpg', category: 'Sample Category A', rating: 4.6, reviews: 8, stock: 'in-stock',
    description: 'Replace with the real product description.',
    specs: { 'Spec label': 'Spec value' },
    compatibility: ['Use case one'] },
  { id: 'sample-3', brand: 'Sample Brand Two', sku: 'SKU-0003', name: 'Sample Product Three', price: 220, img: 'images/product-3.jpg', category: 'Sample Category B', rating: 4.7, reviews: 15, stock: 'low-stock',
    description: 'Replace with the real product description.',
    specs: { 'Spec label': 'Spec value', 'Another spec': 'Another value' },
    compatibility: ['Use case one', 'Use case two'] },
  { id: 'sample-4', brand: 'Sample Brand Three', sku: 'SKU-0004', name: 'Sample Product Four', price: 45, img: 'images/product-4.jpg', category: 'Sample Category B', rating: 4.5, reviews: 6, stock: 'in-stock',
    description: 'Replace with the real product description.',
    specs: { 'Spec label': 'Spec value' },
    compatibility: ['Use case one'] },
  { id: 'sample-5', brand: 'Sample Brand Three', sku: 'SKU-0005', name: 'Sample Product Five', price: 310, img: 'images/product-5.jpg', category: 'Sample Category C', rating: 4.9, reviews: 21, stock: 'in-stock',
    description: 'Replace with the real product description.',
    specs: { 'Spec label': 'Spec value', 'Another spec': 'Another value' },
    compatibility: ['Use case one', 'Use case two'] },
  { id: 'sample-6', brand: 'Sample Brand Four', sku: 'SKU-0006', name: 'Sample Product Six', price: 90, img: 'images/product-6.jpg', category: 'Sample Category C', rating: 4.4, reviews: 9, stock: 'in-stock',
    description: 'Replace with the real product description.',
    specs: { 'Spec label': 'Spec value' },
    compatibility: ['Use case one'] },
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
      <span class="font-bold tabular mt-auto">${formatPrice(p.price)}</span>
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
    'In-Store Pickup', 'Delivery Available',
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

let cart = JSON.parse(localStorage.getItem('site_cart') || '{}');
function saveCart() { localStorage.setItem('site_cart', JSON.stringify(cart)); }
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

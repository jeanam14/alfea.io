/* Shared behaviour for all Alfea pages: nav, mobile sheet, reveal, card
   spotlight, modal helper, count-up, accordion. Page-specific interactive
   components (conversation replay, fit check, before/after slider, etc.)
   live inline on their own page. */
(function () {
  'use strict';

  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Nav scroll state ---------- */
  var nav = document.querySelector('.nav');
  function onScroll() {
    if (!nav) return;
    if (window.scrollY > 40) nav.classList.add('scrolled');
    else nav.classList.remove('scrolled');
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- Mobile sheet ---------- */
  var burger = document.querySelector('.nav__burger');
  var sheet = document.querySelector('.sheet');
  var sheetClose = document.querySelector('.sheet__close');
  function closeSheet() { sheet && sheet.classList.remove('open'); }
  burger && burger.addEventListener('click', function () { sheet.classList.add('open'); });
  sheetClose && sheetClose.addEventListener('click', closeSheet);
  sheet && sheet.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', closeSheet); });

  /* ---------- Reveal on scroll ---------- */
  var revealEls = document.querySelectorAll('.reveal');
  if (!reducedMotion && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in-view'); io.unobserve(e.target); }
      });
    }, { threshold: 0.12 });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('in-view'); });
  }

  /* ---------- Card cursor spotlight ---------- */
  if (!reducedMotion && !('ontouchstart' in window)) {
    document.querySelectorAll('.spot').forEach(function (card) {
      card.addEventListener('pointermove', function (e) {
        var r = card.getBoundingClientRect();
        card.style.setProperty('--mx', (e.clientX - r.left) + 'px');
        card.style.setProperty('--my', (e.clientY - r.top) + 'px');
      });
    });
  }

  /* ---------- Modal (generic open/close, content injected by caller) ---------- */
  var overlay = document.getElementById('modal-overlay');
  var panel = overlay ? overlay.querySelector('.modal-panel') : null;
  window.AlfeaModal = {
    open: function (html) {
      if (!panel) return;
      panel.innerHTML = '<button class="modal-panel__close" aria-label="Fermer">&times;</button>' + html;
      overlay.classList.add('open');
      document.body.style.overflow = 'hidden';
      panel.querySelector('.modal-panel__close').addEventListener('click', window.AlfeaModal.close);
    },
    close: function () {
      if (!overlay) return;
      overlay.classList.remove('open');
      document.body.style.overflow = '';
    }
  };
  overlay && overlay.addEventListener('click', function (e) { if (e.target === overlay) window.AlfeaModal.close(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') window.AlfeaModal.close(); });

  /* ---------- Data-modal declarative cards ---------- */
  document.querySelectorAll('[data-modal-title]').forEach(function (el) {
    el.addEventListener('click', function () {
      var title = el.getAttribute('data-modal-title');
      var body = el.getAttribute('data-modal-body') || '';
      var steps = el.getAttribute('data-modal-steps');
      var html = '<h3>' + title + '</h3><p>' + body + '</p>';
      if (steps) {
        html += '<ul>' + steps.split('|').map(function (s) { return '<li>' + s + '</li>'; }).join('') + '</ul>';
      }
      var cta = el.getAttribute('data-modal-cta');
      var ctaHref = el.getAttribute('data-modal-cta-href');
      if (cta && ctaHref) html += '<a class="btn btn-primary" style="width:100%;" href="' + ctaHref + '">' + cta + '</a>';
      window.AlfeaModal.open(html);
    });
  });

  /* ---------- Count-up ---------- */
  function countUp(el) {
    var target = el.getAttribute('data-count-to');
    var prefix = el.getAttribute('data-count-prefix') || '';
    var suffix = el.getAttribute('data-count-suffix') || '';
    var isRange = target.indexOf('-') !== -1;
    if (reducedMotion || isRange) { el.textContent = prefix + target + suffix; return; }
    var end = parseInt(target, 10);
    var start = 0;
    var dur = 900;
    var t0 = null;
    function step(ts) {
      if (!t0) t0 = ts;
      var p = Math.min(1, (ts - t0) / dur);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = prefix + Math.round(start + (end - start) * eased) + suffix;
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  var countEls = document.querySelectorAll('[data-count-to]');
  if (countEls.length && 'IntersectionObserver' in window) {
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { countUp(e.target); cio.unobserve(e.target); }
      });
    }, { threshold: 0.5 });
    countEls.forEach(function (el) { cio.observe(el); });
  }

  /* ---------- Accordion ---------- */
  document.querySelectorAll('.accordion').forEach(function (acc) {
    var items = acc.querySelectorAll('.accordion__item');
    items.forEach(function (item) {
      var btn = item.querySelector('.accordion__q');
      var panelEl = item.querySelector('.accordion__a');
      btn.addEventListener('click', function () {
        var isOpen = item.classList.contains('open');
        items.forEach(function (i) {
          i.classList.remove('open');
          i.querySelector('.accordion__a').style.maxHeight = null;
        });
        if (!isOpen) {
          item.classList.add('open');
          panelEl.style.maxHeight = panelEl.scrollHeight + 'px';
        }
      });
    });
  });

  /* ---------- Year ---------- */
  document.querySelectorAll('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });

  window.AlfeaReducedMotion = reducedMotion;
})();

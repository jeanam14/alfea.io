(function () {
  var nav = document.querySelector('.nav');
  var hero = document.querySelector('.hero');
  function onScroll() {
    if (!nav || !hero) return;
    var heroH = hero.offsetHeight;
    if (window.scrollY > heroH - 120) nav.classList.add('scrolled');
    else nav.classList.remove('scrolled');
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  var burger = document.querySelector('.nav__burger');
  var sheet = document.querySelector('.mobile-sheet');
  var sheetClose = document.querySelector('.mobile-sheet__close');
  function closeSheet() { sheet && sheet.classList.remove('open'); }
  burger && burger.addEventListener('click', function () { sheet.classList.add('open'); });
  sheetClose && sheetClose.addEventListener('click', closeSheet);
  sheet && sheet.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', closeSheet); });

  var revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in-view'); io.unobserve(e.target); }
      });
    }, { threshold: 0.15 });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('in-view'); });
  }

  document.querySelectorAll('.card').forEach(function (card) {
    card.addEventListener('pointermove', function (e) {
      var r = card.getBoundingClientRect();
      card.style.setProperty('--mx', (e.clientX - r.left) + 'px');
      card.style.setProperty('--my', (e.clientY - r.top) + 'px');
    });
  });

  var overlay = document.getElementById('modal-overlay');
  var panel = overlay ? overlay.querySelector('.modal-panel') : null;
  function openModal(data) {
    if (!panel) return;
    var html = '<button class="modal-panel__close" aria-label="Fermer">&times;</button>';
    if (data.eyebrow) html += '<span class="modal-panel__eyebrow">' + data.eyebrow + '</span>';
    html += '<h3>' + data.title + '</h3>';
    if (data.desc) html += '<p>' + data.desc + '</p>';
    if (data.steps && data.steps.length) {
      html += '<ul class="modal-panel__steps">' + data.steps.map(function (s) { return '<li>' + s + '</li>'; }).join('') + '</ul>';
    }
    if (data.metaLeft || data.metaRight) {
      html += '<div class="modal-panel__meta"><span>' + (data.metaLeft || '') + '</span><span>' + (data.metaRight || '') + '</span></div>';
    }
    if (data.ctaHref) {
      html += '<a href="' + data.ctaHref + '" target="_blank" rel="noopener" class="btn btn-primary" style="width:100%;">' + (data.ctaLabel || 'Nous écrire') + '</a>';
    }
    panel.innerHTML = html;
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
    panel.querySelector('.modal-panel__close').addEventListener('click', closeModal);
  }
  function closeModal() {
    overlay.classList.remove('open');
    document.body.style.overflow = '';
  }
  document.querySelectorAll('[data-modal]').forEach(function (el) {
    el.addEventListener('click', function () {
      try { openModal(JSON.parse(el.getAttribute('data-modal'))); } catch (e) { /* noop */ }
    });
  });
  overlay && overlay.addEventListener('click', function (e) { if (e.target === overlay) closeModal(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeModal(); });

  var yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();
})();

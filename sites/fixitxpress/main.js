(function(){
  // Floating nav: switch to light high-contrast fill once the dark hero scrolls away
  var navEl = document.querySelector('.nav');
  var heroEl = document.querySelector('.hero, .page-head');
  function updateNav(){
    if (!navEl) return;
    var threshold = heroEl ? heroEl.offsetHeight - 90 : 140;
    navEl.classList.toggle('scrolled', window.scrollY > threshold);
  }
  window.addEventListener('scroll', updateNav, {passive:true});
  window.addEventListener('resize', updateNav);
  updateNav();

  // Mobile menu
  var menuBtn = document.getElementById('menuBtn');
  var mobileMenu = document.getElementById('mobileMenu');
  if (menuBtn && mobileMenu) {
    menuBtn.addEventListener('click', function(){
      var open = mobileMenu.classList.toggle('open');
      menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
      if (open && navEl) navEl.classList.add('scrolled'); else updateNav();
    });
    mobileMenu.querySelectorAll('a').forEach(function(a){
      a.addEventListener('click', function(){ mobileMenu.classList.remove('open'); updateNav(); });
    });
  }

  // Service-card detail popups
  var overlay = document.getElementById('modalOverlay');
  var titleEl = document.getElementById('modalTitle');
  var bodyEl = document.getElementById('modalBody');
  var closeBtn = document.getElementById('modalClose');
  var lastFocus = null;
  function openModal(card){
    var detail = card.querySelector('.detail');
    titleEl.textContent = card.getAttribute('data-title');
    bodyEl.innerHTML = detail ? detail.innerHTML : '';
    overlay.classList.add('show');
    lastFocus = card;
    closeBtn.focus();
  }
  function closeModal(){
    overlay.classList.remove('show');
    if (lastFocus) lastFocus.focus();
  }
  document.querySelectorAll('.service-card').forEach(function(card){
    card.addEventListener('click', function(){ openModal(card); });
    card.addEventListener('keydown', function(e){
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openModal(card); }
    });
  });
  if (overlay) {
    closeBtn.addEventListener('click', closeModal);
    overlay.addEventListener('click', function(e){ if (e.target === overlay) closeModal(); });
    document.addEventListener('keydown', function(e){ if (e.key === 'Escape' && overlay.classList.contains('show')) closeModal(); });
  }
})();

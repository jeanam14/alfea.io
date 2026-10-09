(function(){
  // Glass nav: dark-hero styling until we scroll past the hero, then light high-contrast fill.
  var nav = document.querySelector('.nav');
  var hero = document.querySelector('.hero, .page-head');
  function updateNav(){
    if (!nav) return;
    var threshold = hero ? hero.offsetHeight - 90 : 140;
    nav.classList.toggle('scrolled', window.scrollY > threshold);
  }
  window.addEventListener('scroll', updateNav, {passive:true});
  window.addEventListener('resize', updateNav);
  updateNav();

  // Mobile menu
  var burger = document.querySelector('.burger');
  var menu = document.querySelector('.mobile-menu');
  if (burger && menu){
    burger.addEventListener('click', function(){
      var open = menu.classList.toggle('open');
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
      if (open) nav.classList.add('scrolled'); else updateNav();
    });
    menu.querySelectorAll('a').forEach(function(a){
      a.addEventListener('click', function(){ menu.classList.remove('open'); burger.setAttribute('aria-expanded','false'); updateNav(); });
    });
  }

  // Service detail modals
  var overlay = document.getElementById('modalOverlay');
  if (!overlay) return;
  var mTitle = document.getElementById('modalTitle');
  var mBody = document.getElementById('modalBody');
  var lastFocus = null;
  function openModal(card){
    lastFocus = card;
    mTitle.textContent = card.getAttribute('data-title');
    var d = card.querySelector('.detail');
    mBody.innerHTML = d ? d.innerHTML : '';
    overlay.classList.add('show');
    document.body.style.overflow = 'hidden';
    document.getElementById('modalClose').focus();
  }
  function closeModal(){
    overlay.classList.remove('show');
    document.body.style.overflow = '';
    if (lastFocus) lastFocus.focus();
  }
  document.querySelectorAll('.card[data-title]').forEach(function(card){
    card.addEventListener('click', function(){ openModal(card); });
    card.addEventListener('keydown', function(e){
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openModal(card); }
    });
  });
  document.getElementById('modalClose').addEventListener('click', closeModal);
  overlay.addEventListener('click', function(e){ if (e.target === overlay) closeModal(); });
  document.addEventListener('keydown', function(e){ if (e.key === 'Escape' && overlay.classList.contains('show')) closeModal(); });
})();

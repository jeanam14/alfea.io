(function(){
  var nav = document.getElementById('nav');
  var hero = document.querySelector('.hero');
  function updateNav(){
    var threshold = hero ? hero.offsetHeight - 80 : 120;
    nav.classList.toggle('scrolled', window.scrollY > threshold);
  }
  window.addEventListener('scroll', updateNav, {passive:true});
  window.addEventListener('resize', updateNav);
  updateNav();

  var burger = document.getElementById('burger');
  var links = document.getElementById('navLinks');
  burger.addEventListener('click', function(){
    var open = links.classList.toggle('open');
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
  links.querySelectorAll('a').forEach(function(a){
    a.addEventListener('click', function(){ links.classList.remove('open'); burger.setAttribute('aria-expanded','false'); });
  });

  var overlay = document.getElementById('modal');
  var titleEl = document.getElementById('modalTitle');
  var detailEl = document.getElementById('modalDetail');
  function openModal(el){
    titleEl.innerHTML = el.getAttribute('data-title');
    detailEl.innerHTML = el.getAttribute('data-detail');
    overlay.classList.add('show');
    overlay.setAttribute('aria-hidden','false');
    document.getElementById('modalClose').focus();
  }
  function closeModal(){
    overlay.classList.remove('show');
    overlay.setAttribute('aria-hidden','true');
  }
  document.querySelectorAll('[data-detail]').forEach(function(el){
    el.addEventListener('click', function(){ openModal(el); });
  });
  document.getElementById('modalClose').addEventListener('click', closeModal);
  overlay.addEventListener('click', function(e){ if (e.target === overlay) closeModal(); });
  document.addEventListener('keydown', function(e){ if (e.key === 'Escape') closeModal(); });
})();

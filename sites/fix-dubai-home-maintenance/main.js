(function(){
  var nav = document.querySelector('.nav');
  var hero = document.querySelector('.hero');
  function updateNav(){
    if (!nav) return;
    var threshold = hero ? hero.offsetHeight - 90 : 120;
    nav.classList.toggle('scrolled', window.scrollY > threshold);
  }
  window.addEventListener('scroll', updateNav, {passive:true});
  window.addEventListener('resize', updateNav);
  updateNav();

  var menuBtn = document.querySelector('.menu-btn');
  var menu = document.querySelector('.mobile-menu');
  if (menuBtn && menu){
    menuBtn.addEventListener('click', function(){
      var open = menu.classList.toggle('open');
      menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    menu.querySelectorAll('a').forEach(function(a){
      a.addEventListener('click', function(){ menu.classList.remove('open'); });
    });
  }

  var modal = document.getElementById('svcModal');
  if (!modal) return;
  var mTitle = document.getElementById('mTitle');
  var mKicker = document.getElementById('mKicker');
  var mDetail = document.getElementById('mDetail');
  var mList = document.getElementById('mList');
  var mWa = document.getElementById('mWa');
  var lastFocus = null;

  function openModal(card){
    lastFocus = card;
    var title = card.getAttribute('data-title') || '';
    mTitle.textContent = title;
    mKicker.textContent = card.getAttribute('data-kicker') || 'Service details';
    mDetail.textContent = card.getAttribute('data-detail') || '';
    mList.innerHTML = '';
    var pts = (card.getAttribute('data-points') || '').split('|').filter(Boolean);
    pts.forEach(function(p){ var li = document.createElement('li'); li.textContent = p.trim(); mList.appendChild(li); });
    mList.style.display = pts.length ? '' : 'none';
    mWa.href = 'https://wa.me/971524714009?text=' + encodeURIComponent('Hi Fix Dubai, I need help with: ' + title);
    modal.classList.add('show');
    modal.setAttribute('aria-hidden','false');
    document.body.style.overflow = 'hidden';
    modal.querySelector('.modal-close').focus();
  }
  function closeModal(){
    modal.classList.remove('show');
    modal.setAttribute('aria-hidden','true');
    document.body.style.overflow = '';
    if (lastFocus) lastFocus.focus();
  }
  document.querySelectorAll('.svc-card').forEach(function(card){
    card.addEventListener('click', function(){ openModal(card); });
  });
  modal.querySelector('.modal-close').addEventListener('click', closeModal);
  modal.addEventListener('click', function(e){ if (e.target === modal) closeModal(); });
  document.addEventListener('keydown', function(e){ if (e.key === 'Escape' && modal.classList.contains('show')) closeModal(); });
})();

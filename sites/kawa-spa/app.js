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
    panel.classList.remove('modal-panel--booking');
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
    html += '<button class="btn btn-primary" style="width:100%;" data-open-booking="' + (data.bookingService || '') + '">Réserver ce soin</button>';
    panel.innerHTML = html;
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
    panel.querySelector('.modal-panel__close').addEventListener('click', closeModal);
    var bookBtn = panel.querySelector('[data-open-booking]');
    bookBtn && bookBtn.addEventListener('click', function () { openBooking(bookBtn.getAttribute('data-open-booking')); });
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

  /* ---------- Booking modal (Setmore-style preview) ---------- */
  var SERVICES = ['Bilan silhouette', 'Drainage lymphatique', 'Remodelage corporel', 'Massages bien-être', 'Épilation', 'Soins du visage'];
  var DAY_NAMES = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
  var TIME_SLOTS = ['9h00', '10h30', '12h00', '14h00', '15h30', '17h00'];

  function buildDates() {
    var out = [];
    var today = new Date();
    for (var i = 0; i < 6; i++) {
      var d = new Date(today);
      d.setDate(today.getDate() + i);
      out.push(d);
    }
    return out;
  }

  function openBooking(presetService) {
    if (!panel) return;
    panel.classList.add('modal-panel--booking');
    var dates = buildDates();
    var state = { service: presetService || SERVICES[0], dateIdx: 0, time: null };

    var html = '<button class="modal-panel__close" aria-label="Fermer">&times;</button>';
    html += '<span class="modal-panel__eyebrow">RÉSERVATION</span><h3>Choisir un créneau</h3>';
    html += '<div class="booking-preview-pill"><span class="booking-preview-pill__dot"></span>Réservation en ligne bientôt disponible — votre demande part directement sur WhatsApp</div>';
    html += '<div class="booking-field"><label>Soin</label><select class="booking-select" id="bk-service">' + SERVICES.map(function (s) { return '<option' + (s === state.service ? ' selected' : '') + '>' + s + '</option>'; }).join('') + '</select></div>';
    html += '<div class="booking-field"><label>Date</label><div class="booking-dates" id="bk-dates">' + dates.map(function (d, i) {
      return '<div class="booking-date' + (i === 0 ? ' active' : '') + '" data-idx="' + i + '"><div class="booking-date__day">' + DAY_NAMES[d.getDay()] + '</div><div class="booking-date__num">' + d.getDate() + '</div></div>';
    }).join('') + '</div></div>';
    html += '<div class="booking-field"><label>Heure</label><div class="booking-times" id="bk-times">' + TIME_SLOTS.map(function (t) {
      return '<div class="booking-time" data-time="' + t + '">' + t + '</div>';
    }).join('') + '</div></div>';
    html += '<div class="booking-summary" id="bk-summary">Choisissez une heure pour continuer.</div>';
    html += '<a class="btn btn-primary" style="width:100%;" id="bk-confirm" target="_blank" rel="noopener">Réserver</a>';

    panel.innerHTML = html;
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
    panel.querySelector('.modal-panel__close').addEventListener('click', closeModal);

    var serviceSel = panel.querySelector('#bk-service');
    var datesEl = panel.querySelector('#bk-dates');
    var timesEl = panel.querySelector('#bk-times');
    var summaryEl = panel.querySelector('#bk-summary');
    var confirmEl = panel.querySelector('#bk-confirm');

    function render() {
      var d = dates[state.dateIdx];
      var dateLabel = DAY_NAMES[d.getDay()] + ' ' + d.getDate() + '/' + (d.getMonth() + 1);
      if (state.time) {
        summaryEl.innerHTML = '<strong>' + state.service + '</strong> — ' + dateLabel + ' à <strong>' + state.time + '</strong>';
        var msg = 'Bonjour, je souhaite réserver : ' + state.service + ', le ' + dateLabel + ' à ' + state.time;
        confirmEl.href = 'https://wa.me/2250788166792?text=' + encodeURIComponent(msg);
      } else {
        summaryEl.textContent = 'Choisissez une heure pour continuer.';
        confirmEl.href = 'https://wa.me/2250788166792?text=' + encodeURIComponent('Bonjour, je souhaite prendre rendez-vous chez Kawa Spa pour : ' + state.service);
      }
    }

    serviceSel.addEventListener('change', function () { state.service = serviceSel.value; render(); });
    datesEl.addEventListener('click', function (e) {
      var el = e.target.closest('.booking-date');
      if (!el) return;
      datesEl.querySelectorAll('.booking-date').forEach(function (d) { d.classList.remove('active'); });
      el.classList.add('active');
      state.dateIdx = parseInt(el.getAttribute('data-idx'), 10);
      render();
    });
    timesEl.addEventListener('click', function (e) {
      var el = e.target.closest('.booking-time');
      if (!el) return;
      timesEl.querySelectorAll('.booking-time').forEach(function (t) { t.classList.remove('active'); });
      el.classList.add('active');
      state.time = el.getAttribute('data-time');
      render();
    });
    render();
  }

  document.querySelectorAll('[data-booking]').forEach(function (el) {
    el.addEventListener('click', function (e) {
      e.preventDefault();
      openBooking();
    });
  });

  var counters = document.querySelectorAll('.stat__num[data-count]');
  if (counters.length && 'IntersectionObserver' in window) {
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        cio.unobserve(e.target);
        var el = e.target;
        var target = parseFloat(el.getAttribute('data-count'));
        var decimals = el.getAttribute('data-count').includes('.') ? 1 : 0;
        var suffix = el.getAttribute('data-suffix') || '';
        var start = performance.now();
        var dur = 1100;
        function tick(now) {
          var p = Math.min(1, (now - start) / dur);
          var eased = 1 - Math.pow(1 - p, 3);
          el.textContent = (target * eased).toFixed(decimals) + suffix;
          if (p < 1) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
      });
    }, { threshold: 0.4 });
    counters.forEach(function (el) { cio.observe(el); });
  }

  var yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();
})();

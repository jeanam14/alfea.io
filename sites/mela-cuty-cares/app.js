// Mela & Cuty Cares — shared interactions
(function () {
  'use strict';

  /* ---------- Nav scroll + mobile sheet ---------- */
  var nav = document.querySelector('.nav');
  var heroEl = document.querySelector('.hero');
  function onScroll() {
    if (!nav) return;
    var threshold = heroEl ? heroEl.offsetHeight - 80 : 400;
    if (window.scrollY > threshold) nav.classList.add('scrolled');
    else nav.classList.remove('scrolled');
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  var burger = document.querySelector('.nav__burger');
  var sheet = document.querySelector('.mobile-sheet');
  if (burger && sheet) {
    burger.addEventListener('click', function () { sheet.classList.add('open'); });
    sheet.querySelectorAll('a, .mobile-sheet__close').forEach(function (el) {
      el.addEventListener('click', function () { sheet.classList.remove('open'); });
    });
  }

  /* ---------- Reveal on scroll ---------- */
  var revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && revealEls.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { entry.target.classList.add('in'); io.unobserve(entry.target); }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('in'); });
  }

  /* ---------- Card oil-sheen cursor tracking ---------- */
  document.querySelectorAll('.card').forEach(function (card) {
    card.addEventListener('pointermove', function (e) {
      var r = card.getBoundingClientRect();
      card.style.setProperty('--mx', ((e.clientX - r.left) / r.width * 100) + '%');
      card.style.setProperty('--my', ((e.clientY - r.top) / r.height * 100) + '%');
    });
  });

  /* ---------- Modal (service / product detail popups) ---------- */
  var modalOverlay = document.getElementById('modal-overlay');
  var modalPanel = modalOverlay ? modalOverlay.querySelector('.modal-panel') : null;
  var lastFocused = null;

  function openModal(data) {
    if (!modalOverlay || !modalPanel) return;
    modalPanel.innerHTML =
      '<button class="modal-close" aria-label="Fermer">&times;</button>' +
      (data.img ? '<div class="modal-panel__img photo photo--on-dark" style="background-image:url(' + data.img + ');background-size:cover;background-position:center;"></div>' : '') +
      '<div class="modal-panel__body">' +
        '<span class="eyebrow eyebrow--dark">' + data.eyebrow + '</span>' +
        '<h3>' + data.title + '</h3>' +
        '<p class="modal-panel__desc">' + data.desc + '</p>' +
        (data.steps ? '<div class="modal-panel__steps">' + data.steps.map(function (s, i) {
          return '<div class="modal-step"><span class="modal-step__num">' + (i + 1) + '</span><span>' + s + '</span></div>';
        }).join('') + '</div>' : '') +
        (data.tags ? '<div class="card__tags">' + data.tags.map(function (t) { return '<span class="tag">' + t + '</span>'; }).join('') + '</div>' : '') +
        '<div class="modal-panel__meta"><span>' + data.metaLeft + '</span><span>' + data.metaRight + '</span></div>' +
        '<a href="' + data.ctaHref + '" class="btn btn-primary" style="width:100%;">' + data.ctaLabel + '</a>' +
      '</div>';
    lastFocused = document.activeElement;
    modalOverlay.classList.add('open');
    document.body.style.overflow = 'hidden';
    modalPanel.querySelector('.modal-close').addEventListener('click', closeModal);
    modalPanel.focus();
  }
  function closeModal() {
    if (!modalOverlay) return;
    modalOverlay.classList.remove('open');
    document.body.style.overflow = '';
    if (lastFocused) lastFocused.focus();
  }
  if (modalOverlay) {
    modalOverlay.addEventListener('click', function (e) { if (e.target === modalOverlay) closeModal(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeModal(); });
  }
  document.querySelectorAll('[data-modal]').forEach(function (card) {
    card.addEventListener('click', function () {
      try { openModal(JSON.parse(card.getAttribute('data-modal'))); } catch (e) { /* noop */ }
    });
  });

  /* ---------- Filter chips (soins.html) ---------- */
  var chips = document.querySelectorAll('.filter-chip');
  if (chips.length) {
    chips.forEach(function (chip) {
      chip.addEventListener('click', function () {
        chips.forEach(function (c) { c.classList.remove('active'); });
        chip.classList.add('active');
        var filter = chip.getAttribute('data-filter');
        document.querySelectorAll('[data-tags]').forEach(function (card) {
          var tags = (card.getAttribute('data-tags') || '').split(',');
          var show = filter === 'tous' || tags.indexOf(filter) !== -1;
          card.style.display = show ? '' : 'none';
        });
      });
    });
  }

  /* ---------- Process timeline (scroll-draw) ---------- */
  var timeline = document.querySelector('.timeline');
  if (timeline) {
    var progress = timeline.querySelector('.timeline__progress');
    var droplet = timeline.querySelector('.timeline__droplet');
    var nodes = timeline.querySelectorAll('.timeline__node');
    var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) {
      nodes.forEach(function (n) { n.classList.add('lit'); });
      if (progress) progress.style.width = '100%';
    } else {
      function updateTimeline() {
        var rect = timeline.getBoundingClientRect();
        var vh = window.innerHeight;
        var total = rect.height + vh * 0.6;
        var passed = vh * 0.85 - rect.top;
        var pct = Math.max(0, Math.min(1, passed / total));
        if (progress) progress.style.width = (pct * 100) + '%';
        if (droplet) droplet.style.left = (pct * 100) + '%';
        var litCount = Math.round(pct * nodes.length);
        nodes.forEach(function (n, i) { n.classList.toggle('lit', i < litCount); });
      }
      window.addEventListener('scroll', updateTimeline, { passive: true });
      window.addEventListener('resize', updateTimeline);
      updateTimeline();
    }
  }

  /* ---------- Texture toggle (Micro-boucles ou gros grains ?) ---------- */
  var toggleBtns = document.querySelectorAll('.toggle-btn');
  if (toggleBtns.length) {
    toggleBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        toggleBtns.forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        var target = btn.getAttribute('data-panel');
        document.querySelectorAll('.texture-panel').forEach(function (p) {
          p.classList.toggle('active', p.getAttribute('data-panel') === target);
        });
      });
    });
  }

  /* ---------- Booking flow (reservation.html) ---------- */
  var bookingRoot = document.getElementById('booking-widget');
  if (bookingRoot) initBooking(bookingRoot);

  function initBooking(root) {
    var services = [
      { id: 'diagnostic', name: 'Diagnostic du cuir chevelu', duration: 'Durée à confirmer' },
      { id: 'soin-profond', name: 'Soin profond du cuir chevelu', duration: 'Durée à confirmer' },
      { id: 'shampooing-soin', name: 'Shampooing soin', duration: 'Durée à confirmer' },
      { id: 'hydratation', name: 'Soin hydratant des longueurs', duration: 'Durée à confirmer' },
      { id: 'micro-boucles', name: 'Rituel micro-boucles', duration: 'Durée à confirmer' },
      { id: 'gros-grains', name: 'Rituel gros grains', duration: 'Durée à confirmer' },
      { id: 'reparateur', name: 'Soin réparateur / fortifiant', duration: 'Durée à confirmer' }
    ];

    var state = { step: 1, service: null, date: null, time: null, name: '', phone: '', email: '', texture: null, note: '' };
    var params = new URLSearchParams(window.location.search);
    var preselect = params.get('soin');
    if (preselect) { var m = services.find(function (s) { return s.id === preselect; }); if (m) state.service = m; }

    var monthOffset = 0;
    var MONTHS_FR = ['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre'];
    var DOW_FR = ['L','M','M','J','V','S','D'];

    function seededRandom(seed) {
      var h = 0;
      for (var i = 0; i < seed.length; i++) { h = Math.imul(31, h) + seed.charCodeAt(i) | 0; }
      return function () { h = Math.imul(h ^ (h >>> 15), 2246822507); h = Math.imul(h ^ (h >>> 13), 3266489909); h ^= h >>> 16; return (h >>> 0) / 4294967296; };
    }

    function slotsForDate(dateStr) {
      var rand = seededRandom(dateStr);
      var times = [];
      ['09:00','09:30','10:00','10:30','11:00','11:30'].forEach(function (t) { times.push({ t: t, period: 'matin' }); });
      ['13:30','14:00','14:30','15:00','15:30','16:00','16:30','17:00','17:30'].forEach(function (t) { times.push({ t: t, period: 'apres-midi' }); });
      return times.map(function (slot) { return { t: slot.t, period: slot.period, full: rand() < 0.22 }; });
    }

    root.innerHTML =
      '<div class="steps-indicator" id="steps-indicator"></div>' +
      '<div class="steps-labels"><span>Soin</span><span>Date</span><span>Heure</span><span>Coordonnées</span><span>Confirmation</span></div>' +
      '<div class="booking-step active" data-step="1">' +
        '<h3>Choisissez votre soin</h3><p class="booking-step__hint">Sélectionnez le soin qui vous intéresse.</p>' +
        '<select class="staff-select" disabled><option>Première disponibilité</option></select>' +
        '<div id="service-list"></div>' +
      '</div>' +
      '<div class="booking-step" data-step="2">' +
        '<h3>Choisissez votre jour</h3><p class="booking-step__hint">Les disponibilités sont indiquées sous chaque date.</p>' +
        '<div class="cal"><div class="cal__header"><button class="cal__nav" id="cal-prev" aria-label="Mois précédent">‹</button><h4 id="cal-month"></h4><button class="cal__nav" id="cal-next" aria-label="Mois suivant">›</button></div>' +
        '<div class="cal__grid" id="cal-grid"></div></div>' +
      '</div>' +
      '<div class="booking-step" data-step="3">' +
        '<h3>Choisissez votre heure</h3><p class="booking-step__hint" id="slots-date-label"></p>' +
        '<div id="slots-container"></div>' +
      '</div>' +
      '<div class="booking-step" data-step="4">' +
        '<h3>Vos coordonnées</h3><p class="booking-step__hint">Pour confirmer votre demande de rendez-vous.</p>' +
        '<div class="form-field"><label>Nom complet</label><input type="text" id="f-name" placeholder="Votre nom"></div>' +
        '<div class="form-field"><label>Téléphone</label><div class="phone-field"><span class="phone-prefix">+225</span><input type="tel" id="f-phone" placeholder="05 00 00 00 00"></div></div>' +
        '<div class="form-field"><label>Email (optionnel)</label><input type="email" id="f-email" placeholder="vous@email.com"></div>' +
        '<div class="form-field"><label>Votre texture</label><div class="texture-segmented" id="f-texture">' +
          '<button type="button" class="texture-opt" data-val="Micro-boucles">Micro-boucles</button>' +
          '<button type="button" class="texture-opt" data-val="Gros grains">Gros grains</button>' +
          '<button type="button" class="texture-opt" data-val="Je ne sais pas">Je ne sais pas</button>' +
        '</div></div>' +
        '<div class="form-field"><label>Note (optionnel)</label><textarea id="f-note" placeholder="Une précision à nous partager ?"></textarea></div>' +
      '</div>' +
      '<div class="booking-step" data-step="5">' +
        '<div id="confirm-view"></div>' +
      '</div>' +
      '<div class="booking-nav" id="booking-nav"></div>';

    var serviceListEl = document.getElementById('service-list');
    serviceListEl.innerHTML = services.map(function (s) {
      return '<div class="service-row" data-id="' + s.id + '"><span class="service-row__radio"></span><div class="service-row__info"><h4>' + s.name + '</h4><div class="service-row__meta">' + s.duration + ' · Tarif : sur demande</div></div></div>';
    }).join('');
    serviceListEl.querySelectorAll('.service-row').forEach(function (row) {
      row.addEventListener('click', function () {
        state.service = services.find(function (s) { return s.id === row.getAttribute('data-id'); });
        renderServiceList();
        updateSummary();
        updateNav();
      });
    });
    function renderServiceList() {
      serviceListEl.querySelectorAll('.service-row').forEach(function (row) {
        row.classList.toggle('selected', state.service && row.getAttribute('data-id') === state.service.id);
      });
    }
    renderServiceList();

    function renderCalendar() {
      var base = new Date();
      base.setMonth(base.getMonth() + monthOffset);
      var year = base.getFullYear(), month = base.getMonth();
      document.getElementById('cal-month').textContent = MONTHS_FR[month] + ' ' + year;
      var grid = document.getElementById('cal-grid');
      var html = DOW_FR.map(function (d) { return '<div class="cal__dow">' + d + '</div>'; }).join('');
      var firstDay = new Date(year, month, 1);
      var startOffset = (firstDay.getDay() + 6) % 7;
      var daysInMonth = new Date(year, month + 1, 0).getDate();
      var today = new Date(); today.setHours(0,0,0,0);
      var maxDate = new Date(today); maxDate.setDate(maxDate.getDate() + 60);
      for (var i = 0; i < startOffset; i++) html += '<div class="cal__empty"></div>';
      for (var d = 1; d <= daysInMonth; d++) {
        var thisDate = new Date(year, month, d);
        var dateStr = year + '-' + String(month + 1).padStart(2, '0') + '-' + String(d).padStart(2, '0');
        var isPast = thisDate < today;
        var isSunday = thisDate.getDay() === 0;
        var isFuture = thisDate > maxDate;
        var disabled = isPast || isSunday || isFuture;
        var isToday = thisDate.getTime() === today.getTime();
        var isSelected = state.date === dateStr;
        html += '<button class="cal__day' + (isToday ? ' today' : '') + (isSelected ? ' selected' : '') + '" data-date="' + dateStr + '" ' + (disabled ? 'disabled' : '') + '>' + d + (!disabled ? '<span class="cal__day-dot"></span>' : '') + '</button>';
      }
      grid.innerHTML = html;
      grid.querySelectorAll('.cal__day:not(:disabled)').forEach(function (btn) {
        btn.addEventListener('click', function () {
          state.date = btn.getAttribute('data-date');
          state.time = null;
          renderCalendar();
          updateSummary();
          updateNav();
        });
      });
    }
    document.getElementById('cal-prev').addEventListener('click', function () { monthOffset--; renderCalendar(); });
    document.getElementById('cal-next').addEventListener('click', function () { monthOffset++; renderCalendar(); });
    renderCalendar();

    function renderSlots() {
      var container = document.getElementById('slots-container');
      var label = document.getElementById('slots-date-label');
      if (!state.date) { container.innerHTML = '<p style="opacity:.6;font-size:14px;">Choisissez d\'abord une date.</p>'; return; }
      var d = new Date(state.date + 'T00:00:00');
      label.textContent = d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
      var slots = slotsForDate(state.date);
      var matin = slots.filter(function (s) { return s.period === 'matin'; });
      var apresMidi = slots.filter(function (s) { return s.period === 'apres-midi'; });
      function group(title, arr) {
        return '<div class="slots-group"><h5>' + title + '</h5><div class="slots-grid">' + arr.map(function (s) {
          return '<button class="slot-pill' + (state.time === s.t ? ' selected' : '') + '" data-time="' + s.t + '" ' + (s.full ? 'disabled' : '') + '>' + s.t + (s.full ? ' · Complet' : '') + '</button>';
        }).join('') + '</div></div>';
      }
      container.innerHTML = group('Matin', matin) + group('Après-midi', apresMidi) + '<p class="slots-caption">Heure d\'Abidjan (GMT)</p>';
      container.querySelectorAll('.slot-pill:not(:disabled)').forEach(function (btn) {
        btn.addEventListener('click', function () {
          state.time = btn.getAttribute('data-time');
          renderSlots();
          updateSummary();
          updateNav();
        });
      });
    }

    var textureOpts = root.querySelectorAll('.texture-opt');
    textureOpts.forEach(function (opt) {
      opt.addEventListener('click', function () {
        state.texture = opt.getAttribute('data-val');
        textureOpts.forEach(function (o) { o.classList.remove('selected'); });
        opt.classList.add('selected');
        updateSummary();
      });
    });

    function updateSummary() {
      var sumService = document.getElementById('sum-service');
      var sumDate = document.getElementById('sum-date');
      var sumTime = document.getElementById('sum-time');
      if (sumService) sumService.textContent = state.service ? state.service.name : '—';
      if (sumService) sumService.classList.toggle('placeholder', !state.service);
      if (sumDate) sumDate.textContent = state.date ? new Date(state.date + 'T00:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' }) : '—';
      if (sumDate) sumDate.classList.toggle('placeholder', !state.date);
      if (sumTime) sumTime.textContent = state.time || '—';
      if (sumTime) sumTime.classList.toggle('placeholder', !state.time);
      var stickyInfo = document.getElementById('sticky-info');
      if (stickyInfo) {
        var parts = [];
        if (state.service) parts.push(state.service.name);
        if (state.date) parts.push(new Date(state.date + 'T00:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }));
        if (state.time) parts.push(state.time);
        stickyInfo.innerHTML = parts.length ? '<strong>' + parts.join(' · ') + '</strong>' : 'Choisissez votre soin';
      }
    }

    var stepsIndicator = document.getElementById('steps-indicator');
    function renderStepsIndicator() {
      var html = '';
      for (var i = 1; i <= 5; i++) {
        var cls = i === state.step ? 'active' : (i < state.step ? 'done' : '');
        html += '<div class="step-dot ' + cls + '">' + (i < state.step ? '✓' : i) + '</div>';
        if (i < 5) html += '<div class="step-line ' + (i < state.step ? 'done' : '') + '"></div>';
      }
      stepsIndicator.innerHTML = html;
    }

    function canAdvance() {
      if (state.step === 1) return !!state.service;
      if (state.step === 2) return !!state.date;
      if (state.step === 3) return !!state.time;
      if (state.step === 4) return state.name.trim().length > 1 && state.phone.trim().length > 6;
      return true;
    }

    function goStep(n) {
      state.step = n;
      root.querySelectorAll('.booking-step').forEach(function (s) { s.classList.toggle('active', +s.getAttribute('data-step') === n); });
      renderStepsIndicator();
      if (n === 3) renderSlots();
      if (n === 5) renderConfirm();
      updateNav();
      renderNavButtons();
      var stickyBar = document.getElementById('sticky-bar');
      if (stickyBar) stickyBar.classList.toggle('show', n < 5);
      root.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    function updateNav() {
      var nextBtn = document.getElementById('btn-next');
      if (nextBtn) nextBtn.disabled = !canAdvance();
    }

    function buildWaMessage() {
      var lines = [
        'Bonjour Mela & Cuty Cares,',
        'Je souhaite demander un rendez-vous :',
        '- Soin : ' + (state.service ? state.service.name : '-'),
        '- Date : ' + (state.date ? new Date(state.date + 'T00:00:00').toLocaleDateString('fr-FR') : '-'),
        '- Heure : ' + (state.time || '-'),
        '- Nom : ' + state.name,
        '- Texture : ' + (state.texture || 'non précisé')
      ];
      if (state.note) lines.push('- Note : ' + state.note);
      return encodeURIComponent(lines.join('\n'));
    }

    function renderConfirm() {
      var view = document.getElementById('confirm-view');
      view.innerHTML =
        '<h3>Confirmation</h3>' +
        '<div class="recap-card">' +
          '<div class="recap-row"><span>Soin</span><span>' + (state.service ? state.service.name : '-') + '</span></div>' +
          '<div class="recap-row"><span>Date</span><span>' + (state.date ? new Date(state.date + 'T00:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' }) : '-') + '</span></div>' +
          '<div class="recap-row"><span>Heure</span><span>' + (state.time || '-') + '</span></div>' +
          '<div class="recap-row"><span>Nom</span><span>' + (state.name || '-') + '</span></div>' +
        '</div>' +
        '<a id="wa-send" class="btn btn-kola" style="width:100%;" target="_blank" rel="noopener">Envoyer ma demande sur WhatsApp</a>';
      var waLink = document.getElementById('wa-send');
      waLink.href = 'https://wa.me/2250504242727?text=' + buildWaMessage();
      waLink.addEventListener('click', function () {
        setTimeout(function () {
          view.innerHTML =
            '<div class="success-state">' +
              '<svg class="success-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M12 2C9 6 6 9 6 13a6 6 0 0 0 12 0c0-4-3-7-6-11Z"/></svg>' +
              '<h3>Merci !</h3>' +
              '<p>Nous vous confirmons votre créneau très vite.</p>' +
              '<a href="tel:+2250757108189" class="btn-text">Ou appelez-nous au +225 07 57 10 81 89</a>' +
            '</div>';
        }, 400);
      }, { once: true });
    }

    var navEl = document.getElementById('booking-nav');
    function renderNavButtons() {
      var backHtml = state.step > 1 ? '<button class="btn-text" id="btn-back">← Retour</button>' : '<span></span>';
      var nextHtml = state.step < 5 ? '<button class="btn btn-primary" id="btn-next">Continuer</button>' : '<span></span>';
      navEl.innerHTML = backHtml + nextHtml;
      var back = document.getElementById('btn-back');
      if (back) back.addEventListener('click', function () { goStep(state.step - 1); });
      var next = document.getElementById('btn-next');
      if (next) {
        next.disabled = !canAdvance();
        next.addEventListener('click', function () {
          if (state.step === 4) {
            state.name = document.getElementById('f-name').value;
            state.phone = document.getElementById('f-phone').value;
            state.email = document.getElementById('f-email').value;
            state.note = document.getElementById('f-note').value;
          }
          if (canAdvance()) goStep(state.step + 1);
        });
      }
    }

    document.addEventListener('input', function (e) {
      if (!e.target || !e.target.id) return;
      if (e.target.id === 'f-name') { state.name = e.target.value; updateNav(); }
      else if (e.target.id === 'f-phone') { state.phone = e.target.value; updateNav(); }
      else if (e.target.id === 'f-email') { state.email = e.target.value; }
      else if (e.target.id === 'f-note') { state.note = e.target.value; }
    });

    renderStepsIndicator();
    renderNavButtons();
    updateSummary();
  }
})();

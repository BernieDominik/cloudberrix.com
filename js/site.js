/* Cloudberrix — scroll reveals, the spine index, and the page's motion.
   One rAF-throttled pass computes every effect from where its element
   stands relative to the viewport. Nothing moves far: the page should
   feel alive, not animated. No dependencies. */
(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* header elevation */
  var head = document.querySelector('.site-head');
  if (head) {
    var onScroll = function () {
      head.classList.toggle('is-scrolled', window.scrollY > 8);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* current year */
  var year = document.getElementById('year');
  if (year) year.textContent = String(new Date().getFullYear());

  /* scroll reveals — stagger siblings that arrive in the same frame */
  var reveals = Array.prototype.slice.call(document.querySelectorAll('.reveal'));
  if ('IntersectionObserver' in window && !reduced) {
    var io = new IntersectionObserver(function (entries) {
      var batch = 0;
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.style.setProperty('--d', (batch * 0.09) + 's');
        entry.target.classList.add('revealed');
        io.unobserve(entry.target);
        batch += 1;
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('revealed'); });
  }

  /* ---- the stage measures itself, so its frames stay proportional to
          the column rather than to the viewport ---- */
  var stage = document.querySelector('.product-stage');
  function measure() {
    if (stage) stage.style.setProperty('--sw', stage.offsetWidth + 'px');
  }

  /* ---- the spine: each mark sits at its chapter's true position ---- */
  var spine = document.querySelector('.spine');
  var fill = document.querySelector('.spine-fill');
  var marks = Array.prototype.slice.call(document.querySelectorAll('.spine a'));
  var sections = marks.map(function (a) {
    var id = a.getAttribute('data-for');
    return id === 'hero' ? document.querySelector('.hero') : document.getElementById(id);
  });
  function placeMarks() {
    if (!spine) return;
    var doc = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    marks.forEach(function (a, i) {
      var sec = sections[i];
      if (!sec) return;
      var r = Math.min(1, Math.max(0, (sec.offsetTop - 64) / doc));
      a.style.top = (r * 100).toFixed(2) + '%';
    });
    relaxMarks();
  }

  /* Each mark sits at its chapter's true depth, which collides as soon as one
     chapter is several times the height of its neighbours — they bunch into a
     few per cent of the track and the labels overlap. Nudge them apart,
     forward then backward, without moving any of them off its own chapter. */
  function relaxMarks() {
    var H = spine.getBoundingClientRect().height;
    if (!H || marks.length < 2) return;
    var GAP = 13;
    var items = marks.map(function (a) {
      return { a: a, h: a.getBoundingClientRect().height,
               y: parseFloat(a.style.top || '0') / 100 * H };
    });
    for (var i = 1; i < items.length; i++) {
      var lo = items[i - 1].y + items[i - 1].h / 2 + GAP + items[i].h / 2;
      if (items[i].y < lo) items[i].y = lo;
    }
    var last = items.length - 1;
    var over = items[last].y + items[last].h / 2 - H;
    if (over > 0) items[last].y -= over;
    for (var j = items.length - 2; j >= 0; j--) {
      var hi = items[j + 1].y - items[j + 1].h / 2 - GAP - items[j].h / 2;
      if (items[j].y > hi) items[j].y = hi;
    }
    items.forEach(function (it) { it.a.style.top = (it.y / H * 100).toFixed(2) + '%'; });
  }

  /* ---- the hero recedes as the page slides over it ---- */
  var heroSec = document.querySelector('.hero');
  var heroMark = document.querySelector('.hero-mark');
  var fades = [
    { el: document.querySelector('.hero-stack .eyebrow'), lag: 0.16, fade: 1.35 },
    { el: document.querySelector('.hero-title'), lag: 0.24, fade: 1.0 },
    { el: document.querySelector('.hero-lede'), lag: 0.34, fade: 1.2 }
  ];
  var heroBase = document.querySelector('.hero-base');
  /* the page-load rise owns opacity until it ends; take over afterwards */
  fades.map(function (f) { return f.el; }).concat([heroBase]).forEach(function (el) {
    if (!el) return;
    var free = function () { el.style.animation = 'none'; el.style.opacity = 1; el.dataset.free = '1'; };
    el.addEventListener('animationend', free, { once: true });
    setTimeout(free, 1700);
  });

  /* ---- chapter layers that counter-drift as they pass ---- */
  var drifts = [
    [document.querySelector('.product-head > div:first-child'), 9],
    [document.querySelector('.stage-col'), -7],
    [document.querySelector('.about-head'), 10],
    [document.querySelector('.creed'), -9],
    [document.querySelector('.contact-stack'), 7]
  ].filter(function (d) { return d[0]; });

  /* the devices themselves, layered against each other */
  var layers = stage ? [
    { els: stage.querySelectorAll('.fig-desktop .laptop, .fig-desktop .stage-cap'), max: 14 },
    { els: stage.querySelectorAll('.fig-mobile .phone, .fig-mobile .stage-cap'), max: -10 },
    { els: stage.querySelectorAll('.fig-web .win, .fig-web .stage-cap'), max: 22 }
  ] : [];

  /* every screen is a window onto one light: the field is sized to the
     whole stage and each screen shows its own slice, re-cut as the
     devices drift, so the light holds still behind them */
  var screens = stage ? stage.querySelectorAll('.scr') : [];
  function light() {
    if (!screens.length) return;
    var s = stage.getBoundingClientRect();
    if (s.bottom < -200 || s.top > window.innerHeight + 200) return;
    Array.prototype.forEach.call(screens, function (el) {
      var r = el.getBoundingClientRect();
      el.style.backgroundSize = s.width.toFixed(1) + 'px ' + s.height.toFixed(1) + 'px';
      el.style.backgroundPosition = (s.left - r.left).toFixed(1) + 'px ' + (s.top - r.top).toFixed(1) + 'px';
    });
  }

  /* the goal ripens from the creed's grey into the studio's copper */
  var goal = document.querySelector('.creed-goal');
  var SOFT = [92, 93, 104], COPPER = [154, 69, 38];

  /* -1 above the fold … 0 centred … +1 below */
  function prog(el) {
    var r = el.getBoundingClientRect();
    if (!r.height) return 0;
    var p = (window.innerHeight - (r.top + r.height / 2) * 2) / window.innerHeight;
    return Math.max(-1, Math.min(1, p));
  }

  var ticking = false;
  function drift() {
    ticking = false;
    /* below 900px the cluster is too tight to move, and reduced motion
       means none of this runs at all */
    var still = reduced || window.innerWidth < 900;
    var y = window.scrollY;

    if (spine) {
      var doc = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      if (fill) fill.style.height = (Math.min(1, y / doc) * 100).toFixed(2) + '%';
      var here = 0;
      sections.forEach(function (sec, i) {
        if (sec && sec.getBoundingClientRect().top <= window.innerHeight * 0.45) here = i;
      });
      marks.forEach(function (a, i) { a.classList.toggle('is-here', i === here); });
    }

    var hh = heroSec ? Math.max(1, heroSec.offsetHeight) : 1;
    var t = Math.min(1, y / hh);
    fades.forEach(function (f) {
      if (!f.el || !f.el.dataset.free) return;
      if (still || y <= 0) { f.el.style.transform = ''; f.el.style.opacity = 1; return; }
      f.el.style.transform = 'translateY(' + (y * f.lag).toFixed(1) + 'px)';
      f.el.style.opacity = Math.max(0, 1 - t * f.fade).toFixed(3);
    });
    if (heroBase && heroBase.dataset.free) {
      heroBase.style.transform = (still || y <= 0) ? '' : 'translateY(' + (y * -0.07).toFixed(1) + 'px)';
    }
    if (heroMark) {
      heroMark.style.transform = still
        ? 'translateY(-50%)'
        : 'translateY(calc(-50% + ' + (y * 0.06).toFixed(1) + 'px)) rotate(' + (y * 0.012).toFixed(2) + 'deg)';
    }

    drifts.forEach(function (d) {
      var p = still ? 0 : prog(d[0]);
      d[0].style.transform = p === 0 ? '' : 'translateY(' + (p * d[1]).toFixed(1) + 'px)';
    });

    if (stage) {
      var sp = still ? 0 : prog(stage);
      stage.style.setProperty('--wy', (sp * 22).toFixed(1) + 'px');
      layers.forEach(function (layer) {
        Array.prototype.forEach.call(layer.els, function (el) {
          /* the captions carry their centring transform; keep it underneath */
          var base = el.classList.contains('stage-cap') ? 'translateX(-50%) ' : '';
          el.style.transform = sp === 0 ? (base || '') : base + 'translateY(' + (sp * layer.max).toFixed(1) + 'px)';
        });
      });
      light();
    }

    if (goal) {
      if (still) { goal.style.color = ''; return; }
      var g = Math.max(0, Math.min(1, 1 + Math.min(0, prog(goal)) * 1.7));
      g = g * g * (3 - 2 * g);
      if (g >= 1) { goal.style.color = ''; }
      else {
        goal.style.color = 'rgb(' +
          Math.round(SOFT[0] + (COPPER[0] - SOFT[0]) * g) + ',' +
          Math.round(SOFT[1] + (COPPER[1] - SOFT[1]) * g) + ',' +
          Math.round(SOFT[2] + (COPPER[2] - SOFT[2]) * g) + ')';
      }
    }
  }
  function queue() { if (!ticking) { ticking = true; requestAnimationFrame(drift); } }

  window.addEventListener('scroll', queue, { passive: true });
  /* the devices rise into place on reveal; re-cut the light once they land */
  if (stage) stage.addEventListener('transitionend', queue);
  window.addEventListener('resize', function () { measure(); placeMarks(); queue(); }, { passive: true });
  window.addEventListener('load', function () { measure(); placeMarks(); queue(); });
  measure(); placeMarks(); queue();

})();

/* Cloudberrix — the inner pages: header elevation, the year, scroll
   reveals, and the spine index where a page has one (Preflight Kit).
   The home page has its own script, home.js. No dependencies. */
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

  var ticking = false;
  function drift() {
    ticking = false;
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
  }
  function queue() { if (!ticking) { ticking = true; requestAnimationFrame(drift); } }

  window.addEventListener('scroll', queue, { passive: true });
  window.addEventListener('resize', function () { placeMarks(); queue(); }, { passive: true });
  window.addEventListener('load', function () { placeMarks(); queue(); });
  placeMarks(); queue();

})();

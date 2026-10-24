/* Cloudberrix — the home page: arrival, the header hairline, and the
   device stage (measured, drifting a few pixels, lit by one light).
   No dependencies. */
(function () {
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- arrival: a soft rise, staggered within each batch ---- */
  var reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !reduced) {
    var io = new IntersectionObserver(function (entries) {
      var n = 0;
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.style.setProperty('--d', (n++ * 0.08) + 's');
        e.target.classList.add('in');
        io.unobserve(e.target);
      });
    }, { rootMargin: '0px 0px -6% 0px', threshold: 0.1 });
    Array.prototype.forEach.call(reveals, function (el) { io.observe(el); });
  } else {
    Array.prototype.forEach.call(reveals, function (el) { el.classList.add('in'); });
  }

  /* ---- the header gains its hairline once the page moves ---- */
  var head = document.querySelector('.head');

  /* ---- current year ---- */
  var year = document.getElementById('year');
  if (year) year.textContent = String(new Date().getFullYear());

  /* ---- the stage: measured, drifting, lit by one light ---- */
  var stage = document.querySelector('.product-stage');
  var screens = stage.querySelectorAll('.scr');
  var layers = [
    [stage.querySelector('.fig-desktop .laptop'), 12],
    [stage.querySelector('.fig-mobile .phone'), -9],
    [stage.querySelector('.fig-web .win'), 18]
  ];
  function measure() { stage.style.setProperty('--sw', stage.offsetWidth + 'px'); }
  function prog(el) {
    var r = el.getBoundingClientRect();
    var p = (window.innerHeight - (r.top + r.height / 2) * 2) / window.innerHeight;
    return Math.max(-1, Math.min(1, p));
  }
  function light() {
    var s = stage.getBoundingClientRect();
    if (s.bottom < -200 || s.top > window.innerHeight + 200) return;
    Array.prototype.forEach.call(screens, function (el) {
      var r = el.getBoundingClientRect();
      el.style.backgroundSize = s.width.toFixed(1) + 'px ' + s.height.toFixed(1) + 'px';
      el.style.backgroundPosition = (s.left - r.left).toFixed(1) + 'px ' + (s.top - r.top).toFixed(1) + 'px';
    });
  }
  var ticking = false;
  function frame() {
    ticking = false;
    head.classList.toggle('is-scrolled', window.scrollY > 8);
    var still = reduced || window.innerWidth < 900;
    var p = still ? 0 : prog(stage);
    layers.forEach(function (l) {
      if (l[0]) l[0].style.transform = p === 0 ? '' : 'translateY(' + (p * l[1]).toFixed(1) + 'px)';
    });
    light();
  }
  function queue() { if (!ticking) { ticking = true; requestAnimationFrame(frame); } }
  window.addEventListener('scroll', queue, { passive: true });
  window.addEventListener('resize', function () { measure(); queue(); }, { passive: true });
  window.addEventListener('load', function () { measure(); queue(); });
  stage.addEventListener('transitionend', queue);
  measure(); queue();
})();

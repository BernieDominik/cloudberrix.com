/* Cloudberrix — reveals + rail progress fill. No dependencies. */
(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* header elevation */
  var head = document.querySelector('.site-head');
  var onScroll = function () {
    head.classList.toggle('is-scrolled', window.scrollY > 8);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

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

})();

/* Preflight Kit — the Crosswind demonstration, the screens rail, and the
   one place the spine has to turn over. Loaded only by /preflight/.
   No dependencies. */
(function () {
  'use strict';
  var plot = document.getElementById('pfPlot');
  if (!plot) return;

  var CX = 306, CY = 196;        /* the touchdown point, in user units */
  var RAY = 176;                 /* where the "wind from" ray starts */
  var VMAX = 35, LIMIT = 17;     /* PA-28-161 demonstrated crosswind */

  var el = function (id) { return document.getElementById(id); };
  var ray = el('pfRay'), box = el('pfBox'), wind = el('pfWind'),
      arc = el('pfArc'), arcLab = el('pfArcLab'),
      head = el('pfHead'), cross = el('pfCross'),
      pill = el('pfPill'), pillBox = pill.querySelector('rect'), pillTxt = pill.querySelector('text'),
      headLab = el('pfHeadLab'), crossLab = el('pfCrossLab'),
      sock = el('pfSockBody'), rwyNum = el('pfRwyNum'),
      chip = el('pfVerdict'), chipTxt = chip.querySelector('span'),
      dirIn = el('pfDir'), spdIn = el('pfSpd'), seg = el('pfSeg');

  var st = { rwy: 27, dir: 220, spd: 10 };

  var pad3 = function (n) { return ('00' + n).slice(-3); };
  var setD = function (node, d) { node.setAttribute('d', d); };
  var show = function (node, on) { node.style.display = on ? '' : 'none'; };
  var put = function (node, x, y, txt, anchor) {
    node.setAttribute('x', x.toFixed(1));
    node.setAttribute('y', y.toFixed(1));
    if (anchor) node.setAttribute('text-anchor', anchor);
    if (txt !== undefined) node.textContent = txt;
  };

  function draw() {
    var rwyHdg = st.rwy * 10;
    /* the wind's bearing relative to the runway, folded to -180 … +180 */
    var rel = ((st.dir - rwyHdg + 540) % 360) - 180;
    var th = rel * Math.PI / 180;
    var hd = st.spd * Math.cos(th);      /* + head, - tail */
    var cw = st.spd * Math.sin(th);      /* + from the right, - from the left */
    var ux = Math.sin(th), uy = -Math.cos(th);   /* toward where the wind is from */

    /* One scale for the whole drawing, but not a linear one: at ten knots a
       linear scale leaves the split too small to read, and at thirty-five it
       runs off the plot. The vector is drawn to a compressed length and both
       components share that same px-per-knot, so the rectangle stays exact. */
    var r = 152 * Math.pow(Math.min(1, st.spd / VMAX), 0.62);
    var S = st.spd > 0 ? r / st.spd : 0;
    var kx = CX + cw * S, ky = CY - hd * S;      /* the corner of the rectangle */

    /* the thin ray that says only where the wind is from */
    if (r < RAY - 26) {
      setD(ray, 'M' + (CX + RAY * ux).toFixed(1) + ' ' + (CY + RAY * uy).toFixed(1) +
                'L' + (CX + (r + 12) * ux).toFixed(1) + ' ' + (CY + (r + 12) * uy).toFixed(1));
      show(ray, true);
    } else { show(ray, false); }

    /* the vector itself, drawn to length */
    if (r > 30) {
      setD(wind, 'M' + kx.toFixed(1) + ' ' + ky.toFixed(1) +
                 'L' + (CX + 16 * ux).toFixed(1) + ' ' + (CY + 16 * uy).toFixed(1));
      show(wind, true);
    } else { show(wind, false); }

    /* the decomposition rectangle */
    if (Math.abs(hd) * S > 8 && Math.abs(cw) * S > 8) {
      setD(box, 'M' + kx.toFixed(1) + ' ' + ky.toFixed(1) + 'H' + CX +
                'M' + kx.toFixed(1) + ' ' + ky.toFixed(1) + 'V' + CY);
      show(box, true);
    } else { show(box, false); }

    /* along the runway */
    if (Math.abs(hd) * S > 9) {
      var sh = hd >= 0 ? 1 : -1;
      setD(head, 'M' + CX + ' ' + ky.toFixed(1) + 'L' + CX + ' ' + (CY - sh * 15).toFixed(1));
      show(head, true);
      var hy = CY - hd * S * 0.52;
      if (Math.abs(hy - CY) < 36) hy = CY - sh * 36;
      /* stand on the side the rectangle is not on */
      var side = cw > 0.5 ? -1 : 1;
      var hx = CX + side * 36, anc = side < 0 ? 'end' : 'start';
      put(headLab.querySelector('.v'), hx, hy, Math.round(Math.abs(hd)) + ' kt', anc);
      put(headLab.querySelector('.k'), hx, hy + 14, hd >= 0 ? 'HEAD' : 'TAIL', anc);
      show(headLab, true);
    } else { show(head, false); show(headLab, false); }

    /* across the runway */
    if (Math.abs(cw) * S > 9) {
      var sc = cw >= 0 ? 1 : -1;
      setD(cross, 'M' + kx.toFixed(1) + ' ' + CY + 'L' + (CX + sc * 15).toFixed(1) + ' ' + CY);
      show(cross, true);
      var off = Math.max(Math.abs(cw) * S, 46) + 13;
      var lx = CX + sc * off;
      put(crossLab.querySelector('.v'), lx, CY - 6, Math.round(Math.abs(cw)) + ' kt', sc < 0 ? 'end' : 'start');
      put(crossLab.querySelector('.k'), lx, CY + 10, sc < 0 ? 'FROM THE LEFT' : 'FROM THE RIGHT', sc < 0 ? 'end' : 'start');
      show(crossLab, true);
    } else { show(cross, false); show(crossLab, false); }

    /* the angle off the runway */
    if (Math.abs(rel) > 7) {
      var a2x = CX + 52 * ux, a2y = CY + 52 * uy;
      setD(arc, 'M' + CX + ' ' + (CY - 52) + 'A52 52 0 0 ' + (rel > 0 ? 1 : 0) + ' ' +
                a2x.toFixed(1) + ' ' + a2y.toFixed(1));
      show(arc, true);
      var hm = th / 2;
      put(arcLab, CX + 68 * Math.sin(hm), CY - 68 * Math.cos(hm) + 4,
          Math.round(Math.abs(rel)) + '°');
      show(arcLab, true);
    } else { show(arc, false); show(arcLab, false); }

    /* the label at the far end of the ray */
    var txt = pad3(st.dir) + '° · ' + st.spd + ' kt';
    var pw = txt.length * 7.6 + 22;
    var px = Math.min(592 - pw / 2, Math.max(pw / 2 + 8, CX + (RAY + 4) * ux));
    var py = Math.min(340, Math.max(26, CY + (RAY + 4) * uy));
    pillBox.setAttribute('x', (px - pw / 2).toFixed(1));
    pillBox.setAttribute('y', (py - 12).toFixed(1));
    pillBox.setAttribute('width', pw.toFixed(1));
    put(pillTxt, px, py + 4.5, txt, 'middle');

    /* the sock: it points downwind, and it fills with the wind */
    var rot = st.spd < 1 ? 90 : Math.atan2(Math.cos(th), -Math.sin(th)) * 180 / Math.PI;
    var sx = 0.42 + 0.58 * Math.min(1, st.spd / VMAX);
    sock.setAttribute('transform', 'rotate(' + rot.toFixed(1) + ') scale(' + sx.toFixed(3) + ',1)');

    rwyNum.textContent = st.rwy < 10 ? '0' + st.rwy : String(st.rwy);

    /* the readout, and the verdict */
    var cr = Math.round(Math.abs(cw)), hr = Math.round(Math.abs(hd));
    el('pfHeadKey').textContent = hd >= 0 ? 'Headwind' : 'Tailwind';
    el('pfHeadVal').textContent = hr;
    el('pfCrossKey').textContent = cr === 0 ? 'Crosswind' : (cw < 0 ? 'Crosswind from left' : 'Crosswind from right');
    el('pfCrossVal').textContent = cr;
    el('pfAngVal').textContent = Math.round(Math.abs(rel));

    var over = cr > LIMIT;
    chip.classList.toggle('is-ok', !over);
    chip.classList.toggle('is-over', over);
    chipTxt.textContent = over ? 'Over the limit' : 'Within the limit';
    el('pfCellCross').classList.toggle('is-over', over);
    el('pfCellCross').classList.toggle('is-amber', !over);

    el('pfDirOut').textContent = pad3(st.dir);
    el('pfSpdOut').textContent = st.spd;
    dirIn.value = st.dir;
    spdIn.value = st.spd;
    dirIn.style.setProperty('--fill', (st.dir / 359 * 100).toFixed(1) + '%');
    spdIn.style.setProperty('--fill', (st.spd / VMAX * 100).toFixed(1) + '%');
  }

  dirIn.addEventListener('input', function () { st.dir = +dirIn.value; draw(); });
  spdIn.addEventListener('input', function () { st.spd = +spdIn.value; draw(); });

  Array.prototype.forEach.call(seg.querySelectorAll('button'), function (b) {
    b.addEventListener('click', function () {
      st.rwy = +b.dataset.rwy;
      Array.prototype.forEach.call(seg.querySelectorAll('button'), function (o) {
        o.setAttribute('aria-pressed', String(o === b));
      });
      draw();
    });
  });

  /* drag the wind straight on the drawing */
  var dragging = false;
  function angleAt(ev) {
    var p = plot.createSVGPoint();
    p.x = ev.clientX; p.y = ev.clientY;
    var m = plot.getScreenCTM();
    if (!m) return null;
    var q = p.matrixTransform(m.inverse());
    var dx = q.x - CX, dy = q.y - CY;
    if (dx * dx + dy * dy < 900) return null;      /* too close to the centre to mean anything */
    var deg = Math.atan2(dx, -dy) * 180 / Math.PI;
    return Math.round((st.rwy * 10 + deg + 720)) % 360;
  }
  plot.addEventListener('pointerdown', function (ev) {
    var a = angleAt(ev);
    if (a === null) return;
    dragging = true;
    plot.setPointerCapture(ev.pointerId);
    st.dir = a; draw();
    ev.preventDefault();
  });
  plot.addEventListener('pointermove', function (ev) {
    if (!dragging) return;
    var a = angleAt(ev);
    if (a === null) return;
    st.dir = a; draw();
  });
  var stop = function (ev) {
    if (!dragging) return;
    dragging = false;
    if (plot.hasPointerCapture && plot.hasPointerCapture(ev.pointerId)) plot.releasePointerCapture(ev.pointerId);
  };
  plot.addEventListener('pointerup', stop);
  plot.addEventListener('pointercancel', stop);

  draw();

  /* The spine is ink on bone. Dusk is the one band on the site that makes
     that unreadable, so the spine turns over while dusk is what is behind
     it — the middle of the window, which is where the spine stands. */
  var dusk = document.getElementById('offline');
  if (dusk && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      document.body.classList.toggle('on-dusk', entries[0].isIntersecting);
    }, { rootMargin: '-30% 0px -30% 0px' }).observe(dusk);
  }
})();

(function () {
  'use strict';
  var rail = document.querySelector('.pf-rail');
  if (!rail) return;

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  var canHover = window.matchMedia('(hover: hover)').matches;

  /* A second run of the same nine, so there is no end to reach. It is
     decoration: the nine real figures are the ones that get read out. */
  var originals = Array.prototype.slice.call(rail.children);
  originals.forEach(function (fig) {
    var copy = fig.cloneNode(true);
    copy.setAttribute('aria-hidden', 'true');
    Array.prototype.forEach.call(copy.querySelectorAll('img'), function (im) {
      im.setAttribute('alt', '');
    });
    rail.appendChild(copy);
  });

  /* one run's width, gaps included — the distance to fold back by */
  var half = 0;
  function measure() {
    half = rail.children[originals.length].offsetLeft - rail.children[0].offsetLeft;
  }
  measure();
  window.addEventListener('resize', measure, { passive: true });
  window.addEventListener('load', measure);

  var SPEED = 32;    /* px per second: a drift, not a carousel */
  var HOLD = 2600;   /* how long a nudge of your own holds it still */
  var last = 0, held = 0, hover = false, focused = false, dragging = false;

  /* The position is kept here rather than read back off the element.
     A frame's worth of drift is about half a pixel, and scrollLeft
     rounds to a device pixel on a 1x display: read it back and the
     half-pixels are thrown away every frame, so it never moves at all. */
  var pos = 0;

  function paused() {
    return hover || focused || dragging || document.hidden ||
           reduced.matches || performance.now() < held;
  }
  function tick(now) {
    var dt = last ? Math.min(64, now - last) : 0;
    last = now;
    if (!paused() && half > 0) {
      pos += SPEED * dt / 1000;
      if (pos >= half) pos -= half;      /* the seam is the same picture */
      rail.scrollLeft = pos;
    }
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);

  function hold() { held = performance.now() + HOLD; }
  if (canHover) {
    rail.addEventListener('pointerenter', function (ev) {
      if (ev.pointerType !== 'touch') hover = true;
    });
    rail.addEventListener('pointerleave', function () { hover = false; });
  }
  rail.addEventListener('focusin', function () { focused = true; });
  rail.addEventListener('focusout', function () { focused = false; });
  rail.addEventListener('wheel', hold, { passive: true });
  rail.addEventListener('touchstart', function () { hover = false; hold(); }, { passive: true });
  rail.addEventListener('touchmove', hold, { passive: true });
  /* while it is being held, whatever moved it is the authority */
  rail.addEventListener('scroll', function () {
    if (!paused()) return;
    pos = rail.scrollLeft;
    if (half > 0 && pos >= half) { pos -= half; rail.scrollLeft = pos; }
  }, { passive: true });

  /* grab and pull — the scrollbar is hidden, so this is the affordance */
  var x0 = 0, s0 = 0;
  rail.addEventListener('pointerdown', function (ev) {
    if (ev.pointerType === 'touch') return;   /* touch already scrolls natively */
    dragging = true;
    x0 = ev.clientX;
    s0 = rail.scrollLeft;
    rail.classList.add('is-dragging');
    rail.setPointerCapture(ev.pointerId);
    ev.preventDefault();
  });
  rail.addEventListener('pointermove', function (ev) {
    if (!dragging) return;
    var next = s0 - (ev.clientX - x0);
    /* pulled past the start: step a whole run forward, which shows the
       same thing, so the run has no end in that direction either */
    if (next < 0 && half > 0) { next += half; s0 += half; }
    rail.scrollLeft = next;
    pos = next;
  });
  function release(ev) {
    if (!dragging) return;
    dragging = false;
    hold();
    rail.classList.remove('is-dragging');
    if (rail.hasPointerCapture && rail.hasPointerCapture(ev.pointerId)) {
      rail.releasePointerCapture(ev.pointerId);
    }
  }
  rail.addEventListener('pointerup', release);
  rail.addEventListener('pointercancel', release);
})();

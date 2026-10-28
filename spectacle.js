/* Spectacle layer behaviour: headline word reveal, featured-works carousel with pointer tilt,
   the draggable 21-book ring, scroll-driven 3D trilogy reveal, and the local film player. */
(() => {
  'use strict';
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const motionOff = () => document.documentElement.dataset.sceneMotion === 'paused';
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  // A 12-year-old machine is often 4 cores or 4 GB. Mark it before the headline animation starts.
  if ((navigator.hardwareConcurrency || 8) <= 4 || (navigator.deviceMemory || 8) <= 4) document.documentElement.classList.add('modest-motion', 'modest-type');

  // ---- headline: wrap each word so it can condense out of the mist
  const h1 = document.querySelector('.hero h1');
  if (h1 && !reduce.matches) {
    let i = 0;
    const walk = node => {
      [...node.childNodes].forEach(n => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(part => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.append(part); return; }
            const s = document.createElement('span'); s.className = 'word'; s.style.setProperty('--wi', i++); s.textContent = part; frag.append(s);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1 && n.tagName !== 'BR') walk(n);
      });
    };
    h1.setAttribute('aria-label', h1.textContent.replace(/\s+/g, ' ').trim());
    walk(h1);
  }

  // ---- featured works carousel. Each book carries its own world (motion.js listens for 'montagna:feature');
  // it stays for data-dwell ms (11 s), the active dot fills as a progress bar and everything holds while hovered.
  const feat = document.querySelector('[data-featured]');
  if (feat) {
    const items = [...feat.querySelectorAll('.feat-item')], dots = [...feat.querySelectorAll('.feat-dot')], now = feat.querySelector('[data-feat-now]');
    const hero = feat.closest('.hero'), coords = hero && hero.querySelector('[data-world-coords]'), place = hero && hero.querySelector('[data-world-place]');
    const DWELL = Number(feat.dataset.dwell) || 11000; feat.style.setProperty('--dwell', DWELL + 'ms');
    const n = items.length; let cur = 0, tmr = 0, due = 0, left = DWELL, hover = false;
    const glyphs = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const scramble = (el, text) => {
      clearInterval(el._s); if (motionOff()) { el.textContent = text; return; }
      let f = 0; el._s = setInterval(() => {
        f++; const shown = Math.floor(f * 1.6);
        el.textContent = [...text].map((ch, i) => /[\s°\/·.:,]/.test(ch) || i < shown ? ch : glyphs[(Math.random() * glyphs.length) | 0]).join('');
        if (shown >= text.length) { clearInterval(el._s); el.textContent = text; }
      }, 40);
    };
    const announce = (centre, instant) => {
      const it = items[cur]; if (!hero || !it) return;
      if (centre && centre.width) { const hr = hero.getBoundingClientRect(); hero.style.setProperty('--wx', ((centre.left + centre.width / 2 - hr.left) / hr.width * 100).toFixed(1) + '%'); hero.style.setProperty('--wy', ((centre.top + centre.height / 2 - hr.top) / hr.height * 100).toFixed(1) + '%'); }
      if (it.dataset.accent) hero.style.setProperty('--accent', it.dataset.accent);
      if (coords && it.dataset.coords && coords.textContent !== it.dataset.coords) scramble(coords, it.dataset.coords);
      if (place && it.dataset.place && place.textContent !== it.dataset.place) scramble(place, it.dataset.place);
      document.dispatchEvent(new CustomEvent('montagna:feature', { detail: { slug: it.dataset.slug, index: cur, instant: !!instant } }));
    };
    const arm = (ms = DWELL) => { clearTimeout(tmr); left = ms; due = performance.now() + ms; tmr = setTimeout(tick, ms); };
    const tick = () => { if (hover || motionOff() || document.hidden) { arm(); return; } show(cur + 1); };
    const show = (k, instant) => {
      const slot = feat.querySelector('.feat-item[data-pos="0"] .feat-book'), centre = slot && slot.getBoundingClientRect(); // where the front book sits
      cur = (k + n) % n;
      items.forEach((it, i) => {
        let d = i - cur; if (d > n / 2) d -= n; if (d < -n / 2) d += n;
        it.dataset.pos = String(clamp(d, -2, 2)); const on = d === 0;
        it.setAttribute('aria-hidden', String(!on)); it.querySelectorAll('a,button').forEach(a => a.tabIndex = on ? 0 : -1);
      });
      dots.forEach((d, i) => d.setAttribute('aria-current', String(i === cur)));
      if (now) now.textContent = String(cur + 1).padStart(2, '0');
      announce(centre, instant);
      window.MontagnaShop && window.MontagnaShop.syncFeatured(items[cur].dataset.slug);
      if (hover) { clearTimeout(tmr); left = DWELL; } else arm();
    };
    const hold = () => { if (hover) return; hover = true; clearTimeout(tmr); left = Math.max(500, due - performance.now()); feat.classList.add('held'); };
    const release = () => { if (!hover) return; hover = false; feat.classList.remove('held'); due = performance.now() + left; clearTimeout(tmr); tmr = setTimeout(tick, left); };
    feat.querySelectorAll('[data-step]').forEach(b => b.addEventListener('click', () => show(cur + Number(b.dataset.step))));
    dots.forEach(d => d.addEventListener('click', () => show(Number(d.dataset.go))));
    items.forEach((it, i) => it.querySelector('.feat-book').addEventListener('click', e => { if (it.dataset.pos !== '0') { e.preventDefault(); show(i); } }));
    feat.addEventListener('pointerenter', e => { if (e.pointerType !== 'touch') hold(); });
    feat.addEventListener('pointerleave', () => { release(); feat.style.setProperty('--tilt-x', '0deg'); feat.style.setProperty('--tilt-y', '0deg'); });
    feat.addEventListener('pointermove', e => {
      if (motionOff()) return; const r = feat.getBoundingClientRect();
      feat.style.setProperty('--tilt-x', ((e.clientX - r.left) / r.width - .5) * 50 + 'deg');
      feat.style.setProperty('--tilt-y', -((e.clientY - r.top) / r.height - .5) * 22 + 'deg');
    });
    feat.addEventListener('keydown', e => { if (e.key === 'ArrowRight') show(cur + 1); if (e.key === 'ArrowLeft') show(cur - 1); });
    // resuming background motion restarts the clock (and the dot's progress bar)
    new MutationObserver(() => { if (!motionOff()) { dots.forEach(d => d.setAttribute('aria-current', 'false')); void feat.offsetWidth; dots[cur] && dots[cur].setAttribute('aria-current', 'true'); arm(); } })
      .observe(document.documentElement, { attributes: true, attributeFilter: ['data-scene-motion'] });
    const start = Number(new URLSearchParams(location.search).get('feature')) || 1; // ?feature=3 opens on the third book (handy for previews)
    show(clamp(start, 1, n) - 1, true);
  }

  // ---- the library ring
  const stage = document.querySelector('[data-ring]');
  if (stage) {
    const ring = stage.querySelector('.ring'), items = [...ring.children], n = items.length, step = 360 / n;
    const cap = { title: document.querySelector('[data-ring-title]'), group: document.querySelector('[data-ring-group]'), tag: document.querySelector('[data-ring-tagline]'), link: document.querySelector('[data-ring-link]') };
    let angle = 0, vel = 0, target = null, drag = null, visible = false, raf = 0, last = 0, front = -1, idleUntil = 0, slowFrames = 0;
    const dims = new Array(n), zs = new Array(n);
    const frontIndex = () => ((Math.round(-angle / step) % n) + n) % n;
    const paint = () => {
      ring.style.setProperty('--angle', angle.toFixed(2) + 'deg');
      // Shade and stacking only when the shelf has turned enough to matter.
      // Rewriting all 21 books every frame is what makes the spin stutter.
      const bucket = (angle * 2) | 0;
      if (paint.bucket !== bucket) {
        paint.bucket = bucket;
        items.forEach((it, i) => {
          let d = ((i * step + angle) % 360 + 540) % 360 - 180; // -180..180, 0 = facing viewer
          const f = Math.cos(d * Math.PI / 180);
          const dim = (.65 * (1 - Math.max(0, f))).toFixed(2);
          if (dims[i] !== dim) { dims[i] = dim; it.style.setProperty('--dim', dim); }
          const z = String(Math.round(f * 100) + 100);
          if (zs[i] !== z) { zs[i] = z; it.style.zIndex = z; }
        });
      }
      const k = frontIndex();
      if (k !== front) {
        front = k; items.forEach((it, i) => it.classList.toggle('front', i === k));
        const it = items[k]; cap.title.textContent = it.dataset.title; cap.group.textContent = it.dataset.group; cap.tag.textContent = it.dataset.tagline; cap.link.href = it.getAttribute('href');
      }
    };
    const goTo = i => { let want = -i * step; while (want - angle > 180) want -= 360; while (want - angle < -180) want += 360; target = want; idleUntil = performance.now() + 9000; kick(); };
    const tick = t => {
      raf = 0;
      // A hidden tab reports one-second frames. That is the browser, not a slow computer.
      if (document.hidden) { last = 0; slowFrames = 0; return; }
      const frameMs = last ? t - last : 0;
      if (frameMs > 50) slowFrames++; else slowFrames = Math.max(0, slowFrames - 1);
      if (slowFrames > 15) document.documentElement.classList.add('modest-motion');
      // On a machine that is already behind, paint the shelf at an even 30fps. Speed still follows the clock.
      if (document.documentElement.classList.contains('modest-motion') && visible && frameMs && frameMs < 32 && !drag && target === null && Math.abs(vel) < .5) {
        raf = requestAnimationFrame(tick); return;
      }
      const dt = frameMs ? Math.min(.05, frameMs / 1000) : 0; last = t;
      if (drag) { /* position set by pointer */ }
      else if (target !== null) { angle += (target - angle) * Math.min(1, dt * 5); if (Math.abs(target - angle) < .05) { angle = target; target = null; } }
      else if (Math.abs(vel) > .5) { angle += vel * dt; vel *= Math.pow(.05, dt); if (Math.abs(vel) <= .5) { goTo(frontIndex()); } }
      else if (!motionOff() && t > idleUntil) angle -= 7 * dt;
      paint();
      if (visible && (!motionOff() || drag || target !== null || Math.abs(vel) > .5)) raf = requestAnimationFrame(tick); else last = 0;
    };
    const kick = () => { if (!raf && !document.hidden) raf = requestAnimationFrame(tick); };
    document.addEventListener('visibilitychange', () => { if (!document.hidden && visible) kick(); });
    new IntersectionObserver(es => { visible = es[0].isIntersecting; if (visible) kick(); }).observe(stage);
    let moved = 0, pressHref = null;
    stage.addEventListener('pointerdown', e => {
      const link = e.target.closest && e.target.closest('.ring-item');
      pressHref = link ? link.getAttribute('href') : null;
      drag = { x: e.clientX, a: angle, t: performance.now(), lx: e.clientX }; moved = 0; target = null; vel = 0; stage.classList.add('dragging'); stage.setPointerCapture(e.pointerId); kick();
    });
    stage.addEventListener('pointermove', e => {
      if (!drag) return; const dx = e.clientX - drag.x; moved = Math.max(moved, Math.abs(dx));
      angle = drag.a + dx * .22; const now = performance.now(), dtt = (now - drag.t) / 1000 || .016; vel = (e.clientX - drag.lx) * .22 / dtt; drag.t = now; drag.lx = e.clientX;
    });
    const end = () => { if (!drag) return; drag = null; stage.classList.remove('dragging'); idleUntil = performance.now() + 9000; if (Math.abs(vel) < 30) goTo(frontIndex()); kick(); };
    stage.addEventListener('pointerup', () => {
      const href = pressHref, tap = moved <= 28;
      end();
      if (tap && href) location.assign(href);
    });
    stage.addEventListener('pointercancel', () => { pressHref = null; end(); });
    items.forEach(it => it.addEventListener('click', e => { if (e.detail !== 0 && moved > 28) e.preventDefault(); }));
    document.querySelectorAll('[data-ring-step]').forEach(b => b.addEventListener('click', () => goTo(frontIndex() + Number(b.dataset.ringStep))));
    stage.addEventListener('keydown', e => { if (e.key === 'ArrowRight') goTo(frontIndex() + 1); if (e.key === 'ArrowLeft') goTo(frontIndex() - 1); });
    paint();
  }

  // ---- 3D trilogy shelves: books swing from spine-on to cover-on as the section arrives
  const shelves = [...document.querySelectorAll('.saga-volumes')];
  if (shelves.length) {
    let q = 0;
    const update = () => {
      q = 0;
      shelves.forEach(s => {
        const r = s.getBoundingClientRect(), p = clamp((innerHeight - r.top) / (innerHeight * .75), 0, 1);
        [...s.children].forEach((v, i) => { const next = motionOff() ? '1' : clamp(p * 1.6 - i * .22, 0, 1).toFixed(3); if (v.dataset.rv !== next) { v.dataset.rv = next; v.style.setProperty('--rv', next); } });
      });
    };
    addEventListener('scroll', () => { if (!q) q = requestAnimationFrame(update); }, { passive: true }); addEventListener('resize', update); update();
  }

  // ---- local film player (the new trailer is a file on this site, not a third-party embed)
  const films = document.querySelectorAll('[data-film]');
  if (films.length) {
    const dlg = document.createElement('dialog'); dlg.className = 'film-dialog'; dlg.setAttribute('aria-label', 'Film player');
    dlg.innerHTML = '<header><span data-film-name></span><button type="button" aria-label="Close film">×</button></header><video controls playsinline preload="none"></video>';
    document.body.append(dlg);
    const video = dlg.querySelector('video');
    const close = () => { video.pause(); dlg.close(); };
    dlg.querySelector('button').addEventListener('click', close);
    dlg.addEventListener('click', e => { if (e.target === dlg) close(); });
    dlg.addEventListener('close', () => video.pause());
    films.forEach(b => b.addEventListener('click', () => {
      dlg.querySelector('[data-film-name]').textContent = b.dataset.filmTitle || 'Film';
      if (video.getAttribute('src') !== b.dataset.film) video.src = b.dataset.film;
      dlg.showModal(); video.play().catch(() => {});
    }));
  }
})();

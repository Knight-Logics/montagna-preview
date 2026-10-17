/* Spectacle layer behaviour: headline word reveal, featured-works carousel with pointer tilt,
   the draggable 21-book ring, scroll-driven 3D trilogy reveal, and the local film player. */
(() => {
  'use strict';
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const motionOff = () => document.documentElement.dataset.sceneMotion === 'paused';
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));

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

  // ---- featured works carousel
  const feat = document.querySelector('[data-featured]');
  if (feat) {
    const items = [...feat.querySelectorAll('.feat-item')], dots = [...feat.querySelectorAll('.feat-dot')], now = feat.querySelector('[data-feat-now]');
    const n = items.length; let cur = 0, timer = 0, hover = false;
    const show = k => {
      cur = (k + n) % n;
      items.forEach((it, i) => {
        let d = i - cur; if (d > n / 2) d -= n; if (d < -n / 2) d += n;
        it.dataset.pos = String(clamp(d, -2, 2)); const on = d === 0;
        it.setAttribute('aria-hidden', String(!on)); it.querySelectorAll('a,button').forEach(a => a.tabIndex = on ? 0 : -1);
      });
      dots.forEach((d, i) => d.setAttribute('aria-current', String(i === cur)));
      if (now) now.textContent = String(cur + 1).padStart(2, '0');
    };
    const auto = () => { clearInterval(timer); timer = setInterval(() => { if (!hover && !motionOff() && !document.hidden) show(cur + 1); }, 6200); };
    feat.querySelectorAll('[data-step]').forEach(b => b.addEventListener('click', () => { show(cur + Number(b.dataset.step)); auto(); }));
    dots.forEach(d => d.addEventListener('click', () => { show(Number(d.dataset.go)); auto(); }));
    items.forEach((it, i) => it.querySelector('.feat-book').addEventListener('click', e => { if (it.dataset.pos !== '0') { e.preventDefault(); show(i); auto(); } }));
    feat.addEventListener('pointerenter', () => hover = true); feat.addEventListener('pointerleave', () => { hover = false; feat.style.setProperty('--tilt-x', '0deg'); feat.style.setProperty('--tilt-y', '0deg'); });
    feat.addEventListener('pointermove', e => {
      if (motionOff()) return; const r = feat.getBoundingClientRect();
      feat.style.setProperty('--tilt-x', ((e.clientX - r.left) / r.width - .5) * 50 + 'deg');
      feat.style.setProperty('--tilt-y', -((e.clientY - r.top) / r.height - .5) * 22 + 'deg');
    });
    feat.addEventListener('keydown', e => { if (e.key === 'ArrowRight') { show(cur + 1); auto(); } if (e.key === 'ArrowLeft') { show(cur - 1); auto(); } });
    show(0); auto();
  }

  // ---- the library ring
  const stage = document.querySelector('[data-ring]');
  if (stage) {
    const ring = stage.querySelector('.ring'), items = [...ring.children], n = items.length, step = 360 / n;
    const cap = { title: document.querySelector('[data-ring-title]'), group: document.querySelector('[data-ring-group]'), tag: document.querySelector('[data-ring-tagline]'), link: document.querySelector('[data-ring-link]') };
    let angle = 0, vel = 0, target = null, drag = null, visible = false, raf = 0, last = 0, front = -1, idleUntil = 0;
    const frontIndex = () => ((Math.round(-angle / step) % n) + n) % n;
    const paint = () => {
      ring.style.setProperty('--angle', angle + 'deg');
      items.forEach((it, i) => {
        let d = ((i * step + angle) % 360 + 540) % 360 - 180; // -180..180, 0 = facing viewer
        const f = Math.cos(d * Math.PI / 180);
        it.style.setProperty('--dim', (.65 * (1 - Math.max(0, f))).toFixed(3));
        it.style.zIndex = String(Math.round(f * 100) + 100);
      });
      const k = frontIndex();
      if (k !== front) {
        front = k; items.forEach((it, i) => it.classList.toggle('front', i === k));
        const it = items[k]; cap.title.textContent = it.dataset.title; cap.group.textContent = it.dataset.group; cap.tag.textContent = it.dataset.tagline; cap.link.href = it.getAttribute('href');
      }
    };
    const goTo = i => { let want = -i * step; while (want - angle > 180) want -= 360; while (want - angle < -180) want += 360; target = want; idleUntil = performance.now() + 9000; kick(); };
    const tick = t => {
      raf = 0; const dt = last ? Math.min(.05, (t - last) / 1000) : 0; last = t;
      if (drag) { /* position set by pointer */ }
      else if (target !== null) { angle += (target - angle) * Math.min(1, dt * 5); if (Math.abs(target - angle) < .05) { angle = target; target = null; } }
      else if (Math.abs(vel) > .5) { angle += vel * dt; vel *= Math.pow(.05, dt); if (Math.abs(vel) <= .5) { goTo(frontIndex()); } }
      else if (!motionOff() && t > idleUntil) angle -= 7 * dt;
      paint();
      if (visible && (!motionOff() || drag || target !== null || Math.abs(vel) > .5)) raf = requestAnimationFrame(tick); else last = 0;
    };
    const kick = () => { if (!raf) raf = requestAnimationFrame(tick); };
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
        [...s.children].forEach((v, i) => v.style.setProperty('--rv', motionOff() ? 1 : clamp(p * 1.6 - i * .22, 0, 1).toFixed(3)));
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

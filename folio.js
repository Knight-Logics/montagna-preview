(() => {
  'use strict';
  const root = document.querySelector('[data-folio]');
  if (!root) return;
  const host = root.querySelector('.folio-book-host');
  const theatre = root.querySelector('.folio-theatre');
  const native = root.querySelector('[data-folio-native]');
  const text = document.querySelector('.portfolio-reader');
  const prev = root.querySelector('[data-folio-prev]');
  const next = root.querySelector('[data-folio-next]');
  const status = root.querySelector('.folio-page-status');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  let book = null, mode = 'book';

  function fitStage() {
    const nav = root.querySelector('.folio-navigation');
    const bar = root.querySelector('.folio-progress');
    const open = native.clientWidth >= 760;
    const ratio = open ? 4 / 3 : 2 / 3;
    const availableH = Math.max(220, native.clientHeight - (nav?.offsetHeight || 0) - (bar?.offsetHeight || 0) - 16);
    const availableW = Math.max(240, native.clientWidth);
    let width = availableW;
    let height = width / ratio;
    if (height > availableH) { height = availableH; width = height * ratio; }
    theatre.style.width = Math.floor(width) + 'px';
    theatre.style.height = Math.floor(height) + 'px';
    theatre.dataset.spread = open ? 'open' : 'single';
  }

  function pageSize() {
    const pw = Number(host.dataset.pageW) || 900;
    const ph = Number(host.dataset.pageH) || 1260;
    const ratio = ph / pw;
    const open = theatre.dataset.spread !== 'single';
    return {
      width: 700,
      height: Math.round(700 * ratio),
      size: 'stretch',
      minWidth: 240,
      maxWidth: 1400,
      minHeight: Math.round(240 * ratio),
      maxHeight: Math.round(1400 * ratio),
      showCover: false,
      usePortrait: !open,
      drawShadow: true,
      maxShadowOpacity: .32,
      flippingTime: 950,
      autoSize: true,
      useMouseEvents: true,
      mobileScrollSupport: true,
      swipeDistance: 30,
      showPageCorners: true,
      clickEventForward: true
    };
  }

  function update() {
    if (!book) return;
    const page = book.getCurrentPageIndex(), total = book.getPageCount();
    const landscape = book.getOrientation() === 'landscape';
    const left = landscape ? page - (page % 2) : page;
    const right = Math.min(left + (landscape ? 1 : 0), total - 1);
    const spread = right > left;
    status.textContent = (spread ? 'Pages ' + (left + 1) + '–' + (right + 1) : 'Page ' + (left + 1)) + ' of ' + total;
    prev.disabled = left === 0;
    next.disabled = right >= total - 1;
    root.querySelector('.folio-progress span').style.width = ((page + 1) / total * 100) + '%';
    root.dataset.currentPage = String(page + 1);
  }

  function initialize() {
    if (book || !window.St?.PageFlip) return;
    try {
      fitStage();
      book = new St.PageFlip(host, pageSize());
      book.on('init', update);
      book.on('flip', update);
      book.on('changeOrientation', update);
      book.on('changeState', ({ data }) => { root.dataset.turnState = data; });
      book.loadFromHTML(host.querySelectorAll('.folio-leaf'));
      root.dataset.readerReady = 'true';
      if (text) text.hidden = true;
      host.querySelectorAll('img').forEach(img => {
        if (!img.complete) img.addEventListener('load', () => book?.update(), { once: true });
      });
      update();
    } catch {
      status.textContent = 'The text edition is available below.';
      native.hidden = true;
      if (text) text.hidden = false;
      root.querySelectorAll('[data-folio-mode]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.folioMode === 'text')));
    }
  }

  function setMode(value, scroll = true) {
    if (book && mode === 'book') book.getRender().finishAnimation();
    mode = value === 'text' ? 'text' : 'book';
    root.dataset.mode = mode;
    root.querySelectorAll('[data-folio-mode]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.folioMode === mode)));
    native.hidden = false;
    native.classList.toggle('folio-dormant', mode !== 'book');
    native.inert = mode !== 'book';
    native.setAttribute('aria-hidden', String(mode !== 'book'));
    if (text) text.hidden = mode !== 'text';
    if (mode === 'book') {
      initialize();
      requestAnimationFrame(() => book?.update());
    }
    if (mode === 'text' && text && scroll) text.scrollIntoView({ behavior: reduce.matches ? 'instant' : 'smooth', block: 'start' });
  }

  function turn(direction) {
    if (!book || mode !== 'book' || book.getState() === 'flipping') return;
    try {
      if (direction > 0 && !next.disabled) {
        if (reduce.matches) book.turnToNextPage(); else book.flipNext('bottom');
      } else if (direction < 0 && !prev.disabled) {
        if (reduce.matches) book.turnToPrevPage(); else book.flipPrev('bottom');
      }
      update();
    } catch { update(); }
  }

  prev.addEventListener('click', () => turn(-1));
  next.addEventListener('click', () => turn(1));
  root.querySelectorAll('[data-folio-mode]').forEach(b => b.addEventListener('click', () => setMode(b.dataset.folioMode)));
  theatre.addEventListener('keydown', e => {
    if (e.key === 'ArrowRight') { e.preventDefault(); turn(1); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); turn(-1); }
    else if (e.key === 'Home') { e.preventDefault(); book?.turnToPage(0); update(); }
    else if (e.key === 'End') { e.preventDefault(); book?.turnToPage(book.getPageCount() - 1); update(); }
  });
  const expandButton = root.querySelector('[data-folio-expand]');
  const setExpanded = on => { root.classList.toggle('folio-expanded', on); expandButton.textContent = on ? 'Exit full screen ↙' : 'Expand ↗'; };
  expandButton.addEventListener('click', async () => {
    if (document.fullscreenElement) await document.exitFullscreen?.();
    else if (root.classList.contains('folio-expanded')) setExpanded(false);
    else if (root.requestFullscreen) {
      try { await root.requestFullscreen(); }
      catch { setExpanded(true); }
    } else setExpanded(true);
    requestAnimationFrame(() => { fitStage(); book?.update(); });
  });
  document.addEventListener('fullscreenchange', () => {
    root.querySelector('[data-folio-expand]').textContent = document.fullscreenElement ? 'Exit full screen ↙' : 'Expand ↗';
    setTimeout(() => { fitStage(); book?.update(); }, 80);
  });
  let resize;
  new ResizeObserver(() => {
    clearTimeout(resize);
    resize = setTimeout(() => { if (mode === 'book') { fitStage(); book?.update(); } }, 90);
  }).observe(native);
  if (reduce.matches) setMode('text', false);
  else initialize();
})();

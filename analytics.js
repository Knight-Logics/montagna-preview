(() => {
  'use strict';
  const script = document.currentScript;
  const ga4 = script?.dataset.ga4 || '';
  const googleTag = script?.dataset.googleTag || '';
  const clarityId = script?.dataset.clarity || '';
  if (!/^G-[A-Z0-9]+$/.test(ga4) && !/^GTM-[A-Z0-9]+$/.test(googleTag) && !/^[a-z0-9]{6,20}$/.test(clarityId)) return;
  if (!['stephenfmontagnabooks.com', 'www.stephenfmontagnabooks.com'].includes(location.hostname)) return;
  const key = 'montagna-analytics-consent-v1';
  const serviceSignature = ga4 + '|' + clarityId + (googleTag ? '|' + googleTag : '');
  const maxAge = 180 * 24 * 60 * 60 * 1000;
  let loaded = false;
  let lastFocus = null;
  let choice = null;
  try {
    const saved = JSON.parse(localStorage.getItem(key));
    if (saved && saved.services === serviceSignature && ['granted', 'denied'].includes(saved.choice) && saved.time <= Date.now() && Date.now() - saved.time < maxAge) choice = saved.choice;
  } catch (_) { /* Analytics remains off if storage is unavailable. */ }
  const privacySignal = navigator.globalPrivacyControl === true || navigator.doNotTrack === '1';
  const privateRoute = /^\/(reading-list|contact|contact-us|cart|checkout)(\/|$)/.test(location.pathname);
  const services = [ga4 || googleTag ? 'Google Analytics' : '', clarityId ? 'Microsoft Clarity' : ''].filter(Boolean).join(' and ');
  const addScript = (src, id) => {
    if (document.getElementById(id)) return;
    const tag = document.createElement('script');
    tag.id = id;
    tag.async = true;
    tag.src = src;
    document.head.append(tag);
  };
  const cleanUrl = value => {
    try { const url = new URL(value); return url.origin + url.pathname; } catch (_) { return ''; }
  };
  const start = () => {
    if (loaded || privacySignal) return;
    loaded = true;
    if ((ga4 || googleTag) && !privateRoute) {
      if (ga4) window['ga-disable-' + ga4] = false;
      window.dataLayer = window.dataLayer || [];
      window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
      window.gtag('consent', 'default', {analytics_storage:'denied', ad_storage:'denied', ad_user_data:'denied', ad_personalization:'denied'});
      window.gtag('consent', 'update', {analytics_storage:'granted', ad_storage:'denied', ad_user_data:'denied', ad_personalization:'denied'});
      window.gtag('set', {page_location:cleanUrl(location.href), page_referrer:cleanUrl(document.referrer), allow_google_signals:false, allow_ad_personalization_signals:false, allow_enhanced_conversions:false});
      window.gtag('js', new Date());
      if (googleTag) {
        addScript('https://www.googletagmanager.com/gtm.js?id=' + encodeURIComponent(googleTag), 'montagna-google-tag');
      } else {
        window.gtag('config', ga4, {page_location:cleanUrl(location.href), page_referrer:cleanUrl(document.referrer), allow_google_signals:false, allow_ad_personalization_signals:false});
        addScript('https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(ga4), 'montagna-ga4');
      }
    }
    if (clarityId && !privateRoute) {
      document.body.setAttribute('data-clarity-mask', 'true');
      window.clarity = window.clarity || function () { (window.clarity.q = window.clarity.q || []).push(arguments); };
      window.clarity('consentv2', {analytics_Storage:'granted', ad_Storage:'denied'});
      addScript('https://www.clarity.ms/tag/' + encodeURIComponent(clarityId), 'montagna-clarity');
    }
  };
  const expireCookies = () => {
    const domains = ['', location.hostname, '.' + location.hostname, '.stephenfmontagnabooks.com'];
    for (const cookie of document.cookie.split(';')) {
      const name = cookie.trim().split('=')[0];
      if (!/^(_ga($|_)|_gid$|_gat($|_)|_clck$|_clsk$)/.test(name)) continue;
      for (const domain of domains) document.cookie = name + '=; Max-Age=0; Path=/; SameSite=Lax' + (domain ? '; Domain=' + domain : '');
    }
  };

  // Only public catalog identifiers enter these events; no link queries or input values.
  const editions = new Map();
  try {
    const catalog = JSON.parse(document.getElementById('edition-catalog')?.textContent || '{}');
    for (const [slug, book] of Object.entries(catalog.books || {})) {
      if (!/^[a-z0-9-]{1,80}$/.test(slug)) continue;
      for (const edition of book.editions || []) {
        if (!['paperback', 'hardback'].includes(edition.format) || !edition.url) continue;
        const url = new URL(edition.url, location.origin);
        if (url.protocol !== 'https:' || url.hostname !== 'shop.ingramspark.com') continue;
        url.hash = '';
        editions.set(url.href, {book_slug:slug, book_format:edition.format, retailer:'ingramspark'});
      }
    }
  } catch (_) { /* Invalid/missing catalog disables book event matching. */ }
  const filmPaths = new Map();
  for (const button of document.querySelectorAll('[data-film]')) {
    try {
      const url = new URL(button.dataset.film, location.origin);
      if (url.origin !== location.origin || !/^\/films\/[a-z0-9-]+\.mp4$/.test(url.pathname)) continue;
      filmPaths.set(url.pathname, url.pathname.split('/').pop().replace(/\.mp4$/, ''));
    } catch (_) { /* Only the site's published local film paths are tracked. */ }
  }
  const canMeasure = () => loaded && choice === 'granted' && !privacySignal && !privateRoute;
  // 2026-11-08 (Claude): where on the page a button was pressed. The book panel beside the reader's guide is 'shelf'.
  // Keep these values in step with dist/app.js (anonymous counts) and functions/api/count.js.
  const placementOf = element => {
    if (element.closest('.guide-shelf')) return 'shelf';
    if (element.closest('.search-results')) return 'search';
    const path = location.pathname;
    if (path === '/') return 'home';
    if (/^\/books\/[^/]+/.test(path)) return 'book';
    if (/^\/books\/?$/.test(path)) return 'books';
    if (/^\/reviews\//.test(path)) return 'review';
    if (/^\/portfolio\//.test(path)) return 'portfolio';
    if (/^\/series\//.test(path)) return 'series';
    if (/^\/(collections|new-release)(\/|$)/.test(path)) return 'collections';
    return 'other';
  };
  const sendReaderEvent = (name, parameters) => {
    if (!canMeasure()) return false;
    if (ga4 && typeof window.gtag === 'function') {
      window.gtag('event', name, {...parameters, send_to:ga4});
    }
    if (clarityId && typeof window.clarity === 'function') {
      for (const key of ['book_slug', 'book_format', 'placement', 'trailer_id']) {
        if (parameters[key]) window.clarity('set', key, parameters[key]);
      }
      window.clarity('event', name + (name === 'trailer_progress' ? '_' + parameters.video_percent : ''));
    }
    return true;
  };
  const buyClick = event => {
    if (!canMeasure() || (event.type === 'auxclick' ? event.button !== 1 : event.button !== 0)) return;
    const link = event.target.closest?.('a[href]');
    if (!link) return;
    try {
      const url = new URL(link.href, location.origin);
      url.hash = '';
      const edition = editions.get(url.href);
      if (!edition) return;
      sendReaderEvent('book_buy_click', {...edition, placement:placementOf(link)});
    } catch (_) { /* Unrecognized destinations remain unmeasured. */ }
  };
  document.addEventListener('click', buyClick, true);
  document.addEventListener('auxclick', buyClick, true);

  // 2026-11-08 (Claude): a book saved to the reading list ("+"). Only the book's public slug is sent, never the list.
  // Capture phase: this runs before dist/app.js updates the list, so a slug already in storage means a removal.
  document.addEventListener('click', event => {
    if (!canMeasure()) return;
    const button = event.target.closest?.('[data-save]');
    const slug = button?.dataset.save || '';
    if (!/^[a-z0-9-]{1,80}$/.test(slug)) return;
    let list = [];
    try { list = JSON.parse(localStorage.getItem('montagna-reading-list') || '[]'); } catch (_) { list = []; }
    if (Array.isArray(list) && list.includes(slug)) return;
    sendReaderEvent('reading_list_add', {book_slug:slug, placement:placementOf(button)});
  }, true);

  const videoStates = new WeakMap();
  const media = event => {
    const video = event.target;
    if (!canMeasure() || video.tagName !== 'VIDEO') return null;
    try {
      const url = new URL(video.currentSrc || video.src, location.origin);
      const id = url.origin === location.origin && filmPaths.get(url.pathname);
      if (!id) return null;
      let state = videoStates.get(video);
      if (!state || state.id !== id || state.finished) {
        state = {id, started:false, finished:false, milestones:new Set(), previous:video.currentTime || 0};
        videoStates.set(video, state);
      }
      return {video, state};
    } catch (_) { return null; }
  };
  const videoEvent = (name, video, state, extra={}) => sendReaderEvent(name, {
    trailer_id:state.id, video_provider:'local_mp4',
    video_duration:Number.isFinite(video.duration) ? Math.round(video.duration) : 0,
    ...extra
  });
  document.addEventListener('playing', event => {
    const item = media(event);
    if (!item) return;
    const {video, state} = item;
    state.previous = video.currentTime || 0;
    if (!state.started) { videoEvent('trailer_start', video, state); state.started = true; }
  }, true);
  document.addEventListener('timeupdate', event => {
    const item = media(event);
    if (!item) return;
    const {video, state} = item;
    const current = video.currentTime || 0;
    const previous = state.previous;
    state.previous = current;
    if (video.paused || video.seeking || !Number.isFinite(video.duration) || video.duration <= 0) return;
    if (!state.started) { videoEvent('trailer_start', video, state); state.started = true; return; }
    if (current < previous || current - previous > 2) return;
    for (const percent of [25, 50, 75]) {
      const threshold = video.duration * percent / 100;
      if (!state.milestones.has(percent) && previous < threshold && current >= threshold) {
        videoEvent('trailer_progress', video, state, {video_percent:percent});
        state.milestones.add(percent);
      }
    }
  }, true);
  document.addEventListener('seeked', event => {
    const item = media(event);
    if (item) item.state.previous = item.video.currentTime || 0;
  }, true);
  document.addEventListener('ended', event => {
    const item = media(event);
    if (!item || !item.state.started) return;
    videoEvent('trailer_complete', item.video, item.state, {video_percent:100});
    item.state.finished = true;
  }, true);
  const panel = document.createElement('section');
  panel.className = 'analytics-consent';
  panel.hidden = true;
  panel.setAttribute('role', 'region');
  panel.setAttribute('aria-label', 'Visitor analytics choices');
  panel.innerHTML = '<h2>Visitor analytics</h2><p>' + (privacySignal
    ? 'Your browser requests privacy. Optional visitor analytics will stay off.'
    : 'With your permission, we use ' + services + ' to understand visits and improve this website' + (clarityId ? ', including through heatmaps and masked session recordings' : '') + '. You can use the whole site without them.') +
    '</p><p><a href="/privacy/#visitor-analytics">Read the privacy policy</a></p><div class="analytics-consent-actions">' +
    (privacySignal ? '<button type="button" data-choice="close">Close</button>' : '<button type="button" data-choice="granted">Allow analytics</button><button type="button" data-choice="denied">Decline analytics</button>') + '</div>';
  const settings = document.createElement('button');
  settings.type = 'button';
  settings.className = 'analytics-settings';
  settings.textContent = 'Analytics choices';
  const open = focus => { lastFocus = document.activeElement; panel.hidden = false; if (focus) panel.querySelector('button')?.focus(); };
  const close = () => { panel.hidden = true; if (lastFocus && typeof lastFocus.focus === 'function') lastFocus.focus(); };
  settings.addEventListener('click', () => open(true));
  panel.addEventListener('keydown', event => { if (event.key === 'Escape') close(); });
  panel.addEventListener('click', event => {
    const next = event.target.closest('[data-choice]')?.dataset.choice;
    if (!next) return;
    if (next === 'close') { close(); return; }
    choice = next;
    try { localStorage.setItem(key, JSON.stringify({choice, time:Date.now(), services:serviceSignature})); } catch (_) { /* Choice still applies to this page. */ }
    close();
    if (choice === 'granted') { start(); return; }
    if (ga4) window['ga-disable-' + ga4] = true;
    if (window.gtag) window.gtag('consent', 'update', {analytics_storage:'denied', ad_storage:'denied', ad_user_data:'denied', ad_personalization:'denied'});
    if (window.clarity) window.clarity('consentv2', {analytics_Storage:'denied', ad_Storage:'denied'});
    expireCookies();
    if (loaded) location.reload();
  });
  document.body.append(panel, settings);
  if (privacySignal) { expireCookies(); return; }
  if (choice === 'granted') start();
  else if (choice === null) open(false);
})();

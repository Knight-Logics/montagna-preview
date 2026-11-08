(() => {
  'use strict';
  const script = document.currentScript;
  const ga4 = script?.dataset.ga4 || '';
  const clarityId = script?.dataset.clarity || '';
  if (!/^G-[A-Z0-9]+$/.test(ga4) && !/^[a-z0-9]{6,20}$/.test(clarityId)) return;
  if (!['stephenfmontagnabooks.com', 'www.stephenfmontagnabooks.com'].includes(location.hostname)) return;
  const key = 'montagna-analytics-consent-v1';
  const serviceSignature = ga4 + '|' + clarityId;
  const maxAge = 180 * 24 * 60 * 60 * 1000;
  let loaded = false;
  let lastFocus = null;
  let choice = null;
  try {
    const saved = JSON.parse(localStorage.getItem(key));
    if (saved && saved.services === serviceSignature && ['granted', 'denied'].includes(saved.choice) && saved.time <= Date.now() && Date.now() - saved.time < maxAge) choice = saved.choice;
  } catch (_) { /* Analytics remains off if storage is unavailable. */ }
  const privacySignal = navigator.globalPrivacyControl === true || navigator.doNotTrack === '1';
  const services = [ga4 ? 'Google Analytics' : '', clarityId ? 'Microsoft Clarity' : ''].filter(Boolean).join(' and ');
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
    if (ga4) {
      window['ga-disable-' + ga4] = false;
      window.dataLayer = window.dataLayer || [];
      window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
      window.gtag('consent', 'default', {analytics_storage:'denied', ad_storage:'denied', ad_user_data:'denied', ad_personalization:'denied'});
      window.gtag('consent', 'update', {analytics_storage:'granted', ad_storage:'denied', ad_user_data:'denied', ad_personalization:'denied'});
      window.gtag('js', new Date());
      window.gtag('config', ga4, {page_location:cleanUrl(location.href), page_referrer:cleanUrl(document.referrer), allow_google_signals:false, allow_ad_personalization_signals:false});
      addScript('https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(ga4), 'montagna-ga4');
    }
    if (clarityId && !/^\/(reading-list|contact|contact-us)(\/|$)/.test(location.pathname)) {
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

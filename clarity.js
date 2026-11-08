/* Microsoft Clarity loader (2026-11-08, Claude, at Nick's request). Built by scripts/discovery.py from seo.CLARITY_ID.
   A file rather than an inline snippet so the Content-Security-Policy stays hash-based. It waits until the page has
   loaded and the browser is idle, so it never competes with the page itself, and it does not load at all when the
   browser sends Global Privacy Control or Do Not Track. For visitors in the EEA, the UK and Switzerland no consent
   signal is sent, so Clarity runs there without cookies (one ID per page view). Disclosed on /privacy/. */
(()=>{const n=navigator;if(n.globalPrivacyControl===true||n.doNotTrack==='1'||window.doNotTrack==='1')return;
const go=()=>{window.clarity=window.clarity||function(){(window.clarity.q=window.clarity.q||[]).push(arguments)};
const s=document.createElement('script');s.async=true;s.src='https://www.clarity.ms/tag/za6mj6fqaz';document.head.appendChild(s);};
const later=()=>('requestIdleCallback' in window)?requestIdleCallback(go,{timeout:4000}):setTimeout(go,1500);
if(document.readyState==='complete')later();else addEventListener('load',later,{once:true});})();

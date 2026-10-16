(() => {
  'use strict';
  const root=document.querySelector('[data-folio]');if(!root)return;
  const host=root.querySelector('.folio-book-host');
  const theatre=root.querySelector('.folio-theatre');
  const native=root.querySelector('[data-folio-native]');
  const text=document.querySelector('.portfolio-reader');
  const original=root.querySelector('[data-folio-original]');
  const originalConsent=original.querySelector('.folio-original-consent');
  const prev=root.querySelector('[data-folio-prev]');
  const next=root.querySelector('[data-folio-next]');
  const status=root.querySelector('.folio-page-status');
  const reduce=matchMedia('(prefers-reduced-motion: reduce)');
  let book=null,mode='book';
  function update(){if(!book)return;const page=book.getCurrentPageIndex(),total=book.getPageCount(),spread=book.getOrientation()==='landscape'&&page>0&&page<total-1;status.textContent=(spread?'Pages '+(page+1)+'–'+Math.min(page+2,total):'Page '+(page+1))+' of '+total;prev.disabled=page===0;next.disabled=page>=total-(spread?2:1);root.querySelector('.folio-progress span').style.width=((page+1)/total*100)+'%';root.dataset.currentPage=String(page+1);}
  function initialize(){
    if(book||!window.St?.PageFlip)return;
    try{
      book=new St.PageFlip(host,{width:400,height:560,size:'stretch',minWidth:260,maxWidth:465,minHeight:364,maxHeight:651,showCover:true,drawShadow:true,maxShadowOpacity:.32,flippingTime:950,usePortrait:true,autoSize:true,useMouseEvents:true,mobileScrollSupport:true,swipeDistance:30,showPageCorners:true,clickEventForward:true});
      book.on('init',update);book.on('flip',update);book.on('changeOrientation',update);
      book.on('changeState',({data})=>{root.dataset.turnState=data;});
      book.loadFromHTML(host.querySelectorAll('.folio-leaf'));root.dataset.readerReady='true';
      if(text)text.hidden=true;update();
    }catch{status.textContent='The text edition is available below.';native.hidden=true;if(text)text.hidden=false;root.querySelectorAll('[data-folio-mode]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.folioMode==='text')));}
  }
  function setMode(value,scroll=true){
    // Keep the measured book surface mounted while reading another format.
    // A display:none ancestor leaves PageFlip with a zero-size cached rectangle.
    if(book&&mode==='book')book.getRender().finishAnimation();
    mode=value;root.dataset.mode=mode;root.querySelectorAll('[data-folio-mode]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.folioMode===mode)));native.hidden=false;native.classList.toggle('folio-dormant',mode!=='book');native.inert=mode!=='book';native.setAttribute('aria-hidden',String(mode!=='book'));original.hidden=mode!=='original';if(text)text.hidden=mode!=='text';
    if(mode!=='original'&&original.querySelector('iframe'))original.replaceChildren(originalConsent);
    if(mode==='book'){initialize();requestAnimationFrame(()=>book?.update());}
    if(mode==='text'&&text&&scroll)text.scrollIntoView({behavior:reduce.matches?'instant':'smooth',block:'start'});
  }
  function turn(direction){if(!book||mode!=='book'||book.getState()==='flipping')return;try{if(direction>0&&!next.disabled){if(reduce.matches)book.turnToNextPage();else book.flipNext('bottom');}else if(direction<0&&!prev.disabled){if(reduce.matches)book.turnToPrevPage();else book.flipPrev('bottom');}update();}catch{update();}}
  prev.addEventListener('click',()=>turn(-1));next.addEventListener('click',()=>turn(1));
  root.querySelectorAll('[data-folio-mode]').forEach(b=>b.addEventListener('click',()=>setMode(b.dataset.folioMode)));
  theatre.addEventListener('keydown',e=>{if(e.key==='ArrowRight'){e.preventDefault();turn(1);}else if(e.key==='ArrowLeft'){e.preventDefault();turn(-1);}else if(e.key==='Home'){e.preventDefault();book?.turnToPage(0);update();}else if(e.key==='End'){e.preventDefault();book?.turnToPage(book.getPageCount()-1);update();}});
  root.querySelector('[data-folio-load-original]').addEventListener('click',()=>{if(original.querySelector('iframe'))return;const iframe=document.createElement('iframe');iframe.src=root.dataset.original;iframe.title='Original '+document.querySelector('h1').textContent+' portfolio flipbook';iframe.allow='fullscreen';iframe.allowFullscreen=true;iframe.referrerPolicy='strict-origin-when-cross-origin';original.replaceChildren(iframe);});
  root.querySelector('[data-folio-expand]').addEventListener('click',async()=>{if(document.fullscreenElement){await document.exitFullscreen?.();}else if(root.requestFullscreen){try{await root.requestFullscreen();}catch{root.classList.toggle('folio-expanded');}}else root.classList.toggle('folio-expanded');requestAnimationFrame(()=>book?.update());});
  document.addEventListener('fullscreenchange',()=>{root.querySelector('[data-folio-expand]').textContent=document.fullscreenElement?'Exit full screen ↙':'Expand ↗';setTimeout(()=>book?.update(),80);});
  let resize;new ResizeObserver(()=>{clearTimeout(resize);resize=setTimeout(()=>{if(mode==='book')book?.update();},90);}).observe(root);
  if(reduce.matches)setMode('text',false);else initialize();
})();

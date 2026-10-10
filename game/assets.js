(function () {
  'use strict';
  const shocks={tv:'assets/generated/tv/shock.jpg',impact:'assets/generated/cg/impact-shock.jpg',cloth:'assets/generated/cg/cloth-shock.jpg'};
  const images=new Set(VN_PROJECT.scenes.flatMap(s=>[s.background?.src,s.character?.src]).filter(Boolean));
  for(const s of VN_PROJECT.scenes)if(s.tv)images.add(`assets/generated/tv/${s.tv}.svg`);
  for(const src of [...Object.values(shocks),'assets/generated/tv/cabinet.png','assets/generated/bg/tv-close.svg','assets/generated/ui/title-plate.jpg',...['history','save','load','auto','skip','settings','title','favicon'].map(n=>`assets/generated/ui/${n}.svg`)])images.add(src);
  // Short shocks come first; limit concurrent work instead of flooding mobile connections.
  const ordered=[...Object.values(shocks),...images];
  const records=new Map([...new Set(ordered)].map(src=>[src,{src,type:'image',status:'pending',attempts:0,image:null}]));
  for(const name of ['shock-tv','shock-impact','shock-cloth'])records.set(name,{src:name,type:'sound',status:'pending',attempts:0});
  const panel=document.getElementById('asset-loading'),progress=document.getElementById('asset-progress'),message=document.getElementById('asset-message'),count=document.getElementById('asset-count'),retry=document.getElementById('asset-retry');
  let status='loading',running=false,resolveReady,readyPromise;
  function resetReady(){readyPromise=new Promise(resolve=>{resolveReady=resolve;});}
  resetReady();
  function snapshot(){const all=[...records.values()];return {status,total:all.length,loaded:all.filter(r=>r.status==='ready').length,images:all.filter(r=>r.type==='image').length,failures:all.filter(r=>r.status==='error').map(r=>r.src),records:all.map(r=>({src:r.src,type:r.type,status:r.status,attempts:r.attempts,decoded:r.type==='image'?Boolean(r.image?.complete&&r.image.naturalWidth):r.status==='ready'}))};}
  function render(){
    const s=snapshot();panel.hidden=status==='ready';panel.dataset.status=status;panel.setAttribute('aria-busy',String(running));progress.max=s.total;progress.value=s.loaded;count.textContent=`${s.loaded} / ${s.total}`;
    message.textContent=status==='error'?`有 ${s.failures.length} 项画面或声音未能载入。请检查网络后重试。`:'正在准备画面与声音，请稍候。';
    panel.querySelector('h2').textContent=status==='error'?'录像还没有准备好':'正在准备录像';
    retry.hidden=status!=='error';retry.disabled=running;
    for(const id of ['vn-scene','title-screen','toolbar','choice-panel'])document.getElementById(id).inert=status!=='ready';
    window.dispatchEvent(new CustomEvent('vn:assets-state',{detail:s}));
  }
  function timed(promise,ms){return new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(new Error('Resource timeout')),ms);promise.then(v=>{clearTimeout(timer);resolve(v);},e=>{clearTimeout(timer);reject(e);});});}
  async function load(r){
    r.status='loading';
    for(let i=0;i<3;i++){
      r.attempts++;
      try{
        if(r.type==='image'){
          const image=new Image();image.decoding='async';
          const suffix=r.attempts>1?`?vn-retry=${Date.now()}-${r.attempts}`:'';
          image.src=r.src+suffix;
          await timed(image.decode(),30000);
          if(!image.complete||!image.naturalWidth)throw new Error('Empty image');
          r.image=image;
        }else await timed(VNAudio.prepareEffect(r.src),30000);
        r.status='ready';render();return;
      }catch(e){r.error=e.message;if(i<2)await new Promise(resolve=>setTimeout(resolve,400*(i+1)));}
    }
    r.status='error';render();
  }
  async function run(){
    if(running)return;running=true;status='loading';render();
    const queue=[...records.values()].filter(r=>r.status!=='ready');let index=0;
    await Promise.all(Array.from({length:4},async()=>{while(index<queue.length)await load(queue[index++]);}));
    running=false;status=[...records.values()].some(r=>r.status!=='ready')?'error':'ready';
    if(status==='ready'){
      // Repair markup images too, if their original request failed before a retry succeeded.
      for(const im of document.images){const r=records.get(im.getAttribute('src'));if(r?.image&&im.src!==r.image.src)im.src=r.image.src;}
      for(const b of document.querySelectorAll('#toolbar [data-symbol]'))b.style.setProperty('--tool-icon',`url("${image(`assets/generated/ui/${b.dataset.symbol}.svg`).src}")`);
      document.querySelector('link[rel=icon]').href=image('assets/generated/ui/favicon.svg').src;
      resolveReady();
    }
    render();
  }
  function whenReady(){return status==='ready'?Promise.resolve():readyPromise;}
  function image(src){const r=records.get(src);if(r?.status!=='ready'||!r.image)throw new Error('Image not prepared: '+src);return r.image;}
  async function ensureDecoded(src){
    for(;;){
      await whenReady();const r=records.get(src);
      try{await r.image.decode();return r.image;}
      catch(e){r.status='error';r.error=e.message;if(status!=='error'){status='error';resetReady();}render();}
    }
  }
  window.VNAssets={getState:snapshot,whenReady,image,ensureDecoded,shocks:Object.freeze(shocks),url:src=>records.get(src)?.image?.src||src,retry:run};
  retry.onclick=run;run();
})();

import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import puppeteer from 'puppeteer';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const out=path.join(root,'output',process.env.VNUI_PRELOAD_OUTPUT||'preload');await mkdir(out,{recursive:true});
const browser=await puppeteer.launch({headless:true,executablePath:process.env.VNUI_BROWSER_PATH||undefined,args:['--allow-file-access-from-files',...(process.env.CI?['--no-sandbox']:[])]});
const url=process.env.VNUI_TEST_URL||'http://127.0.0.1:4180/';
const checks=[],errors=[],expectedFailures=[];let page,context;
const delay=ms=>new Promise(r=>setTimeout(r,ms));
function check(value,label){checks.push({ok:Boolean(value),label});assert.ok(value,label);}
async function ready(){await page.waitForFunction(()=>VNAssets.getState().status==='ready',{timeout:90000});}
async function fresh(size={width:1280,height:720}){
 if(context)await context.close();context=await browser.createBrowserContext();page=await context.newPage();await page.setViewport(size);await page.setCacheEnabled(false);
 page.on('pageerror',e=>errors.push(e.message));
 await page.evaluateOnNewDocument(()=>{
  window.hits=[];
  window.addEventListener('vn:scare-hit',e=>{
   const im=document.querySelector('.scare-frame');
   hits.push({...e.detail,time:performance.now(),decoded:im.complete&&im.naturalWidth>0,opacity:getComputedStyle(im).opacity,prepared:im===VNAssets.image(VNAssets.shocks[e.detail.kind]),audio:VNAudio.getState()});
  });
 });
}
async function configure(key){
 await page.click('#settings-button');await page.evaluate(key=>[...document.querySelectorAll('#menu-content label')].find(l=>l.textContent===key).querySelector('input').click(),key);await page.click('#close-dialog');
}
try{
 // A late image keeps every entry point locked, including keyboard and direct APIs.
 await fresh({width:320,height:568});await page.setRequestInterception(true);let held=null;
 const coldSaveScript=await page.evaluateOnNewDocument(()=>localStorage.setItem('afternoon-program-v1:auto',JSON.stringify({version:1,scene:'prologue-001',flags:{},history:[],time:new Date().toISOString()})));
 page.on('request',r=>{if(!held&&r.url().endsWith('/cg/cloth-shock.jpg'))held=r;else r.continue();});
 await page.goto(url,{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>typeof VNAssets!=='undefined');
 await delay(300);
 check(await page.evaluate(()=>VNAssets.getState().status==='loading'&&document.getElementById('start-button').disabled&&document.getElementById('continue-button').disabled),'Cold loading gates Start and valid Continue');
 await page.evaluate(()=>{document.getElementById('start-button').click();document.getElementById('continue-button').click();VNPlayer.goToScene(VN_PROJECT.scenes[10].id);});
 await page.keyboard.press('Space');await page.keyboard.press('Escape');
 check(await page.evaluate(()=>AfternoonGame.getState().mode==='title'&&!document.getElementById('menu-dialog').open),'Keyboard and direct jump cannot bypass preload');
 check(await page.$eval('#asset-loading',e=>{const r=e.getBoundingClientRect();return r.width<=innerWidth&&r.height<=innerHeight&&e.getAttribute('aria-busy')==='true';}),'Small phone loading panel fits and reports busy');
 await page.screenshot({path:path.join(out,'phone-loading.png')});
 assert.ok(held);await held.continue();await ready();
 const inventory=await page.evaluate(()=>VNAssets.getState());
 check(inventory.loaded===inventory.total&&inventory.records.every(r=>r.decoded),'All manifest images and shock sounds are decoded');
 check(inventory.records.filter(r=>r.src.includes('/tv/')).length===8,'TV cabinet, six programs and TV shock are included');
 check(await page.$eval('#asset-loading',e=>e.hidden&&e.getAttribute('aria-busy')==='false'),'Successful loading hides overlay and clears busy');
 check(await page.$eval('#continue-button',e=>!e.disabled),'Valid Continue unlocks after resources are ready');
 check(await page.evaluate(()=>VNAudio.getState().preparedEffects.length===3),'All three shock sounds are ready before Start');
 await page.click('#start-button');await page.setViewport({width:1280,height:720});
 await page.click('#settings-button');await page.select('#menu-content select','0');await page.click('#close-dialog');
 const shocks=await page.evaluate(()=>VN_PROJECT.scenes.filter(s=>s.scare).map(s=>({id:s.id,kind:s.scare})));
 // Monitor transport after startup: triggers must reuse prepared images/sounds.
 const newShockRequests=[];page.on('request',r=>{if(/(?:shock\.jpg|shock-.*\.wav)/.test(r.url()))newShockRequests.push(r.url());});
 for(const s of shocks){
  await page.evaluate(id=>VNPlayer.goToScene(id),s.id);
  await page.waitForFunction(k=>hits.some(h=>h.kind===k),{timeout:5000},s.kind);
  const hit=await page.evaluate(k=>hits.find(h=>h.kind===k),s.kind);
  check(hit.decoded&&hit.opacity==='1'&&hit.prepared,'Visible shock reuses decoded original: '+s.kind);
  check(hit.audio.contextState==='running'&&hit.audio.effects>0,'Decoded shock sound starts in running audio context: '+s.kind);
  await page.screenshot({path:path.join(out,'hit-'+s.kind+'.png')});
  await page.waitForFunction(()=>!AfternoonGame.getState().scareBusy,{timeout:5000});
  const elapsed=await page.evaluate(t=>performance.now()-t,hit.time);
  check(elapsed>=(s.kind==='cloth'?530:260),'Full shock lifetime follows visible hit: '+s.kind);
  check(await page.evaluate(id=>AfternoonGame.getState().playedScares.includes(id),s.id),'Completed shock is recorded: '+s.kind);
  if(s.kind==='tv'){await delay(650);await page.keyboard.press('Space');check(await page.evaluate(id=>AfternoonGame.getState().readScenes.includes(id),s.id),'TV shock scene is known before fast-forward test');}
 }
 check(newShockRequests.length===0,'No shock image or audio download at trigger time');
 // Simulate the visibility API transition; CSS and lifetime must both pause.
 await page.evaluate(id=>VNPlayer.goToScene(id),shocks[2].id);const visibilityCount=await page.evaluate(()=>hits.length);
 await page.waitForFunction(n=>hits.length>n,{timeout:5000},visibilityCount);
 await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'));});
 await delay(900);
 check(await page.evaluate(()=>AfternoonGame.getState().scareBusy&&getComputedStyle(document.querySelector('.scare-frame')).animationPlayState==='paused'),'Hidden-tab signal pauses animation and shock lifetime');
 await page.evaluate(()=>{delete document.hidden;document.dispatchEvent(new Event('visibilitychange'));});
 await page.waitForFunction(()=>!AfternoonGame.getState().scareBusy,{timeout:5000});check(true,'Visible-tab signal resumes shock to completion');
 // Hold a second decode after startup; Ctrl/Auto/manual cannot consume this event.
 await page.evaluate(()=>{
  const im=VNAssets.image(VNAssets.shocks.tv);window.realDecode=im.decode.bind(im);
  im.decode=()=>new Promise(resolve=>{window.releaseDecode=()=>realDecode().then(resolve);});
 });
 await page.evaluate(id=>VNPlayer.goToScene(id),shocks[0].id);await delay(1300);
 await page.keyboard.press('Space');await page.keyboard.down('Control');await page.click('#auto-button');
 check(await page.evaluate(id=>AfternoonGame.getState().scene===id&&AfternoonGame.getState().scareBusy&&!document.querySelector('.scare-frame'),shocks[0].id),'Delayed decode blocks fast-forward and does not start animation');
 const hitCount=await page.evaluate(()=>hits.length);await page.evaluate(()=>releaseDecode());
 await page.waitForFunction(n=>hits.length>n,{timeout:5000},hitCount);await page.keyboard.up('Control');await page.click('#auto-button');
 await page.waitForFunction(()=>!AfternoonGame.getState().scareBusy,{timeout:5000});
 // Navigation invalidates the pending async continuation.
 await page.evaluate(id=>VNPlayer.goToScene(id),shocks[0].id);await page.click('#title-button');await page.evaluate(()=>releaseDecode());await delay(800);
 check(await page.evaluate(()=>AfternoonGame.getState().mode==='title'&&!document.querySelector('.scare-frame')),'Title cancels pending decode without a late shock');
 await page.click('#start-button');await page.evaluate(id=>VNPlayer.goToScene(id),shocks[0].id);await page.click('#settings-button');await page.evaluate(()=>releaseDecode());await delay(700);
 check(await page.evaluate(()=>!document.querySelector('.scare-frame')&&document.getElementById('menu-dialog').open),'Menu cancels pending shock');
 // Remove delay before closing menu: unfinished event can replay.
 await page.evaluate(()=>VNAssets.image(VNAssets.shocks.tv).decode=realDecode);const beforeMenuClose=await page.evaluate(()=>hits.length);await page.click('#close-dialog');
 await page.waitForFunction(n=>hits.length>n,{timeout:5000},beforeMenuClose);await page.waitForFunction(()=>!AfternoonGame.getState().scareBusy,{timeout:5000});
 // Save during lead. Reload must replay incomplete shock; old v1 also loads.
 await page.evaluate(id=>VNPlayer.goToScene(id),shocks[1].id);
 await page.waitForFunction(()=>document.getElementById('vn-stage').classList.contains('scare-lead'));
 check(await page.evaluate(id=>!JSON.parse(localStorage.getItem('afternoon-program-v1:auto')).playedScares.includes(id),shocks[1].id),'Autosave during lead does not mark shock completed');
 // Stop the one-time startup save injection before testing real persisted state.
 await page.removeScriptToEvaluateOnNewDocument(coldSaveScript.identifier);
 await page.reload({waitUntil:'load'});await ready();await page.click('#continue-button');
 await page.waitForFunction(()=>hits.some(h=>h.kind==='impact'),{timeout:5000});check(true,'Continue replays incomplete saved shock');
 await page.waitForFunction(()=>!AfternoonGame.getState().scareBusy,{timeout:5000});await page.click('#title-button');
 await page.evaluate(()=>{const key='afternoon-program-v1:auto',s=JSON.parse(localStorage.getItem(key));delete s.playedScares;localStorage.setItem(key,JSON.stringify(s));});
 await page.click('#continue-button');check(await page.evaluate(()=>AfternoonGame.getState().mode==='reading'),'Legacy version1 save remains compatible');
 await configure('开启突发惊吓');await page.evaluate(id=>VNPlayer.goToScene(id),shocks[2].id);await delay(1200);
 check(await page.evaluate(()=>!AfternoonGame.getState().scareBusy&&!document.querySelector('.scare-frame')),'Sudden-effects setting disables shock');
 await configure('开启突发惊吓');await configure('减少动态效果');await page.evaluate(id=>VNPlayer.goToScene(id),shocks[2].id);await delay(1200);
 check(await page.evaluate(()=>!AfternoonGame.getState().scareBusy&&!document.querySelector('.scare-frame')),'Reduced motion disables shock');
 // Independent fault runs; expected failures are separate from normal errors.
 for(const fault of ['404','corrupt','sound','background','icon']){
  await fresh({width:320,height:568});await page.setRequestInterception(true);let broken=true;
  const target=fault==='sound'?'/sfx/shock-tv.wav':fault==='background'?'/bg/living.svg':fault==='icon'?'/ui/history.svg':'/cg/impact-shock.jpg';
  page.on('request',r=>{if(broken&&r.url().includes(target)){expectedFailures.push({fault,url:r.url()});r.respond({status:['404','background','icon'].includes(fault)?404:200,contentType:fault==='sound'?'audio/wav':'image/jpeg',body:'broken resource'});}else r.continue();});
  await page.goto(url,{waitUntil:'load'});await page.waitForFunction(()=>VNAssets.getState().status==='error',{timeout:90000});
  const failed=await page.evaluate(()=>VNAssets.getState());
  check(failed.failures.length===1&&failed.records.find(r=>r.status==='error').attempts===3,fault+' gets three attempts, then explicit error');
  check(await page.evaluate(()=>document.getElementById('start-button').disabled&&!document.getElementById('asset-retry').hidden),fault+' cannot falsely unlock gameplay');
  await page.screenshot({path:path.join(out,'phone-error-'+fault+'.png')});
  broken=false;
  if(fault==='background'){await page.keyboard.press('Tab');check(await page.evaluate(()=>document.activeElement.id==='asset-retry'),'Error retry can be reached by Tab');await page.keyboard.press('Enter');}
  else await page.click('#asset-retry');
  await ready();await page.click('#start-button');
  check(await page.evaluate(()=>AfternoonGame.getState().mode==='reading'),fault+' recovers through manual retry');
  if(fault==='background'){await page.evaluate(()=>VNPlayer.goToScene(VN_PROJECT.scenes.find(s=>s.background?.src==='assets/generated/bg/living.svg').id));check(await page.$eval('.vn-background',e=>e.complete&&e.naturalWidth>0&&e.src.includes('vn-retry')),'Scene renderer uses successfully retried background');}
  if(fault==='icon')check(await page.$eval('#log-button',e=>e.style.getPropertyValue('--tool-icon').includes('vn-retry')),'Toolbar uses successfully retried icon URL');
  await page.evaluate(()=>VNAudio.unlock());await page.evaluate(id=>VNPlayer.goToScene(id),shocks[1].id);
  await page.waitForFunction(()=>hits.some(h=>h.kind==='impact'),{timeout:5000});
  check(await page.evaluate(()=>hits.at(-1).decoded),'Recovered shock uses successful decode: '+fault);
  if(fault==='background'){await page.click('#title-button');check(await page.$eval('.vn-background',e=>e===VNAssets.image('assets/generated/bg/living.svg')&&e.complete&&e.src.includes('vn-retry')),'Returning to title retains successfully decoded retry image');}
  console.log('PASS fault recovery: '+fault);
 }
 // Runtime re-decode failure also waits for retry, without losing its event.
 await fresh();await page.goto(url,{waitUntil:'load'});await ready();await page.click('#start-button');
 await page.evaluate(()=>{const im=VNAssets.image(VNAssets.shocks.cloth),decode=im.decode.bind(im);let failed=false;im.decode=()=>{if(!failed){failed=true;return Promise.reject(new Error('injected decode failure'));}return decode();};});
 await page.evaluate(id=>VNPlayer.goToScene(id),shocks[2].id);await page.waitForFunction(()=>VNAssets.getState().status==='error');
 check(await page.evaluate(()=>AfternoonGame.getState().scareBusy&&!document.querySelector('.scare-frame')),'Runtime decode failure waits without consuming shock');
 await page.click('#asset-retry');await ready();await page.waitForFunction(()=>hits.some(h=>h.kind==='cloth'),{timeout:5000});check(true,'Runtime retry resumes the waiting shock');
 // Local direct-file loading uses preloaded HTMLAudio and still plays all shocks.
 await fresh();await page.goto(pathToFileURL(path.join(root,'app.html')).href,{waitUntil:'load'});await ready();await page.click('#start-button');
 for(const s of shocks){await page.evaluate(id=>VNPlayer.goToScene(id),s.id);await page.waitForFunction(k=>hits.some(h=>h.kind===k),{timeout:5000},s.kind);check(await page.evaluate(()=>hits.at(-1).decoded),'Direct-file decoded shock: '+s.kind);}
 check(!errors.length,'No unexpected script errors: '+errors.join(';'));
 await writeFile(path.join(out,'results.json'),JSON.stringify({passed:true,inventory,checks,errors,expectedFailures},null,2));console.log(`PASS: ${checks.length} preload assertions; ${inventory.images} images, ${inventory.total} resources`);
}catch(e){if(page){await page.screenshot({path:path.join(out,'failure.png')});await writeFile(path.join(out,'failure-dom.html'),await page.content());}await writeFile(path.join(out,'results.json'),JSON.stringify({passed:false,checks,errors,expectedFailures,error:e.stack},null,2));throw e;}
finally{await browser.close();}

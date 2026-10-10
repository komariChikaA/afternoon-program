import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
let puppeteer;
try{puppeteer=(await import('puppeteer')).default;}
catch{puppeteer=(await import(pathToFileURL(process.env.VNUI_PUPPETEER_PATH||path.join(root,'../cake/vn-project/node_modules/puppeteer/lib/esm/puppeteer/puppeteer.js')).href)).default;}
const out=path.join(root,'output/responsive');await mkdir(out,{recursive:true});
const browser=await puppeteer.launch({headless:true,executablePath:process.env.VNUI_BROWSER_PATH||undefined,args:process.env.CI?['--no-sandbox']:[]});
const sizes=[[320,568],[390,844],[430,932],[667,375],[844,390],[768,1024],[1024,768],[1920,1080]];
const checks=[],errors=[];let page;
function check(ok,label){checks.push({ok:Boolean(ok),label});assert.ok(ok,label);}
async function tap(selector){
 await page.$eval(selector,e=>e.scrollIntoView({block:'nearest'}));
 const b=await (await page.$(selector)).boundingBox();assert.ok(b,selector);
 const hit=await page.evaluate(({x,y},s)=>document.querySelector(s)?.contains(document.elementFromPoint(x,y)),{x:b.x+b.width/2,y:b.y+b.height/2},selector);
 check(hit,'Unobstructed control '+selector);
 await page.touchscreen.tap(b.x+b.width/2,b.y+b.height/2);
}
async function capture(name){await page.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.images].map(i=>i.decode()));});await page.screenshot({path:path.join(out,name+'.png')});}
try{
 for(const [width,height] of sizes){
  const label=`${width}x${height}`;page=await browser.newPage();await page.setViewport({width,height,hasTouch:true,isMobile:width<1100,deviceScaleFactor:1});
  page.on('pageerror',e=>errors.push(label+': '+e.message));
  page.on('response',r=>{if(r.status()>=400)errors.push(r.url()+': '+r.status());});
  await page.goto(process.env.VNUI_TEST_URL||'http://127.0.0.1:4180/',{waitUntil:'load'});
  await capture(label+'-title');
  await tap('#title-settings-button');await page.select('#menu-content select','0');await tap('#close-dialog');
  await tap('#start-button');
  check(await page.evaluate(()=>AfternoonGame.getState().scene==='prologue-000'),label+' starts by touch');
  await tap('#auto-button');check(await page.evaluate(()=>AfternoonGame.getState().auto),label+' Auto enables');await tap('#auto-button');
  await page.touchscreen.tap(width/2,Math.min(height/3,150));
  check(await page.evaluate(()=>AfternoonGame.getState().scene==='prologue-001'),label+' tap advances');
  await tap('#skip-button');check(await page.evaluate(()=>!AfternoonGame.getState().skip),label+' unread skip stops');
  const layout=await page.evaluate(()=>{
   const bad=[];const viewport={w:innerWidth,h:innerHeight};
   const fits=e=>{const r=e.getBoundingClientRect();return r.x>=-1&&r.y>=-1&&r.right<=viewport.w+1&&r.bottom<=viewport.h+1;};
   if(document.documentElement.scrollWidth>innerWidth+1)bad.push('page horizontal overflow');
   for(const b of document.querySelectorAll('#toolbar button'))if(!fits(b)||(innerWidth<=1100&&b.getBoundingClientRect().height<43))bad.push('toolbar: '+b.id);
   for(const s of VN_PROJECT.scenes){
    VNPlayer.goToScene(s.id);
    const d=document.querySelector('.vn-dialogue'),t=document.querySelector('.vn-text');
    if(d&&(!fits(d)||d.clientHeight<60||d.scrollWidth>d.clientWidth+2))bad.push('dialogue: '+s.id);
    if(t&&parseFloat(getComputedStyle(t).fontSize)<16)bad.push('font: '+s.id);
    const c=document.querySelector('#choice-panel');if(!c.hidden&&(!fits(c)||c.clientHeight<44||c.scrollWidth>c.clientWidth+2))bad.push('choices: '+s.id);
   }
   return bad;
  });check(!layout.length,label+' every scene has readable, scrollable, bounded layout: '+layout.join(','));
  const longest=await page.evaluate(()=>VN_PROJECT.scenes.reduce((a,b)=>(b.dialogue?.text.length||0)>(a.dialogue?.text.length||0)?b:a).id);
  await page.evaluate(id=>VNPlayer.goToScene(id),longest);await capture(label+'-long-text');
  for(const id of ['day1-observe','home-actions']){
   await page.evaluate(id=>VNPlayer.goToScene(id),id);await capture(label+'-'+id);
   const choices=await page.$$eval('#choice-panel button',bs=>bs.map(b=>b.dataset.choice));
   for(const key of choices){
    await page.evaluate(id=>VNPlayer.goToScene(id),id);
    await tap(`#choice-panel button[data-choice="${key}"]`);
    check(await page.evaluate(id=>AfternoonGame.getState().scene!==id,id),label+' choice '+id+':'+key+' follows branch');
   }
  }
  await page.evaluate(()=>VNPlayer.goToScene('prologue-010'));
  await tap('#save-button');await tap('#menu-content .save-row:first-of-type button');await tap('#close-dialog');
  const saved=await page.evaluate(()=>AfternoonGame.getState().scene);
  await page.touchscreen.tap(width/2,Math.min(height/3,150));await tap('#load-button');await tap('#menu-content .save-row:nth-of-type(2) button');
  check(await page.evaluate(s=>AfternoonGame.getState().scene===s,saved),label+' save/load restores state');
  await tap('#log-button');await capture(label+'-menu');await tap('#close-dialog');
  await tap('#settings-button');check(await page.$eval('#menu-dialog',e=>e.scrollWidth<=e.clientWidth+2),label+' settings no horizontal overflow');await tap('#close-dialog');
  const tv=await page.evaluate(()=>VN_PROJECT.scenes.find(s=>s.closeTV).id);await page.evaluate(id=>VNPlayer.goToScene(id),tv);await capture(label+'-tv');
  const before=await page.evaluate(()=>AfternoonGame.getState().scene);await page.setViewport({width:height,height:width,hasTouch:true,isMobile:width<1100,deviceScaleFactor:1});
  check(await page.evaluate(id=>AfternoonGame.getState().scene===id,before),label+' rotate keeps progress');
  await page.setViewport({width,height,hasTouch:true,isMobile:width<1100,deviceScaleFactor:1});
  const end=await page.evaluate(()=>VN_PROJECT.scenes.find(s=>s.end).id);await page.evaluate(id=>VNPlayer.goToScene(id),end);
  await page.waitForFunction(()=>!document.querySelector('.scare-frame')&&!document.getElementById('vn-stage').dataset.scare);
  const hold=await page.evaluate(id=>VN_PROJECT.scenes.find(s=>s.id===id).holdMs||0,end);await new Promise(r=>setTimeout(r,Math.max(hold,1150)+100));
  await page.touchscreen.tap(width/2,Math.min(height/3,150));
  check(await page.evaluate(()=>AfternoonGame.getState().mode==='ending'),label+' ending reachable');await capture(label+'-ending');
  await tap('#ending-title-button');await tap('#credits-button');check(await page.$eval('#menu-dialog',d=>d.open),label+' sources available');await tap('#close-dialog');
  console.log('PASS '+label);await page.close();page=null;
 }
 check(!errors.length,'No HTTP or script errors: '+errors.join(';'));
 await writeFile(path.join(out,'results.json'),JSON.stringify({passed:true,sizes,checks,errors},null,2));console.log(`PASS: ${checks.length} responsive assertions`);
}catch(e){if(page)await capture('failure');await writeFile(path.join(out,'results.json'),JSON.stringify({passed:false,checks,errors,error:e.stack},null,2));throw e;}
finally{await browser.close();}

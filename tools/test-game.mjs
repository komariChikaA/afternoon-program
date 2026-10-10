import assert from 'node:assert/strict';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {fileURLToPath,pathToFileURL} from 'node:url';
import path from 'node:path';
import {createHash} from 'node:crypto';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
let puppeteer;
try {puppeteer=(await import('puppeteer')).default;}
catch {puppeteer=(await import(pathToFileURL(process.env.VNUI_PUPPETEER_PATH || path.join(root,'../cake/vn-project/node_modules/puppeteer/lib/esm/puppeteer/puppeteer.js')).href)).default;}
const output=path.join(root,'output/playwright');await mkdir(output,{recursive:true});
const browser=await puppeteer.launch({headless:true,executablePath:process.env.VNUI_BROWSER_PATH || undefined,args:['--allow-file-access-from-files']});
const results=[],errors=[];
function check(ok,label){results.push({ok:Boolean(ok),label});assert.ok(ok,label);}
let page;
try {
 page=await browser.newPage();await page.setViewport({width:1920,height:1080});
 page.on('pageerror',e=>errors.push(e.message));
 page.on('console',m=>{if(m.type()==='error'&&!m.text().startsWith('Failed to load resource:'))errors.push(m.text());});
 page.on('response',r=>{if(r.status()>=400)errors.push(r.url()+': HTTP '+r.status());});
 page.on('requestfailed',r=>{const reason=r.failure()?.errorText;if(reason==='net::ERR_ABORTED'&&/gymnopedie-1\.ogg/.test(r.url()))return;errors.push(r.url()+': '+reason);});
 const url=process.env.VNUI_TEST_URL || 'http://127.0.0.1:4173/app.html';
 await page.goto(url,{waitUntil:'load'});
 await page.evaluate(async()=>Promise.all([...document.images].map(i=>i.decode())));
 check(await page.$eval('#title-screen',e=>!e.hidden),'Title appears on initial load');
 await page.screenshot({path:path.join(output,'01-title.png')});
 await page.click('#title-settings-button');await page.select('#menu-content select','0');await page.click('#close-dialog');
 await page.click('#start-button');
 const state=()=>page.evaluate(()=>AfternoonGame.getState());
 check((await state()).scene==='prologue-000','New Game starts prologue');
 await page.keyboard.press('Space');check((await state()).scene==='prologue-001','Space advances');
 await page.keyboard.press('Enter');check((await state()).scene==='prologue-002','Enter advances');
 await page.click('#vn-stage',{offset:{x:950,y:250}});check((await state()).scene==='prologue-003','Stage click advances');
 await page.click('#title-button');await page.click('#start-button');
 await page.keyboard.down('Control');await new Promise(r=>setTimeout(r,600));await page.keyboard.up('Control');
 check((await state()).scene==='prologue-003','Held Ctrl skips known lines and stops before unread content');
 await page.click('#skip-button');check(!(await state()).skip && (await state()).scene==='prologue-003','Read-skip button never skips unread content');
 await page.click('#auto-button');await page.waitForFunction(()=>AfternoonGame.getState().scene!=='prologue-003',{timeout:6000});
 check((await state()).auto && (await state()).scene!=='prologue-003','Auto advances without keyboard or clicks');
 await page.click('#settings-button');const pausedScene=(await state()).scene;await new Promise(r=>setTimeout(r,2400));
 check((await state()).scene===pausedScene,'Auto pauses while menu is open');await page.click('#close-dialog');await page.click('#auto-button');
 const visited=[],chosen=[],captures=new Set();let steps=0;
 while((await state()).mode==='reading' && steps++<1200) {
   const s=await state();visited.push(s.scene);
   const node=await page.evaluate(()=>VN_PROJECT.scenes[VNPlayer.getState().sceneIndex]);
   if(node.holdMs)await new Promise(r=>setTimeout(r,node.holdMs+60));
   const milestone=node.id==='day1-observe'?'02-program':node.chapter==='afternoon_a'&&node.closeTV?'03-afternoon-a':node.id==='loop2-observe'?'04-repeat':node.chapter==='afternoon_b'&&node.tv==='cartoon'?'05-afternoon-b':node.id==='fear-understanding'?'06-fear':node.id==='home-actions'?'07-home':node.id==='clothes-7'?'08-clothes':null;
   if(milestone&&!captures.has(milestone)) {
     await page.evaluate(async()=>Promise.all([...document.images].map(i=>i.decode())));
     await page.screenshot({path:path.join(output,milestone+'.png')});captures.add(milestone);
   }
   check(!node.fear || ['escape'].includes(node.chapter),'Fear effect occurs only after pet intervention');
   if(node.id==='day1-observe'){
     await page.click('#save-button');await page.click('#menu-content .save-row:first-of-type button');await page.click('#close-dialog');
     check((await state()).scene==='day1-observe','Saving does not advance the story');
   }
   const buttons=await page.$$('#choice-panel button');
   if(buttons.length) {
     const choices=await page.$$eval('#choice-panel button',bs=>bs.map(b=>b.dataset.choice));
     const next=choices.findIndex(c=>!chosen.includes(s.scene+':'+c));
     const pick=next<0?buttons.length-1:next;chosen.push(s.scene+':'+choices[pick]);await buttons[pick].click();
   }else await page.keyboard.press('Space');
 }
 check((await state()).mode==='ending','Full authored graph reaches ending through UI input');
 check(steps<1200,'No branch loop blocks completion');
 check(['afternoon-a-000','loop2-day1-000','afternoon-b-000','fear-understanding','home-bed','clothes-1','clothes-7'].every(id=>visited.includes(id)),'All required milestones visited');
 check((await state()).flags.pet_interaction && (await state()).flags.held_pet,'Pet interaction and intervention flags survive');
 check(await page.evaluate(()=>VNAudio.getState().active===null && !VNAudio.getState().musicPlaying),'Ending stops audio and BGM');
 check(chosen.filter(x=>x.startsWith('home-actions:')).length===4,'Home actions include lock, curtains, wash and sleep');
 await page.screenshot({path:path.join(output,'09-ending.png')});
 await page.click('#ending-title-button');check((await state()).mode==='title','Ending returns to title');
 await page.click('#title-load-button');await page.click('#menu-content .save-row:nth-of-type(2) button');
 check((await state()).scene==='day1-observe','Manual save restores scene');
 await page.click('#title-button');await page.reload({waitUntil:'load'});await page.click('#continue-button');
 check((await state()).scene==='day1-observe','Automatic save survives reload');
 await page.click('#settings-button');await page.select('#menu-content select','38');await page.click('#close-dialog');
 await page.click('#choice-panel button:last-child');
 const typingScene=(await state()).scene;await page.keyboard.press('Space');
 check((await state()).scene===typingScene && !(await state()).typing,'First click finishes typing without skipping');
 await page.keyboard.press('Space');check((await state()).scene!==typingScene,'Second click advances completed line');
 await page.click('#log-button');check(await page.$$eval('.log-entry',es=>es.length>0),'Backlog available');
 const before=(await state()).scene;await page.$eval('#menu-dialog',d=>d.focus());await page.keyboard.press('Space');check((await state()).scene===before && await page.$eval('#menu-dialog',d=>d.open),'Modal pauses advance');await page.keyboard.press('Escape');
 await page.evaluate(()=>localStorage.setItem('afternoon-program-v1:slot-3','{"version":1,"scene":"missing"}'));
 await page.click('#load-button');await page.waitForSelector('#menu-content .save-row:last-child button',{timeout:3000});check(await page.$eval('#menu-content .save-row:last-child button',b=>b.disabled),'Corrupt saves rejected');await page.click('#close-dialog');
 await page.click('#settings-button');await page.select('#menu-content select','0');await page.click('#close-dialog');
 // Authored shocks: actual abrupt image insertion, cleanup, accessibility and
 // navigation cancellation, rather than checking a CSS class alone.
 const shocks=await page.evaluate(()=>VN_PROJECT.scenes.filter(s=>s.scare).map(s=>({id:s.id,kind:s.scare})));
 check(shocks.length===3,'Exactly three authored jumpscares');
 for(const shot of shocks){
   await page.evaluate(id=>VNPlayer.goToScene(id),shot.id);
   await page.waitForSelector('.scare-frame',{timeout:2000});
   check(await page.$eval('.scare-frame',e=>e.complete&&e.naturalWidth>0),'Shock image decodes: '+shot.kind);
   await page.screenshot({path:path.join(output,'shock-'+shot.kind+'.png')});
   await page.waitForFunction(()=>!document.querySelector('.scare-frame')&&!document.getElementById('vn-stage').dataset.scare,{timeout:2500});
 }
 await page.click('#settings-button');
 await page.evaluate(()=>{const l=[...document.querySelectorAll('#menu-content label')].find(l=>l.textContent==='开启突发惊吓');l.querySelector('input').click();});
 await page.click('#close-dialog');await page.evaluate(id=>VNPlayer.goToScene(id),shocks[0].id);await new Promise(r=>setTimeout(r,700));
 check(await page.$eval('#vn-stage',s=>!s.dataset.scare&&!s.querySelector('.scare-frame')),'Jumpscare setting disables visuals and shock transient');
 await page.click('#settings-button');await page.evaluate(()=>[...document.querySelectorAll('#menu-content label')].find(l=>l.textContent==='开启突发惊吓').querySelector('input').click());await page.click('#close-dialog');
 await page.evaluate(id=>VNPlayer.goToScene(id),shocks[0].id);await page.click('#title-button');await new Promise(r=>setTimeout(r,700));
 check(await page.$eval('#vn-stage',s=>!s.dataset.scare&&!s.querySelector('.scare-frame')),'Title navigation cancels delayed jumpscare');
 await page.click('#start-button');
 check(await page.evaluate(()=>VNAudio.getState().musicPlaying),'Public-domain recording BGM starts after input');
 // Inventory every asset and inspect text fit at desktop and narrow landscape.
 const layout=await page.evaluate(async()=> {
   const failures=[];
   for(const scene of VN_PROJECT.scenes){VNPlayer.goToScene(scene.id);const p=document.querySelector('.vn-text');const box=document.querySelector('.vn-dialogue');if(p&&box&&(p.getBoundingClientRect().bottom>box.getBoundingClientRect().bottom-5||p.scrollWidth>p.clientWidth+1))failures.push(scene.id);}
   const sources=[...new Set(VN_PROJECT.scenes.flatMap(s=>[s.background?.src,s.character?.src]).filter(Boolean))];
   for(const src of sources){const i=new Image();i.src=src;try{await i.decode();}catch{failures.push(src);}}
   return failures;
 });check(layout.length===0,'All scene text fits and all scene assets decode: '+layout.join(','));
 await page.setViewport({width:844,height:390});
 await page.evaluate(()=>VNPlayer.goToScene('day1-observe'));await page.screenshot({path:path.join(output,'10-responsive.png')});
 check(await page.$eval('#vn-stage',e=>e.getBoundingClientRect().width<=innerWidth+1 && e.getBoundingClientRect().height<=innerHeight+1),'Stage fits narrow landscape');
 await page.setViewport({width:1920,height:1080});
 await page.goto(pathToFileURL(path.join(root,'app.html')).href,{waitUntil:'load'});
 check(await page.$eval('#title-screen',e=>!e.hidden),'Double-click file startup works without server');
 await page.click('#start-button');check((await state()).mode==='reading','Direct-file New Game works');
 const engineHashes=JSON.parse(await readFile(path.join(root,'docs/engine-sha256.json'),'utf8'));
 for(const name of ['renderer.js','animation.js','interaction.js'])check(createHash('sha256').update(await readFile(path.join(root,'engine',name))).digest('hex')===engineHashes[name],'VNUI '+name+' reused unchanged');
 await page.goto(new URL('./editor/index.html',url).href,{waitUntil:'load'});
 check(await page.$$eval('#scene-select option',es=>es.length===399),'Editor loads every scene');
 await page.select('#scene-select','50');
 await page.click('.layer-row .layer-name');
 await page.evaluate(()=>[...document.querySelectorAll('.layer-row .layer-name')].find(b=>b.textContent==='Dialogue').click());
 const layer=await page.$('.design-dialogue');
 const beforeDrag=await page.$eval('.design-dialogue',e=>e.style.left);
 const box=await layer.boundingBox();await page.mouse.move(box.x+box.width/2,box.y+20);await page.mouse.down();await page.mouse.move(box.x+box.width/2+30,box.y+35,{steps:3});await page.mouse.up();
 check(await page.$eval('.design-dialogue',(e,b)=>e.style.left!==b,beforeDrag),'Editor drag edits geometry');
 const handle=await page.$('.design-dialogue .resize-handle');const hb=await handle.boundingBox();const bw=await page.$eval('.design-dialogue',e=>e.style.width);await page.mouse.move(hb.x+3,hb.y+3);await page.mouse.down();await page.mouse.move(hb.x+23,hb.y+13,{steps:3});await page.mouse.up();check(await page.$eval('.design-dialogue',(e,b)=>e.style.width!==b,bw),'Editor resize works');
 await page.click('#export-button');check(await page.$eval('#export-dialog',d=>d.open),'Editor exports project');await page.screenshot({path:path.join(output,'11-editor.png')});
 check(errors.length===0,'No browser console, script, or network errors: '+errors.join(';'));
 await writeFile(path.join(output,'test-results.json'),JSON.stringify({passed:true,scenes:399,steps,uniqueScenes:new Set(visited).size,choices:chosen,checks:results,errors},null,2));
 console.log(`PASS: ${results.length} assertions, ${steps} UI steps, ${new Set(visited).size} unique scenes, no browser errors`);
}catch(e){if(page){await page.screenshot({path:path.join(output,'failure.png')});await writeFile(path.join(output,'failure-dom.html'),await page.content());}await writeFile(path.join(output,'test-results.json'),JSON.stringify({passed:false,checks:results,errors,error:e.stack},null,2));throw e;}
finally{await browser.close();}

(function () {
  'use strict';
  const project = window.VN_PROJECT;
  const byId = new Map(project.scenes.map(s => [s.id, s]));
  const stage = document.getElementById('vn-stage');
  const $ = id => document.getElementById(id);
  const originalGo = VNPlayer.goToScene;
  const STORE = 'afternoon-program-v1';
  const flagNames = ['seen_photo_x','watched_tv','pet_interaction','noticed_missing_relative','seen_coat','checked_list','held_pet','locked_door','closed_curtains','washed_face'];
  let mode = 'title', current = null, flags = {}, history = [], readyAt = 0, typeTimer = 0, typing = false;
  let storageWarned = false;
  let auto=false,skip=false,ctrl=false,advanceTimer=0;
  let effectTimer=0, scareTimer=0, scareCleanup=0;
  const scareImages={tv:'assets/generated/tv/shock.jpg',impact:'assets/generated/cg/impact-shock.jpg',cloth:'assets/generated/cg/cloth-shock.jpg'};
  for(const src of [...Object.values(scareImages),'assets/generated/tv/cabinet.png']){const im=new Image();im.src=src;}
  const defaultOptions = {speed:38, volume:.55, muted:false, sudden:true, reduced:matchMedia('(prefers-reduced-motion: reduce)').matches};
  let options = {...defaultOptions};
  function read(key) {try {return JSON.parse(localStorage.getItem(STORE + ':' + key));} catch {return null;}}
  function write(key, value) {
    try {localStorage.setItem(STORE + ':' + key, JSON.stringify(value));return true;}
    catch {if (!storageWarned) {toast('浏览器未允许存储：本次仍可完整游玩，存档不可用。');storageWarned = true;} return false;}
  }
  const savedOptions = read('options');
  const savedRead=read('read-scenes');
  const readScenes=new Set((Array.isArray(savedRead)?savedRead:[]).filter(id=>byId.has(id)));
  function rememberRead(){if(current?.id){readScenes.add(current.id);write('read-scenes',[...readScenes]);}}
  function controls(){ $('auto-button').setAttribute('aria-pressed',String(auto));$('skip-button').setAttribute('aria-pressed',String(skip||ctrl)); }
  function stopAdvance(){clearTimeout(advanceTimer);advanceTimer=0;}
  function scheduleAdvance(){
    stopAdvance();controls();
    if(mode!=='reading'||$('menu-dialog').open||current?.choices?.length)return;
    if(skip||ctrl){
      if(!readScenes.has(current.id)){skip=false;controls();return;}
      advanceTimer=setTimeout(()=>{if(typing)completeLine();next();},Math.max(65,readyAt-performance.now()));
    }else if(auto){
      advanceTimer=setTimeout(()=>{if(mode!=='reading'||$('menu-dialog').open)return;if(typing){scheduleAdvance();return;}next();},Math.max(1200,(current.dialogue?.text.length||0)*65,readyAt-performance.now()));
    }
  }
  if (savedOptions && typeof savedOptions === 'object') {
    if ([0,20,38,65].includes(savedOptions.speed)) options.speed = savedOptions.speed;
    if (Number.isFinite(savedOptions.volume)) options.volume = Math.max(0,Math.min(1,savedOptions.volume));
    for (const k of ['muted','reduced','sudden']) if (typeof savedOptions[k] === 'boolean') options[k] = savedOptions[k];
  }
  function applyOptions() {project.settings.typingSpeed = options.speed; stage.classList.toggle('reduce-motion', options.reduced); VNAudio.configure(options); write('options', options);}
  let toastTimer;
  function toast(message) {clearTimeout(toastTimer);$('toast').textContent=message;$('toast').classList.add('show');toastTimer=setTimeout(()=>$('toast').classList.remove('show'),3200);}

  // Reuse VNUI's typing entry point, with a cancellable timer so the first click
  // completes a line and the second advances. No detached-node timers remain.
  VNAnimation.typeInteractive = (element,text,speed) => {
    clearInterval(typeTimer); typing = Boolean(speed && text.length);
    if (!typing) {element.textContent=text;return;}
    element.textContent=''; let index=0;
    typeTimer=setInterval(()=> {
      if (!element.isConnected) {clearInterval(typeTimer);typing=false;return;}
      element.textContent=text.slice(0,++index);
      if (index>=text.length) {clearInterval(typeTimer);typing=false;}
    },speed);
  };
  function completeLine() {clearInterval(typeTimer);typing=false;const p=document.querySelector('.vn-text');if (p && current) p.textContent=current.dialogue?.text || '';}
  function snapshot() {return {version:1, scene:current?.id, flags:{...flags}, history:history.slice(-500), time:new Date().toISOString()};}
  function validSave(save) {
    return save && save.version===1 && byId.has(save.scene) && save.flags && typeof save.flags==='object' && !Array.isArray(save.flags) &&
      Object.entries(save.flags).every(([k,v])=>flagNames.includes(k) && typeof v==='boolean') && Array.isArray(save.history) &&
      save.history.length<=500 && save.history.every(x=>typeof x==='string' && byId.has(x));
  }
  function restore(save) {
    if (!validSave(save)) {toast('这个存档不可读取，未更改当前进度。');return false;}
    flags={...save.flags};history=[...save.history];mode='reading';$('menu-dialog').close();VNAudio.unlock();show(save.scene,false);return true;
  }
  function clearScare(){
    clearTimeout(scareTimer);clearTimeout(scareCleanup);stage.classList.remove('scare-lead','scare-hit');
    stage.querySelectorAll('.scare-frame').forEach(e=>e.remove());delete stage.dataset.scare;
  }
  function scare(kind){
    stage.dataset.scare=kind;stage.classList.add('scare-lead');
    scareTimer=setTimeout(()=>{
      stage.classList.remove('scare-lead');stage.classList.add('scare-hit');
      const im=document.createElement('img');im.className='scare-frame';im.src=scareImages[kind];im.alt='';im.setAttribute('aria-hidden','true');stage.append(im);
      VNAudio.effect('shock-'+kind);
      scareCleanup=setTimeout(clearScare,kind==='cloth'?540:270);
    },kind==='cloth'?520:330);
  }
  function show(id, record=true) {
    const scene=byId.get(id); if (!scene) return false;
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
    current=scene; mode='reading';
    if (scene.set) Object.assign(flags,scene.set);
    let displayed=scene;
    if (scene.variants) {
      const variant=scene.variants.find(v=>Boolean(flags[v.flag])===v.value);
      if (variant) displayed={...scene,dialogue:{...scene.dialogue,text:variant.text}};
    }
    // Renderer reads its project model; use a temporary view for conditional copy.
    const index=project.scenes.findIndex(s=>s.id===id);
    const source=project.scenes[index];project.scenes[index]=displayed;
    originalGo(id);project.scenes[index]=source;current=displayed;
    clearScare();
    readyAt=performance.now()+Math.max(scene.holdMs||0,scene.scare?1150:0);
    if (record && history.at(-1)!==id) history.push(id);
    history=history.slice(-500);
    $('title-screen').hidden=true;$('ending-screen').hidden=true;
    for (const id of ['toolbar','reading-header','reading-hint']) $(id).hidden=false;
    $('location-label').textContent=scene.location ?? '亲戚家';$('clock-label').textContent=scene.clock ?? '下午 2:32';
    $('reading-header').hidden=!(scene.location||scene.clock);
    stage.classList.toggle('fear',Boolean(scene.fear));stage.classList.toggle('pressure',Boolean(scene.pressure));
    stage.dataset.bg=scene.closeTV?'tv-close':'';
    if(scene.closeTV) $('vn-scene').querySelector('.vn-background').src='assets/generated/bg/tv-close.svg';
    decorate(scene);
    clearTimeout(effectTimer);stage.classList.remove('impact','cloth-fall','signal-loss');
    const previousEffect=$('vn-scene').querySelector('.shot-effect');if(previousEffect)previousEffect.remove();
    if(scene.effect&&!options.reduced){
      void stage.offsetWidth;stage.classList.add(scene.effect==='cloth'?'cloth-fall':scene.effect==='signal'?'signal-loss':'impact');
      if(scene.effect==='signal'){
        const flash=document.createElement('div');flash.className='shot-effect signal-frame';flash.setAttribute('aria-hidden','true');$('vn-scene').append(flash);
        effectTimer=setTimeout(()=>flash.remove(),380);
      }
    }
    VNAudio.ambience(scene.audio || 'quiet');
    if (record && scene.sfx) VNAudio.effect(scene.sfx);
    if(record&&scene.scare&&options.sudden&&!options.reduced)scare(scene.scare);
    renderChoices();
    write('auto',snapshot());
    scheduleAdvance();
    return true;
  }
  function decorate(scene) {
    if (!scene.tv) return;
    const frame=document.createElement('div');frame.className='tv-frame '+scene.tv;
    const cabinet=document.createElement('img');cabinet.className='tv-cabinet';cabinet.src='assets/generated/tv/cabinet.png';cabinet.alt='';
    const img=document.createElement('img');img.className='tv-picture';img.src=`assets/generated/tv/${scene.tv}.svg`;
    img.alt=scene.tv==='cartoon'?'电视里两个手绘老人，一左一右，直视镜头':'家庭录像里的两个亲戚，一左一右';
    const noise=document.createElement('div');noise.className='tv-noise';noise.setAttribute('aria-hidden','true');
    const glass=document.createElement('div');glass.className='tv-glass';glass.append(img,noise);
    const shine=document.createElement('div');shine.className='tv-glare';glass.append(shine);
    const label=document.createElement('span');label.className='tv-label';label.textContent='VIDEO · CH 01';
    frame.append(cabinet,glass,label);$('vn-scene').append(frame);
  }
  function renderChoices() {
    const panel=$('choice-panel');panel.replaceChildren();
    const choices=(current.choices||[]).filter(c=>!c.hideIf||!flags[c.hideIf]);
    panel.hidden=!choices.length;
    choices.forEach((choice,i)=> {
      const button=document.createElement('button');button.dataset.choice=choice.key || String(i);
      const number=document.createElement('span');number.className='choice-number';number.textContent=String(i+1).padStart(2,'0');
      button.append(number,document.createTextNode(choice.label));
      button.onclick=()=> {if (mode!=='reading'||$('menu-dialog').open||performance.now()<readyAt) return;completeLine();rememberRead();if (choice.set) Object.assign(flags,choice.set);VNAudio.unlock();show(choice.to);};
      panel.append(button);
    });
  }
  function next() {
    if (mode!=='reading'||$('menu-dialog').open||performance.now()<readyAt) return;
    VNAudio.unlock();
    if (typing) {completeLine();return;}
    if (current.choices?.length) return;
    rememberRead();
    if (current.end) {finish();return;}
    const index=project.scenes.findIndex(s=>s.id===current.id);
    show(current.next || project.scenes[index+1]?.id);
  }
  VNPlayer.next=next;
  // Direct scene selection remains available to the editor/diagnostics. Gameplay
  // always enters through the authored graph, rather than the linear timeline.
  VNPlayer.goToScene=id=>show(id);
  function start() {flags={};history=[];mode='reading';VNAudio.unlock();show(project.scenes[0].id);}
  function title() {
    clearScare();clearTimeout(effectTimer);stage.classList.remove('impact','cloth-fall','signal-loss');
    auto=false;skip=false;ctrl=false;stopAdvance();controls();
    completeLine();mode='title';current=null;stage.classList.remove('fear','pressure');stage.dataset.bg='';
    $('choice-panel').hidden=true;$('ending-screen').hidden=true;$('title-screen').hidden=false;
    for (const id of ['toolbar','reading-header','reading-hint']) $(id).hidden=true;
    $('vn-scene').replaceChildren();const image=document.createElement('img');image.className='vn-layer vn-background';image.src='assets/generated/bg/living.svg';image.alt='午后的老住宅客厅';$('vn-scene').append(image);
    $('vn-scene').style.transform='none';VNAudio.stop();document.title='下午的节目';$('continue-button').disabled=!validSave(read('auto'));
  }
  function finish() {
    clearScare();
    auto=false;skip=false;ctrl=false;stopAdvance();controls();
    completeLine();mode='ending';$('choice-panel').hidden=true;$('ending-screen').hidden=false;
    for (const id of ['toolbar','reading-header','reading-hint']) $(id).hidden=true;
    VNAudio.stop();stage.classList.remove('fear','pressure');write('completed',true);
    $('ending-detail').textContent='';
    window.dispatchEvent(new Event('vn:ended'));
  }
  function openMenu(heading) {
    clearScare();
    stopAdvance();
    $('menu-heading').textContent=heading;$('menu-content').replaceChildren();$('menu-dialog').showModal();return $('menu-content');
  }
  function button(label,fn) {const b=document.createElement('button');b.textContent=label;b.onclick=fn;return b;}
  function saveMenu(load=false) {
    const content=openMenu(load?'读取存档':'保存进度');
    const note=document.createElement('p');note.className='menu-note';note.textContent='存档保存在当前浏览器。自动存档在每段对白后更新；手动存档有三个槽位。';content.append(note);
    const slots=load?['auto','slot-1','slot-2','slot-3']:['slot-1','slot-2','slot-3'];
    for (const slot of slots) {
      const row=document.createElement('div');row.className='save-row';
      const save=read(slot), valid=validSave(save), label=slot==='auto'?'自动存档':`存档 ${slot.slice(-1)}`;
      const info=document.createElement('p');
      info.textContent=valid?`${byId.get(save.scene).location || '亲戚家'} · ${new Date(save.time).toLocaleString('zh-CN')}`:save?'存档已损坏':'空槽位';
      const b=button(load?`读取 ${label}`:`保存至 ${label}`,()=> {
        if (load) {restore(read(slot));return;}
        if (write(slot,snapshot())) {toast('进度已保存');saveMenu(false);}
      });b.disabled=load?!valid:mode!=='reading';row.append(b,info);content.append(row);
    }
  }
  function settings() {
    const content=openMenu('阅读设置');
    const speedLabel=document.createElement('label');speedLabel.append('文字速度');const speed=document.createElement('select');
    [[65,'慢'],[38,'标准'],[20,'快'],[0,'即时显示']].forEach(([value,label])=>{const o=document.createElement('option');o.value=value;o.textContent=label;speed.append(o);});
    speed.value=options.speed;speed.onchange=()=>{options.speed=Number(speed.value);applyOptions();completeLine();};speedLabel.append(speed);content.append(speedLabel);
    const volumeLabel=document.createElement('label');volumeLabel.append('环境音量');const volume=document.createElement('input');volume.type='range';volume.min=0;volume.max=1;volume.step=.05;volume.value=options.volume;volume.setAttribute('aria-label','环境音量');volume.oninput=()=>{options.volume=Number(volume.value);applyOptions();VNAudio.unlock();};volumeLabel.append(volume);content.append(volumeLabel);
    for (const [key,label] of [['muted','关闭声音'],['reduced','减少动态效果'],['sudden','开启突发惊吓']]) {
      const l=document.createElement('label');l.append(label);const input=document.createElement('input');input.type='checkbox';input.checked=options[key];input.onchange=()=>{options[key]=input.checked;applyOptions();VNAudio.unlock();};l.append(input);content.append(l);
    }
    const note=document.createElement('p');note.className='menu-note';note.textContent='点击、Space 或 Enter 推进。第一次操作补全文字。按住 Ctrl 或点击已读快进只跳过读过的段落，遇到新内容和选项会停下。Auto 自动阅读，菜单和选项会暂停。减少动态效果也会关闭突发惊吓的画面和音效。';content.append(note);
  }
  function log() {
    const content=openMenu('对白回看');
    for (const id of history) {
      const scene=byId.get(id);if (!scene.dialogue?.text) continue;
      const entry=document.createElement('div');entry.className='log-entry';const name=document.createElement('strong');name.textContent=scene.dialogue.name || '旁白';
      entry.append(name,document.createTextNode(scene.dialogue.text));content.append(entry);
    }
    requestAnimationFrame(()=>$('menu-dialog').scrollTop=$('menu-dialog').scrollHeight);
  }
  $('start-button').onclick=start;$('continue-button').onclick=()=>restore(read('auto'));
  $('title-load-button').onclick=()=>saveMenu(true);$('title-settings-button').onclick=settings;
  $('credits-button').onclick=()=>{
    const content=openMenu('素材与音乐');
    for(const item of project.meta.credits||[]){
      const p=document.createElement('p');p.className='menu-note';
      const a=document.createElement('a');a.href=item.source;a.textContent=item.title.replace(/^File:/,'');a.target='_blank';a.rel='noopener';
      p.append(a,document.createElement('br'),document.createTextNode(`${item.author} · ${item.license}`));content.append(p);
    }
    const note=document.createElement('p');note.className='menu-note';note.textContent='照片经过裁切、调色和游戏合成；真实地点和人物与虚构故事无关。各项授权及改编范围见 assets/ASSETS.md。';content.append(note);
  };
  $('save-button').onclick=()=>saveMenu(false);$('load-button').onclick=()=>saveMenu(true);
  $('settings-button').onclick=settings;$('log-button').onclick=log;
  $('auto-button').onclick=()=>{auto=!auto;skip=false;$('auto-button').blur();scheduleAdvance();};
  $('skip-button').onclick=()=>{skip=!skip;auto=false;$('skip-button').blur();if(skip&&!readScenes.has(current.id))toast('这里还没有读过。快进会停在新内容前。');scheduleAdvance();};
  $('title-button').onclick=()=>{$('menu-dialog').close();title();};$('ending-title-button').onclick=title;
  $('close-dialog').onclick=()=>$('menu-dialog').close();
  $('menu-dialog').addEventListener('close',()=>{if(!$('menu-dialog').open){if(document.activeElement instanceof HTMLElement)document.activeElement.blur();scheduleAdvance();}});
  $('menu-dialog').addEventListener('click',e=>{if (e.target===$('menu-dialog')) {const r=e.target.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)e.target.close();}});
  addEventListener('keydown',event=> {
    if(event.code==='ControlLeft'||event.code==='ControlRight'){if(mode==='reading'&&!event.repeat&&!$('menu-dialog').open){ctrl=true;auto=false;scheduleAdvance();}return;}
    if (event.code==='Escape') {event.preventDefault();event.stopImmediatePropagation();if ($('menu-dialog').open) $('menu-dialog').close();else settings();}
    else if (event.target.closest('button,dialog')) event.stopImmediatePropagation();
  },true);
  addEventListener('keyup',e=>{if(e.code==='ControlLeft'||e.code==='ControlRight'){ctrl=false;scheduleAdvance();}});
  addEventListener('blur',()=>{ctrl=false;skip=false;stopAdvance();controls();});
  addEventListener('focus',scheduleAdvance);
  window.AfternoonGame={getState:()=>({mode,scene:current?.id,flags:{...flags},typing,history:[...history],options:{...options},auto,skip,ctrl,readScenes:[...readScenes]})};
  applyOptions();title();
})();

(function(){
  'use strict';
  let active=null,unlocked=false,volume=.55,muted=false;
  const ambient=new Audio();ambient.loop=true;ambient.preload='auto';
  const effects=new Set();
  const prepared=new Map(),preparing=new Map();let context=null;
  function audioContext(){return context||(context=new (window.AudioContext||window.webkitAudioContext)());}
  async function prepareEffect(name){
    if(prepared.has(name))return;
    if(preparing.has(name))return preparing.get(name);
    const task=(async()=>{
      const src=`assets/generated/sfx/${name}.wav`;
      if(location.protocol==='file:'||!(window.AudioContext||window.webkitAudioContext)){
        const a=new Audio();a.preload='auto';
        await new Promise((resolve,reject)=>{
          const timer=setTimeout(()=>{a.pause();a.removeAttribute('src');a.load();reject(new Error('Sound timeout'));},25000);
          const finish=fn=>{clearTimeout(timer);a.oncanplaythrough=a.onerror=null;fn();};
          a.oncanplaythrough=()=>finish(resolve);a.onerror=()=>finish(()=>reject(new Error('Sound unavailable')));
          a.src=src;a.load();
        });prepared.set(name,{audio:a});
      }else{
        const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),25000);
        try{
          const response=await fetch(src,{signal:controller.signal});if(!response.ok)throw new Error('Sound HTTP '+response.status);
          const buffer=await audioContext().decodeAudioData(await response.arrayBuffer());
          if(!buffer.length)throw new Error('Empty sound');prepared.set(name,{buffer});
        }finally{clearTimeout(timer);}
      }
    })();preparing.set(name,task);
    try{await task;}finally{preparing.delete(name);}
  }
  const music=new Audio('assets/source/music/gymnopedie-1.ogg');music.loop=true;music.preload='metadata';
  let musicLevel=0,targetMusic=0,fadeTimer=0;
  function fadeMusic(value){targetMusic=value;clearInterval(fadeTimer);if(value>0&&unlocked&&!muted)attempt(music);fadeTimer=setInterval(()=>{musicLevel+=(targetMusic-musicLevel)*.12;music.volume=muted?0:volume*musicLevel;if(Math.abs(musicLevel-targetMusic)<.002){musicLevel=targetMusic;clearInterval(fadeTimer);if(!targetMusic)music.pause();}},80);}
  const levels={house:.32,program:.25,kitchen:.35,night:.22,quiet:.10,fear:.26,home:.18,pressure:.28};
  function attempt(audio){const p=audio.play();if(p)p.catch(()=>{});}
  function configure(options){volume=options.volume;muted=options.muted;ambient.volume=muted?0:volume*(levels[active]||.2);music.volume=muted?0:volume*musicLevel;for(const a of effects){if(a.gain)a.gain.gain.value=muted?0:volume*.6;else a.volume=muted?0:volume*.6;}}
  function unlock(){unlocked=true;if(context?.state==='suspended')context.resume().catch(()=>{});if(active&&active!=='silence'&&!muted)attempt(ambient);if(targetMusic>0&&!muted)attempt(music);}
  function ambience(name){if(name===active)return;ambient.pause();active=name;fadeMusic(['house','kitchen','program'].includes(name)?.15:0);if(name==='silence'){ambient.removeAttribute('src');ambient.load();return;}ambient.src=`assets/generated/sfx/ambient-${name}.wav`;ambient.volume=muted?0:volume*(levels[name]||.2);if(unlocked&&!muted)attempt(ambient);}
  function effect(name){
    if(!unlocked||muted)return;const cached=prepared.get(name);
    if(cached?.buffer&&context?.state==='running'){
      const source=context.createBufferSource(),gain=context.createGain();source.buffer=cached.buffer;gain.gain.value=volume*.6;source.connect(gain);gain.connect(context.destination);
      const entry={source,gain};effects.add(entry);source.onended=()=>{effects.delete(entry);source.disconnect();gain.disconnect();};source.start();return;
    }
    const a=cached?.audio||new Audio(`assets/generated/sfx/${name}.wav`);if(cached?.audio)a.currentTime=0;
    a.volume=volume*.6;effects.add(a);const cleanup=()=>effects.delete(a);a.onended=cleanup;a.onerror=cleanup;attempt(a);
  }
  function stop(){active=null;ambient.pause();music.pause();clearInterval(fadeTimer);musicLevel=0;targetMusic=0;for(const a of effects){if(a.source)a.source.stop();else a.pause();}effects.clear();}
  window.VNAudio={configure,unlock,ambience,effect,stop,prepareEffect,getState:()=>({active,unlocked,muted,volume,playing:!ambient.paused,musicPlaying:!music.paused,musicLevel,effects:effects.size,preparedEffects:[...prepared.keys()],contextState:context?.state})};
})();

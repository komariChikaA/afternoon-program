(function(){
  'use strict';
  let active=null,unlocked=false,volume=.55,muted=false;
  const ambient=new Audio();ambient.loop=true;ambient.preload='auto';
  const effects=new Set();
  const music=new Audio('assets/source/music/gymnopedie-1.ogg');music.loop=true;music.preload='metadata';
  let musicLevel=0,targetMusic=0,fadeTimer=0;
  function fadeMusic(value){targetMusic=value;clearInterval(fadeTimer);if(value>0&&unlocked&&!muted)attempt(music);fadeTimer=setInterval(()=>{musicLevel+=(targetMusic-musicLevel)*.12;music.volume=muted?0:volume*musicLevel;if(Math.abs(musicLevel-targetMusic)<.002){musicLevel=targetMusic;clearInterval(fadeTimer);if(!targetMusic)music.pause();}},80);}
  const levels={house:.32,program:.25,kitchen:.35,night:.22,quiet:.10,fear:.26,home:.18,pressure:.28};
  function attempt(audio){const p=audio.play();if(p)p.catch(()=>{});}
  function configure(options){volume=options.volume;muted=options.muted;ambient.volume=muted?0:volume*(levels[active]||.2);music.volume=muted?0:volume*musicLevel;for(const a of effects)a.volume=muted?0:volume*.6;}
  function unlock(){unlocked=true;if(active&&active!=='silence'&&!muted)attempt(ambient);if(targetMusic>0&&!muted)attempt(music);}
  function ambience(name){if(name===active)return;ambient.pause();active=name;fadeMusic(['house','kitchen','program'].includes(name)?.15:0);if(name==='silence'){ambient.removeAttribute('src');ambient.load();return;}ambient.src=`assets/generated/sfx/ambient-${name}.wav`;ambient.volume=muted?0:volume*(levels[name]||.2);if(unlocked&&!muted)attempt(ambient);}
  function effect(name){if(!unlocked||muted)return;const a=new Audio(`assets/generated/sfx/${name}.wav`);a.volume=volume*.6;effects.add(a);const cleanup=()=>effects.delete(a);a.onended=cleanup;a.onerror=cleanup;attempt(a);}
  function stop(){active=null;ambient.pause();music.pause();clearInterval(fadeTimer);musicLevel=0;targetMusic=0;for(const a of effects)a.pause();effects.clear();}
  window.VNAudio={configure,unlock,ambience,effect,stop,getState:()=>({active,unlocked,muted,volume,playing:!ambient.paused,musicPlaying:!music.paused,musicLevel,effects:effects.size})};
})();

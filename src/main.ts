import Phaser from 'phaser';
import './styles/base.css';
import './styles/hud-immersive.css';
import './styles/characters.css';
import {createState,Store} from './core/GameState';
import {CombatEngine} from './core/CombatEngine';
import {resume} from './core/AFKManager';
import {LocalSaveRepository} from './services/Storage';
import {SoundFX} from './services/SoundFX';
import {CatacombScene} from './game/scenes/CatacombScene';
import {UIManager} from './ui/UIManager';

function fatal(message:string){const app=document.querySelector('#app')!;app.innerHTML='<div class="fatal"><h1>The journey is paused.</h1><p></p><button onclick="location.reload()">Try again</button></div>';app.querySelector('p')!.textContent=message;}
async function boot(){
 const repository=new LocalSaveRepository();let state;
 try{state=repository.load()||createState(Date.now(),crypto.getRandomValues(new Uint32Array(1))[0]);resume(state,Date.now());repository.save(state);}catch(e){fatal((e as Error).message);return;}
 const store=new Store(new CombatEngine(state));const sfx=new SoundFX();
 store.subscribe((_s,events)=>{for(const e of events){sfx.init();if(e.type==='hit')e.critical?sfx.playCrit():sfx.playHit();if(e.type==='skill')sfx.playCrit();}});
 let last=performance.now(),lastSave=last;let saveFailed=false;
 const save=()=>{try{state.savedAt=state.now;repository.save(state);if(saveFailed)document.querySelector('#save-status-hud')!.textContent='◇ Saved on this device';saveFailed=false;}catch{if(!saveFailed)ui.toast('Storage is full or unavailable. Keep this tab open to preserve progress.');saveFailed=true;document.querySelector('#save-status-hud')!.textContent='⚠ Progress could not be saved';}};
 const ui=new UIManager(store,save);
 const game=new Phaser.Game({type:Phaser.AUTO,parent:'game',width:window.innerWidth,height:window.innerHeight,backgroundColor:'#080b14',pixelArt:true,antialias:false,scale:{mode:Phaser.Scale.RESIZE,autoCenter:Phaser.Scale.CENTER_BOTH},scene:[new CatacombScene(store)],audio:{noAudio:true},fps:{target:60}});
 const timer=window.setInterval(()=>{if(document.hidden)return;const now=performance.now(),elapsed=now-last;last=now;if(elapsed>5000){resume(state,Date.now());store.notify();save();if(elapsed>=60000&&state.afk.seconds>=60)ui.open('afk');}else store.tick(elapsed);if(now-lastSave>=5000){save();lastSave=now;}},100);
 document.addEventListener('visibilitychange',()=>{if(document.hidden){save();}else{const away=Date.now()-state.savedAt;resume(state,Date.now());last=performance.now();store.notify();save();if(away>=60000&&state.afk.seconds>=60)ui.open('afk');}});
 window.addEventListener('pagehide',()=>{save();});
 if(import.meta.hot)import.meta.hot.dispose(()=>{clearInterval(timer);game.destroy(true);});
 // Keep the exclusive browser lock alive until this document unloads.
 await new Promise<void>(()=>{});
}
if(navigator.locks){void navigator.locks.request('embermarch-authority',{ifAvailable:true},async lock=>{if(!lock){fatal('Your adventure is already running in another tab. Close that tab and try again to protect your save.');return;}await boot();});}else fatal('This browser does not support the save lock required by this game. Use a modern browser on localhost or HTTPS.');

import {effect,signal} from '@preact/signals';
import {readStored} from '../../services/legacyStorage';

// Per-device UI preferences. Browser storage may be blocked (private mode), so every access is guarded and defaults always work.
const KEY='thailnw.ui.v1';
export const UI_SCALE_MIN=.9,UI_SCALE_MAX=1.25;
export type DamageNumbers='all'|'important'|'off';
type Prefs={scale:number;muted:boolean;trackerOpen:boolean;chatOpen:boolean;damageNumbers:DamageNumbers;shake:boolean};
function load():Prefs{
 // On phones the tracker and chat start collapsed so they don't cover the fight; an explicit choice always wins.
 const phone=typeof matchMedia==='function'&&matchMedia('(max-width:760px)').matches;
 const defaults:Prefs={scale:1,muted:false,trackerOpen:!phone,chatOpen:!phone,damageNumbers:'all',shake:true};
 try{const raw=JSON.parse(readStored(KEY)??'{}') as Partial<Prefs>;const scale=Number(raw.scale);
  return {scale:Number.isFinite(scale)?Math.min(UI_SCALE_MAX,Math.max(UI_SCALE_MIN,scale)):1,muted:raw.muted===true,
   trackerOpen:typeof raw.trackerOpen==='boolean'?raw.trackerOpen:defaults.trackerOpen,chatOpen:typeof raw.chatOpen==='boolean'?raw.chatOpen:defaults.chatOpen,
   damageNumbers:raw.damageNumbers==='important'||raw.damageNumbers==='off'?raw.damageNumbers:'all',shake:raw.shake!==false};
 }catch{return defaults;}
}
export const prefs=signal<Prefs>(load());
export function setPref<K extends keyof Prefs>(key:K,value:Prefs[K]){
 const next={...prefs.value,[key]:value};
 // Phones lack the height for both panels open at once (plus the target bar), so opening one folds the other.
 const phone=typeof matchMedia==='function'&&matchMedia('(max-width:760px)').matches;
 if(phone&&value===true){if(key==='chatOpen')next.trackerOpen=false;if(key==='trackerOpen')next.chatOpen=false;}
 prefs.value=next;
}
effect(()=>{
 const p=prefs.value;if(typeof document==='undefined')return;document.documentElement.style.setProperty('--tf-ui-scale',String(p.scale));
 try{localStorage.setItem(KEY,JSON.stringify(p));}catch{/* preferences simply won't persist */}
});

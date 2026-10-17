import {effect,signal} from '@preact/signals';

// Per-device UI preferences. Browser storage may be blocked (private mode), so every access is guarded and defaults always work.
const KEY='embermarch.ui.v1';
export const UI_SCALE_MIN=.9,UI_SCALE_MAX=1.25;
type Prefs={scale:number;muted:boolean;trackerOpen:boolean};
const DEFAULTS:Prefs={scale:1,muted:false,trackerOpen:true};
function load():Prefs{
 try{const raw=JSON.parse(localStorage.getItem(KEY)??'{}') as Partial<Prefs>;
  // On phones the tracker starts collapsed so it doesn't cover the fight; an explicit choice always wins.
  const phone=typeof matchMedia==='function'&&matchMedia('(max-width:760px)').matches;
  const scale=Number(raw.scale);return {scale:Number.isFinite(scale)?Math.min(UI_SCALE_MAX,Math.max(UI_SCALE_MIN,scale)):1,muted:raw.muted===true,trackerOpen:typeof raw.trackerOpen==='boolean'?raw.trackerOpen:!phone};
 }catch{return {...DEFAULTS};}
}
export const prefs=signal<Prefs>(load());
export function setPref<K extends keyof Prefs>(key:K,value:Prefs[K]){prefs.value={...prefs.value,[key]:value};}
effect(()=>{
 const p=prefs.value;if(typeof document==='undefined')return;document.documentElement.style.setProperty('--tf-ui-scale',String(p.scale));
 try{localStorage.setItem(KEY,JSON.stringify(p));}catch{/* preferences simply won't persist */}
});

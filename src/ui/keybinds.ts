import {effect,signal} from '@preact/signals';

// Remappable keyboard shortcuts (UI_UX_PLAN 2.5). One table drives the hotbar, targeting and window hotkeys.
export const ACTIONS=[
 {id:'skill:0',group:'สกิล',label:'สกิลช่อง 1'},{id:'skill:1',group:'สกิล',label:'สกิลช่อง 2'},{id:'skill:2',group:'สกิล',label:'สกิลช่อง 3'},
 {id:'skill:3',group:'สกิล',label:'สกิลช่อง 4'},{id:'skill:4',group:'สกิล',label:'สกิลช่อง 5'},{id:'skill:5',group:'สกิล',label:'สกิลพิเศษ (R)'},
 {id:'target:next',group:'เป้าหมาย',label:'เลือกเป้าหมายถัดไป'},{id:'target:clear',group:'เป้าหมาย',label:'กลับไปเลือกอัตโนมัติ'},
 {id:'panel:inventory',group:'หน้าต่าง',label:'กระเป๋า'},{id:'panel:stats',group:'หน้าต่าง',label:'ตัวละคร'},{id:'panel:pet',group:'หน้าต่าง',label:'สัตว์เลี้ยง'},
 {id:'panel:shop',group:'หน้าต่าง',label:'ร้านค้า'},{id:'panel:travel',group:'หน้าต่าง',label:'แผนที่โลก'},{id:'panel:quests',group:'หน้าต่าง',label:'ภารกิจ'},
] as const;
export type Action=typeof ACTIONS[number]['id'];
export const DEFAULT_KEYS:Record<Action,string>={'skill:0':'1','skill:1':'2','skill:2':'3','skill:3':'4','skill:4':'5','skill:5':'R','target:next':'T','target:clear':'X',
 'panel:inventory':'I','panel:stats':'C','panel:pet':'P','panel:shop':'B','panel:travel':'M','panel:quests':'Q'};
/** Keys that keep their browser/dialog meaning and can't be bound. */
const RESERVED=new Set(['Escape','Enter','Shift','Control','Alt','Meta','AltGraph','CapsLock','NumLock','ScrollLock','Dead','Unidentified','Process','ContextMenu','OS']);

/** Canonical name for a key press ("2", "R", "Tab", "Space", "F2"), or null if it can't be bound. */
export function normalizeKey(key:string):string|null{
 if(!key||RESERVED.has(key))return null;if(key===' ')return 'Space';
 return key.length===1?key.toUpperCase():key;
}
const STORE='embermarch.keys.v1';
function load():Record<Action,string>{
 const keys={...DEFAULT_KEYS};
 try{const raw=JSON.parse(localStorage.getItem(STORE)??'{}') as Record<string,unknown>;const used=new Set<string>();
  for(const a of ACTIONS){const k=typeof raw[a.id]==='string'?normalizeKey(raw[a.id] as string):null;if(k&&!used.has(k)){keys[a.id]=k;}used.add(keys[a.id]);}
  // A corrupted file could leave duplicates; fall back to defaults rather than guess.
  if(new Set(Object.values(keys)).size!==ACTIONS.length)return {...DEFAULT_KEYS};
 }catch{/* defaults */}
 return keys;
}
export const keybinds=signal<Record<Action,string>>(load());
/** True while the remap window is waiting for a key; global shortcuts must stand down. */
export const capturing=signal(false);
export function actionFor(key:string):Action|undefined{return ACTIONS.find(a=>keybinds.value[a.id]===key)?.id;}
/** Binds a key; if another action already used it, the two swap. Returns the swapped action, if any. */
export function bindKey(action:Action,key:string):Action|undefined{
 const k=normalizeKey(key);if(!k)throw new Error('This key cannot be assigned.');
 const current={...keybinds.value},other=ACTIONS.find(a=>a.id!==action&&current[a.id]===k)?.id;
 if(other)current[other]=current[action];current[action]=k;keybinds.value=current;return other;
}
export function resetKeys(){keybinds.value={...DEFAULT_KEYS};}
/** Typing into a field must never trigger game shortcuts. */
export function isTyping(target:EventTarget|null){const el=target as HTMLElement|null;return !!el&&(el.isContentEditable||!!el.matches?.('input,select,textarea'));}
// Persist only the player's overrides, so future changes to the defaults still reach everyone else.
effect(()=>{
 const v=keybinds.value,overrides=Object.fromEntries(ACTIONS.filter(a=>v[a.id]!==DEFAULT_KEYS[a.id]).map(a=>[a.id,v[a.id]]));
 try{if(Object.keys(overrides).length)localStorage.setItem(STORE,JSON.stringify(overrides));else localStorage.removeItem(STORE);}catch{/* won't persist */}
});

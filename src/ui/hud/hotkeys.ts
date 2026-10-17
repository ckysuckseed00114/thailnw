import type {Store} from '../../core/GameState';
import type {Command} from '../../core/models';
import {skillsFor} from '../../core/Skills';
import {nextTarget} from '../../core/Targeting';
import {actionFor,capturing,isTyping,normalizeKey} from '../keybinds';

export interface HudHost{open(panel:string):void;toggle(panel:string):void;toast(text:string):void}
/** The single global keyboard dispatcher: looks the key up in the remappable table and runs the action. */
export function installHotkeys(store:Store,host:HudHost){
 const send=(c:Command)=>{try{store.dispatch(c);}catch(err){host.toast((err as Error).message);}};
 const onKey=(e:KeyboardEvent)=>{
  if(capturing.value||e.repeat||e.ctrlKey||e.metaKey||e.altKey||isTyping(e.target))return;
  const key=normalizeKey(e.key),action=key?actionFor(key):undefined;if(!action)return;
  // Window hotkeys also close their own window; everything else waits until windows are closed.
  if(action.startsWith('panel:')){e.preventDefault();host.toggle(action.slice(6));return;}
  if(document.querySelector('dialog[open]'))return;
  e.preventDefault();const s=store.state;
  if(action.startsWith('skill:')){const k=skillsFor(s)[Number(action.slice(6))];if(k)send({type:'cast',id:k.id});}
  else if(action==='target:next'){const id=nextTarget(s);if(id)send({type:'target',id});}
  else if(action==='target:clear')send({type:'target',id:0});
 };
 document.addEventListener('keydown',onKey);return ()=>document.removeEventListener('keydown',onKey);
}

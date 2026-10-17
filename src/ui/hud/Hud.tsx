import {render} from 'preact';
import type {Store} from '../../core/GameState';
import type {SoundFX} from '../../services/SoundFX';
import {bindStore} from './gameSignal';
import {prefs} from './prefs';
import {PlayerFrame} from './PlayerFrame';
import {Minimap} from './Minimap';
import {Purse,TopBar} from './TopBar';
import {QuestTracker} from './QuestTracker';
import {Hotbar} from './Hotbar';
import {ChatBox} from './ChatBox';
import './hud.css';

/** Mounts the Preact HUD above the game; returns an unmount function for HMR. */
export function mountHud(store:Store,openPanel:(id:string)=>void,sfx:SoundFX,toast:(text:string)=>void){
 const root=document.createElement('div');root.id='hud-root';root.className='hud-root';document.querySelector('.shell')!.append(root);
 document.documentElement.classList.add('hud-v2');
 sfx.enabled=!prefs.value.muted;
 const unbind=bindStore(store);
 // Top items are grid items placed per breakpoint (UI_UX_PLAN 1.6); the hotbar and chat are anchored to the bottom edge.
 render(<>
  <PlayerFrame/>
  <TopBar sfx={sfx}/>
  <Purse/>
  <Minimap onOpenMap={()=>openPanel('travel')}/>
  <QuestTracker onOpenJournal={()=>openPanel('quests')}/>
  <Hotbar toast={toast}/>
  <ChatBox/>
 </>,root);
 return ()=>{render(null,root);unbind();root.remove();document.documentElement.classList.remove('hud-v2');};
}

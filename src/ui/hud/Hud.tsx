import {render} from 'preact';
import type {Store} from '../../core/GameState';
import type {SoundFX} from '../../services/SoundFX';
import {bindStore} from './gameSignal';
import {installHotkeys,type HudHost} from './hotkeys';
import {prefs} from './prefs';
import {PlayerFrame} from './PlayerFrame';
import {Minimap} from './Minimap';
import {Purse,TopBar} from './TopBar';
import {QuestTracker} from './QuestTracker';
import {Hotbar} from './Hotbar';
import {ChatBox} from './ChatBox';
import {BossBar,TargetFrame} from './Targets';
import {KeybindsDialog} from './KeybindsDialog';
import './hud.css';

/** Mounts the Preact HUD above the game; returns an unmount function for HMR. */
export function mountHud(store:Store,host:HudHost,sfx:SoundFX){
 const root=document.createElement('div');root.id='hud-root';root.className='hud-root';document.querySelector('.shell')!.append(root);
 document.documentElement.classList.add('hud-v2');
 sfx.enabled=!prefs.value.muted;
 const unbind=bindStore(store),unkeys=installHotkeys(store,host);
 // Top items are grid items placed per breakpoint (UI_UX_PLAN 1.6); target/boss bars, hotbar and chat are anchored.
 render(<>
  <PlayerFrame/>
  <TopBar sfx={sfx}/>
  <Purse/>
  <Minimap onOpenMap={()=>host.open('travel')}/>
  <QuestTracker onOpenJournal={()=>host.open('quests')}/>
  <TargetFrame toast={host.toast}/>
  <BossBar/>
  <Hotbar toast={host.toast}/>
  <ChatBox/>
  <KeybindsDialog/>
 </>,root);
 return ()=>{render(null,root);unbind();unkeys();root.remove();document.documentElement.classList.remove('hud-v2');};
}

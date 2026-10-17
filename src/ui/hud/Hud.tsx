import {render} from 'preact';
import type {Store} from '../../core/GameState';
import {bindStore} from './gameSignal';
import {PlayerFrame} from './PlayerFrame';
import {Minimap} from './Minimap';
import './hud.css';

/** Mounts the Preact HUD layer above the game; returns an unmount function for HMR. */
export function mountHud(store:Store,openPanel:(id:string)=>void){
 const root=document.createElement('div');root.id='hud-root';root.className='hud-root';document.querySelector('.shell')!.append(root);
 document.documentElement.classList.add('hud-v2');
 const unbind=bindStore(store);
 render(<><PlayerFrame/><Minimap onOpenMap={()=>openPanel('travel')}/></>,root);
 return ()=>{render(null,root);unbind();root.remove();document.documentElement.classList.remove('hud-v2');};
}

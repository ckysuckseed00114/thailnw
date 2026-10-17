import {useEffect,useRef,useState} from 'preact/hooks';
import {REGIONS} from '../../core/models';
import type {SoundFX} from '../../services/SoundFX';
import {useGame} from './gameSignal';
import {UI_SCALE_MAX,UI_SCALE_MIN,prefs,setPref,type DamageNumbers} from './prefs';

const pad=(n:number)=>String(n).padStart(2,'0');
const n=(v:number)=>Math.floor(v).toLocaleString();
function Gear(){return <svg viewBox="0 0 16 16" aria-hidden="true"><path fill="currentColor" d="M7 1h2l.4 2 1.4.6 1.7-1.2 1.4 1.4-1.2 1.7.6 1.4 2 .4v2l-2 .4-.6 1.4 1.2 1.7-1.4 1.4-1.7-1.2-1.4.6L9 15H7l-.4-2-1.4-.6-1.7 1.2-1.4-1.4 1.2-1.7L2.7 9 1 9V7l2-.4.6-1.4-1.2-1.7 1.4-1.4 1.7 1.2L6.6 3zM8 5.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5z"/></svg>;}

/** Quick settings: UI scale, sound and fullscreen. The full settings window is task 3.8. */
function QuickSettings({sfx,onClose}:{sfx:SoundFX;onClose:()=>void}){
 const ref=useRef<HTMLDivElement>(null);const p=prefs.value;
 useEffect(()=>{
  const away=(e:PointerEvent)=>{if(!ref.current?.parentElement?.contains(e.target as Node))onClose();};
  const esc=(e:KeyboardEvent)=>{if(e.key==='Escape'){e.stopPropagation();onClose();}};
  document.addEventListener('pointerdown',away);document.addEventListener('keydown',esc,true);ref.current?.querySelector<HTMLElement>('input')?.focus();
  return ()=>{document.removeEventListener('pointerdown',away);document.removeEventListener('keydown',esc,true);};
 },[]);
 const fullscreen=()=>{const task=document.fullscreenElement?document.exitFullscreen():document.documentElement.requestFullscreen();task.catch(()=>{});};
 return <div ref={ref} class="qs tf-frame ink" role="dialog" aria-label="ตั้งค่าด่วน">
  <label class="qs-row"><span>ขนาด UI</span><input type="range" min={UI_SCALE_MIN*100} max={UI_SCALE_MAX*100} step="5" value={Math.round(p.scale*100)} onInput={e=>setPref('scale',Number((e.target as HTMLInputElement).value)/100)}/><b>{Math.round(p.scale*100)}%</b></label>
  <label class="qs-row"><span>เสียงเอฟเฟกต์</span><input type="checkbox" checked={!p.muted} onChange={e=>{const on=(e.target as HTMLInputElement).checked;sfx.enabled=on;setPref('muted',!on);}}/><b>{p.muted?'ปิด':'เปิด'}</b></label>
  <label class="qs-row"><span>ตัวเลขดาเมจ</span><select value={p.damageNumbers} onChange={e=>setPref('damageNumbers',(e.target as HTMLSelectElement).value as DamageNumbers)}><option value="all">ทั้งหมด</option><option value="important">เฉพาะสำคัญ</option><option value="off">ปิด</option></select><b/></label>
  <div class="qs-actions"><button type="button" onClick={()=>setPref('scale',1)}>รีเซ็ตขนาด</button><button type="button" onClick={fullscreen}>เต็มจอ</button></div>
 </div>;
}
export function TopBar({sfx}:{sfx:SoundFX}){
 const s=useGame();const [open,setOpen]=useState(false);
 return <div class="tb">
  <div class="tb-plate">
   <small>ชั้น {pad(s.floor)} · ภูมิภาค {pad(s.region)}</small>
   <h2 class="tf-ornate">{REGIONS[s.region-1]}</h2>
  </div>
  <button type="button" class="tb-gear" aria-label="ตั้งค่าด่วน" aria-expanded={open} title="ตั้งค่าด่วน" onClick={()=>setOpen(!open)}><Gear/></button>
  {open&&<QuickSettings sfx={sfx} onClose={()=>setOpen(false)}/>}
 </div>;
}
export function Purse(){
 const s=useGame();
 return <div class="purse" aria-label="เงินในกระเป๋า">
  <span title="$LM (สกุลเงินหลัก)"><svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="6.5" fill="#e8b84a" stroke="#7a5622"/><path d="M8 4.5 9 7l2.5.2-1.9 1.6.6 2.5L8 10l-2.2 1.3.6-2.5-1.9-1.6L7 7z" fill="#fff3c4"/></svg><b>{n(s.lm)}</b></span>
  <span title="Bone (วัตถุดิบตีบวก)"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 3a1.8 1.8 0 0 1 3 1.3L11.7 9A1.8 1.8 0 1 1 13 12a1.8 1.8 0 1 1-3 1.3L5.3 8.6A1.8 1.8 0 1 1 4 3z" fill="#e9e1cc" stroke="#6b604c"/></svg><b>{n(s.bone)}</b></span>
 </div>;
}

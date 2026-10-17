import {signal} from '@preact/signals';
import {useEffect,useRef,useState} from 'preact/hooks';
import {CLASS_SKILLS} from '../../core/Skills';
import {ACTIONS,bindKey,capturing,keybinds,normalizeKey,resetKeys,type Action} from '../keybinds';
import {useGame} from './gameSignal';

export const keybindsOpen=signal(false);
/** Key remapping window (UI_UX_PLAN 2.5). Clicking a key waits for the next key press; a taken key swaps places. */
export function KeybindsDialog(){
 const open=keybindsOpen.value,ref=useRef<HTMLDialogElement>(null);const s=useGame();
 const [waiting,setWaiting]=useState<Action|null>(null);const [note,setNote]=useState('');
 useEffect(()=>{const d=ref.current;if(!d)return;if(open&&!d.open)d.showModal();if(!open&&d.open)d.close();},[open]);
 useEffect(()=>{
  capturing.value=!!waiting;if(!waiting)return;
  const onKey=(e:KeyboardEvent)=>{
   e.preventDefault();e.stopPropagation();
   if(e.key==='Escape'){setWaiting(null);setNote('ยกเลิกแล้ว');return;}
   const key=normalizeKey(e.key);if(!key){setNote('ปุ่มนี้ใช้ตั้งเป็นปุ่มลัดไม่ได้');return;}
   const swapped=bindKey(waiting,key);const label=(a:Action)=>ACTIONS.find(x=>x.id===a)!.label;
   setNote(swapped?`ตั้ง ${key} ให้ "${label(waiting)}" แล้ว และย้าย "${label(swapped)}" ไปใช้ ${keybinds.value[swapped]}`:`ตั้ง ${key} ให้ "${label(waiting)}" แล้ว`);setWaiting(null);
  };
  window.addEventListener('keydown',onKey,true);return ()=>{window.removeEventListener('keydown',onKey,true);capturing.value=false;};
 },[waiting]);
 const keys=keybinds.value,skills=CLASS_SKILLS[s.hero.class];
 const groups=[...new Set(ACTIONS.map(a=>a.group))];
 return <dialog ref={ref} class="kb tf-frame" aria-labelledby="kb-title" onClose={()=>{keybindsOpen.value=false;setWaiting(null);setNote('');}} onCancel={e=>{if(waiting)e.preventDefault();}}>
  <div class="kb-head"><h2 id="kb-title" class="tf-title">ปุ่มลัด</h2><button type="button" class="kb-x" aria-label="ปิด" onClick={()=>{keybindsOpen.value=false;}}>×</button></div>
  <p class="kb-help">คลิกปุ่มทางขวาแล้วกดปุ่มใหม่บนคีย์บอร์ด · กด Esc เพื่อยกเลิก · ถ้าปุ่มซ้ำกับคำสั่งอื่น ระบบจะสลับให้</p>
  {groups.map(g=><section key={g}><h3>{g}</h3>
   {ACTIONS.filter(a=>a.group===g).map(a=>{const skill=a.id.startsWith('skill:')?skills[Number(a.id.slice(6))]:undefined;
    return <div key={a.id} class="kb-row"><span>{a.label}{skill&&<small> · {skill.name}</small>}</span>
     <button type="button" class={`kb-key ${waiting===a.id?'wait':''}`} aria-label={`${a.label}: ${keys[a.id]} — คลิกเพื่อเปลี่ยน`} onClick={()=>{setNote('');setWaiting(a.id);}}>{waiting===a.id?'กดปุ่ม…':keys[a.id]}</button>
    </div>;})}
  </section>)}
  <p class="kb-note" role="status">{note}</p>
  <div class="kb-foot"><button type="button" onClick={()=>{resetKeys();setNote('คืนค่าเริ่มต้นแล้ว');}}>คืนค่าเริ่มต้น</button><button type="button" class="primary" onClick={()=>{keybindsOpen.value=false;}}>เสร็จ</button></div>
 </dialog>;
}

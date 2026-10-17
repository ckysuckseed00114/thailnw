import {useEffect} from 'preact/hooks';
import type {Command} from '../../core/models';
import {isAuto,isUnlocked,readyAt,skillsFor,type SkillDef} from '../../core/Skills';
import {ELEMENT_COLOR} from '../theme/elements';
import {currentStore,lastCast,useGame} from './gameSignal';

// Original glyphs per effect type, drawn in the element colour.
function Glyph({k}:{k:SkillDef}){
 const e=k.effect;const c=ELEMENT_COLOR[k.element].fill;
 const d=e.kind==='heal'?'M12 4c3 3 6 5 6 9a6 6 0 0 1-12 0c0-4 3-6 6-9zm-1 6v3H8v2h3v3h2v-3h3v-2h-3v-3z'
  :e.kind==='shield'?'M12 3 19 6v5c0 5-3 8-7 10-4-2-7-5-7-10V6z'
  :e.target==='all'?'M12 2l2 6 6-2-4 5 5 4-6 1 1 6-4-4-4 4 1-6-6-1 5-4-4-5 6 2z'
  :'M18 3h3v3L10 17l2 2-2 2-2-2-3 3-2-2 3-3-2-2 2-2 2 2z';
 return <svg viewBox="0 0 24 24" aria-hidden="true"><path d={d} fill={c} stroke="#0008" stroke-width="1" fill-rule="evenodd"/>{k.key==='R'&&<circle cx="12" cy="12" r="10.5" fill="none" stroke="var(--tf-gold-hi)" stroke-width="1.2" stroke-dasharray="2 2"/>}</svg>;
}
export function Hotbar({toast}:{toast:(text:string)=>void}){
 const s=useGame(),skills=skillsFor(s),flashes=lastCast.value,now=performance.now();
 const send=(c:Command)=>{try{currentStore().dispatch(c);}catch(err){toast((err as Error).message);}};
 // Keys 1–5 and R cast; ignored while typing or while a window is open.
 useEffect(()=>{
  const onKey=(e:KeyboardEvent)=>{
   if(e.repeat||e.ctrlKey||e.metaKey||e.altKey||(e.target as HTMLElement).matches?.('input,select,textarea')||document.querySelector<HTMLDialogElement>('#modal')?.open)return;
   const k=skillsFor(currentStore().state).find(k=>k.key.toLowerCase()===e.key.toLowerCase());if(!k)return;
   e.preventDefault();send({type:'cast',id:k.id});
  };
  document.addEventListener('keydown',onKey);return ()=>document.removeEventListener('keydown',onKey);
 },[]);
 return <div class="hb" role="toolbar" aria-label="แถบสกิล">
  {skills.map(k=>{
   const locked=!isUnlocked(s,k),left=Math.max(0,readyAt(s,k)-s.now),auto=isAuto(s,k),frac=Math.min(1,left/k.cooldown);
   const flash=now-(flashes[k.id]??-1e9)<350;
   const tip=`${k.key} · ${k.name}\n${k.desc}\nคูลดาวน์ ${k.cooldown/1000} วิ${locked?` · ปลดล็อกที่ Lv ${k.unlock}`:''}`;
   return <div key={k.id} class={`hb-slot ${locked?'locked':''} ${left===0&&!locked?'ready':''} ${flash?'flash':''} ${k.key==='R'?'ult':''}`}>
    <button type="button" class="hb-cast" title={tip} aria-label={`${k.name}${locked?` (ล็อก ถึง Lv ${k.unlock})`:left?` (คูลดาวน์ ${Math.ceil(left/1000)} วิ)`:''}`} onClick={()=>send({type:'cast',id:k.id})}>
     <Glyph k={k}/>
     {!locked&&left>0&&<span class="hb-cd" style={{background:`conic-gradient(#000b ${frac}turn,transparent 0)`}}><b>{Math.ceil(left/1000)}</b></span>}
     {locked&&<span class="hb-lock"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M5 7V5a3 3 0 0 1 6 0v2h1v7H4V7zm1.5 0h3V5a1.5 1.5 0 0 0-3 0z" fill="currentColor"/></svg><b>Lv {k.unlock}</b></span>}
    </button>
    <span class="tf-key hb-key">{k.key}</span>
    {!locked&&<button type="button" class={`hb-auto ${auto?'on':''}`} aria-pressed={auto} title={auto?'ร่ายอัตโนมัติ: เปิด':'ร่ายอัตโนมัติ: ปิด'} aria-label={`ร่าย ${k.name} อัตโนมัติ`} onClick={()=>send({type:'autocast',id:k.id,value:!auto})}>A</button>}
   </div>;
  })}
  <span class="hb-sep" aria-hidden="true"/>
  <button type="button" class={`hb-advance ${s.autoAdvance?'on':''}`} aria-pressed={s.autoAdvance} title="เดินหน้าไปภูมิภาคถัดไปอัตโนมัติหลังชนะบอส" onClick={()=>send({type:'advance'})}>
   <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2 3l6 5-6 5zm6 0 6 5-6 5z" fill="currentColor"/></svg><small>{s.autoAdvance?'ออโต้':'หยุด'}</small>
  </button>
 </div>;
}

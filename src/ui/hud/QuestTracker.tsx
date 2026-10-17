import {QUESTS} from '../../core/CombatEngine';
import {ROOMS,type GameState} from '../../core/models';
import {useGame} from './gameSignal';
import {prefs,setPref} from './prefs';

export type TrackedItem={id:string;title:string;detail:string;done:number;total:number;ready?:boolean};
/** Room objective first, then unclaimed milestone quests; at most three lines (UI_UX_PLAN 1.4). */
export function trackedItems(s:GameState):TrackedItem[]{
 const total=s.room===ROOMS?1:3,cleared=s.respawnAt?0:Math.max(0,total-s.enemies.length);
 const title=s.respawnAt?'กลับเข้าสู่การต่อสู้':s.nextRoomAt?'ประตูเปิด · กำลังเดินทาง':s.room===ROOMS?'ปราบผู้พิทักษ์ภูมิภาค':'เคลียร์ห้องนี้';
 const room:TrackedItem={id:'room',title,detail:s.room===ROOMS?'The Hollow Warden':`ห้อง ${s.room}/${ROOMS}`,done:cleared,total};
 const quests=QUESTS.filter(q=>!s.questClaims.includes(q.id)).map(q=>({id:q.id,title:q.name,detail:q.description,done:Math.min(q.target,s[q.metric]),total:q.target,ready:s[q.metric]>=q.target}));
 return [room,...quests.sort((a,b)=>Number(b.ready)-Number(a.ready))].slice(0,3);
}
export function QuestTracker({onOpenJournal}:{onOpenJournal:()=>void}){
 const s=useGame(),open=prefs.value.trackerOpen,items=trackedItems(s);
 const ready=items.filter(i=>i.ready).length;
 return <section class={`qt ${open?'':'closed'}`} aria-label="ภารกิจที่ติดตาม">
  <button type="button" class="qt-head" aria-expanded={open} onClick={()=>setPref('trackerOpen',!open)}>
   <span class="qt-mark" aria-hidden="true">◆</span><span class="tf-title">ภารกิจที่ติดตาม</span>
   {ready>0&&<span class="qt-badge" title="รับรางวัลได้">{ready}</span>}
   <span class="qt-chev" aria-hidden="true">{open?'▾':'▸'}</span>
  </button>
  {open&&<ul>{items.map(i=><li key={i.id} class={i.ready?'ready':''}>
   <button type="button" onClick={i.id==='room'?undefined:onOpenJournal} disabled={i.id==='room'} title={i.id==='room'?undefined:'เปิดสมุดภารกิจ'}>
    <span class="qt-title">{i.title}</span>
    <span class="qt-detail">{i.ready?'พร้อมรับรางวัล':i.detail}<b>({i.done}/{i.total})</b></span>
    <span class="qt-bar"><i style={{width:`${i.total?i.done/i.total*100:0}%`}}/></span>
   </button>
  </li>)}</ul>}
 </section>;
}

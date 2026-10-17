import {regionIndex} from '../../core/Formulas';
import {REGIONS,type Enemy,type GameState} from '../../core/models';
import {focusEnemy,nextTarget} from '../../core/Targeting';
import {keybinds} from '../keybinds';
import {currentStore,useGame} from './gameSignal';

/** Thresholds are shared with the authority's two guard summons. */
export const BOSS_PHASES=[2/3,1/3];
export function bossPhase(e:Enemy){const f=e.hp/e.maxHp;return 1+BOSS_PHASES.filter(t=>f<=t).length;}
/** Every third boss attack is a slam (CombatEngine); returns hits until the next one, 1 = the next attack. */
export function hitsUntilSlam(e:Enemy){return 3-(e.attacks%3);}
const ROMAN=['I','II','III'];
const n=(v:number)=>Math.ceil(v).toLocaleString();
const pick=(id:number,toast:(t:string)=>void)=>{try{currentStore().dispatch({type:'target',id});}catch(err){toast((err as Error).message);}};

function HpBar({e,boss}:{e:Enemy;boss?:boolean}){
 return <div class={`tg-bar ${boss?'boss':''}`} role="meter" aria-label="พลังชีวิตศัตรู" aria-valuemin={0} aria-valuemax={e.maxHp} aria-valuenow={Math.ceil(e.hp)}>
  <i style={{width:`${Math.max(0,e.hp/e.maxHp*100)}%`}}/>
  {boss&&BOSS_PHASES.map(t=><s key={t} style={{left:`${t*100}%`}}/>)}
  <b>{n(e.hp)} / {n(e.maxHp)}</b>
 </div>;
}
function stunned(s:GameState,e:Enemy){return e.stunnedUntil>s.now?<span class="tg-stun">มึนงง {Math.ceil((e.stunnedUntil-s.now)/1000)}s</span>:null;}

/** Current target of single-target attacks (2.3). Hidden in boss rooms, where the boss bar takes its place. */
export function TargetFrame({toast}:{toast:(t:string)=>void}){
 const s=useGame();const e=s.respawnAt||s.nextRoomAt?undefined:focusEnemy(s);
 if(!e||e.boss||e.hp<=0)return null;
 const manual=s.target===e.id,keys=keybinds.value;
 return <section class="tg" aria-label="เป้าหมาย">
  <div class="tg-head">
   <span class="tg-name">{e.name}</span><span class="tg-lv">Lv {regionIndex(s)}</span>
   <span class={`tg-mode ${manual?'manual':''}`}>{manual?'เลือกเอง':'อัตโนมัติ'}</span>{stunned(s,e)}
  </div>
  <HpBar e={e}/>
  <div class="tg-actions">
   <button type="button" onClick={()=>{const id=nextTarget(s);if(id)pick(id,toast);}} title={`เป้าหมายถัดไป (${keys['target:next']})`}>ถัดไป <span class="tf-key">{keys['target:next']}</span></button>
   {manual&&<button type="button" onClick={()=>pick(0,toast)} title={`กลับไปเลือกอัตโนมัติ (${keys['target:clear']})`}>อัตโนมัติ <span class="tf-key">{keys['target:clear']}</span></button>}
  </div>
 </section>;
}
/** Boss bar with phase markers and the slam counter (replaces the DOM boss bar). */
export function BossBar(){
 const s=useGame();const e=s.respawnAt?undefined:s.enemies.find(m=>m.boss&&m.hp>0);if(!e)return null;
 const phase=bossPhase(e),slamIn=hitsUntilSlam(e);
 return <section class="bb" aria-label={`บอส ${e.name}`}>
  <div class="bb-head"><span class="bb-name">{e.name}</span><span class="bb-sub">ผู้พิทักษ์ {REGIONS[s.region-1]}</span><span class="bb-phase">ระยะ {ROMAN[phase-1]}{e.summons>0?` · เรียกผู้คุ้มกัน ${e.summons}/2`:''}</span>{stunned(s,e)}</div>
  <HpBar e={e} boss/>
  <div class={`bb-slam ${slamIn===1?'next':''}`} aria-live="polite">
   {[0,1,2].map(i=><i key={i} class={i<3-slamIn?'on':''}/>)}
   <span>{slamIn===1?'ทุบหนักครั้งถัดไป!':`ทุบหนักในอีก ${slamIn} ครั้ง`}</span>
  </div>
 </section>;
}

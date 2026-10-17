import {stats,xpForLevel} from '../../core/Formulas';
import {SKILLS,type GameState,type Shrine} from '../../core/models';
import {heroSVG} from '../../game/HeroArt';
import {primarySkill,readyAt} from '../../core/Skills';
import {Bar,Frame} from '../components/Frame';
import {useGame} from './gameSignal';

/** Charge of the slot-1 skill. Shown as SP until a real MP resource exists (UI_UX_PLAN U4). */
export function skillCharge(s:GameState){const k=primarySkill(s);return s.respawnAt?0:Math.max(0,Math.min(1,1-(readyAt(s,k)-s.now)/k.cooldown));}

const BUFF_TEXT:Record<Shrine,string>={Fury:'พลังโทสะ · ดาเมจ ×2',Fortune:'โชคลาภ · เงินและของ ×2',Haste:'เร่งเร้า · ตีเร็วขึ้น 50%',Renewal:'ฟื้นฟู · ฟื้น HP 3%/วิ'};
// Small original glyphs, one per effect, drawn in currentColor.
const GLYPH:Record<string,string>={
 Fury:'M8 1c1 3 4 4 4 8a4 4 0 0 1-8 0c0-2 1-3 2-4 0 2 1 3 2 3 0-3-1-5 0-7z',
 Fortune:'M8 2a6 6 0 1 0 0 12A6 6 0 0 0 8 2zm0 2.5 1 2.2 2.3.3-1.7 1.6.4 2.3L8 9.8 6 10.9l.4-2.3L4.7 7l2.3-.3z',
 Haste:'M2 9h7l-2 5 7-8H7l2-5z',
 Renewal:'M3 13C3 6 8 3 13 3c0 6-4 10-10 10zm0 0 6-6',
 Shield:'M8 1 14 3v5c0 4-3 6-6 7-3-1-6-3-6-7V3z',
 Pet:'M5 6a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm6 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zM3 9a1.4 1.4 0 1 1 0-2.8A1.4 1.4 0 0 1 3 9zm10 0a1.4 1.4 0 1 1 0-2.8A1.4 1.4 0 0 1 13 9zM8 8c2.5 0 4 2.5 4 4.2 0 1-1 1.8-2 1.6L8 13.4l-2 .4c-1 .2-2-.6-2-1.6C4 10.5 5.5 8 8 8z',
};
function Buff({id,tone,title,label}:{id:string;tone:string;title:string;label?:string}){
 return <span class="pf-buff" style={{'--tone':tone}} title={title} aria-label={title}>
  <svg viewBox="0 0 16 16" aria-hidden="true"><path d={GLYPH[id]} fill="currentColor" stroke={id==='Renewal'?'currentColor':'none'} stroke-width="1.4"/></svg>{label&&<small>{label}</small>}
 </span>;
}
export function PlayerFrame(){
 const s=useGame(),st=stats(s);
 const shrine=s.shrine&&s.shrine.until>s.now?s.shrine:null;const next=xpForLevel(s.hero.level+1);
 return <Frame class="pf" aria-label="ข้อมูลผู้เล่น">
  <div class={`pf-portrait ${s.respawnAt?'down':''}`} dangerouslySetInnerHTML={{__html:heroSVG(s.hero.class)}}/>
  <span class="pf-level tf-plate">Lv. {s.hero.level}</span>
  <div class="pf-body">
   <div class="pf-name tf-title" title={s.hero.name}>{s.hero.name}</div>
   <div class="pf-class">{s.hero.class} · {SKILLS[s.hero.class].name}</div>
   <div class="pf-bars">
    <span class="pf-tag">HP</span><Bar kind="hp" value={s.hero.hp} max={st.maxHp} label="พลังชีวิต"/>
    <span class="pf-tag">SP</span><Bar kind="sp" value={skillCharge(s)*100} max={100} label="พลังสกิล (ชาร์จสกิลอัตโนมัติ)"/>
   </div>
   <Bar kind="xp" value={s.hero.xp} max={next} label="ค่าประสบการณ์"/>
   <div class="pf-buffs">
    {s.respawnAt?<span class="pf-down">ฟื้นคืนใน {Math.ceil((s.respawnAt-s.now)/1000)} วิ</span>:null}
    {shrine&&<Buff id={shrine.kind} tone="var(--tf-gold-hi)" title={BUFF_TEXT[shrine.kind]} label={`${Math.ceil((shrine.until-s.now)/1000)}s`}/>}
    {s.shield&&<Buff id="Shield" tone="var(--tf-spirit)" title="โล่ของ Shellby · กันการโจมตีครั้งถัดไป"/>}
    <Buff id="Pet" tone="#a9e2a0" title={`${s.pet} · Lv ${s.pets[s.pet].level}`} label={`${s.pets[s.pet].level}`}/>
   </div>
  </div>
 </Frame>;
}

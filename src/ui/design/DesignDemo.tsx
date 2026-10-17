// Dev-only design system page (`/design.html`, not part of the production build).
import {render} from 'preact';
import '../../styles/base.css';
import '../theme/tokens.css';
import '../hud/hud.css';
import {createState,Store} from '../../core/GameState';
import {CombatEngine} from '../../core/CombatEngine';
import {Bar,Frame} from '../components/Frame';
import {bindStore} from '../hud/gameSignal';
import {PlayerFrame} from '../hud/PlayerFrame';
import {Minimap} from '../hud/Minimap';
import {Purse,TopBar} from '../hud/TopBar';
import {QuestTracker} from '../hud/QuestTracker';
import {SoundFX} from '../../services/SoundFX';

const SWATCHES:[string,string][]=[['--tf-gold','ทองอุ่น'],['--tf-leaf','ใบไม้'],['--tf-terracotta','ดินเผา'],['--tf-jade','หยก'],['--tf-sky','ฟ้า'],['--tf-lotus','บัวชมพู'],['--tf-wood','ไม้เข้ม'],['--tf-ink','หมึก'],['--tf-gold-edge','ขอบทอง'],['--tf-gold-hi','ทองไฮไลต์'],['--tf-spirit','ฟ้าวิญญาณ'],['--tf-hp','HP'],['--tf-sp','SP'],['--tf-xp','XP']];

// A sample character mid-fight so the HUD components render realistic values.
const s=createState(Date.parse('2026-10-17T21:37:00'),7);const engine=new CombatEngine(s);engine.dispatch({type:'class',value:'Wand',name:'ลักกี้'});
s.hero.level=42;s.hero.hp=55;s.room=3;s.region=6;s.shrine={kind:'Haste',until:s.now+42000};s.shield=true;s.skillAt=s.now+2600;s.hero.xp=1800;
const store=new Store(engine);bindStore(store);

function Section({title,children}:{title:string;children:preact.ComponentChildren}){return <section style={{margin:'0 0 28px'}}><h2 class="tf-title" style={{fontSize:'18px',margin:'0 0 12px'}}>{title}</h2>{children}</section>;}
function Demo(){
 return <main style={{maxWidth:'1040px',margin:'0 auto',padding:'28px 20px 60px',color:'var(--tf-text)',fontFamily:'var(--tf-font-body)'}}>
  <h1 class="tf-ornate" style={{fontSize:'44px',margin:'0 0 4px'}}>ระบบออกแบบ · Embermarch</h1>
  <p style={{color:'var(--tf-text-2)',margin:'0 0 28px'}}>Design tokens, ตัวอักษร และองค์ประกอบ HUD ชุดแรก (UI_UX_PLAN 1.1–1.3)</p>
  <Section title="สี (tokens)">
   <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(120px,1fr))',gap:'10px'}}>
    {SWATCHES.map(([v,label])=><div key={v} class="tf-frame" style={{padding:'8px'}}><div style={{height:'44px',background:`var(${v})`,border:'1px solid #000'}}/><div style={{fontSize:'13px',marginTop:'6px'}}>{label}</div><code style={{fontSize:'10px',color:'var(--tf-text-3)'}}>{v}</code></div>)}
   </div>
  </Section>
  <Section title="ตัวอักษร">
   <Frame style={{padding:'18px 20px'}}>
    <div class="tf-ornate" style={{fontSize:'32px'}}>กลียุคอาคม ชุมนุมสยาม</div>
    <div class="tf-title" style={{fontSize:'22px',margin:'6px 0'}}>หัวข้อ Kanit · เมืองพระแสง ตลาดน้ำโคมทอง</div>
    <p style={{margin:'0 0 8px',lineHeight:1.7}}>เนื้อหา Sarabun: ผู้กล้าเดินทางผ่านป่าวิญญาณเพื่อตามหาดวงไฟศักดิ์สิทธิ์ ทดสอบสระและวรรณยุกต์ ปิ่น ญี่ ฎุ ฐ์ ฤๅ</p>
    <div style={{fontFamily:'var(--tf-font-num)',fontSize:'22px',color:'#ffd34d'}}>541! 18,420 / 18,420</div>
   </Frame>
  </Section>
  <Section title="กรอบ แถบ ป้าย">
   <div style={{display:'flex',flexWrap:'wrap',gap:'20px',alignItems:'flex-start'}}>
    <Frame style={{padding:'16px',width:'240px'}}><div class="tf-title">กรอบไม้ (wood)</div><p style={{fontSize:'13px',color:'var(--tf-text-2)'}}>หน้าต่างทั่วไป</p></Frame>
    <Frame tone="ink" style={{padding:'16px',width:'240px'}}><div class="tf-title">กรอบหมึก (ink)</div><p style={{fontSize:'13px',color:'var(--tf-text-2)'}}>แผงเวท/กลางคืน</p></Frame>
    <Frame style={{padding:'14px',width:'260px',display:'grid',gap:'6px'}}><Bar kind="hp" value={18420} max={18420}/><Bar kind="sp" value={64} max={100}/><Bar kind="xp" value={3} max={5}/><div><span class="tf-plate">Lv. 252</span> <span class="tf-key">M</span> <span class="tf-key">ESC</span></div></Frame>
   </div>
  </Section>
  <Section title="HUD Phase 1: Player frame · Top bar · Purse · Minimap · Quest tracker">
   <div class="hud-root" style={{position:'relative',minHeight:'420px',background:'#202a3c',border:'1px solid #000'}}>
    <PlayerFrame/><TopBar sfx={new SoundFX()}/><Purse/><Minimap onOpenMap={()=>alert('เปิดแผนที่โลก')}/><QuestTracker onOpenJournal={()=>alert('เปิดสมุดภารกิจ')}/>
   </div>
  </Section>
 </main>;
}
document.body.style.background='#0b0d14';
render(<Demo/>,document.getElementById('design')!);

import {REGIONS,ROOMS} from '../../core/models';
import {traversalProgress} from '../../core/RoomTraversal';
import {useGame} from './gameSignal';

// Room nodes along a winding path inside the 100×100 map disc; the last node is the warden.
const NODES:[number,number][]=[[20,64],[35,40],[51,58],[66,35],[80,55]];
const pad=(n:number)=>String(n).padStart(2,'0');
export function Minimap({onOpenMap}:{onOpenMap:()=>void}){
 const s=useGame();const i=s.room-1;
 // While the gate is open the hero walks to the next node; after the warden the walk leaves the map.
 const p=s.nextRoomAt&&!s.respawnAt?traversalProgress(s.now,s.nextRoomAt):0;const to=NODES[Math.min(i+1,ROOMS-1)],from=NODES[i];
 const hero=i<ROOMS-1?[from[0]+(to[0]-from[0])*p,from[1]+(to[1]-from[1])*p]:from;
 const clock=new Date(s.now);
 return <div class="mm" aria-label="แผนที่ย่อ">
  <span class="mm-area tf-plate" title={`ชั้น ${s.floor} · ภูมิภาค ${s.region}`}>{REGIONS[s.region-1]}</span>
  <span class="mm-clock">{pad(clock.getHours())}:{pad(clock.getMinutes())}</span>
  <svg class="mm-disc" viewBox="0 0 100 100" role="img" aria-label={`ห้อง ${s.room} จาก ${ROOMS}${s.room===ROOMS?' (ห้องบอส)':''}`}>
   <defs><clipPath id="mm-clip"><circle cx="50" cy="50" r="44"/></clipPath></defs>
   <circle cx="50" cy="50" r="49" fill="#0c0a08"/>
   <g clip-path="url(#mm-clip)">
    <rect width="100" height="100" fill="#1b2433"/>
    {[...Array(9)].map((_,k)=><path key={k} d={`M0 ${k*12+4}h100`} stroke="#ffffff08" stroke-width="5"/>)}
    <polyline points={NODES.map(n=>n.join(',')).join(' ')} fill="none" stroke="#000" stroke-width="7" stroke-linejoin="round" opacity=".45"/>
    <polyline points={NODES.map(n=>n.join(',')).join(' ')} fill="none" stroke="#6b5a40" stroke-width="4" stroke-linejoin="round" stroke-dasharray="1 2.5"/>
    {NODES.map(([x,y],k)=>{const boss=k===ROOMS-1,done=k<i,here=k===i;
     return boss?<g key={k}><rect x={x-5} y={y-5} width="10" height="10" transform={`rotate(45 ${x} ${y})`} fill={done?'#6a4b3a':'#7a1f22'} stroke={here?'#ffd9a0':'#e06650'} stroke-width="1.5"/><circle cx={x} cy={y} r="1.6" fill="#ffd27a"/></g>
      :<circle key={k} cx={x} cy={y} r={here?4.6:3.6} fill={done?'var(--tf-gold-edge)':here?'#173a55':'#2a3245'} stroke={here?'var(--tf-spirit)':done?'var(--tf-gold-hi)':'#5b6478'} stroke-width="1.4"/>;})}
    <circle class="mm-hero" cx={hero[0]} cy={hero[1]} r="2.6" fill="#fff" stroke="var(--tf-spirit)" stroke-width="1.2"/>
   </g>
   <circle cx="50" cy="50" r="45.5" fill="none" stroke="var(--tf-gold-lo)" stroke-width="3"/>
   <circle cx="50" cy="50" r="47.5" fill="none" stroke="var(--tf-gold-edge)" stroke-width="1.6"/>
   {[0,90,180,270].map(a=><rect key={a} x="48.5" y="1" width="3" height="5" fill="var(--tf-gold-hi)" transform={`rotate(${a} 50 50)`}/>)}
   <text x="50" y="13" text-anchor="middle" font-size="6" fill="var(--tf-gold-hi)" font-family="Kanit,sans-serif">N</text>
  </svg>
  <span class="mm-room">ห้อง {s.room}/{ROOMS}{s.room===ROOMS?' · บอส':''}</span>
  <button type="button" class="mm-open" onClick={onOpenMap} title="เปิดแผนที่โลก (M)" aria-label="เปิดแผนที่โลก"><span class="tf-key">M</span></button>
 </div>;
}

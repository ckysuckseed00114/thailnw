import {ATTRIBUTES,CLASSES,MAX_CHEST,MAX_INVENTORY,NAME_MAX,PETS,cleanName,ROOMS,SLOTS,type Command,type GameEvent,type GameState,type Item,type Reward,type Shrine} from './models';
import {forgeCost,itemPower,monsterStats,petXp,regionIndex,salvageValue,sealCost,stats,xpForLevel} from './Formulas';
import {drop,random} from './DropTable';
import type {Authority} from './GameState';
import {ROOM_TRAVERSE_MS} from './RoomTraversal';
import {focusEnemy} from './Targeting';
import {findSkill,isAuto,isUnlocked,primarySkill,readyAt,skillsFor,type SkillDef} from './Skills';

export const QUESTS=[{id:'first',name:'A light in the dark',description:'Defeat 10 monsters',target:10,metric:'kills',lm:100,bone:60},{id:'warden',name:'Break the watch',description:'Defeat 3 bosses',target:3,metric:'bosses',lm:300,bone:200},{id:'veteran',name:'The long descent',description:'Defeat 100 monsters',target:100,metric:'kills',lm:800,bone:400}] as const;
export class CombatEngine implements Authority {
 constructor(public state:GameState){}
 private events:GameEvent[]=[];
 private note(text:string){this.state.log.unshift(text);this.state.log.length=Math.min(8,this.state.log.length);this.events.push({type:'log',target:0,label:text});}
 private awardXP(xp:number){const s=this.state;s.hero.xp+=xp;while(s.hero.xp>=xpForLevel(s.hero.level+1)&&s.hero.level<1000){s.hero.xp-=xpForLevel(s.hero.level+1);s.hero.level++;s.hero.points++;s.hero.hp=stats(s).maxHp;this.note(`Level ${s.hero.level}. An attribute point awaits.`);}}
 /** Returns false when the chest is full and the item was salvaged into Bone instead. */
 private stash(item:Item){const s=this.state;if(s.chest.length<MAX_CHEST){s.chest.push(item);return true;}s.bone+=salvageValue(item);return false;}
 private record(reward:Reward,seconds=0){const s=this.state;const minute=Math.floor(s.now/60000)*60000;let h=s.history.find(h=>h.at===minute);if(!h){h={at:minute,seconds:0,lm:0,xp:0,bone:0,loot:0};s.history.push(h);}h.seconds+=seconds;for(const k of ['lm','xp','bone','loot'] as const)h[k]+=reward[k];s.history=s.history.filter(h=>h.at>=s.now-86400000);}
 private spawn(){
  const s=this.state;const boss=s.room===ROOMS;const m=monsterStats(regionIndex(s),boss);
  s.enemies=Array.from({length:boss?1:3},(_,i)=>({id:++s.serial,name:boss?'The Hollow Warden':['Mossling','Crypt Sentinel','Cave Stalker'][i],hp:m.hp,maxHp:m.hp,damage:m.damage,boss,attackAt:s.now+1800+i*400,stunnedUntil:0,attacks:0,summons:0}));
  s.nextRoomAt=0;s.attackAt=s.now+400;s.target=0;
  if(random(s)<.08){const kinds:Shrine[]=['Fury','Fortune','Haste','Renewal'];s.shrine={kind:kinds[Math.floor(random(s)*4)],until:s.now+60000};this.note(`${s.shrine.kind} shrine · blessed for 60 seconds.`);}
  this.events.push({type:'room',target:0});
 }
 private strike(ids:number[],mult:number,from?:{skill:SkillDef;stunMs?:number}){
  const s=this.state;const st=stats(s);
  for(const id of ids){const e=s.enemies.find(e=>e.id===id&&e.hp>0);if(!e)continue;const critical=random(s)<st.crit;const damage=Math.round(st.damage*mult*(critical?st.critMult:1));const dealt=Math.min(e.hp,damage);e.hp=Math.max(0,e.hp-damage);s.hero.hp=Math.min(st.maxHp,s.hero.hp+dealt*st.lifeSteal);if(from?.stunMs)e.stunnedUntil=Math.max(e.stunnedUntil,s.now+from.stunMs);this.events.push({type:'hit',target:id,amount:damage,critical,...(from?{skill:from.skill.id,element:from.skill.element}:{})});if(e.boss&&e.hp>0)this.summon(e);}
 }
 /** Each health threshold calls one guard. Boss keeps attacking while guards are alive. */
 private summon(boss:GameState['enemies'][number]){
  const s=this.state,ratio=boss.hp/boss.maxHp;
  while(boss.summons<2&&ratio<=(2-boss.summons)/3){
   boss.summons++;
   const base=monsterStats(regionIndex(s),false),hp=Math.round(base.hp*1.25);
   const guard={id:++s.serial,name:"Warden's Guard",hp,maxHp:hp,damage:base.damage*1.15,boss:false,attackAt:s.now+1200,stunnedUntil:0,attacks:0,summons:0};
   s.enemies.push(guard);this.events.push({type:'summon',target:guard.id,label:`Phase ${boss.summons+1} · Warden's Guard`});
   this.note(`The Warden calls a guard in phase ${boss.summons+1}!`);
  }
 }
 /** Only called while enemies exist (step returns early otherwise). */
 private focus(){return focusEnemy(this.state)!;}
 private cast(k:SkillDef){
  const s=this.state;const e=k.effect;const f=this.focus();const alive=s.enemies.filter(m=>m.hp>0).sort((a,b)=>Number(b===f)-Number(a===f));
  this.events.push({type:'skill',target:alive[0]?.id??0,label:k.name,skill:k.id,element:k.element});
  this.strike((e.target==='all'?alive:alive.slice(0,1)).map(m=>m.id),e.mult,{skill:k,stunMs:e.stunMs});
  s.cooldowns[k.id]=s.now+k.cooldown;
 }
 private kills(){
  const s=this.state;
  for(const e of s.enemies.filter(e=>e.hp<=0)){
   s.kills++;if(e.boss)s.bosses++;
   const r=regionIndex(s),fortune=s.shrine?.kind==='Fortune'&&s.shrine.until>s.now?2:1;
   const reward={lm:(e.boss?45:8)*r*fortune,xp:(e.boss?100:18)*r,bone:(e.boss?15:3)*r,loot:0};
   if(e.boss||random(s)<.24){for(let i=0;i<fortune;i++){this.stash(drop(s,r));reward.loot++;}}
   s.lm+=reward.lm;s.bone+=reward.bone;this.awardXP(reward.xp);this.record(reward);
   if(e.boss)this.note(`Warden defeated. Clear the guards to open the gate. +${reward.lm} $LM · +${reward.xp} XP`);
  }
  s.enemies=s.enemies.filter(e=>e.hp>0);if(s.target&&!s.enemies.some(e=>e.id===s.target))s.target=0;
  if(!s.enemies.length&&!s.nextRoomAt){
   if(s.room===ROOMS){const r=regionIndex(s);s.cleared=Math.max(s.cleared,r);s.unlocked=Math.max(s.unlocked,Math.min(s.floor*11,r+1));this.note('The Warden and guards are defeated. The gate opens.');}
   s.nextRoomAt=s.now+ROOM_TRAVERSE_MS;
  }
 }
 tick(ms:number){
  // Events raised by dispatch() since the last tick (e.g. a manual cast) are delivered with this tick's events.
  if(!Number.isFinite(ms)||ms<0)return [];
  // Fixed substeps keep combat independent of frame rate. The host handles long offline gaps.
  for(let remaining=Math.min(ms,5000);remaining>0;){const dt=Math.min(50,remaining);remaining-=dt;this.step(dt);}
  const out=this.events;this.events=[];return out;
 }
 private step(dt:number){
  const s=this.state;s.now+=dt;if(!s.started)return;
  this.record({lm:0,xp:0,bone:0,loot:0},dt/1000);
  if(s.respawnAt){if(s.now>=s.respawnAt){s.respawnAt=0;s.room=1;s.hero.hp=stats(s).maxHp;const first=primarySkill(s);s.cooldowns[first.id]=s.now+first.cooldown;s.petAt=s.now+8000;s.shield=false;this.spawn();}return;}
  if(s.shrine&&s.shrine.until<=s.now)s.shrine=null;
  if(s.shrine?.kind==='Renewal')s.hero.hp=Math.min(stats(s).maxHp,s.hero.hp+stats(s).maxHp*.03*dt/1000);
  if(!s.enemies.length){if(!s.nextRoomAt)this.spawn();else if(s.now>=s.nextRoomAt){if(s.room===ROOMS){s.room=1;if(s.autoAdvance&&s.region<11)s.region++;}else s.room++;this.spawn();}return;}
  if(s.now>=s.attackAt){this.strike([this.focus().id],1);s.attackAt=s.now+stats(s).interval;}
  for(const k of skillsFor(s))if(isUnlocked(s,k)&&isAuto(s,k)&&s.now>=readyAt(s,k)&&s.enemies.some(m=>m.hp>0))this.cast(k);
  if(s.now>=s.petAt){const bonus=1+(s.pets[s.pet].level-1)*.1;const st=stats(s);if(s.pet==='Leafhopper')s.hero.hp=Math.min(st.maxHp,s.hero.hp+st.maxHp*.1*bonus);else if(s.pet==='Shellby')s.shield=true;else{const f=this.focus();this.strike([f.id],(s.pet==='Craboulder'?.9:1.2)*bonus);if(s.pet==='Craboulder')f.stunnedUntil=s.now+1000*bonus;}this.events.push({type:'pet',target:0,label:s.pet});s.petAt=s.now+8000/(s.pet==='Shellby'?bonus:1);}
  this.kills();
  for(const e of s.enemies){
   if(s.now<e.attackAt||s.now<e.stunnedUntil)continue;
   e.attacks++;const slam=e.boss&&e.attacks%3===0;const st=stats(s);
   // Basic attacks can be sidestepped too; slam retains its higher dodge chance.
   const dodgeChance=slam?st.dodge:Math.min(.35,.12+s.hero.attributes.Agility*.005);
   const dodged=random(s)<dodgeChance,shielded=!dodged&&s.shield,blocked=!dodged&&!shielded&&random(s)<st.block,avoided=dodged||shielded||blocked;
   if(shielded)s.shield=false;
   const amount=avoided?0:Math.round(e.damage*(slam?2.5:1));s.hero.hp=Math.max(0,s.hero.hp-amount);e.attackAt=s.now+(e.boss?2200:2400);
   this.events.push({type:'hit',target:0,source:e.id,amount,label:dodged?'DODGE':shielded?'SHIELD':blocked?'BLOCK':slam?'SLAM':undefined});
   if(s.hero.hp<=0){s.respawnAt=s.now+3000;s.enemies=[];s.nextRoomAt=0;this.events.push({type:'death',target:0});this.note('Fallen, but not forgotten. Returning in 3 seconds.');break;}
  }
 }
 dispatch(c:Command){
  const s=this.state;const check=(ok:unknown,message:string)=>{if(!ok)throw new Error(message);};
  const spend=(lm:number,bone:number)=>{check(s.lm>=lm&&s.bone>=bone,'Not enough $LM or Bone.');s.lm-=lm;s.bone-=bone;};
  const named=(value:unknown)=>{const name=cleanName(value);check(name,`Names need 2–${NAME_MAX} letters or numbers (spaces, _ ' . - allowed).`);return name!;};
  if(c.type==='class'){check(CLASSES.includes(c.value),'Unknown class.');check(!s.started,'Your class is already chosen.');const name=c.name===undefined?s.hero.name:named(c.name);s.hero.name=name;s.hero.class=c.value;s.started=true;for(const k of skillsFor(s))s.cooldowns[k.id]=s.now+k.cooldown;this.spawn();return;}
  check(s.started,'Choose your class first.');
  if(c.type==='name'){s.hero.name=named(c.value);return;}
  if(c.type==='target'){check(c.id===0||s.enemies.some(e=>e.id===c.id&&e.hp>0),'That target is gone.');s.target=c.id;return;}
  if(c.type==='cast'||c.type==='autocast'){
   const k=findSkill(s,c.id);check(k,'That skill does not belong to your class.');if(!k)return;
   if(c.type==='autocast'){check(typeof c.value==='boolean','Invalid auto-cast setting.');s.autoCast[k.id]=c.value;return;}
   check(isUnlocked(s,k),`${k.name} unlocks at level ${k.unlock}.`);check(!s.respawnAt,'Wait until you respawn.');
   check(s.now>=readyAt(s,k),`${k.name} is cooling down.`);
   check(s.enemies.some(m=>m.hp>0),'No target in range.');
   this.cast(k);return;
  }
  if(c.type==='allocate'){check(ATTRIBUTES.includes(c.value)&&s.hero.points>0,'No attribute points available.');check(c.value!=='Vampirism'||s.hero.attributes.Vampirism<20,'Vampirism is capped at 20.');s.hero.points--;s.hero.attributes[c.value]++;}
  else if(c.type==='claim'){const worn=new Set(Object.values(s.equipped)),room=MAX_INVENTORY-s.inventory.filter(i=>!worn.has(i.id)).length;check(room>0||!s.chest.length,`Inventory is full (${MAX_INVENTORY}). Salvage gear to make room.`);s.inventory.push(...s.chest.splice(0,Math.max(0,room)));if(s.chest.length)this.note(`Inventory full · ${s.chest.length} items wait in the chest.`);}
  else if(c.type==='best'){for(const slot of SLOTS){const best=s.inventory.filter(i=>i.slot===slot).sort((a,b)=>itemPower(b)-itemPower(a))[0];if(best)s.equipped[slot]=best.id;}}
  else if(c.type==='equip'||c.type==='unequip'||c.type==='forge'||c.type==='salvage'||c.type==='lock'){
   const item=s.inventory.find(i=>i.id===c.id);check(item,'Item not found.');if(!item)return;
   if(c.type==='equip')s.equipped[item.slot]=item.id;
   if(c.type==='unequip'){check(s.equipped[item.slot]===item.id,'Item is not equipped.');const worn=new Set(Object.values(s.equipped));check(s.inventory.filter(i=>!worn.has(i.id)).length<MAX_INVENTORY,'Inventory is full. Salvage gear to make room.');delete s.equipped[item.slot];}
   if(c.type==='lock')item.locked=!item.locked;
   if(c.type==='forge'){check(item.forge<60,'Maximum forge level reached.');const price=forgeCost(item);spend(price.lm,price.bone);item.forge++;item.invested+=price.bone;}
   if(c.type==='salvage'){check(!item.locked&&s.equipped[item.slot]!==item.id,'Unequip or replace equipped gear, and unlock before salvaging.');s.bone+=salvageValue(item);s.inventory=s.inventory.filter(i=>i.id!==item.id);}
  }
  else if(c.type==='pet'){check(PETS.includes(c.value),'Unknown companion.');s.pet=c.value;s.shield=false;s.petAt=s.now+8000;}
  else if(c.type==='feed'){check(Number.isSafeInteger(c.amount)&&c.amount>0&&c.amount<=10000,'Invalid feeding amount.');const p=s.pets[s.pet];check(p.level<10,'Companion is at maximum level.');spend(c.amount,c.amount);p.xp+=c.amount*10;while(p.level<10&&p.xp>=petXp(p.level)){p.xp-=petXp(p.level);p.level++;}if(p.level===10)p.xp=0;}
  else if(c.type==='advance')s.autoAdvance=!s.autoAdvance;
  else if(c.type==='travel'){check(Number.isInteger(c.region)&&c.region>=1&&c.region<=s.unlocked,'Region is locked.');check(s.now>=s.travelAt,'Travel is cooling down.');check(!s.respawnAt,'Wait until you respawn.');s.floor=Math.floor((c.region-1)/11)+1;s.region=(c.region-1)%11+1;s.room=1;s.travelAt=s.now+1800000;this.spawn();}
  else if(c.type==='seal'){const next=Math.floor((s.unlocked-1)/11)+2;check(s.cleared>=(next-1)*11,'Defeat all 11 region bosses first.');const cost=sealCost(next);spend(cost.lm,cost.bone);s.floor=next;s.region=1;s.room=1;s.unlocked=(next-1)*11+1;s.respawnAt=0;s.hero.hp=stats(s).maxHp;this.spawn();}
  else if(c.type==='afk'){s.lm+=s.afk.lm;s.bone+=s.afk.bone;this.awardXP(s.afk.xp);let salvaged=0;for(let i=0;i<s.afk.loot;i++)if(!this.stash(drop(s,regionIndex(s))))salvaged++;if(salvaged)this.note(`Chest full · ${salvaged} idle finds salvaged into Bone.`);s.afk={lm:0,xp:0,bone:0,loot:0,seconds:0};}
  else if(c.type==='quest'){const q=QUESTS.find(q=>q.id===c.id);check(q&&!s.questClaims.includes(c.id),'Quest already claimed or missing.');if(q){check(s[q.metric]>=q.target,'Quest is not complete.');s.lm+=q.lm;s.bone+=q.bone;s.questClaims.push(c.id);}}
  else if(c.type==='buy'){check(c.offer==='potion'||c.offer==='cache','Unknown offer.');if(c.offer==='potion'){check(!s.respawnAt&&s.hero.hp<stats(s).maxHp,'Potion unavailable at full health or while fallen.');spend(50,0);s.hero.hp=stats(s).maxHp;}else{check(s.chest.length<MAX_CHEST,'The loot chest is full. Claim it first.');spend(150,0);this.stash(drop(s,regionIndex(s)));}}
  s.hero.hp=Math.min(s.hero.hp,stats(s).maxHp);
 }
}

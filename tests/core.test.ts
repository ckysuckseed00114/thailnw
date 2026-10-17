import {describe,it,expect} from 'vitest';
import {createState} from '../src/core/GameState';
import {CombatEngine} from '../src/core/CombatEngine';
import {forgeCost,itemPower,monsterStats,salvageValue,sealCost,stats,xpForLevel} from '../src/core/Formulas';
import {drop} from '../src/core/DropTable';
import {offlineReward,resume} from '../src/core/AFKManager';
import {migrateSave,validateSave} from '../src/services/Storage';
import {CLASSES,DEFAULT_NAME,MAX_CHEST,MAX_INVENTORY,cleanName,type GameState} from '../src/core/models';
const fixture=()=>{const s=createState(1700000000000,42);const e=new CombatEngine(s);e.dispatch({type:'class',value:'Sword'});return {s,e};};
describe('balance contract',()=>{
 it('uses the specified base stats and XP curve',()=>{const s=createState();expect(stats(s)).toMatchObject({maxHp:100,damage:14,interval:600,crit:.1,critMult:1.8,block:.12,dodge:.3,lifeSteal:0});expect(xpForLevel(2)).toBe(250);expect(xpForLevel(3)).toBe(1160);expect(xpForLevel(4)).toBe(1346);});
 it('scales monsters and floor seals',()=>{expect(monsterStats(2,false).hp).toBe(Math.round(42*1.4));expect(monsterStats(3,true).damage).toBeCloseTo(10*1.35**2);expect(sealCost(2)).toEqual({lm:3000,bone:800});expect(sealCost(3)).toEqual({lm:6000,bone:1600});});
 it('caps dodge and vampirism',()=>{const s=createState();s.hero.attributes.Agility=100;s.hero.attributes.Vampirism=20;expect(stats(s).dodge).toBe(.5);expect(stats(s).lifeSteal).toBe(.05);});
});
describe('authority',()=>{
 it('is deterministic independent of tick chunking',()=>{const a=fixture(),b=fixture();for(let i=0;i<200;i++)a.e.tick(100);for(let i=0;i<400;i++)b.e.tick(50);expect(a.s).toEqual(b.s);});
 it.each(CLASSES)('runs %s combat and casts its skill',c=>{const s=createState(1700000000000,51);const e=new CombatEngine(s);e.dispatch({type:'class',value:c});let skills=0;for(let i=0;i<300;i++)skills+=e.tick(100).filter(e=>e.type==='skill').length;expect(skills).toBeGreaterThan(0);expect(s.kills).toBeGreaterThan(0);expect(s.hero.hp).toBeGreaterThanOrEqual(0);});
 it('respawns at room one after three seconds and retains equipment',()=>{const {s,e}=fixture();s.inventory.push(drop(s,1));s.room=3;s.hero.hp=1;s.hero.attributes.Defense=0;s.enemies.forEach(enemy=>{enemy.damage=10000;enemy.attackAt=s.now;});for(let i=0;i<20&&!s.respawnAt;i++)e.tick(100);expect(s.respawnAt).toBeGreaterThan(0);const respawn=s.respawnAt;e.tick(respawn-s.now-50);expect(s.hero.hp).toBe(0);e.tick(50);expect(s.room).toBe(1);expect(s.hero.hp).toBe(stats(s).maxHp);expect(s.inventory).toHaveLength(1);});
 it('allocates points and forbids invalid allocations',()=>{const {s,e}=fixture();s.hero.points=2;e.dispatch({type:'allocate',value:'Strength'});expect(stats(s).damage).toBe(16);s.hero.attributes.Vampirism=20;expect(()=>e.dispatch({type:'allocate',value:'Vampirism'})).toThrow();expect(s.hero.points).toBe(1);});
 it('forge charges atomically and salvage refunds invested bone',()=>{const {s,e}=fixture();const item=drop(s,1);s.inventory.push(item);const cost=forgeCost(item);expect(()=>e.dispatch({type:'forge',id:item.id})).toThrow();expect(item.forge).toBe(0);s.lm=cost.lm;s.bone=cost.bone;e.dispatch({type:'forge',id:item.id});expect(item.forge).toBe(1);expect(s.lm).toBe(0);expect(s.bone).toBe(0);const value=salvageValue(item);e.dispatch({type:'salvage',id:item.id});expect(s.bone).toBe(value);expect(s.inventory).toHaveLength(0);});
 it('protects locked and equipped gear; equip best uses forged power',()=>{const {s,e}=fixture();const a=drop(s,1),b=drop(s,1);a.slot=b.slot='Weapon';a.base=10;a.forge=30;b.base=20;b.forge=0;s.inventory=[a,b];expect(itemPower(a)).toBeGreaterThan(itemPower(b));e.dispatch({type:'best'});expect(s.equipped.Weapon).toBe(a.id);expect(()=>e.dispatch({type:'salvage',id:a.id})).toThrow();b.locked=true;expect(()=>e.dispatch({type:'salvage',id:b.id})).toThrow();});
 it('claims chest only once',()=>{const {s,e}=fixture();s.chest.push(drop(s,1));e.dispatch({type:'claim'});e.dispatch({type:'claim'});expect(s.inventory).toHaveLength(1);expect(s.chest).toHaveLength(0);});
 it('checks travel unlocks and cooldown',()=>{const {s,e}=fixture();expect(()=>e.dispatch({type:'travel',region:2})).toThrow();s.unlocked=2;e.dispatch({type:'travel',region:2});expect(s.region).toBe(2);expect(()=>e.dispatch({type:'travel',region:1})).toThrow();e.tick(100);expect(s.region).toBe(2);});
 it('gates floor seals behind all bosses and charges doubling cost',()=>{const {s,e}=fixture();s.lm=10000;s.bone=10000;expect(()=>e.dispatch({type:'seal'})).toThrow();s.cleared=11;s.unlocked=11;e.dispatch({type:'seal'});expect(s.floor).toBe(2);expect(s.unlocked).toBe(12);expect(s.lm).toBe(7000);expect(s.bone).toBe(9200);expect(()=>e.dispatch({type:'seal'})).toThrow();});
 it('feeds with both currencies and respects the level cap',()=>{const {s,e}=fixture();s.lm=10000;s.bone=10000;e.dispatch({type:'feed',amount:10});expect(s.pets.Leafhopper.level).toBe(2);expect(s.lm).toBe(9990);expect(s.bone).toBe(9990);e.dispatch({type:'feed',amount:1000});expect(s.pets.Leafhopper).toEqual({level:10,xp:0});expect(()=>e.dispatch({type:'feed',amount:1})).toThrow();expect(()=>e.dispatch({type:'feed',amount:-1})).toThrow();});
 it('claims milestone rewards once',()=>{const {s,e}=fixture();s.kills=10;e.dispatch({type:'quest',id:'first'});expect(s.lm).toBe(100);expect(()=>e.dispatch({type:'quest',id:'first'})).toThrow();});
 it('levels up repeatedly and refills health',()=>{const {s,e}=fixture();s.hero.hp=2;s.afk.xp=250+1160;e.dispatch({type:'afk'});expect(s.hero.level).toBe(3);expect(s.hero.points).toBe(2);expect(s.hero.xp).toBe(0);expect(s.hero.hp).toBe(stats(s).maxHp);});
 it('runs a sustained session without invalid state',()=>{const {s,e}=fixture();for(let i=0;i<720;i++){e.tick(5000);if(i%6===0){e.dispatch({type:'claim'});e.dispatch({type:'best'});}if(s.hero.points)e.dispatch({type:'allocate',value:'Vitality'});}expect(validateSave(s)).toBe(true);expect(s.kills).toBeGreaterThan(20);});
});
describe('bounded storage',()=>{
 const fill=(s:GameState,list:'inventory'|'chest',n:number)=>{for(let i=0;i<n;i++)s[list].push(drop(s,1));};
 it('claims only what fits and keeps the rest in the chest',()=>{const {s,e}=fixture();fill(s,'inventory',MAX_INVENTORY-2);fill(s,'chest',5);e.dispatch({type:'claim'});expect(s.inventory).toHaveLength(MAX_INVENTORY);expect(s.chest).toHaveLength(3);expect(()=>e.dispatch({type:'claim'})).toThrow();expect(s.chest).toHaveLength(3);});
 it('claiming an empty chest with a full inventory is a no-op',()=>{const {s,e}=fixture();fill(s,'inventory',MAX_INVENTORY);expect(()=>e.dispatch({type:'claim'})).not.toThrow();});
 it('salvages combat drops into Bone when the chest is full',()=>{const {s,e}=fixture();fill(s,'chest',MAX_CHEST);s.enemies.forEach(m=>{m.boss=true;m.hp=0;});const bone=s.bone;e.tick(50);expect(s.chest).toHaveLength(MAX_CHEST);expect(s.bone-bone).toBeGreaterThan(3*15);});
 it('salvages AFK loot beyond chest capacity without losing value',()=>{const {s,e}=fixture();fill(s,'chest',MAX_CHEST-10);s.afk.loot=5000;e.dispatch({type:'afk'});expect(s.chest).toHaveLength(MAX_CHEST);expect(s.afk.loot).toBe(0);expect(s.bone).toBeGreaterThanOrEqual(4990*30);});
 it('refuses a loot cache when the chest is full and keeps the gold',()=>{const {s,e}=fixture();fill(s,'chest',MAX_CHEST);s.lm=150;expect(()=>e.dispatch({type:'buy',offer:'cache'})).toThrow();expect(s.lm).toBe(150);});
 it('still loads saves that exceed the caps',()=>{const {s}=fixture();fill(s,'inventory',MAX_INVENTORY+20);expect(validateSave(JSON.parse(JSON.stringify(s)))).toBe(true);});
});
describe('player names',()=>{
 it('normalises valid names in any script and rejects the rest',()=>{expect(cleanName('  Lucky   Rohit ')).toBe('Lucky Rohit');expect(cleanName('ลักกี้')).toBe('ลักกี้');expect(cleanName("O'Brien-2")).toBe("O'Brien-2");for(const bad of ['','A','x'.repeat(17),'<b>hi</b>','-dash',' ',42,null])expect(cleanName(bad)).toBeNull();});
 it('sets the name when the class is chosen, and refuses a bad one atomically',()=>{const a=createState();const e=new CombatEngine(a);expect(()=>e.dispatch({type:'class',value:'Axe',name:'!'})).toThrow();expect(a.started).toBe(false);expect(a.hero.name).toBe(DEFAULT_NAME);e.dispatch({type:'class',value:'Axe',name:' Rohit '});expect(a.hero.name).toBe('Rohit');expect(a.hero.class).toBe('Axe');});
 it('keeps the default name when none is given',()=>{const {s}=fixture();expect(s.hero.name).toBe(DEFAULT_NAME);});
 it('renames later and keeps the old name on invalid input',()=>{const {s,e}=fixture();e.dispatch({type:'name',value:'LuckyRohit'});expect(s.hero.name).toBe('LuckyRohit');expect(()=>e.dispatch({type:'name',value:'x'})).toThrow();expect(s.hero.name).toBe('LuckyRohit');expect(validateSave(JSON.parse(JSON.stringify(s)))).toBe(true);});
 it('migrates version 1 saves to version 2 with the default name',()=>{const {s}=fixture();const old=JSON.parse(JSON.stringify(s));old.version=1;delete old.hero.name;expect(validateSave(old)).toBe(false);const migrated=migrateSave(old) as GameState;expect(migrated.version).toBe(2);expect(migrated.hero.name).toBe(DEFAULT_NAME);expect(migrated.hero.level).toBe(s.hero.level);expect(validateSave(migrated)).toBe(true);expect(old.version).toBe(1);});
 it('leaves unknown versions for validation to reject',()=>{const odd={version:99,hero:{}};expect(migrateSave(odd)).toBe(odd);expect(validateSave(migrateSave(odd))).toBe(false);});
});
describe('offline rewards and saves',()=>{
 function history(s:GameState){s.history=[{at:s.savedAt-1000,seconds:60,lm:60,xp:120,bone:30,loot:2}];}
 it('pays 75% of the measured rate, caps at 8 hours',()=>{const {s}=fixture();history(s);expect(offlineReward(s,s.savedAt+3600000)).toEqual({seconds:3600,lm:2700,xp:5400,bone:1350,loot:90});expect(offlineReward(s,s.savedAt+86400000).seconds).toBe(28800);});
 it('does not invent rewards without history or on backwards clocks',()=>{const {s}=fixture();expect(offlineReward(s,s.savedAt+3600000).lm).toBe(0);history(s);expect(offlineReward(s,s.savedAt-1000).lm).toBe(0);});
 it('ignores performance older than 24 hours',()=>{const {s}=fixture();history(s);s.history[0].at=s.savedAt-86400001;expect(offlineReward(s,s.savedAt+3600000).lm).toBe(0);});
 it('resuming and claiming are idempotent at a given timestamp',()=>{const {s,e}=fixture();history(s);const now=s.savedAt+3600000;resume(s,now);const amount=s.afk.lm;resume(s,now);expect(s.afk.lm).toBe(amount);e.dispatch({type:'afk'});e.dispatch({type:'afk'});expect(s.lm).toBe(amount);});
 it('round-trips valid saves and rejects malformed values',()=>{const {s}=fixture();expect(validateSave(JSON.parse(JSON.stringify(s)))).toBe(true);expect(validateSave({version:1})).toBe(false);s.hero.hp=NaN;expect(validateSave(s)).toBe(false);});
});

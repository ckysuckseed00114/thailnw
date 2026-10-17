import {describe,it,expect} from 'vitest';
import {createState} from '../src/core/GameState';
import {CombatEngine} from '../src/core/CombatEngine';
import {random} from '../src/core/DropTable';
import {ROOMS} from '../src/core/models';

function bossFight(){const s=createState(1700000000000,34),engine=new CombatEngine(s);engine.dispatch({type:'class',value:'Sword'});
 s.room=ROOMS;s.enemies=[];engine.tick(50);s.cooldowns['Sword-1']=s.now+1e9;s.attackAt=s.now+1e9;s.petAt=s.now+1e9;
 return {s,engine,boss:s.enemies[0]};}

describe('eight-room boss encounter',()=>{
 it('has seven normal rooms and a boss in room eight',()=>{expect(ROOMS).toBe(8);const {s}=bossFight();expect(s.room).toBe(8);expect(s.enemies).toHaveLength(1);expect(s.enemies[0].boss).toBe(true);});
 it('summons one guard at each HP threshold without making the boss untargetable',()=>{
  const {s,engine,boss}=bossFight();boss.hp=boss.maxHp*.68;s.attackAt=s.now;engine.tick(50);
  expect(boss.summons).toBe(1);expect(s.enemies).toHaveLength(2);
  engine.dispatch({type:'target',id:boss.id});expect(s.target).toBe(boss.id);
  boss.hp=boss.maxHp*.35;s.attackAt=s.now;engine.tick(50);
  expect(boss.summons).toBe(2);expect(s.enemies).toHaveLength(3);
  s.attackAt=s.now;engine.tick(50);expect(boss.summons).toBe(2);
 });
 it('keeps boss attacks active while guards fight beside it',()=>{
  const {s,engine,boss}=bossFight();boss.hp=boss.maxHp*.68;s.attackAt=s.now;engine.tick(50);
  boss.attackAt=s.now;const before=boss.attacks;
  const events=engine.tick(50);expect(boss.attacks).toBe(before+1);
  expect(events.some(e=>e.type==='hit'&&e.target===0&&e.source===boss.id)).toBe(true);
 });
 it('requires remaining guards to die before the gate opens',()=>{
  const {s,engine,boss}=bossFight();boss.hp=boss.maxHp*.68;s.attackAt=s.now;engine.tick(50);
  boss.hp=0;engine.tick(50);expect(s.enemies.some(e=>!e.boss)).toBe(true);expect(s.nextRoomAt).toBe(0);expect(s.cleared).toBe(0);
  s.enemies.forEach(e=>e.hp=0);engine.tick(50);expect(s.nextRoomAt).toBeGreaterThan(s.now);expect(s.cleared).toBe(1);expect(s.unlocked).toBe(2);
 });
});

describe('tactical evasion',()=>{
 it('can dodge an ordinary hit, retain its shield, and emit a visual cue',()=>{
  const s=createState(1700000000000,25),engine=new CombatEngine(s);engine.dispatch({type:'class',value:'Sword'});
  s.enemies=s.enemies.slice(0,1);const enemy=s.enemies[0];enemy.attackAt=s.now;
  s.attackAt=s.now+1e9;s.petAt=s.now+1e9;s.cooldowns['Sword-1']=s.now+1e9;s.shield=true;
  const seed=Array.from({length:1000},(_,i)=>i+1).find(n=>random({...s,rng:n})<.12)!;s.rng=seed;
  const hp=s.hero.hp,events=engine.tick(50);
  expect(events.some(e=>e.type==='hit'&&e.target===0&&e.source===enemy.id&&e.label==='DODGE')).toBe(true);
  expect(s.hero.hp).toBe(hp);expect(s.shield).toBe(true);
 });
});

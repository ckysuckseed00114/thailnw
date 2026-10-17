import {describe,it,expect} from 'vitest';
import {CombatEngine} from '../src/core/CombatEngine';
import {createState} from '../src/core/GameState';
import {BASE_MOVE_SPEED,DOOR_X,ENTRY_WALK,HALL_WALK,ROOM_TRAVERSE_MS,ROOM_STRIDE,ROOM_WALK,WAVE_X,traversalProgress,walkMs,walkPoint} from '../src/core/RoomTraversal';
import {resume} from '../src/core/AFKManager';
import {stats} from '../src/core/Formulas';
import {focusEnemy} from '../src/core/Targeting';
import {migrateSave,validateSave} from '../src/services/Storage';
function cleared(){const s=createState(1700000000000,42),e=new CombatEngine(s);e.dispatch({type:'class',value:'Sword'});s.enemies.forEach(m=>m.hp=0);e.tick(50);return {s,e};}
describe('connected room traversal',()=>{
 it('opens a timed passage only after the last enemy dies',()=>{const {s,e}=cleared();const hp=s.hero.hp,kills=s.kills;expect(s.nextRoomAt-s.now).toBe(ROOM_TRAVERSE_MS);e.tick(ROOM_TRAVERSE_MS-50);expect(s.room).toBe(1);expect(s.enemies).toHaveLength(0);expect(s.kills).toBe(kills);expect(s.hero.hp).toBe(hp);e.tick(50);expect(s.room).toBe(2);expect(s.enemies).toHaveLength(3);expect(s.nextRoomAt).toBe(0);});
 it('keeps the door closed while enemies remain',()=>{const s=createState(),e=new CombatEngine(s);e.dispatch({type:'class',value:'Sword'});e.tick(50);expect(s.nextRoomAt).toBe(0);});
 it('preserves remaining passage time over a save/resume',()=>{const {s,e}=cleared();e.tick(1500);s.savedAt=s.now;const left=s.nextRoomAt-s.now;resume(s,s.now+3600000);expect(s.nextRoomAt-s.now).toBe(left);});
 it('travel cancels the current passage',()=>{const {s,e}=cleared();s.unlocked=2;e.dispatch({type:'travel',region:2});expect(s.nextRoomAt).toBe(0);expect(s.region).toBe(2);expect(s.room).toBe(1);expect(s.enemies).toHaveLength(3);});
 it('crosses the boss gate into the next region',()=>{const {s,e}=cleared();s.room=8;e.tick(5000);e.tick(1500);expect(s.region).toBe(2);expect(s.room).toBe(1);});
 it('times the room walk from move speed, so a faster hero arrives sooner',()=>{const s=createState(1700000000000,42),e=new CombatEngine(s);e.dispatch({type:'class',value:'Sword'});
  expect(stats(s).moveSpeed).toBe(BASE_MOVE_SPEED);s.enemies.forEach(m=>m.hp=0);e.tick(50);expect(s.nextRoomAt-s.walkFrom).toBe(walkMs(ROOM_WALK,BASE_MOVE_SPEED));
  expect(walkMs(ROOM_WALK,BASE_MOVE_SPEED*1.5)).toBe(Math.round(walkMs(ROOM_WALK,BASE_MOVE_SPEED)/1.5));});
 it('keeps walking past the checkpoint into the next room, whose first hall wakes on arrival',()=>{const {s,e}=cleared();e.tick(ROOM_TRAVERSE_MS);expect(s.room).toBe(2);
  expect(s.hallAt-s.walkFrom).toBe(walkMs(ENTRY_WALK(0),BASE_MOVE_SPEED));expect(ENTRY_WALK(0)).toBe(ROOM_STRIDE+WAVE_X[0]-DOOR_X);expect(focusEnemy(s)).toBeUndefined();
  e.tick(s.hallAt-s.now);expect(focusEnemy(s)?.wave).toBe(0);});
});
function hallFight(){const s=createState(1700000000000,42),e=new CombatEngine(s);e.dispatch({type:'class',value:'Sword'});for(const id of Object.keys(s.cooldowns))e.dispatch({type:'autocast',id,value:false});return {s,e};}
describe('walking through a room hall by hall',()=>{
 it('fights the left hall first while the right hall sleeps',()=>{const {s,e}=hallFight();const [front,...rest]=s.enemies;expect(front.wave).toBe(0);expect(rest.every(m=>m.wave===1)).toBe(true);
  rest.forEach(m=>m.attackAt=s.now);s.attackAt=s.now+1e9;const ev=e.tick(50);expect(ev.some(x=>x.type==='hit'&&rest.some(m=>m.id===x.source))).toBe(false);
  expect(focusEnemy(s)).toBe(front);expect(()=>e.dispatch({type:'target',id:rest[0].id})).toThrow();});
 it('walks into the next hall at move speed, then wakes its monsters',()=>{const {s,e}=hallFight();s.enemies[0].hp=0;e.tick(50);
  expect(s.hallAt-s.walkFrom).toBe(walkMs(HALL_WALK,BASE_MOVE_SPEED));expect(focusEnemy(s)).toBeUndefined();expect(s.nextRoomAt).toBe(0);
  const hp=s.hero.hp;e.tick(s.hallAt-s.now-50);expect(s.wave).toBe(0);expect(s.hero.hp).toBe(hp);
  expect(e.tick(50).some(x=>x.type==='wake')).toBe(true);expect(s.hallAt).toBe(0);expect(s.wave).toBe(1);expect(focusEnemy(s)?.wave).toBe(1);expect(s.enemies.every(m=>m.attackAt>=s.now+1200)).toBe(true);});
 it('walks straight to the boss hall in the boss room',()=>{const {s,e}=hallFight();s.room=8;s.enemies=[];e.tick(50);expect(s.enemies[0].wave).toBe(1);expect(s.hallAt).toBeGreaterThan(s.now);
  e.tick(s.hallAt-s.now);expect(focusEnemy(s)?.boss).toBe(true);});
 it('keeps the hall walk over a save/resume and migrates v5 saves into one hall',()=>{const {s,e}=hallFight();s.enemies[0].hp=0;e.tick(50);s.savedAt=s.now;const left=s.hallAt-s.now;resume(s,s.now+60000);expect(s.hallAt-s.now).toBe(left);
  const old=JSON.parse(JSON.stringify(s));old.version=5;delete old.wave;delete old.hallAt;delete old.walkFrom;old.enemies.forEach((m:{wave?:number})=>delete m.wave);
  const m=migrateSave(old) as typeof s;expect(m).toMatchObject({version:6,wave:0,hallAt:0});expect(m.enemies.every(x=>x.wave===0)).toBe(true);expect(validateSave(m)).toBe(true);});
});
describe('room path',()=>{
 it('walks at an even pace with no pauses',()=>{const start={x:900,y:520},to={x:DOOR_X,y:465};expect(walkPoint(start,to,0)).toEqual(start);expect(walkPoint(start,to,1)).toEqual(to);
  const step=(p:number)=>{const a=walkPoint(start,to,p),b=walkPoint(start,to,p+.1);return Math.hypot(b.x-a.x,b.y-a.y);};for(const p of [0,.3,.6,.9])expect(step(p)).toBeCloseTo(step(0),6);expect(traversalProgress(500,4000,7000)).toBe(0);expect(traversalProgress(5500,4000,7000)).toBe(.5);expect(traversalProgress(7000,4000,7000)).toBe(1);});
});

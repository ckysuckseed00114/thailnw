import {describe,it,expect} from 'vitest';
import {CombatEngine} from '../src/core/CombatEngine';
import {createState} from '../src/core/GameState';
import {ROOM_TRAVERSE_MS,ROOM_STRIDE,traversalPoint,traversalProgress} from '../src/core/RoomTraversal';
import {resume} from '../src/core/AFKManager';
function cleared(){const s=createState(1700000000000,42),e=new CombatEngine(s);e.dispatch({type:'class',value:'Sword'});s.enemies.forEach(m=>m.hp=0);e.tick(50);return {s,e};}
describe('connected room traversal',()=>{
 it('opens a timed passage only after the last enemy dies',()=>{const {s,e}=cleared();const hp=s.hero.hp,kills=s.kills;expect(s.nextRoomAt-s.now).toBe(ROOM_TRAVERSE_MS);e.tick(5000);e.tick(1450);expect(s.room).toBe(1);expect(s.enemies).toHaveLength(0);expect(s.kills).toBe(kills);expect(s.hero.hp).toBe(hp);e.tick(50);expect(s.room).toBe(2);expect(s.enemies).toHaveLength(3);expect(s.nextRoomAt).toBe(0);});
 it('keeps the door closed while enemies remain',()=>{const s=createState(),e=new CombatEngine(s);e.dispatch({type:'class',value:'Sword'});e.tick(50);expect(s.nextRoomAt).toBe(0);});
 it('preserves remaining passage time over a save/resume',()=>{const {s,e}=cleared();e.tick(1500);s.savedAt=s.now;const left=s.nextRoomAt-s.now;resume(s,s.now+3600000);expect(s.nextRoomAt-s.now).toBe(left);});
 it('travel cancels the current passage',()=>{const {s,e}=cleared();s.unlocked=2;e.dispatch({type:'travel',region:2});expect(s.nextRoomAt).toBe(0);expect(s.region).toBe(2);expect(s.room).toBe(1);expect(s.enemies).toHaveLength(3);});
 it('crosses the boss gate into the next region',()=>{const {s,e}=cleared();s.room=5;e.tick(5000);e.tick(1500);expect(s.region).toBe(2);expect(s.room).toBe(1);});
 it('has a continuous path through the door to the next room',()=>{const start={x:950,y:520};expect(traversalPoint(start,0,0)).toEqual(start);expect(traversalPoint(start,0,1)).toEqual({x:ROOM_STRIDE+590,y:465});for(const boundary of [.08,.45,.66]){const a=traversalPoint(start,0,boundary-.00001),b=traversalPoint(start,0,boundary+.00001);expect(Math.hypot(a.x-b.x,a.y-b.y)).toBeLessThan(1);}expect(traversalProgress(500,7000)).toBe(0);expect(traversalProgress(7000,7000)).toBe(1);});
});

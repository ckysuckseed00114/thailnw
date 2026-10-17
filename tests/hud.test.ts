import {describe,it,expect} from 'vitest';
import {createState} from '../src/core/GameState';
import {CombatEngine} from '../src/core/CombatEngine';
import {skillCharge} from '../src/ui/hud/PlayerFrame';
import {trackedItems} from '../src/ui/hud/QuestTracker';
import {ROOMS} from '../src/core/models';
describe('HUD quest tracker',()=>{
 const fresh=()=>{const s=createState(1700000000000,5);new CombatEngine(s).dispatch({type:'class',value:'Sword'});return s;};
 it('lists the room objective first and at most three lines',()=>{const items=trackedItems(fresh());expect(items[0].id).toBe('room');expect(items).toHaveLength(3);expect(items[0]).toMatchObject({done:0,total:3});});
 it('counts cleared enemies and switches to the warden in the last room',()=>{const s=fresh();s.enemies.splice(0,2);expect(trackedItems(s)[0].done).toBe(2);s.room=ROOMS;s.enemies=s.enemies.slice(0,1);expect(trackedItems(s)[0]).toMatchObject({total:1,detail:'The Hollow Warden'});});
 it('puts claimable quests first and drops claimed ones',()=>{const s=fresh();s.bosses=3;const items=trackedItems(s);expect(items[1]).toMatchObject({id:'warden',ready:true});s.questClaims.push('warden','first');expect(trackedItems(s).map(i=>i.id)).toEqual(['room','veteran']);});
});
describe('HUD skill power (SP) bar',()=>{
 const ready=()=>{const s=createState(1700000000000,3);new CombatEngine(s).dispatch({type:'class',value:'Wand'});return s;};
 it('fills from empty to full over the auto-skill cooldown',()=>{const s=ready();s.skillAt=s.now+7000;expect(skillCharge(s)).toBe(0);s.skillAt=s.now+3500;expect(skillCharge(s)).toBeCloseTo(.5);s.skillAt=s.now;expect(skillCharge(s)).toBe(1);s.skillAt=s.now-500;expect(skillCharge(s)).toBe(1);});
 it('is empty while the hero is down',()=>{const s=ready();s.skillAt=s.now;s.respawnAt=s.now+2000;expect(skillCharge(s)).toBe(0);});
 it('matches the core cooldown after a skill fires',()=>{const s=ready();const e=new CombatEngine(s);let fired=false;for(let i=0;i<200&&!fired;i++)fired=e.tick(100).some(ev=>ev.type==='skill');expect(fired).toBe(true);expect(skillCharge(s)).toBeLessThan(.05);});
});

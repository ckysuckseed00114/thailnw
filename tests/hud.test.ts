import {describe,it,expect} from 'vitest';
import {createState} from '../src/core/GameState';
import {CombatEngine} from '../src/core/CombatEngine';
import {trackedItems} from '../src/ui/hud/QuestTracker';
import {ROOMS} from '../src/core/models';
describe('HUD quest tracker',()=>{
 const fresh=()=>{const s=createState(1700000000000,5);new CombatEngine(s).dispatch({type:'class',value:'Sword'});return s;};
 it('lists the room objective first and at most three lines',()=>{const items=trackedItems(fresh());expect(items[0].id).toBe('room');expect(items).toHaveLength(3);expect(items[0]).toMatchObject({done:0,total:3});});
 it('counts cleared enemies and switches to the warden in the last room',()=>{const s=fresh();s.enemies.splice(0,2);expect(trackedItems(s)[0].done).toBe(2);s.room=ROOMS;s.enemies=s.enemies.slice(0,1);expect(trackedItems(s)[0]).toMatchObject({total:1,detail:'The Hollow Warden'});});
 it('puts claimable quests first and drops claimed ones',()=>{const s=fresh();s.bosses=3;const items=trackedItems(s);expect(items[1]).toMatchObject({id:'warden',ready:true});s.questClaims.push('warden','first');expect(trackedItems(s).map(i=>i.id)).toEqual(['room','veteran']);});
});
describe('boss objective',()=>{
 it('includes summoned guards in the room total',()=>{const s=createState(1700000000000,3);const e=new CombatEngine(s);e.dispatch({type:'class',value:'Wand'});s.room=ROOMS;s.enemies=[];e.tick(50);const boss=s.enemies[0];boss.hp=boss.maxHp*.6;s.cooldowns['Wand-1']=s.now;e.dispatch({type:'cast',id:'Wand-1'});expect(boss.summons).toBeGreaterThanOrEqual(1);expect(trackedItems(s)[0].total).toBe(1+boss.summons);});
});

import {describe,it,expect} from 'vitest';
import {createState} from '../src/core/GameState';
import {CombatEngine} from '../src/core/CombatEngine';
import {skillCharge} from '../src/ui/hud/PlayerFrame';
describe('HUD skill power (SP) bar',()=>{
 const ready=()=>{const s=createState(1700000000000,3);new CombatEngine(s).dispatch({type:'class',value:'Wand'});return s;};
 it('fills from empty to full over the auto-skill cooldown',()=>{const s=ready();s.skillAt=s.now+7000;expect(skillCharge(s)).toBe(0);s.skillAt=s.now+3500;expect(skillCharge(s)).toBeCloseTo(.5);s.skillAt=s.now;expect(skillCharge(s)).toBe(1);s.skillAt=s.now-500;expect(skillCharge(s)).toBe(1);});
 it('is empty while the hero is down',()=>{const s=ready();s.skillAt=s.now;s.respawnAt=s.now+2000;expect(skillCharge(s)).toBe(0);});
 it('matches the core cooldown after a skill fires',()=>{const s=ready();const e=new CombatEngine(s);let fired=false;for(let i=0;i<200&&!fired;i++)fired=e.tick(100).some(ev=>ev.type==='skill');expect(fired).toBe(true);expect(skillCharge(s)).toBeLessThan(.05);});
});

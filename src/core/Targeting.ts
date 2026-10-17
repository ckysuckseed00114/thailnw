import type {Enemy,GameState} from './models';
/** The enemy single-target attacks go to: the player's pick while it lives, otherwise the front of the line (original behaviour). */
export function focusEnemy(s:GameState):Enemy|undefined{return (s.target?s.enemies.find(e=>e.id===s.target&&e.hp>0):undefined)??s.enemies[0];}
/** Next living enemy after the current focus, wrapping around; 0 when none. */
export function nextTarget(s:GameState):number{
 const alive=s.enemies.filter(e=>e.hp>0);if(!alive.length)return 0;
 const at=alive.findIndex(e=>e.id===focusEnemy(s)?.id);return alive[(at+1)%alive.length].id;
}

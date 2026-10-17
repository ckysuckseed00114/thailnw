import type {Enemy,GameState} from './models';
/** Enemies in the hall the hero is fighting in; the next hall's wave sleeps until the hero walks in. */
export const isActive=(s:GameState,e:Enemy)=>e.wave===s.wave&&!s.hallAt;
export const activeEnemies=(s:GameState)=>s.enemies.filter(e=>e.hp>0&&isActive(s,e));
/** The enemy single-target attacks go to: the player's pick while it lives, otherwise the front of the active line. */
export function focusEnemy(s:GameState):Enemy|undefined{return (s.target?s.enemies.find(e=>e.id===s.target&&e.hp>0&&isActive(s,e)):undefined)??s.enemies.find(e=>isActive(s,e));}
/** Next living active enemy after the current focus, wrapping around; 0 when none. */
export function nextTarget(s:GameState):number{
 const alive=activeEnemies(s);if(!alive.length)return 0;
 const at=alive.findIndex(e=>e.id===focusEnemy(s)?.id);return alive[(at+1)%alive.length].id;
}

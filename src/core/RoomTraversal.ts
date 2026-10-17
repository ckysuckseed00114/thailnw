// Authority and renderer share the walk timing; no client acknowledgement can skip combat.
/** Base walking speed in world px/s. Every walk lasts distance ÷ stats().moveSpeed, so faster heroes clear rooms sooner. */
export const BASE_MOVE_SPEED=230;
export const walkMs=(distance:number,speed:number)=>Math.round(distance/Math.max(1,speed)*1000);
export const ROOM_STRIDE=1440;
/** Where the hero stands after a fresh start (class pick, travel, respawn): just inside the left hall. */
export const ROOM_ENTRY_X=250;
/** Checkpoint in the passage between rooms: walking past it is what moves the hero into the next room. */
export const DOOR_X=1434;
/** Where the hero fights each hall's wave (0 = left hall, 1 = right hall), in room coordinates. */
export const WAVE_X=[366,790] as const;
/** Where the right-hall fight usually ends; the walk to the checkpoint starts here. */
export const FIGHT_END_X=800;
/** Nominal walk lengths (world px). Rooms join up, so the next room's left hall is DOOR_X → ROOM_STRIDE+WAVE_X[0]. */
export const HALL_WALK=WAVE_X[1]-WAVE_X[0];
export const ROOM_WALK=DOOR_X-FIGHT_END_X;
export const ENTRY_WALK=(wave:number)=>ROOM_STRIDE+WAVE_X[wave]-DOOR_X;
/** Clearing the last hall → checkpoint at base speed. */
export const ROOM_TRAVERSE_MS=walkMs(ROOM_WALK,BASE_MOVE_SPEED);
export function traversalProgress(now:number,from:number,until:number){return until<=from?1:Math.max(0,Math.min(1,(now-from)/(until-from)));}
/** Straight, even-paced walk from where the hero stands to a point; no pauses, so speed stays constant. */
export function walkPoint(start:{x:number;y:number},to:{x:number;y:number},progress:number){
 const p=Math.max(0,Math.min(1,progress));return {x:start.x+(to.x-start.x)*p,y:start.y+(to.y-start.y)*p};
}

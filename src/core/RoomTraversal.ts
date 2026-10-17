// Authority and renderer share the walk timing; no client acknowledgement can skip combat.
/** Base walking speed in world px/s. Walk durations come from distance ÷ stats().moveSpeed, so faster heroes clear rooms sooner. */
export const BASE_MOVE_SPEED=230;
/** Path lengths the core times walks by: left-hall fight → right-hall entry, and right hall → the next room's entry. */
export const HALL_WALK=460;
export const ROOM_WALK=690;
export const walkMs=(distance:number,speed:number)=>Math.round(distance/Math.max(1,speed)*1000);
/** Room-to-room walk at base speed (3s). */
export const ROOM_TRAVERSE_MS=walkMs(ROOM_WALK,BASE_MOVE_SPEED);
export const ROOM_STRIDE=1440;
/** Where the hero stands on entering a room: just inside the left hall, so the whole room lies ahead. */
export const ROOM_ENTRY_X=250;
/** Crossing this point (just inside the right hall) wakes the hall's monsters. */
export const HALL_ENTRY_X=790;
/** Progress at which each leg of the walk ends: pause at the door, cross the hall, the passage, then into the next room. */
export const TRAVERSE_BREAKS=[.08,.43,.76,1] as const;
export function traversalProgress(now:number,from:number,until:number){return until<=from?1:Math.max(0,Math.min(1,(now-from)/(until-from)));}
export function hallPoint(start:{x:number;y:number},offset:number,progress:number){
 const p=Math.max(0,Math.min(1,progress)),to={x:offset+HALL_ENTRY_X,y:465};
 return {x:start.x+(to.x-start.x)*p,y:start.y+(to.y-start.y)*p};
}
export function traversalPoint(start:{x:number;y:number},offset:number,progress:number){
 const p=Math.max(0,Math.min(1,progress));
 const points=[start,{x:offset+1260,y:465},{x:offset+1510,y:465},{x:offset+ROOM_STRIDE+ROOM_ENTRY_X,y:465}];
 const breaks=TRAVERSE_BREAKS;
 if(p<=breaks[0])return start;
 for(let i=0;i<3;i++){if(p<=breaks[i+1]){const t=(p-breaks[i])/(breaks[i+1]-breaks[i]);return {x:points[i].x+(points[i+1].x-points[i].x)*t,y:points[i].y+(points[i+1].y-points[i].y)*t};}}
 return points[3];
}

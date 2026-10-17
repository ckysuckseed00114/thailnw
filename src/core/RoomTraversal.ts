// Authority and renderer share the duration; no client acknowledgement can skip combat.
// 3s keeps the walk through the door readable without stalling the fight (6.5s felt sluggish).
export const ROOM_TRAVERSE_MS=3000;
export const ROOM_STRIDE=1440;
/** Where the hero stands on entering a room: just inside the left hall, so the whole room lies ahead. */
export const ROOM_ENTRY_X=250;
/** Progress at which each leg of the walk ends: pause at the door, cross the hall, the passage, then into the next room. */
export const TRAVERSE_BREAKS=[.08,.43,.76,1] as const;
export function traversalProgress(now:number,until:number){return Math.max(0,Math.min(1,1-(until-now)/ROOM_TRAVERSE_MS));}
export function traversalPoint(start:{x:number;y:number},offset:number,progress:number){
 const p=Math.max(0,Math.min(1,progress));
 const points=[start,{x:offset+1260,y:465},{x:offset+1510,y:465},{x:offset+ROOM_STRIDE+ROOM_ENTRY_X,y:465}];
 const breaks=TRAVERSE_BREAKS;
 if(p<=breaks[0])return start;
 for(let i=0;i<3;i++){if(p<=breaks[i+1]){const t=(p-breaks[i])/(breaks[i+1]-breaks[i]);return {x:points[i].x+(points[i+1].x-points[i].x)*t,y:points[i].y+(points[i+1].y-points[i].y)*t};}}
 return points[3];
}

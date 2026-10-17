// Authority and renderer share the duration; no client acknowledgement can skip combat.
export const ROOM_TRAVERSE_MS=6500;
export const ROOM_STRIDE=1440;
export function traversalProgress(now:number,until:number){return Math.max(0,Math.min(1,1-(until-now)/ROOM_TRAVERSE_MS));}
export function traversalPoint(start:{x:number;y:number},offset:number,progress:number){
 const p=Math.max(0,Math.min(1,progress));
 const points=[start,{x:offset+1260,y:465},{x:offset+1510,y:465},{x:offset+ROOM_STRIDE+590,y:465}];
 const breaks=[.08,.45,.66,1];
 if(p<=breaks[0])return start;
 for(let i=0;i<3;i++){if(p<=breaks[i+1]){const t=(p-breaks[i])/(breaks[i+1]-breaks[i]);return {x:points[i].x+(points[i+1].x-points[i].x)*t,y:points[i].y+(points[i+1].y-points[i].y)*t};}}
 return points[3];
}

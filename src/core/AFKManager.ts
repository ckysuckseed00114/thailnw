import type { GameState, Reward } from './models';
export function offlineReward(s:GameState,now:number):Reward & {seconds:number}{
 const seconds=Math.min(8*3600,Math.max(0,(now-s.savedAt)/1000));
 const samples=s.history.filter(h=>h.at>=s.savedAt-86400000&&h.at<=s.savedAt);
 const duration=samples.reduce((sum,h)=>sum+h.seconds,0);
 const out={lm:0,xp:0,bone:0,loot:0,seconds};
 if(duration<10||!s.started)return out;
 for(const k of ['lm','xp','bone','loot'] as const)out[k]=Math.floor(samples.reduce((sum,h)=>sum+h[k],0)/duration*seconds*.75);
 return out;
}
export function resume(s:GameState,now:number){
 const reward=offlineReward(s,now);
 for(const k of ['lm','xp','bone','loot','seconds'] as const)s.afk[k]+=reward[k];
 const delta=Math.max(0,now-s.now);
 for(const k of ['attackAt','petAt','respawnAt','nextRoomAt'] as const)if(s[k])s[k]+=delta;
 for(const id of Object.keys(s.cooldowns))if(s.cooldowns[id])s.cooldowns[id]+=delta;
 for(const e of s.enemies){e.attackAt+=delta;if(e.stunnedUntil)e.stunnedUntil+=delta;}
 s.now=Math.max(s.now,now);s.savedAt=s.now;
}

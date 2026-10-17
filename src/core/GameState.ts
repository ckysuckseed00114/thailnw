import { DEFAULT_NAME, type GameState, type GameEvent, type Command } from './models';
export function createState(now=Date.now(),seed=123456789):GameState{return {
 version:2,rng:seed||1,serial:1,now,savedAt:now,started:false,
 hero:{name:DEFAULT_NAME,class:'Sword',level:1,xp:0,hp:100,points:0,attributes:{Strength:0,Vitality:0,Agility:0,Defense:0,Vampirism:0}},
 lm:0,bone:0,inventory:[],chest:[],equipped:{},floor:1,region:1,room:1,unlocked:1,cleared:0,autoAdvance:true,travelAt:0,
 enemies:[],attackAt:now,skillAt:now+7000,petAt:now+8000,respawnAt:0,nextRoomAt:0,shrine:null,
 pets:{Leafhopper:{level:1,xp:0},Shellby:{level:1,xp:0},Craboulder:{level:1,xp:0},Emberkit:{level:1,xp:0}},pet:'Leafhopper',shield:false,
 kills:0,bosses:0,questClaims:[],history:[],afk:{lm:0,xp:0,bone:0,loot:0,seconds:0},log:['Your descent begins. The halls are listening.']
};}
export interface Authority { state:GameState; dispatch(command:Command):void; tick(ms:number):GameEvent[] }
export class Store {
 private subscribers=new Set<(s:GameState,events:GameEvent[])=>void>();
 constructor(public authority:Authority){}
 get state(){return this.authority.state;}
 subscribe(fn:(s:GameState,events:GameEvent[])=>void){this.subscribers.add(fn);fn(this.state,[]);return()=>this.subscribers.delete(fn);}
 notify(events:GameEvent[]=[]){for(const fn of this.subscribers)fn(this.state,events);}
 dispatch(command:Command){this.authority.dispatch(command);this.notify();}
 tick(ms:number){this.notify(this.authority.tick(ms));}
}

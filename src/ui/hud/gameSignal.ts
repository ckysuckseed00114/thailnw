import {signal} from '@preact/signals';
import type {Store} from '../../core/GameState';
import type {GameState} from '../../core/models';

// The authority mutates one GameState object in place, so components subscribe to a revision counter instead of the object.
const revision=signal(0);
let current:Store|null=null;
export type FeedEntry={id:number;at:number;channel:'system'|'general'|'whisper';text:string};
const FEED_MAX=200;
/** Client-side message history for the chat box (system journal now; player chat arrives with the server). */
export const feed=signal<FeedEntry[]>([]);
/** performance.now() of the latest cast per skill id, for hotbar flashes. */
export const lastCast=signal<Record<string,number>>({});
let feedId=0;
function push(entries:FeedEntry[]){if(entries.length)feed.value=[...feed.value,...entries].slice(-FEED_MAX);}
export function bindStore(store:Store){
 current=store;feedId=0;
 // Seed with the saved journal (stored newest first) so the box is not empty on load.
 feed.value=[...store.state.log].reverse().map(text=>({id:++feedId,at:store.state.now,channel:'system' as const,text}));
 return store.subscribe((s,events)=>{
  revision.value++;
  const lines:FeedEntry[]=[];let casts:Record<string,number>|null=null;
  for(const e of events){
   if(e.type==='log'&&e.label)lines.push({id:++feedId,at:s.now,channel:'system',text:e.label});
   if(e.type==='skill'&&e.skill)(casts??={...lastCast.value})[e.skill]=performance.now();
  }
  push(lines);if(casts)lastCast.value=casts;
 });
}
/** Read inside a component to re-render on every store notification. */
export function useGame():GameState{void revision.value;if(!current)throw new Error('HUD used before bindStore()');return current.state;}
export function currentStore(){if(!current)throw new Error('HUD used before bindStore()');return current;}

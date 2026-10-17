import {signal} from '@preact/signals';
import type {Store} from '../../core/GameState';
import type {GameState} from '../../core/models';

// The authority mutates one GameState object in place, so components subscribe to a revision counter instead of the object.
const revision=signal(0);
let current:Store|null=null;
export function bindStore(store:Store){current=store;return store.subscribe(()=>{revision.value++;});}
/** Read inside a component to re-render on every store notification. */
export function useGame():GameState{void revision.value;if(!current)throw new Error('HUD used before bindStore()');return current.state;}

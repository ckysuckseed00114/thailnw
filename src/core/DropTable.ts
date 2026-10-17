import { RARITIES,SLOTS,type GameState,type Item } from './models';
// Serializable PRNG. The authority owns this seed; clients must never choose it on a live server.
export function random(s:GameState){let x=s.rng|0;x^=x<<13;x^=x>>>17;x^=x<<5;s.rng=x>>>0;return s.rng/4294967296;}
export function drop(s:GameState,region:number):Item{
 const roll=random(s);const rarity=RARITIES[roll<.50?0:roll<.77?1:roll<.92?2:roll<.98?3:roll<.998?4:5];
 const slot=SLOTS[Math.floor(random(s)*SLOTS.length)];
 const prefixes=['Weathered','Verdant','Runed','Eclipsed','Sovereign','Starfallen'];
 const r=RARITIES.indexOf(rarity);
 return {id:++s.serial,slot,rarity,name:`${prefixes[r]} ${slot}`,base:Math.round((3+region*2)*(1+r*.65)),forge:0,invested:0,locked:false};
}

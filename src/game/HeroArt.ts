import type {HeroClass} from '../core/models';
import {HAND_FROM_FEET,heroSprite,spriteRects,weaponSprite} from './PixelSprites';
export const HERO_DESIGNS:Record<HeroClass,{title:string;description:string;accent:string}>={
 Sword:{title:'Dawnwarden',accent:'#f0c25a',description:'Gilded plate, a sea-blue cape and a broad knight blade. A steadfast guardian of the dawn.'},
 Spear:{title:'Stormlancer',accent:'#e5b36e',description:'Ivory armor, a crimson plume and a long gilded spear. Precision at the edge of the storm.'},
 Wand:{title:'Astral Arcanist',accent:'#b9a1f3',description:'An indigo star hat, layered robes and a luminous crystal staff. Keeper of forgotten fire.'},
 Axe:{title:'Emberbreaker',accent:'#f0a66d',description:'A horned helm, a copper beard and a great iron axe. Every strike carries the weight of the forge.'},
 Dagger:{title:'Nightveil',accent:'#8edbb6',description:'A deep emerald hood, a masked face and a crescent dagger. A whisper beyond the torchlight.'}
};
/** Same pixel data as the in-world sprite, with the weapon held at the hand. */
export function heroSVG(kind:HeroClass){
 const body=heroSprite(kind),weapon=weaponSprite(kind),h=body.rows.length,ww=weapon.rows[0].length,wh=weapon.rows.length;
 const wx=13-Math.floor(ww/2),wy=h-HAND_FROM_FEET-(wh-3),top=Math.min(0,wy)-1,right=Math.max(17,wx+ww+1);
 return `<svg viewBox="-1 ${top} ${right+1} ${h+2-top}" class="hero-art" role="img" aria-label="${kind} ${HERO_DESIGNS[kind].title}" shape-rendering="crispEdges"><ellipse cx="8" cy="${h}" rx="7" ry="1.4" fill="#000" opacity=".35"/>${spriteRects(body)}${spriteRects(weapon,wx,wy)}</svg>`;
}

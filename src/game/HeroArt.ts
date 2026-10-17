import type {HeroClass} from '../core/models';
import {HAND_FROM_FEET,heroSprite,spriteRects,weaponSprite} from './PixelSprites';
import {SWORD_ART} from './SwordArt';
import {AXE_ART} from './AxeArt';
import {SPEAR_ART} from './SpearArt';
export const HERO_DESIGNS:Record<HeroClass,{title:string;description:string;accent:string}>={
 Sword:{title:'Dawnwarden',accent:'#f0c25a',description:'A veteran swordsman in burnished gold plate, a navy cape and a broad steel blade.'},
 Spear:{title:'Crimson Lancer',accent:'#c99465',description:'An armored spearman with gold and dark red accents, a shadowed cloak and an ornate long spear.'},
 Wand:{title:'Astral Arcanist',accent:'#b9a1f3',description:'An indigo star hat, layered robes and a luminous crystal staff. Keeper of forgotten fire.'},
 Axe:{title:'Emberbreaker',accent:'#f0a66d',description:'A battle-scarred axe veteran in burnished gold plate and a navy cloak, carrying a runic double-headed axe.'},
 Dagger:{title:'Nightveil',accent:'#8edbb6',description:'A deep emerald hood, a masked face and a crescent dagger. A whisper beyond the torchlight.'}
};
/** Same pixel data as the in-world sprite, with the weapon held at the hand. */
export function heroSVG(kind:HeroClass){
 if(kind==='Sword')return `<svg viewBox="8 0 48 64" class="hero-art" role="img" aria-label="Sword ${HERO_DESIGNS.Sword.title}" shape-rendering="crispEdges"><image href="${SWORD_ART.portrait}" x="0" y="0" width="64" height="64" style="image-rendering:pixelated"/></svg>`;
 if(kind==='Spear')return `<svg viewBox="8 0 48 64" class="hero-art" role="img" aria-label="Spear ${HERO_DESIGNS.Spear.title}" shape-rendering="crispEdges"><image href="${SPEAR_ART.portrait}" x="0" y="0" width="64" height="64" style="image-rendering:pixelated"/></svg>`;
 if(kind==='Axe')return `<svg viewBox="8 0 48 64" class="hero-art" role="img" aria-label="Axe ${HERO_DESIGNS.Axe.title}" shape-rendering="crispEdges"><image href="${AXE_ART.portrait}" x="0" y="0" width="64" height="64" style="image-rendering:pixelated"/></svg>`;
 const body=heroSprite(kind),weapon=weaponSprite(kind),h=body.rows.length,ww=weapon.rows[0].length,wh=weapon.rows.length;
 const wx=13-Math.floor(ww/2),wy=h-HAND_FROM_FEET-(wh-3),top=Math.min(0,wy)-1,right=Math.max(17,wx+ww+1);
 return `<svg viewBox="-1 ${top} ${right+1} ${h+2-top}" class="hero-art" role="img" aria-label="${kind} ${HERO_DESIGNS[kind].title}" shape-rendering="crispEdges"><ellipse cx="8" cy="${h}" rx="7" ry="1.4" fill="#000" opacity=".35"/>${spriteRects(body)}${spriteRects(weapon,wx,wy)}</svg>`;
}

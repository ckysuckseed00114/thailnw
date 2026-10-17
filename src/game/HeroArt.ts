import type {HeroClass} from '../core/models';
export type Pixel={x:number;y:number;w:number;h:number;color:string};
export const HERO_DESIGNS:Record<HeroClass,{title:string;description:string;accent:string;cloth:string;shade:string;hair:string;light:string}>={
 Sword:{title:'Dawnwarden',description:'Silver plate, a teal tabard and a broad knight blade. A steadfast guardian of the dawn.',accent:'#82c9dd',cloth:'#508798',shade:'#294655',hair:'#9a5840',light:'#d4e8e8'},
 Spear:{title:'Stormlancer',description:'Ivory armor, a crimson scarf and a long gilded spear. Precision at the edge of the storm.',accent:'#e5b36e',cloth:'#a94e51',shade:'#582f40',hair:'#40506b',light:'#ede5c9'},
 Wand:{title:'Astral Arcanist',description:'An indigo star hat, layered robes and a luminous crystal staff. Keeper of forgotten fire.',accent:'#b9a1f3',cloth:'#6d589b',shade:'#373052',hair:'#d2c4ae',light:'#cdc1ed'},
 Axe:{title:'Emberbreaker',description:'Braided copper hair, fur shoulders and a great iron axe. Every strike carries the weight of the forge.',accent:'#f0a66d',cloth:'#986143',shade:'#543635',hair:'#a65334',light:'#d9b58a'},
 Dagger:{title:'Nightveil',description:'A deep emerald hood, a violet mantle and paired crescent daggers. A whisper beyond the torchlight.',accent:'#8edbb6',cloth:'#367868',shade:'#1e4141',hair:'#373643',light:'#9bc5bc'}
};
/** Shared pixel geometry keeps selection portraits and the in-world sprite identical. */
export function heroPixels(kind:HeroClass):Pixel[]{
 const d=HERO_DESIGNS[kind],p:Pixel[]=[];const r=(x:number,y:number,w:number,h:number,color:string)=>p.push({x,y,w,h,color});const edge='#202334',skin='#e3ae86',hi='#ffdbac';
 // Silhouette: cloak, broad shoulder plates, compact chibi body, large expressive head.
 r(7,17,18,15,edge);r(8,18,16,13,d.shade);r(6,20,20,7,edge);r(8,18,16,11,d.cloth);r(10,20,12,10,d.light);r(11,24,10,7,d.cloth);r(12,25,3,6,d.accent);r(20,22,3,8,d.shade);
 r(6,19,6,5,edge);r(7,19,4,3,d.light);r(22,19,5,5,edge);r(22,19,4,3,d.light);r(7,24,4,5,edge);r(8,24,3,3,skin);r(23,23,4,6,edge);r(23,24,3,3,hi);r(10,29,13,3,edge);r(11,29,11,2,'#8a6441');r(15,29,4,3,'#e9c77d');r(16,30,2,1,'#fff0b5');
 r(8,4,16,15,edge);r(7,7,18,9,edge);r(9,5,14,13,skin);r(10,6,11,10,hi);r(21,8,2,8,'#bd795d');r(11,15,10,3,skin);r(13,18,7,3,edge);r(14,18,5,2,skin);
 if(kind==='Dagger'){
  r(9,2,13,4,edge);r(7,5,18,12,d.shade);r(9,3,13,4,d.cloth);r(7,7,3,10,d.cloth);r(22,6,3,11,d.cloth);r(10,7,12,8,skin);r(11,7,9,6,hi);r(10,13,13,6,d.shade);r(11,14,10,2,d.cloth);r(8,18,16,3,'#756188');r(8,21,3,7,'#594764');
 }else if(kind==='Wand'){
  r(10,4,14,3,d.hair);r(8,7,3,9,d.hair);r(22,6,2,11,d.hair);r(16,0,6,3,edge);r(13,2,10,4,edge);r(11,5,14,3,edge);r(6,8,22,3,edge);r(15,2,6,3,d.cloth);r(12,5,11,3,d.cloth);r(8,8,18,2,d.light);r(17,4,2,2,'#f8d88a');r(8,28,17,6,d.shade);r(10,27,13,6,d.cloth);r(12,31,10,2,d.light);
 }else{
  r(10,2,11,3,edge);r(8,4,16,4,d.hair);r(7,8,4,6,d.hair);r(22,6,3,8,d.hair);r(10,3,10,4,d.hair);r(10,4,8,2,kind==='Spear'?'#7188a0':'#d18455');r(10,6,3,4,d.hair);r(20,6,3,3,d.hair);
  if(kind==='Sword'){r(6,17,7,4,'#889da9');r(7,17,5,2,'#e1ebec');r(21,17,7,4,'#889da9');r(22,17,4,2,'#e1ebec');}
  if(kind==='Spear'){r(7,18,18,3,d.cloth);r(7,21,4,7,d.cloth);r(8,22,2,4,'#db7e6b');r(15,22,3,5,'#dab275');}
  if(kind==='Axe'){r(10,15,12,4,d.hair);r(13,18,7,3,d.hair);r(14,20,4,2,'#d18a4d');r(5,17,8,5,'#655553');r(6,17,6,3,'#c6baa0');r(21,17,8,5,'#655553');r(22,17,6,3,'#c6baa0');r(11,23,3,6,'#b97c50');}
 }
 r(12,11,3,4,edge);r(20,11,2,4,edge);r(13,11,1,2,'#ffffff');r(20,11,1,1,'#ffffff');r(10,14,2,1,'#d48c74');r(17,15,2,1,'#a96151');
 return p;
}
export function weaponPixels(kind:HeroClass):Pixel[]{
 const p:Pixel[]=[];const r=(x:number,y:number,w:number,h:number,color:string)=>p.push({x,y,w,h,color});const steel='#bcd8e6',shine='#edfcff',edge='#253244',gold='#d4a964';
 if(kind==='Spear'){r(14,10,3,34,edge);r(15,11,1,32,'#b28554');r(12,4,7,13,edge);r(14,1,3,16,steel);r(15,2,1,12,shine);r(11,17,9,3,gold);r(17,20,7,3,'#bc5955');}
 else if(kind==='Wand'){r(14,12,4,32,edge);r(15,12,2,31,'#b69b70');r(9,3,14,15,gold);r(11,1,10,16,edge);r(12,3,8,11,'#8275d3');r(14,1,4,14,'#bcbdff');r(14,3,2,7,'#e8ffff');r(12,18,8,3,gold);}
 else if(kind==='Axe'){r(14,10,4,34,edge);r(15,13,2,29,'#b18456');r(6,4,20,14,edge);r(4,7,7,12,edge);r(6,6,8,11,steel);r(7,7,3,9,shine);r(19,6,7,11,'#7795a6');r(14,4,4,16,gold);r(15,5,2,9,'#f4db8d');}
 else {const dagger=kind==='Dagger';r(13,dagger?14:1,6,dagger?17:28,edge);r(14,dagger?15:3,4,dagger?14:24,steel);r(14,dagger?15:3,1,dagger?13:23,shine);r(10,29,12,4,edge);r(11,29,10,2,gold);r(14,33,4,10,edge);r(15,33,2,8,'#a27b4e');r(13,42,6,3,gold);}
 return p;
}
export function heroSVG(kind:HeroClass){
 if(kind==='Sword')return `<svg viewBox="35 250 149 200" class="hero-art" style="overflow:hidden" role="img" aria-label="Sword Dawnwarden"><image href="${import.meta.env.BASE_URL}assets/heroes/sword-source-v1.png" width="2172" height="724" style="image-rendering:pixelated"/></svg>`;
 const rect=(p:Pixel)=>`<rect x="${p.x}" y="${p.y}" width="${p.w}" height="${p.h}" fill="${p.color}"/>`;
 const weapon=weaponPixels(kind).map(rect).join('');
 return `<svg viewBox="0 0 52 52" class="hero-art" role="img" aria-label="${kind} ${HERO_DESIGNS[kind].title}" shape-rendering="crispEdges"><ellipse cx="25" cy="48" rx="19" ry="3" fill="#000" opacity=".3"/><g transform="translate(6 7)">${heroPixels(kind).map(rect).join('')}<rect x="11" y="32" width="5" height="7" fill="#293242"/><rect x="19" y="32" width="5" height="7" fill="#293242"/><rect x="10" y="37" width="7" height="3" fill="#8d9aab"/><rect x="19" y="37" width="7" height="3" fill="#8d9aab"/></g><g transform="translate(32 6) scale(.55 .85)">${weapon}</g>${kind==='Dagger'?`<g transform="translate(0 11) scale(.5 .7)">${weapon}</g>`:''}</svg>`;
}

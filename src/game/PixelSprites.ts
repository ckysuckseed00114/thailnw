import type {HeroClass} from '../core/models';
// Original low-resolution sprites (3/4 top-down, facing right). Pure data: shared by Phaser textures, SVG portraits and tests.
export type Sprite={rows:string[];palette:Record<string,string>};
const OUTLINE={o:'#1b1422',s:'#f2c29b',S:'#c98b6b',e:'#2a1e2e'};

const FACE=['..orrrsssssso...','..orrssesseso...','..orsssssSsso...','...osssssSSo....'];
const TOPS:Record<HeroClass,string[]>={
 Sword:['...ooooooooo....','..orrrrrrRRRo...','..orrrrrrrrRo...'],
 Spear:['....ppp.........','...oppppoooo....','..ohhhhhhHHHo...','..ohhhhhhhhHo...'],
 Wand:['.........oo.....','........ohHo....','.......ohhHHo...','......ohhhhHo...','....oohhhhhhoo..','.obbbbbbbbbbbbo.'],
 Axe:['.k.ooooooooo.k..','.kohhhhhhHHHok..','..ohhhhhhhhHo...'],
 Dagger:['...ooooooooo....','..ohhhhhhHHHo...','..ohhhhhhhhHo...'],
};
const FACES:Partial<Record<HeroClass,string[]>>={
 Axe:[FACE[0],FACE[1],'..orsssrrrrro...','...orrrrrrro....'],
 Dagger:['..ohhhsssssso...','..ohhssesseso...','..ohmmmmmmmmo...','...ohhhhhhho....'],
};
const TORSO=['.....oooooo.....','...ooAAaaaAoo...','..oAAaaaaaaaAo..','..osaabbbbaaso..','..oSadaaaadaSo..','...occdddddcco..'];
const LEGS=[['....ollo.ollo...','....offo.offo...'],['...ollo...ollo..','...offo...offo..']];
const HERO_PALETTES:Record<HeroClass,Record<string,string>>={
 Sword:{a:'#d9a441',A:'#ffe08a',d:'#8a5a24',b:'#6b3b2a',c:'#3b6d8f',l:'#4a4f66',f:'#2c2a35',r:'#c2533a',R:'#f08a5d'},
 Spear:{a:'#e8e0c8',A:'#ffffff',d:'#9a8f78',b:'#b8473f',c:'#b8473f',l:'#5a4a52',f:'#2c2a35',r:'#3b3550',h:'#b9c4cf',H:'#eef4f8',p:'#d84a3f'},
 Wand:{a:'#6a4fb0',A:'#9a7fe0',d:'#3a2a6a',b:'#e3b85a',c:'#3a2a6a',l:'#4a3a80',f:'#2c2a35',r:'#e6e0d0',h:'#4b3a8c',H:'#7d64c8'},
 Axe:{a:'#8a5a3a',A:'#c08458',d:'#5a3a2a',b:'#d9a441',c:'#a89a86',l:'#4a3a30',f:'#2c2a35',r:'#d06a2c',h:'#8f9aa5',H:'#d6dde3',k:'#efe6d2'},
 Dagger:{a:'#2f5f52',A:'#4f8f78',d:'#1d3a34',b:'#8a6a9a',c:'#4a3a5a',l:'#2a2f3a',f:'#1a1a22',r:'#2a2a33',h:'#2f5f52',H:'#4f8f78',m:'#23303a'},
};
/** Two walk frames per class: 0 = standing, 1 = mid-stride. */
export function heroSprite(kind:HeroClass,frame:0|1=0):Sprite{
 return {rows:[...TOPS[kind],...(FACES[kind]??FACE),...TORSO,...LEGS[frame]],palette:{...OUTLINE,...HERO_PALETTES[kind]}};
}
/** Row of the hand in a hero sprite, counted from the feet; weapons are held there. */
export const HAND_FROM_FEET=5;

const STEEL={o:'#1b1422',W:'#dfe9f2',g:'#7a4e2c',y:'#e3b85a',b:'#d9a441',r:'#c8463d',C:'#8f6cf0',x:'#e6dcff'};
const shaft=(row:string,n:number)=>Array.from({length:n},()=>row);
const WEAPONS:Record<HeroClass,string[]>={
 Sword:['...o...',...shaft('..oWo..',7),'obbbbbo','..ogo..','..ogo..','..oyo..','...o...'],
 Spear:['..o..','.oWo.','oWWWo','.oWo.','.oWo.','.obo.','.oro.',...shaft('.ogo.',13),'.oyo.','..o..'],
 Wand:['..ooo..','.oCxCo.','oCxCCCo','.oCCCo.','..obo..',...shaft('..ogo..',11),'..oyo..','...o...'],
 Axe:['..ooo.o..','.oWWWogo.','oWWWWogo.','oWWWWbgo.','oWWWWogo.','.oWWWogo.','..oooogo.',...shaft('.....ogo.',8),'.....oyo.','......o..'],
 Dagger:['..o..','.oWo.','.oWo.','.oWo.','obbbo','.ogo.','.oyo.','..o..'],
};
export function weaponSprite(kind:HeroClass):Sprite{return {rows:WEAPONS[kind],palette:STEEL};}

export const MONSTERS:Record<string,Sprite>={
 'Crypt Sentinel':{rows:['.....oooooo.....','....owwwwwWo....','...owwwwwwwWo...','...owkrwwkrwo...','...owwwwwwwwo...','....owtwtwto....','.....oooooo.....','....owwWwwwo....','...owkwkwkwko...','...owkwkwkwko...','....owwwwwwo....','.....ow..wo.....','.....ow..wo.....','....oww..wwo....'],palette:{o:'#1b1422',w:'#e6e1cf',W:'#ffffff',k:'#2a2233',r:'#ff5a4a',t:'#bdb59c'}},
 Mossling:{rows:['......gg........','.......gG.......','.....oooooo.....','...ooGGGGGGoo...','..oGGGGGGGGGGo..','.oGGGkGGGGkGGGo.','.oGGGGGGGGGGGGo.','.oGgGGGmmGGGgGo.','.ogggGGGGGGgggo.','..oggggggggggo..','...oooooooooo...'],palette:{o:'#1b1422',G:'#7fbf5a',g:'#3f7a3a',k:'#1b2a1f',m:'#5a1f24'}},
 'Cave Stalker':{rows:['o..............o','oo....oooo....oo','oPo..oPPPPo..oPo','oPPooPPPPPPooPPo','oPPPPPrPPrPPPPPo','.oPPPPPPPPPPPPo.','..ooPPPttPPPoo..','....oPPPPPPo....','.....oPPPPo.....','......o..o......'],palette:{o:'#1b1422',P:'#6a4a8a',r:'#ff6a5a',t:'#e8e0d0'}},
 boss:{rows:['..k..............k..','..kk............kk..','...kk..oooooo..kk...','....kkoDDDDDDokk....','.....oDDDDDDDDo.....','.....oDyyDDyyDo.....','.....oDDDDDDDDo.....','......oDttttDo......','....ooooDDDDoooo....','..ooAAAAAaaAAAAAoo..','.oAAAaaaaaaaaaaAAAo.','.oAaaaarrrrrraaaaAo.','.oaaaarrrrrrrraaaao.','.ofaaaarrrrrraaaafo.','.ofaaaaaaaaaaaaaafo.','..oaaaabbbbbbaaaao..','...oaaaaaaaaaaaao...','...oddddddddddddo...','...oddddo..oddddo...','...oddddo..oddddo...','..offfffo..offfffo..','..oooooo....oooooo..'],palette:{o:'#140f1a',k:'#e8dcc0',D:'#3a2f45',y:'#ffcf5a',t:'#e0d0b0',A:'#6a5a7a',a:'#3f3450',r:'#ff7a3a',f:'#2a2230',b:'#c89a4a',d:'#2a2335'}},
};
export const monsterSprite=(name:string,boss:boolean)=>boss?MONSTERS.boss:MONSTERS[name]??MONSTERS['Crypt Sentinel'];

/** Crisp SVG markup (one rect per horizontal run) for HTML portraits. */
export function spriteRects(sprite:Sprite,dx=0,dy=0){
 let out='';sprite.rows.forEach((row,y)=>{for(let x=0;x<row.length;){const c=row[x];let w=1;while(row[x+w]===c)w++;if(c!=='.')out+=`<rect x="${x+dx}" y="${y+dy}" width="${w}" height="1" fill="${sprite.palette[c]}"/>`;x+=w;}});
 return out;
}

import { RARITIES, type GameState, type Item, type Rarity } from './models';
import { BASE_MOVE_SPEED } from './RoomTraversal';
export const FORGE_RATE:Record<Rarity,number>={Common:.04,Uncommon:.05,Rare:.06,Epic:.08,Legendary:.11,Mythic:.15};
export const SALVAGE:Record<Rarity,number>={Common:30,Uncommon:80,Rare:200,Epic:500,Legendary:1200,Mythic:3000};
export const xpForLevel=(level:number)=>level===2?250:Math.round(1000*1.16**(level-2));
export const itemPower=(item:Item)=>item.base*(1+FORGE_RATE[item.rarity])**item.forge;
export const forgeCost=(item:Item)=>({bone:Math.ceil(20*(RARITIES.indexOf(item.rarity)+1)*1.14**item.forge),lm:Math.ceil(40*(RARITIES.indexOf(item.rarity)+1)*1.14**item.forge)});
export const salvageValue=(item:Item)=>SALVAGE[item.rarity]+Math.floor(item.invested*.25);
export const sealCost=(floor:number)=>({lm:3000*2**(floor-2),bone:800*2**(floor-2)});
export const regionIndex=(s:GameState)=>(s.floor-1)*11+s.region;
export function stats(s:GameState){
 const a=s.hero.attributes;
 const gear=Object.values(s.equipped).map(id=>s.inventory.find(i=>i.id===id)).filter((i):i is Item=>!!i);
 const power=(...slots:string[])=>gear.filter(i=>slots.includes(i.slot)).reduce((n,i)=>n+itemPower(i),0);
 const active=s.shrine&&s.shrine.until>s.now?s.shrine.kind:null;
 return {maxHp:100+a.Vitality*8+power('Helmet','Armor','Shield')*5,damage:(14+a.Strength*2+power('Weapon','Ring','Amulet'))*(active==='Fury'?2:1),interval:600/(1+(a.Agility*2+power('Boots'))/100)/(active==='Haste'?1.5:1),crit:.1,critMult:1.8,block:Math.min(.85,.12+a.Defense*.01),dodge:Math.min(.5,.3+a.Agility*.01),lifeSteal:Math.min(20,a.Vampirism)*.0025,
  // World px/s; sets how long walks between halls and rooms take. Gear or buffs that raise it add their bonus here.
  moveSpeed:BASE_MOVE_SPEED};
}
export const monsterStats=(region:number,boss:boolean)=>({hp:Math.round((boss?170:42)*1.4**(region-1)),damage:(boss?10:3)*1.35**(region-1)});
export const petXp=(level:number)=>100*level;

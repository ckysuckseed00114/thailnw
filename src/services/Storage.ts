import {createState} from '../core/GameState';
import {ATTRIBUTES,CLASSES,PETS,RARITIES,SLOTS,type GameState,type Item} from '../core/models';
export interface SaveRepository {load():GameState|null;save(state:GameState):void}
const KEY='embermarch.save.v1';
const finite=(v:unknown)=>typeof v==='number'&&Number.isFinite(v)&&v>=0;
function item(i:Item){return i&&Number.isSafeInteger(i.id)&&SLOTS.includes(i.slot)&&RARITIES.includes(i.rarity)&&typeof i.name==='string'&&i.name.length<100&&finite(i.base)&&finite(i.invested)&&Number.isInteger(i.forge)&&i.forge>=0&&i.forge<=60&&typeof i.locked==='boolean';}
export function validateSave(value:unknown):value is GameState{
 try{
  const s=value as GameState,base=createState();if(!s||s.version!==1)return false;
  for(const [key,v] of Object.entries(base)){const actual=s[key as keyof GameState];if(typeof v==='number'&&!finite(actual))return false;if(typeof v==='boolean'&&typeof actual!=='boolean')return false;}
  if(!CLASSES.includes(s.hero.class)||!PETS.includes(s.pet)||!Number.isInteger(s.hero.level)||s.hero.level<1||s.hero.level>1000||!finite(s.hero.xp)||!finite(s.hero.hp)||!Number.isInteger(s.hero.points)||s.hero.points<0)return false;
  if(!ATTRIBUTES.every(a=>Number.isInteger(s.hero.attributes[a])&&s.hero.attributes[a]>=0)||s.hero.attributes.Vampirism>20)return false;
  if(![s.floor,s.region,s.room,s.unlocked,s.rng,s.serial].every(Number.isSafeInteger)||s.floor<1||s.region<1||s.region>11||s.room<1||s.room>5||s.rng===0)return false;
  if(!Array.isArray(s.inventory)||!Array.isArray(s.chest)||![...s.inventory,...s.chest].every(item))return false;
  const ids=[...s.inventory,...s.chest].map(i=>i.id);if(new Set(ids).size!==ids.length)return false;
  if(!Object.entries(s.equipped).every(([slot,id])=>s.inventory.some(i=>i.id===id&&i.slot===slot)))return false;
  if(!PETS.every(p=>Number.isInteger(s.pets[p].level)&&s.pets[p].level>=1&&s.pets[p].level<=10&&finite(s.pets[p].xp)))return false;
  if(!Array.isArray(s.history)||s.history.length>1442||!s.history.every(h=>['at','seconds','lm','xp','bone','loot'].every(k=>finite(h[k as keyof typeof h]))))return false;
  if(!s.afk||!Object.values(s.afk).every(finite)||!Number.isInteger(s.afk.loot)||s.afk.loot>100000)return false;
  if(!Array.isArray(s.enemies)||s.enemies.length>3||!s.enemies.every(e=>finite(e.id)&&finite(e.hp)&&finite(e.maxHp)&&finite(e.damage)&&finite(e.attackAt)&&finite(e.stunnedUntil)&&finite(e.attacks)&&typeof e.boss==='boolean'&&typeof e.name==='string'))return false;
  if(s.shrine&&(!['Fury','Fortune','Haste','Renewal'].includes(s.shrine.kind)||!finite(s.shrine.until)))return false;
  return Array.isArray(s.log)&&s.log.every(t=>typeof t==='string')&&Array.isArray(s.questClaims)&&s.questClaims.every(t=>typeof t==='string');
 }catch{return false;}
}
export class LocalSaveRepository implements SaveRepository {
 load(){const raw=localStorage.getItem(KEY);if(!raw)return null;let s:unknown;try{s=JSON.parse(raw);}catch{throw new Error('Save cannot be read. Export or clear browser storage to start over.');}if(!validateSave(s))throw new Error('Save validation failed. Existing save has been preserved.');return s;}
 save(state:GameState){localStorage.setItem(KEY,JSON.stringify(state));}
}

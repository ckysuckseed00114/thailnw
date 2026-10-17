import {createState} from '../core/GameState';
import {ALL_SKILL_IDS} from '../core/Skills';
import {ATTRIBUTES,CLASSES,DEFAULT_NAME,PETS,RARITIES,SLOTS,cleanName,type GameState,type Item} from '../core/models';
export interface SaveRepository {load():GameState|null;save(state:GameState):void}
// The storage slot keeps its original name; the format version lives inside the save.
const KEY='embermarch.save.v1';
type Raw=Record<string,unknown>&{version?:unknown;hero?:Record<string,unknown>};
// One step per format version; each returns a new object so the original stays intact for the backup.
const STEPS:Record<number,(s:Raw)=>Raw>={
 1:s=>({...s,version:2,hero:{...s.hero,name:DEFAULT_NAME}}),
 // v3: the single auto-skill timer becomes per-skill cooldowns; slot 1 keeps its remaining time.
 2:({skillAt,...s})=>({...s,version:3,cooldowns:{[`${String(s.hero?.class)}-1`]:Number.isFinite(skillAt)?skillAt:0},autoCast:{}}),
 // v4: manual targeting; older saves start on automatic.
 3:s=>({...s,version:4,target:0}),
 // v5: one skill per class, eight rooms, and persistent boss summon phases.
 4:s=>{
  const heroClass=String(s.hero?.class),id=`${heroClass}-1`;
  const cooldowns=s.cooldowns as Record<string,number>|undefined,autoCast=s.autoCast as Record<string,boolean>|undefined;
  const enemies=Array.isArray(s.enemies)?s.enemies.map(e=>({...e,summons:0})):s.enemies;
  return {...s,version:5,room:s.room===5?8:s.room,enemies,
   cooldowns:cooldowns&&Object.hasOwn(cooldowns,id)?{[id]:cooldowns[id]}:{},
   autoCast:autoCast&&Object.hasOwn(autoCast,id)?{[id]:autoCast[id]}:{}};
 },
};
/** Upgrades older save formats in memory. Unknown shapes are returned untouched for validateSave to reject. */
export function migrateSave(value:unknown):unknown{
 let s=value as Raw;
 while(s&&typeof s==='object'&&s.hero&&typeof s.hero==='object'&&typeof s.version==='number'&&STEPS[s.version])s=STEPS[s.version](s);
 return s;
}
const finite=(v:unknown)=>typeof v==='number'&&Number.isFinite(v)&&v>=0;
function item(i:Item){return i&&Number.isSafeInteger(i.id)&&SLOTS.includes(i.slot)&&RARITIES.includes(i.rarity)&&typeof i.name==='string'&&i.name.length<100&&finite(i.base)&&finite(i.invested)&&Number.isInteger(i.forge)&&i.forge>=0&&i.forge<=60&&typeof i.locked==='boolean';}
export function validateSave(value:unknown):value is GameState{
 try{
  const s=value as GameState,base=createState();if(!s||s.version!==5)return false;if(!Number.isSafeInteger(s.target))return false;
  for(const [key,v] of Object.entries(base)){const actual=s[key as keyof GameState];if(typeof v==='number'&&!finite(actual))return false;if(typeof v==='boolean'&&typeof actual!=='boolean')return false;}
  if(cleanName(s.hero.name)!==s.hero.name||!CLASSES.includes(s.hero.class)||!PETS.includes(s.pet)||!Number.isInteger(s.hero.level)||s.hero.level<1||s.hero.level>1000||!finite(s.hero.xp)||!finite(s.hero.hp)||!Number.isInteger(s.hero.points)||s.hero.points<0)return false;
  if(!ATTRIBUTES.every(a=>Number.isInteger(s.hero.attributes[a])&&s.hero.attributes[a]>=0)||s.hero.attributes.Vampirism>20)return false;
  if(![s.floor,s.region,s.room,s.unlocked,s.rng,s.serial].every(Number.isSafeInteger)||s.floor<1||s.region<1||s.region>11||s.room<1||s.room>8||s.rng===0)return false;
  if(!Array.isArray(s.inventory)||!Array.isArray(s.chest)||![...s.inventory,...s.chest].every(item))return false;
  const ids=[...s.inventory,...s.chest].map(i=>i.id);if(new Set(ids).size!==ids.length)return false;
  if(!Object.entries(s.equipped).every(([slot,id])=>s.inventory.some(i=>i.id===id&&i.slot===slot)))return false;
  if(!PETS.every(p=>Number.isInteger(s.pets[p].level)&&s.pets[p].level>=1&&s.pets[p].level<=10&&finite(s.pets[p].xp)))return false;
  if(!Array.isArray(s.history)||s.history.length>1442||!s.history.every(h=>['at','seconds','lm','xp','bone','loot'].every(k=>finite(h[k as keyof typeof h]))))return false;
  if(!s.afk||!Object.values(s.afk).every(finite)||!Number.isInteger(s.afk.loot)||s.afk.loot>100000)return false;
  if(!Array.isArray(s.enemies)||s.enemies.length>3||!s.enemies.every(e=>finite(e.id)&&finite(e.hp)&&finite(e.maxHp)&&finite(e.damage)&&finite(e.attackAt)&&finite(e.stunnedUntil)&&finite(e.attacks)&&Number.isInteger(e.summons)&&e.summons>=0&&e.summons<=2&&typeof e.boss==='boolean'&&typeof e.name==='string'))return false;
  if(s.shrine&&(!['Fury','Fortune','Haste','Renewal'].includes(s.shrine.kind)||!finite(s.shrine.until)))return false;
  const record=(o:unknown,ok:(v:unknown)=>boolean)=>!!o&&typeof o==='object'&&!Array.isArray(o)&&Object.entries(o).every(([k,v])=>ALL_SKILL_IDS.has(k)&&ok(v));
  if(!record(s.cooldowns,finite)||!record(s.autoCast,v=>typeof v==='boolean'))return false;
  return Array.isArray(s.log)&&s.log.every(t=>typeof t==='string')&&Array.isArray(s.questClaims)&&s.questClaims.every(t=>typeof t==='string');
 }catch{return false;}
}
export class LocalSaveRepository implements SaveRepository {
 load(){
  const raw=localStorage.getItem(KEY);if(!raw)return null;let parsed:unknown;try{parsed=JSON.parse(raw);}catch{throw new Error('Save cannot be read. Export or clear browser storage to start over.');}
  const s=migrateSave(parsed);if(!validateSave(s))throw new Error('Save validation failed. Existing save has been preserved.');
  // Keep the pre-migration save once, so an upgrade can always be rolled back by hand.
  if(s!==parsed){const backup=`${KEY}.backup-v${(parsed as {version:number}).version}`;try{if(!localStorage.getItem(backup))localStorage.setItem(backup,raw);}catch{/* a full quota must not block loading */}}
  return s;
 }
 save(state:GameState){localStorage.setItem(KEY,JSON.stringify(state));}
}

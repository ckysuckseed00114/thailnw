import {SKILLS,type GameState,type HeroClass} from './models';

/** One cooldown-only class skill. No mana, energy, or secondary casts. */
export type Element='holy'|'lightning'|'arcane'|'earth'|'shadow'|'nature'|'spirit';
export type SkillEffect={kind:'strike';mult:number;target:'one'|'all';stunMs?:number};
export interface SkillDef{id:string;slot:0;key:'1';name:string;desc:string;element:Element;cooldown:number;unlock:1;effect:SkillEffect}
export const SLOT_KEYS=['1'] as const;

const data:Record<HeroClass,{desc:string;element:Element;target:'one'|'all';stunMs?:number}>={
 Sword:{desc:'Spin and strike every foe.',element:'holy',target:'all'},
 Spear:{desc:'Pierce the whole line.',element:'lightning',target:'all'},
 Wand:{desc:'Burst of flame on every foe.',element:'arcane',target:'all'},
 Axe:{desc:'Crushing cleave that stuns.',element:'earth',target:'one',stunMs:2000},
 Dagger:{desc:'Vanish and strike one foe.',element:'shadow',target:'one'},
};
export const CLASS_SKILLS:Record<HeroClass,SkillDef[]> = Object.fromEntries(
 Object.entries(data).map(([name,d])=>[name,[{id:`${name}-1`,slot:0,key:'1',name:SKILLS[name as HeroClass].name,desc:d.desc,
  element:d.element,cooldown:7000,unlock:1,effect:{kind:'strike',mult:SKILLS[name as HeroClass].mult,target:d.target,...(d.stunMs?{stunMs:d.stunMs}:{})}}]])
) as Record<HeroClass,SkillDef[]>;
export const ALL_SKILL_IDS=new Set(Object.values(CLASS_SKILLS).flat().map(k=>k.id));
export const skillsFor=(s:GameState)=>CLASS_SKILLS[s.hero.class];
export const findSkill=(s:GameState,id:string)=>skillsFor(s).find(k=>k.id===id);
export const primarySkill=(s:GameState)=>skillsFor(s)[0];
export const readyAt=(s:GameState,k:SkillDef)=>s.cooldowns[k.id]??0;
export const isUnlocked=(s:GameState,k:SkillDef)=>s.hero.level>=k.unlock;
export const isAuto=(s:GameState,k:SkillDef)=>s.autoCast[k.id]!==false;

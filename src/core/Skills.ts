import {SKILLS,type GameState,type HeroClass} from './models';

// Six skills per class (slots 1–5 + R). Slot 1 keeps the original auto skill's numbers so existing balance is unchanged;
// the others unlock with level. Pure data: shared by the authority, the hotbar and tests.
export type Element='holy'|'lightning'|'arcane'|'earth'|'shadow'|'nature'|'spirit';
export type SkillEffect={kind:'strike';mult:number;target:'one'|'all';stunMs?:number}|{kind:'heal';pct:number}|{kind:'shield'};
export interface SkillDef{id:string;slot:number;key:string;name:string;desc:string;element:Element;cooldown:number;unlock:number;effect:SkillEffect}
export const SLOT_KEYS=['1','2','3','4','5','R'] as const;
/** Auto-cast heals only below this share of max HP, so they are not wasted. */
export const AUTO_HEAL_BELOW=.6;

type Row=[name:string,desc:string,element:Element,cooldownS:number,unlock:number,effect:SkillEffect];
const strike=(mult:number,target:'one'|'all',stunMs?:number):SkillEffect=>({kind:'strike',mult,target,...(stunMs?{stunMs}:{})});
const first=(c:HeroClass,target:'one'|'all',stunMs?:number)=>strike(SKILLS[c].mult,target,stunMs);
const TABLE:Record<HeroClass,Row[]>={
 Sword:[[SKILLS.Sword.name,'Spin and strike every foe.','holy',7,1,first('Sword','all')],['Shield Bash','Slam one foe and stun it.','holy',10,5,strike(1.4,'one',1500)],['Second Wind','Recover 25% of max HP.','nature',30,10,{kind:'heal',pct:.25}],['Guardian Oath','Block the next hit.','spirit',20,20,{kind:'shield'}],['Dawn Strike','A heavy blow to one foe.','holy',15,30,strike(3.5,'one')],['Sunfall','Bring down the dawn on all foes.','holy',60,15,strike(6,'all')]],
 Spear:[[SKILLS.Spear.name,'Pierce the whole line.','lightning',7,1,first('Spear','all')],['Lightning Thrust','A charged thrust at one foe.','lightning',9,5,strike(2.2,'one')],['Storm Step','Block the next hit.','spirit',18,10,{kind:'shield'}],['Thunder Sweep','Sweep all foes and daze them.','lightning',16,20,strike(1.8,'all',800)],['Skyfall Lance','Drop from the sky onto one foe.','lightning',18,30,strike(4,'one')],['Tempest','A storm that stuns every foe.','lightning',60,15,strike(5.5,'all',1500)]],
 Wand:[[SKILLS.Wand.name,'Burst of flame on every foe.','arcane',7,1,first('Wand','all')],['Arcane Bolt','A focused bolt at one foe.','arcane',8,5,strike(2.4,'one')],['Mana Ward','Block the next hit.','spirit',18,10,{kind:'shield'}],['Frost Nova','Freeze every foe in place.','arcane',20,20,strike(1.2,'all',2000)],['Lotus Bloom','Recover 30% of max HP.','nature',30,30,{kind:'heal',pct:.3}],['Starfall','Stars rain on all foes.','arcane',60,15,strike(6.5,'all')]],
 Axe:[[SKILLS.Axe.name,'Crushing cleave that stuns.','earth',7,1,first('Axe','one',2000)],['Rending Chop','A deep chop at one foe.','earth',9,5,strike(2.5,'one')],['Iron Hide','Block the next hit.','spirit',16,10,{kind:'shield'}],['Earthshatter','Shake the ground under all foes.','earth',18,20,strike(2,'all',1200)],['Bloodlust','Recover 20% of max HP.','nature',25,30,{kind:'heal',pct:.2}],['Mountain Breaker','Split the earth beneath every foe.','earth',60,15,strike(5,'all',2500)]],
 Dagger:[[SKILLS.Dagger.name,'Vanish and strike one foe.','shadow',7,1,first('Dagger','one')],['Twin Fangs','Two quick cuts at one foe.','shadow',6,5,strike(2.6,'one')],['Smoke Veil','Block the next hit.','spirit',15,10,{kind:'shield'}],['Fan of Knives','Knives at every foe.','shadow',12,20,strike(1.6,'all')],['Assassinate','A lethal strike on one foe.','shadow',20,30,strike(5,'one')],['Night Reaper','Reap every foe in the dark.','shadow',50,15,strike(4.5,'all')]],
};
export const CLASS_SKILLS:Record<HeroClass,SkillDef[]>=Object.fromEntries(Object.entries(TABLE).map(([c,rows])=>[c,rows.map(([name,desc,element,cd,unlock,effect],i)=>({id:`${c}-${SLOT_KEYS[i]}`,slot:i,key:SLOT_KEYS[i],name,desc,element,cooldown:cd*1000,unlock,effect}))])) as Record<HeroClass,SkillDef[]>;
export const ALL_SKILL_IDS=new Set(Object.values(CLASS_SKILLS).flat().map(k=>k.id));
export const skillsFor=(s:GameState)=>CLASS_SKILLS[s.hero.class];
export const findSkill=(s:GameState,id:string)=>skillsFor(s).find(k=>k.id===id);
export const primarySkill=(s:GameState)=>skillsFor(s)[0];
export const readyAt=(s:GameState,k:SkillDef)=>s.cooldowns[k.id]??0;
export const isUnlocked=(s:GameState,k:SkillDef)=>s.hero.level>=k.unlock;
export const isAuto=(s:GameState,k:SkillDef)=>s.autoCast[k.id]!==false;

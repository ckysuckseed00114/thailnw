import {describe,it,expect} from 'vitest';
import {createState} from '../src/core/GameState';
import {CombatEngine} from '../src/core/CombatEngine';
import {resume} from '../src/core/AFKManager';
import {stats} from '../src/core/Formulas';
import {CLASSES,SKILLS,type GameState,type HeroClass} from '../src/core/models';
import {CLASS_SKILLS,SLOT_KEYS} from '../src/core/Skills';
import {migrateSave,validateSave} from '../src/services/Storage';

const hero=(c:HeroClass='Sword',level=1)=>{const s=createState(1700000000000,9);const e=new CombatEngine(s);e.dispatch({type:'class',value:c});s.hero.level=level;return {s,e};};
const ready=(s:GameState)=>{for(const id of Object.keys(s.cooldowns))s.cooldowns[id]=s.now;};

describe('skill table',()=>{
 it.each(CLASSES)('%s has six skills on 1–5 + R with slot 1 matching the original auto skill',c=>{
  const list=CLASS_SKILLS[c];expect(list.map(k=>k.key)).toEqual([...SLOT_KEYS]);
  expect(list[0]).toMatchObject({name:SKILLS[c].name,cooldown:7000,unlock:1,effect:{kind:'strike',mult:SKILLS[c].mult}});
  expect(new Set(list.map(k=>k.id)).size).toBe(6);
 });
 it('keeps the original targeting and Axe stun on slot 1',()=>{
  expect(CLASS_SKILLS.Sword[0].effect).toMatchObject({target:'all'});expect(CLASS_SKILLS.Dagger[0].effect).toMatchObject({target:'one'});
  expect(CLASS_SKILLS.Axe[0].effect).toMatchObject({target:'one',stunMs:2000});
 });
});
describe('auto-cast',()=>{
 it('fires slot 1 when ready and restarts its cooldown',()=>{const {s,e}=hero();ready(s);const ev=e.tick(50);expect(ev.some(x=>x.type==='skill'&&x.skill==='Sword-1')).toBe(true);expect(s.cooldowns['Sword-1']).toBe(s.now+7000);});
 it('does not fire locked skills',()=>{const {s,e}=hero('Sword',4);ready(s);const ids=e.tick(50).filter(x=>x.type==='skill').map(x=>x.skill);expect(ids).toEqual(['Sword-1']);});
 it('respects the auto switch',()=>{const {s,e}=hero();e.dispatch({type:'autocast',id:'Sword-1',value:false});ready(s);expect(e.tick(50).some(x=>x.type==='skill')).toBe(false);expect(s.autoCast['Sword-1']).toBe(false);});
 it('only auto-heals below 60% health',()=>{const {s,e}=hero('Sword',10);for(const k of CLASS_SKILLS.Sword)if(k.id!=='Sword-3')e.dispatch({type:'autocast',id:k.id,value:false});ready(s);
  expect(e.tick(50).some(x=>x.skill==='Sword-3')).toBe(false);s.hero.hp=stats(s).maxHp*.5;ready(s);expect(e.tick(50).some(x=>x.skill==='Sword-3')).toBe(true);expect(s.hero.hp).toBeGreaterThan(stats(s).maxHp*.7);});
});
describe('manual cast',()=>{
 it('casts a ready skill and delivers its events on the next tick',()=>{const {s,e}=hero('Spear',5);ready(s);e.dispatch({type:'autocast',id:'Spear-1',value:false});e.dispatch({type:'autocast',id:'Spear-2',value:false});
  const hp=s.enemies[0].hp;e.dispatch({type:'cast',id:'Spear-2'});expect(s.enemies[0].hp).toBeLessThan(hp);expect(s.cooldowns['Spear-2']).toBe(s.now+9000);
  const ev=e.tick(50);expect(ev.some(x=>x.type==='skill'&&x.skill==='Spear-2')).toBe(true);expect(ev.some(x=>x.type==='hit'&&x.skill==='Spear-2'&&x.element==='lightning')).toBe(true);});
 it('rejects locked, cooling, foreign and pointless casts without side effects',()=>{const {s,e}=hero('Wand',10);ready(s);
  expect(()=>e.dispatch({type:'cast',id:'Wand-4'})).toThrow(/level 20/);expect(()=>e.dispatch({type:'cast',id:'Axe-1'})).toThrow();
  e.dispatch({type:'cast',id:'Wand-1'});expect(()=>e.dispatch({type:'cast',id:'Wand-1'})).toThrow(/cooling/);
  e.dispatch({type:'cast',id:'Wand-3'});expect(s.shield).toBe(true);s.cooldowns['Wand-3']=s.now;expect(()=>e.dispatch({type:'cast',id:'Wand-3'})).toThrow(/shield/);
  s.enemies=[];expect(()=>e.dispatch({type:'cast',id:'Wand-2'})).toThrow(/target/);});
 it('cannot cast while fallen',()=>{const {s,e}=hero();ready(s);s.respawnAt=s.now+1000;expect(()=>e.dispatch({type:'cast',id:'Sword-1'})).toThrow(/respawn/);});
});
describe('effects',()=>{
 it('stuns targets for the skill duration',()=>{const {s,e}=hero('Axe');ready(s);s.enemies.forEach(m=>{m.hp=m.maxHp=10000;});e.tick(50);expect(s.enemies[0].stunnedUntil).toBeGreaterThanOrEqual(s.now+1900);});
 it('reports how an enemy hit was avoided',()=>{const {s,e}=hero();e.dispatch({type:'autocast',id:'Sword-1',value:false});s.shield=true;s.enemies[0].attackAt=s.now;const ev=e.tick(50);expect(ev.find(x=>x.type==='hit'&&x.target===0)?.label).toBe('SHIELD');expect(s.shield).toBe(false);});
 it('emits journal lines as log events',()=>{const {s,e}=hero();s.hero.xp=10000;s.enemies.forEach(m=>m.hp=0);const ev=e.tick(50);expect(ev.some(x=>x.type==='log'&&/Level/.test(x.label??''))).toBe(true);});
});
describe('persistence',()=>{
 it('migrates v2 saves: the old skill timer becomes the slot-1 cooldown',()=>{const {s}=hero('Dagger');const v2=JSON.parse(JSON.stringify(s));v2.version=2;v2.skillAt=s.now+2500;delete v2.cooldowns;delete v2.autoCast;
  const m=migrateSave(v2) as GameState;expect(m.version).toBe(3);expect(m.cooldowns).toEqual({'Dagger-1':s.now+2500});expect(m.autoCast).toEqual({});expect('skillAt' in m).toBe(false);expect(validateSave(m)).toBe(true);});
 it('rejects unknown skill ids and bad values',()=>{const {s}=hero();const bad=JSON.parse(JSON.stringify(s));bad.cooldowns.Hack=1;expect(validateSave(bad)).toBe(false);const bad2=JSON.parse(JSON.stringify(s));bad2.autoCast['Sword-1']='yes';expect(validateSave(bad2)).toBe(false);});
 it('shifts cooldowns across an absence so they keep their remaining time',()=>{const {s}=hero();s.cooldowns['Sword-2']=s.now+4000;const left=s.cooldowns['Sword-2']-s.now;resume(s,s.now+3600000);expect(s.cooldowns['Sword-2']-s.now).toBe(left);});
});

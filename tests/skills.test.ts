import {describe,it,expect} from 'vitest';
import {createState} from '../src/core/GameState';
import {CombatEngine} from '../src/core/CombatEngine';
import {resume} from '../src/core/AFKManager';
import {CLASSES,SKILLS,type HeroClass} from '../src/core/models';
import {CLASS_SKILLS,SLOT_KEYS} from '../src/core/Skills';
import {migrateSave,validateSave} from '../src/services/Storage';

const hero=(kind:HeroClass='Sword')=>{const s=createState(1700000000000,9),e=new CombatEngine(s);e.dispatch({type:'class',value:kind});return {s,e};};

describe('one class skill, cooldown only',()=>{
 it.each(CLASSES)('%s has exactly its original class skill',kind=>{
  const skills=CLASS_SKILLS[kind];expect(skills).toHaveLength(1);expect(skills.map(k=>k.key)).toEqual([...SLOT_KEYS]);
  expect(skills[0]).toMatchObject({id:`${kind}-1`,name:SKILLS[kind].name,cooldown:7000,unlock:1,effect:{kind:'strike',mult:SKILLS[kind].mult}});
 });
 it('preserves Sword AoE, Dagger single target and Axe stun',()=>{
  expect(CLASS_SKILLS.Sword[0].effect).toMatchObject({target:'all'});
  expect(CLASS_SKILLS.Dagger[0].effect).toMatchObject({target:'one'});
  expect(CLASS_SKILLS.Axe[0].effect).toMatchObject({target:'one',stunMs:2000});
 });
 it('auto-casts once when ready and then waits for the seven-second cooldown',()=>{
  const {s,e}=hero();s.cooldowns['Sword-1']=s.now;
  expect(e.tick(50).filter(x=>x.type==='skill')).toHaveLength(1);
  expect(s.cooldowns['Sword-1']).toBe(s.now+7000);
  expect(e.tick(1000).filter(x=>x.type==='skill')).toHaveLength(0);
 });
 it('allows manual cast only when ready and rejects removed skills',()=>{
  const {s,e}=hero('Wand');e.dispatch({type:'autocast',id:'Wand-1',value:false});s.cooldowns['Wand-1']=s.now;
  e.dispatch({type:'cast',id:'Wand-1'});expect(s.cooldowns['Wand-1']).toBe(s.now+7000);
  expect(()=>e.dispatch({type:'cast',id:'Wand-1'})).toThrow(/cooling/);
  expect(()=>e.dispatch({type:'cast',id:'Wand-2'})).toThrow(/does not belong/);
  expect(e.tick(50).some(x=>x.type==='skill'&&x.skill==='Wand-1')).toBe(true);
 });
 it('has no mana resource in the authoritative state',()=>{const {s}=hero();expect('mana' in s.hero).toBe(false);expect('mp' in s.hero).toBe(false);expect('sp' in s.hero).toBe(false);});
});

describe('save upgrade',()=>{
 it('keeps the class cooldown and removes obsolete skill slots from v4 saves',()=>{
  const {s}=hero('Dagger');const old=JSON.parse(JSON.stringify(s));old.version=4;old.cooldowns['Dagger-2']=s.now+30000;old.autoCast['Dagger-2']=false;
  const next=migrateSave(old);expect(next).toMatchObject({version:6,cooldowns:{'Dagger-1':s.cooldowns['Dagger-1']}});
  expect(Object.keys((next as typeof s).cooldowns)).toEqual(['Dagger-1']);expect(validateSave(next)).toBe(true);
 });
 it('preserves an old boss encounter by moving room 5 to room 8',()=>{
  const {s}=hero();s.room=5;s.enemies=[{...s.enemies[0],boss:true,hp:25,maxHp:170}];const old=JSON.parse(JSON.stringify(s));old.version=4;delete old.enemies[0].summons;
  const next=migrateSave(old) as typeof s;expect(next.room).toBe(8);expect(next.enemies[0].summons).toBe(0);expect(validateSave(next)).toBe(true);
 });
 it('shifts the remaining cooldown across an offline absence',()=>{
  const {s}=hero();s.cooldowns['Sword-1']=s.now+4000;resume(s,s.now+3600000);expect(s.cooldowns['Sword-1']-s.now).toBe(4000);
 });
});

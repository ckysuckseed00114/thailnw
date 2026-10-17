import {describe,it,expect} from 'vitest';
import {createState} from '../src/core/GameState';
import {CombatEngine} from '../src/core/CombatEngine';
import {migrateSave,validateSave} from '../src/services/Storage';
import type {GameState} from '../src/core/models';

const fight=()=>{const s=createState(1700000000000,11);const e=new CombatEngine(s);e.dispatch({type:'class',value:'Dagger'});
 // Tough enemies so nothing dies mid-test; skills off so only basic attacks land; one hall so all are in reach.
 s.enemies.forEach(m=>{m.hp=m.maxHp=100000;m.attackAt=s.now+1e9;m.wave=0;});for(const id of Object.keys(s.cooldowns))e.dispatch({type:'autocast',id,value:false});return {s,e};};
const hits=(ev:ReturnType<CombatEngine['tick']>)=>ev.filter(x=>x.type==='hit'&&x.target!==0).map(x=>x.target);

describe('manual targeting',()=>{
 it('defaults to the front of the line',()=>{const {s,e}=fight();s.attackAt=s.now;expect(hits(e.tick(50))).toEqual([s.enemies[0].id]);});
 it('sends basic attacks and single-target skills to the chosen enemy',()=>{const {s,e}=fight();const pick=s.enemies[2].id;e.dispatch({type:'target',id:pick});expect(s.target).toBe(pick);
  s.attackAt=s.now;expect(hits(e.tick(50))).toEqual([pick]);
  s.cooldowns['Dagger-1']=s.now;e.dispatch({type:'cast',id:'Dagger-1'});expect(hits(e.tick(1))).toContain(pick);});
 it('rejects unknown or dead targets and allows clearing',()=>{const {s,e}=fight();expect(()=>e.dispatch({type:'target',id:999999})).toThrow();s.enemies[1].hp=0;expect(()=>e.dispatch({type:'target',id:s.enemies[1].id})).toThrow();e.dispatch({type:'target',id:0});expect(s.target).toBe(0);});
 it('falls back to automatic when the target dies and resets on a new room',()=>{const {s,e}=fight();const pick=s.enemies[1].id;e.dispatch({type:'target',id:pick});s.enemies[1].hp=0;e.tick(50);expect(s.target).toBe(0);
  e.dispatch({type:'target',id:s.enemies[0].id});s.enemies.forEach(m=>m.hp=0);e.tick(50);e.tick(5000);e.tick(1500);expect(s.room).toBe(2);expect(s.target).toBe(0);});
 it('migrates v3 saves to the current version on automatic targeting',()=>{const {s}=fight();const v3=JSON.parse(JSON.stringify(s));v3.version=3;delete v3.target;const m=migrateSave(v3) as GameState;expect(m).toMatchObject({version:6,target:0});expect(validateSave(m)).toBe(true);});
});

import {describe,it,expect,beforeEach} from 'vitest';
import {ACTIONS,DEFAULT_KEYS,actionFor,bindKey,keybinds,normalizeKey,resetKeys} from '../src/ui/keybinds';
import {bossPhase,hitsUntilSlam} from '../src/ui/hud/Targets';
import type {Enemy} from '../src/core/models';

describe('key bindings',()=>{
 beforeEach(()=>resetKeys());
 it('has a unique default key for every action',()=>{expect(new Set(Object.values(DEFAULT_KEYS)).size).toBe(ACTIONS.length);expect(Object.keys(DEFAULT_KEYS).sort()).toEqual(ACTIONS.map(a=>a.id).sort());});
 it('keeps Tab free for keyboard navigation by default',()=>{expect(Object.values(DEFAULT_KEYS)).not.toContain('Tab');});
 it('normalises keys and refuses reserved ones',()=>{expect(normalizeKey('r')).toBe('R');expect(normalizeKey(' ')).toBe('Space');expect(normalizeKey('F2')).toBe('F2');for(const k of ['Escape','Enter','Shift','Control','Meta',''])expect(normalizeKey(k)).toBeNull();});
 it('looks actions up by key',()=>{expect(actionFor('1')).toBe('skill:0');expect(actionFor('M')).toBe('panel:travel');expect(actionFor('Z')).toBeUndefined();});
 it('rebinds and swaps when the key is taken',()=>{expect(bindKey('skill:0','z')).toBeUndefined();expect(keybinds.value['skill:0']).toBe('Z');
  const swapped=bindKey('skill:1','M');expect(swapped).toBe('panel:travel');expect(keybinds.value['skill:1']).toBe('M');expect(keybinds.value['panel:travel']).toBe('2');
  expect(new Set(Object.values(keybinds.value)).size).toBe(ACTIONS.length);});
 it('rejects unbindable keys and resets to defaults',()=>{expect(()=>bindKey('skill:0','Escape')).toThrow();bindKey('skill:0','Q');resetKeys();expect(keybinds.value).toEqual(DEFAULT_KEYS);});
});
describe('boss bar helpers',()=>{
 const boss=(hp:number,attacks=0):Enemy=>({id:1,name:'W',hp,maxHp:300,damage:1,boss:true,attackAt:0,stunnedUntil:0,attacks});
 it('splits the bar into three phases',()=>{expect(bossPhase(boss(300))).toBe(1);expect(bossPhase(boss(200))).toBe(2);expect(bossPhase(boss(150))).toBe(2);expect(bossPhase(boss(100))).toBe(3);expect(bossPhase(boss(1))).toBe(3);});
 it('counts down to the every-third-hit slam',()=>{expect(hitsUntilSlam(boss(300,0))).toBe(3);expect(hitsUntilSlam(boss(300,1))).toBe(2);expect(hitsUntilSlam(boss(300,2))).toBe(1);expect(hitsUntilSlam(boss(300,3))).toBe(3);});
});

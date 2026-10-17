// @vitest-environment jsdom
import {describe,it,expect,beforeEach} from 'vitest';
import {readStored} from '../src/services/legacyStorage';

describe('storage keys after the rename to Thailnw',()=>{
 beforeEach(()=>localStorage.clear());
 it('prefers the new key',()=>{localStorage.setItem('thailnw.ui.v1','new');localStorage.setItem('embermarch.ui.v1','old');expect(readStored('thailnw.ui.v1')).toBe('new');});
 it('moves a value stored under the old name',()=>{localStorage.setItem('embermarch.keys.v1','{"skill:0":"2"}');expect(readStored('thailnw.keys.v1')).toBe('{"skill:0":"2"}');
  expect(localStorage.getItem('thailnw.keys.v1')).toBe('{"skill:0":"2"}');expect(localStorage.getItem('embermarch.keys.v1')).toBeNull();});
 it('keeps the old save as a rollback copy',()=>{localStorage.setItem('embermarch.save.v1','{}');expect(readStored('thailnw.save.v1',true)).toBe('{}');expect(localStorage.getItem('embermarch.save.v1')).toBe('{}');});
 it('returns null when neither exists',()=>{expect(readStored('thailnw.dock.v1')).toBeNull();});
});

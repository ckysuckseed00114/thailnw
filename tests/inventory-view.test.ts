import {describe,it,expect} from 'vitest';
import {createState} from '../src/core/GameState';
import {renderInventory,type InventoryViewState} from '../src/ui/inventoryView';
import type {Item} from '../src/core/models';

const item=(id:number,name:string):Item=>({id,name,slot:'Weapon',rarity:'Rare',base:12,forge:0,invested:0,locked:false});
const view=(filter:InventoryViewState['filter']='all'):InventoryViewState=>({filter,query:'',selectedId:null,selectedSource:'bag'});

describe('inventory view',()=>{
 it('shows worn gear in its slot and removes it from the bag grid',()=>{
  const s=createState();const worn=item(1,'Worn blade'),spare=item(2,'Spare blade');s.inventory=[worn,spare];s.equipped.Weapon=worn.id;
  const html=renderInventory(s,view());
  expect(html).toContain('data-source="equipped" data-id="1"');
  expect(html).not.toContain('data-source="bag" data-id="1"');
  expect(html).toContain('data-source="bag" data-id="2"');
  const selected=view();selected.selectedId=1;selected.selectedSource='equipped';
  expect(renderInventory(s,selected)).toContain('data-action="unequip" data-id="1"');
 });
 it('separates chest rewards and material balances into their tabs',()=>{
  const s=createState();s.chest=[item(3,'Chest blade')];s.bone=42;
  const chest=renderInventory(s,view('chest'));
  expect(chest).toContain('data-source="chest" data-id="3"');
  expect(chest).toContain('รับไอเท็มจากกล่องสมบัติก่อน');
  const materials=renderInventory(s,view('materials'));
  expect(materials).toContain('Bone');expect(materials).toContain('42');
  expect(materials).not.toContain('data-source="chest" data-id="3"');
 });
});

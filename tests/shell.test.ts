import {describe,it,expect,beforeEach,afterEach} from 'vitest';
import {createState,Store} from '../src/core/GameState';
import {CombatEngine} from '../src/core/CombatEngine';
import {UIManager} from '../src/ui/UIManager';

/** Guards against regressions where the game shell loses #game or save status hooks. */
describe('game shell',()=>{
 beforeEach(()=>{document.body.innerHTML='<div id="app"></div>';});
 afterEach(()=>{document.body.innerHTML='';});
 it('collapses the dock and restores a minimized game panel',()=>{
  const proto=HTMLDialogElement.prototype;
  const original={show:proto.show,showModal:proto.showModal,close:proto.close};
  proto.show=function(){this.setAttribute('open','');};
  proto.showModal=function(){this.setAttribute('open','');};
  proto.close=function(){this.removeAttribute('open');this.dispatchEvent(new Event('close'));};
  try{
   const s=createState(1700000000000,2);s.started=true;const ui=new UIManager(new Store(new CombatEngine(s)),()=>{});
   ui.open('inventory');expect(ui.dialog.open).toBe(true);
   document.querySelector<HTMLElement>('[data-action="inv-filter"][data-value="materials"]')!.click();
   expect(document.querySelector('.inv-materials')).toBeTruthy();
   document.querySelector<HTMLElement>('[data-action="inv-filter"][data-value="all"]')!.click();
   document.querySelector<HTMLElement>('[data-action="minimize"]')!.click();
   expect(ui.dialog.open).toBe(false);expect(document.querySelector('.dock-restore')).toBeTruthy();
   document.querySelector<HTMLElement>('[data-action="dock-toggle"]')!.click();
   expect(document.querySelector('#menu-dock')?.classList.contains('collapsed')).toBe(true);
   document.querySelector<HTMLElement>('[data-action="dock-toggle"]')!.click();
   document.querySelector<HTMLElement>('.dock-restore')!.click();
   expect(ui.dialog.open).toBe(true);expect(document.querySelector('#modal-title')?.textContent).toBe('กระเป๋า');
   expect(document.querySelector('.inventory-ui')).toBeTruthy();
   document.querySelector<HTMLElement>('[data-action="panel-snap"]')!.click();
   expect(ui.dialog.dataset.snap).toBe('right');
  }finally{Object.assign(proto,original);localStorage.removeItem('embermarch.dock.v1');}
 });
 it('mounts Phaser parent and save status for HUD v2',()=>{
  const s=createState(1700000000000,1);s.started=true;
  const store=new Store(new CombatEngine(s));
  new UIManager(store,()=>{});
  expect(document.querySelector('#game')).toBeTruthy();
  expect(document.querySelector('#save-status-hud')).toBeTruthy();
  expect(document.querySelector('#modal')).toBeTruthy();
  expect(document.querySelector('.hero-card')).toBeFalsy();
 });
});

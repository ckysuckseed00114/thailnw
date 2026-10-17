import type {Store} from '../core/GameState';
import {readStored} from '../services/legacyStorage';
import {ATTRIBUTES,CLASSES,NAME_MAX,PETS,REGIONS,SKILLS,type Command,type GameState} from '../core/models';
import {petXp,regionIndex,sealCost,stats} from '../core/Formulas';
import {QUESTS} from '../core/CombatEngine';
import {heroSVG,HERO_DESIGNS} from '../game/HeroArt';
import {renderInventory,type InventoryFilter,type InventorySource,type InventoryViewState} from './inventoryView';
import './menuDock.css';
import './inventory.css';

const n=(v:number)=>Math.floor(v).toLocaleString();
const esc=(v:string)=>v.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));

/** Modal windows and toasts. Live HUD is Preact (`src/ui/hud`). */
export class UIManager {
 private panel='';private previousFocus:HTMLElement|null=null;private toastTimer=0;private panelSignature='';
 private minimized='';private dockCollapsed=false;private dockSide:'left'|'center'|'right'='center';private panelSide:'free'|'left'|'right'='free';
 private inventoryView:InventoryViewState={filter:'all',query:'',selectedId:null,selectedSource:'bag'};
 constructor(private store:Store,private onSave:()=>void){
  try{const p=JSON.parse(readStored('thailnw.dock.v1')??'{}');this.dockCollapsed=p.collapsed===true;this.dockSide=p.side==='left'||p.side==='right'?p.side:'center';this.panelSide=p.panelSide==='left'||p.panelSide==='right'?p.panelSide:'free';}catch{/* use defaults */}
  document.querySelector('#app')!.innerHTML=`<div class="shell shell-game">
<div id="game" role="img" aria-label="Animated dungeon combat. Health and combat updates are available in the surrounding interface."></div>
<span id="save-status-hud" class="save-status-hud" aria-live="polite"></span>
<nav id="menu-dock" class="menu-dock" aria-label="เมนูเกม"><button class="dock-toggle" data-action="dock-toggle" aria-label="พับเมนู" aria-expanded="true">☰ <span>เมนู</span></button><div class="dock-items"></div><button class="dock-grip" data-action="dock-side" title="ย้ายตำแหน่งเมนู" aria-label="ย้ายตำแหน่งเมนู">⋮⋮</button></nav>
<dialog id="modal" aria-labelledby="modal-title"><div class="modal-header"><div><div class="eyebrow">THAILNW / ADVENTURE</div><h2 id="modal-title"></h2></div><div class="modal-controls"><button class="modal-snap" data-action="panel-snap" aria-label="ดูดหน้าต่างเข้าขอบจอ" title="ดูดหน้าต่างเข้าขอบจอ">◧</button><button class="modal-minimize" data-action="minimize" aria-label="ย่อหน้าต่างไปที่เมนู" title="ย่อไปที่เมนู">−</button><button class="close" aria-label="ปิดหน้าต่าง" data-action="close">×</button></div></div><div id="modal-body"></div></dialog>
<div id="toast" role="status" aria-live="polite"></div></div>`;
  this.renderDock();this.installWindowDrag();
  document.addEventListener('click',e=>{const b=(e.target as HTMLElement).closest<HTMLElement>('[data-panel],[data-action]');if(!b)return;if(b.dataset.panel)this.open(b.dataset.panel);if(b.dataset.action)this.action(b);});
  document.addEventListener('input',e=>{if((e.target as HTMLElement).id==='inv-search'){this.inventoryView.query=(e.target as HTMLInputElement).value;this.renderPanel();}});
  document.addEventListener('submit',e=>{const form=e.target as HTMLElement;if(form.dataset.form!=='rename')return;e.preventDefault();form.querySelector<HTMLElement>('[data-action="rename"]')?.click();});
  this.dialog.addEventListener('cancel',e=>{if(!this.store.state.started)e.preventDefault();else this.panel='';});
  this.dialog.addEventListener('close',()=>{this.panel='';this.previousFocus?.focus();this.renderDock();});
  store.subscribe(s=>this.syncOpenPanel(s));
  if(!store.state.started)this.open('class');else if(store.state.afk.seconds>=60)this.open('afk');
 }
 get dialog(){return document.querySelector<HTMLDialogElement>('#modal')!;}
 toast(text:string){const t=document.querySelector('#toast')!;t.textContent=text;t.classList.add('show');window.clearTimeout(this.toastTimer);this.toastTimer=window.setTimeout(()=>t.classList.remove('show'),3500);}
 open(panel:string){if(!this.store.state.started&&panel!=='class')return;this.panel=panel;this.minimized='';this.previousFocus=document.activeElement as HTMLElement;this.renderPanel();this.renderDock();if(!this.dialog.open){if(panel==='class'||panel==='afk')this.dialog.showModal();else this.dialog.show();}this.layoutPanel();}
 private close(){if(!this.store.state.started)return;this.dialog.close();this.panel='';}
 toggle(panel:string){if(!this.store.state.started)return;if(this.panel===panel)this.close();else this.open(panel);}
 private saveDock(){try{localStorage.setItem('thailnw.dock.v1',JSON.stringify({collapsed:this.dockCollapsed,side:this.dockSide,panelSide:this.panelSide}));}catch{/* optional UI preference */}}
 private renderDock(){
  const dock=document.querySelector<HTMLElement>('#menu-dock');if(!dock)return;
  dock.dataset.side=this.dockSide;dock.classList.toggle('collapsed',this.dockCollapsed);
  const toggle=dock.querySelector<HTMLButtonElement>('.dock-toggle')!;toggle.setAttribute('aria-expanded',String(!this.dockCollapsed));toggle.setAttribute('aria-label',this.dockCollapsed?'ขยายเมนู':'พับเมนู');
  const items:[string,string,string][]=[['inventory','🎒','กระเป๋า'],['stats','✦','ตัวละคร'],['pet','🐾','สัตว์เลี้ยง'],['shop','⚒','ร้านค้า'],['market','◇','ตลาด'],['travel','◉','แผนที่'],['quests','📜','ภารกิจ'],['roster','⚔','อาชีพ']];
  dock.querySelector('.dock-items')!.innerHTML=items.map(([id,icon,label])=>`<button class="dock-item ${this.panel===id?'active':''}" data-panel="${id}" aria-label="${label}" title="${label}"><span aria-hidden="true">${icon}</span><small>${label}</small></button>`).join('')+(this.minimized?`<button class="dock-restore" data-panel="${this.minimized}" title="เรียกหน้าต่างคืน">↥ <span>เรียกคืน</span></button>`:'');
  if(this.minimized&&this.dockCollapsed)toggle.classList.add('has-window');else toggle.classList.remove('has-window');
 }
 private layoutPanel(){
  const d=this.dialog,modal=this.panel==='class'||this.panel==='afk';d.classList.toggle('blocking',modal);d.dataset.snap=modal?'free':this.panelSide;
  if(modal){d.style.removeProperty('left');d.style.removeProperty('top');return;}
  const w=Math.min(d.offsetWidth||(this.panelSide==='free'?930:620),window.innerWidth-32),h=Math.min(d.scrollHeight,window.innerHeight*.82);
  const x=this.panelSide==='left'?16:this.panelSide==='right'?window.innerWidth-w-16:Math.max(16,(window.innerWidth-w)/2);
  d.style.left=`${Math.round(x)}px`;d.style.top=`${Math.round(Math.max(16,(window.innerHeight-h)/2))}px`;
 }
 private installWindowDrag(){
  const d=this.dialog,header=d.querySelector<HTMLElement>('.modal-header')!;let startX=0,startY=0,originX=0,originY=0,dragging=false;
  header.addEventListener('pointerdown',e=>{if(e.pointerType==='touch'||window.innerWidth<=760||(e.target as HTMLElement).closest('button')||this.panel==='class'||this.panel==='afk')return;
   startX=e.clientX;startY=e.clientY;originX=d.offsetLeft;originY=d.offsetTop;dragging=true;header.setPointerCapture(e.pointerId);d.classList.add('dragging');});
  header.addEventListener('pointermove',e=>{if(!dragging)return;this.panelSide='free';d.dataset.snap='free';
   d.style.left=`${Math.round(Math.max(8,Math.min(window.innerWidth-d.offsetWidth-8,originX+e.clientX-startX)))}px`;
   d.style.top=`${Math.round(Math.max(8,Math.min(window.innerHeight-48,originY+e.clientY-startY)))}px`;});
  const end=(e:PointerEvent)=>{if(!dragging)return;dragging=false;d.classList.remove('dragging');if(header.hasPointerCapture(e.pointerId))header.releasePointerCapture(e.pointerId);
   if(e.clientX<48)this.panelSide='left';else if(e.clientX>window.innerWidth-48)this.panelSide='right';else this.panelSide='free';
   if(this.panelSide!=='free')this.layoutPanel();this.saveDock();};header.addEventListener('pointerup',end);header.addEventListener('pointercancel',end);
  window.addEventListener('resize',()=>{if(d.open)this.layoutPanel();});
 }
 private send(c:Command){try{this.store.dispatch(c);this.onSave();this.renderPanel();}catch(e){this.toast((e as Error).message);}}
 private action(b:HTMLElement){
  const a=b.dataset.action,id=Number(b.dataset.id);
  if(a==='dock-toggle'){this.dockCollapsed=!this.dockCollapsed;this.saveDock();this.renderDock();return;}
  if(a==='dock-side'){this.dockSide=this.dockSide==='center'?'right':this.dockSide==='right'?'left':'center';this.saveDock();this.renderDock();return;}
  if(a==='minimize'){if(this.panel==='class'||this.panel==='afk')return;this.minimized=this.panel;this.close();this.renderDock();return;}
  if(a==='panel-snap'){this.panelSide=this.panelSide==='free'?'right':this.panelSide==='right'?'left':'free';this.layoutPanel();this.saveDock();return;}
  if(a==='close'){this.close();return;}
  if(a==='inv-filter'){this.inventoryView.filter=b.dataset.value as InventoryFilter;this.inventoryView.selectedId=null;this.inventoryView.selectedSource=this.inventoryView.filter==='chest'?'chest':'bag';this.renderPanel();return;}
  if(a==='inv-select'){this.inventoryView.selectedId=id;this.inventoryView.selectedSource=b.dataset.source as InventorySource;this.renderPanel();return;}
  if(a==='class'){this.send({type:'class',value:b.dataset.value as GameState['hero']['class'],name:this.inputValue('class-name-input')});this.close();return;}
  if(a==='rename'){const before=this.store.state.hero.name;this.send({type:'name',value:this.inputValue('rename-input')??''});if(this.store.state.hero.name!==before)this.toast(`You are now known as ${this.store.state.hero.name}.`);return;}
  if(['equip','unequip','forge','salvage','lock'].includes(a!))this.send({type:a as 'equip',id});
  else if(a==='best')this.send({type:'best'});
  else if(a==='claim')this.send({type:'claim'});
  else if(a==='advance')this.send({type:'advance'});
  else if(a==='seal')this.send({type:'seal'});
  else if(a==='allocate')this.send({type:'allocate',value:b.dataset.value as typeof ATTRIBUTES[number]});
  else if(a==='pet')this.send({type:'pet',value:b.dataset.value as typeof PETS[number]});
  else if(a==='feed')this.send({type:'feed',amount:10});
  else if(a==='travel')this.send({type:'travel',region:id});
  else if(a==='quest')this.send({type:'quest',id:b.dataset.value!});
  else if(a==='buy')this.send({type:'buy',offer:b.dataset.value as 'potion'});
  else if(a==='afk'){this.send({type:'afk'});this.close();}
 }
 private nameField(id:string,label:string){return `<label class="name-field" for="${id}"><span>${label}</span><input id="${id}" maxlength="${NAME_MAX}" value="${esc(this.store.state.hero.name)}" autocomplete="off" spellcheck="false"></label>`;}
 private inputValue(id:string){return document.querySelector<HTMLInputElement>(`#${id}`)?.value;}
 private text(id:string,text:string){document.getElementById(id)!.textContent=text;}
 /** Refresh modal content when currencies or inventory change while a panel is open. */
 private syncOpenPanel(s:GameState){
  if(!this.panel||this.panel==='class')return;
  const st=stats(s);
  const signature=JSON.stringify([s.lm,s.bone,s.hero.points,s.kills,s.bosses,s.chest.length,s.unlocked,Math.ceil(Math.max(0,s.travelAt-s.now)/60000),!!s.respawnAt,s.hero.hp>=st.maxHp,s.inventory.length]);
  if(signature!==this.panelSignature){this.panelSignature=signature;this.renderPanel();}
 }
 renderPanel(){
  if(!this.panel)return;const focused=document.activeElement as HTMLElement|null;const focusData=focused&&this.dialog.contains(focused)?{...focused.dataset}:null;const scroll=this.dialog.scrollTop;const s=this.store.state,st=stats(s);let html='',title='';
  if(this.panel==='class'||this.panel==='roster'){const selecting=this.panel==='class';title=selecting?'Choose your calling':'The five orders';html=`<p class="intro">Five heroes, forged in the same darkness. ${selecting?'Choose the legend you will become.':'Your current order: '+s.hero.class+'.'}</p>${selecting?this.nameField('class-name-input','Your name'):''}<div class="class-grid hero-roster">${CLASSES.map(c=>{const d=HERO_DESIGNS[c];return `<article class="choice character-card ${s.started&&s.hero.class===c?'selected':''}" style="--hero-accent:${d.accent}"><div class="hero-stage"><div class="hero-portal"></div>${heroSVG(c)}<div class="hero-pedestal"></div></div><small class="order-name">${d.title}</small><h3>${c}</h3><b>${SKILLS[c].name} · ${Math.round(SKILLS[c].mult*100)}%</b><p>${d.description}</p>${selecting?`<button class="primary full" data-action="class" data-value="${c}">Choose ${c}</button>`:`<span class="tag">${s.hero.class===c?'YOUR ORDER':'AUTO SKILL · 7s'}</span>`}</article>`;}).join('')}</div><p class="fine-print">Original pixel character designs. All classes retain the same starting attributes; weapons and auto skills define their combat style.${selecting?' Your choice is permanent for this save.':''}</p>`;}
  if(this.panel==='inventory'){title='กระเป๋า';html=renderInventory(s,this.inventoryView);}
  if(this.panel==='stats'){title=s.hero.name;const descriptions=['+2 damage per point','+8 maximum HP per point','+2 speed and +1% boss slam dodge','+1% block chance per point','+0.25% life steal per point · cap 20'];html=`<div class="highlight">Level ${s.hero.level} ${s.hero.class} <b>${s.hero.points} points available</b></div>${ATTRIBUTES.map((a,i)=>`<div class="setting-row"><div><h3>${a} <span class="tag">${s.hero.attributes[a]}</span></h3><p>${descriptions[i]}</p></div><button data-action="allocate" data-value="${a}" ${!s.hero.points||(a==='Vampirism'&&s.hero.attributes[a]>=20)?'disabled':''}>Allocate +</button></div>`).join('')}<div class="highlight"><span>Boss dodge ${(st.dodge*100).toFixed(0)}%</span><span>Life steal ${(st.lifeSteal*100).toFixed(2)}%</span><span>Crit ×1.8</span></div>`;}
  if(this.panel==='pet'){title='Small allies. Great courage.';html=`<p class="intro">Companion skills activate every 8s. Each level adds a 10% skill bonus.</p><div class="pet-grid">${PETS.map((p,i)=>`<article class="choice ${p===s.pet?'selected':''}"><span class="choice-icon">${['♧','◈','⬡','✧'][i]}</span><h3>${p}</h3><b>Level ${s.pets[p].level} / 10</b><p>${['Restores 10% maximum health.','Blocks the next hit. Levels reduce cooldown.','Deals 90% damage and stuns.','Fires a bolt for 120% damage.'][i]}</p><button data-action="pet" data-value="${p}" ${p===s.pet?'disabled':''}>${p===s.pet?'Active companion':'Take along'}</button></article>`).join('')}</div><div class="highlight"><div><b>${s.pet} · ${n(s.pets[s.pet].xp)} / ${petXp(s.pets[s.pet].level)} XP</b><p>Feed 10 Bone + 10 TH → 100 XP</p></div><button class="primary" data-action="feed" ${s.bone<10||s.lm<10||s.pets[s.pet].level>=10?'disabled':''}>Feed companion</button></div>`;}
  if(this.panel==='travel'){title='Beyond the Stone Halls';const next=Math.floor((s.unlocked-1)/11)+2,cost=sealCost(next);html=`<p class="intro">Travel to an unlocked region to farm. Travel cooldown: ${s.travelAt>s.now?Math.ceil((s.travelAt-s.now)/60000)+' minutes remaining':'Ready'}.</p><div class="region-list">${Array.from({length:Math.max(11,Math.ceil(s.unlocked/11)*11)},(_,i)=>`<button data-action="travel" data-id="${i+1}" ${i+1>s.unlocked||s.now<s.travelAt||!!s.respawnAt?'disabled':''} class="${regionIndex(s)===i+1?'selected':''}"><small>F${Math.floor(i/11)+1} / ${String(i%11+1).padStart(2,'0')}</small><b>${REGIONS[i%11]}</b><span>${i+1>s.unlocked?'Locked':regionIndex(s)===i+1?'You are here':'Travel →'}</span></button>`).join('')}</div><div class="highlight"><div><b>Break the seal · Floor ${next}</b><p>${n(cost.lm)} TH + ${n(cost.bone)} Bone · Defeat all prior wardens.</p></div><button data-action="seal" ${s.cleared<(next-1)*11||s.lm<cost.lm||s.bone<cost.bone?'disabled':''}>Unlock floor</button></div>`;}
  if(this.panel==='shop'){title='The wandering merchant';html=`<p class="intro">Supplies for the road ahead. Purchases use local, simulated TH.</p><div class="pet-grid"><article class="choice"><span class="choice-icon">♜</span><h3>Renewal draught</h3><p>Instantly restore all health.</p><button data-action="buy" data-value="potion" ${s.lm<50||s.respawnAt||s.hero.hp>=st.maxHp?'disabled':''}>50 TH · Restore</button></article><article class="choice"><span class="choice-icon">▣</span><h3>Wanderer's cache</h3><p>One random item scaled to your current region. Delivered to the loot chest.</p><button data-action="buy" data-value="cache" ${s.lm<150?'disabled':''}>150 TH · Purchase</button></article></div><p class="fine-print">Rarity chances: Common 50% · Uncommon 27% · Rare 15% · Epic 6% · Legendary 1.8% · Mythic 0.2%</p>`;}
  if(this.panel==='market'){title='The exchange';html='<div class="empty-state">⚖<h3>The trading gates are closed.</h3><p>This build uses local currency and storage. Player trading requires a trusted server, ownership ledger and wallet integration.</p><span class="tag">NOT CONNECTED</span></div>';}
  if(this.panel==='quests'){title='A story worth telling';html=`<p class="intro">Permanent adventure milestones. Each reward can be claimed once.</p>${QUESTS.map(q=>`<div class="setting-row"><div><h3>${q.name}</h3><p>${q.description} · ${Math.min(q.target,s[q.metric])}/${q.target}</p><small>${q.lm} TH + ${q.bone} Bone</small></div><button data-action="quest" data-value="${q.id}" ${s[q.metric]<q.target||s.questClaims.includes(q.id)?'disabled':''}>${s.questClaims.includes(q.id)?'Claimed':'Claim reward'}</button></div>`).join('')}`;}
  if(this.panel==='afk'){title='While you were away';html=`<p class="intro">${Math.floor(s.afk.seconds/60)} minutes of rest. Rewards reflect 75% of your recorded clearing rate over the recent 24 hours, for up to 8 hours per absence.</p><div class="reward-grid">${(['lm','xp','bone','loot'] as const).map(k=>`<div><b>${n(s.afk[k])}</b><small>${k==="lm"?'TH':k.toUpperCase()}</small></div>`).join('')}</div><button class="primary full" data-action="afk">Claim rewards & continue</button>`;}
  if(this.panel==='stats')html=`<div class="character-summary">${heroSVG(s.hero.class)}<div><h3>${HERO_DESIGNS[s.hero.class].title}</h3><p>${HERO_DESIGNS[s.hero.class].description}</p><button data-panel="roster">View all five character designs</button></div></div><form class="name-form" data-form="rename">${this.nameField('rename-input','Name')}<button type="button" data-action="rename">Save name</button></form>`+html;
  this.dialog.classList.toggle('roster-dialog',this.panel==='class'||this.panel==='roster');
  this.dialog.classList.toggle('inventory-dialog',this.panel==='inventory');
  const draft=this.dialog.querySelector<HTMLInputElement>('#rename-input'),keep=draft&&{value:draft.value,focused:document.activeElement===draft,start:draft.selectionStart,end:draft.selectionEnd};
  const gridScroll=this.dialog.querySelector<HTMLElement>('.inv-grid')?.scrollTop;
  this.text('modal-title',title);document.querySelector('#modal-body')!.innerHTML=html;
  const input=this.dialog.querySelector<HTMLInputElement>('#rename-input');if(input&&keep){input.value=keep.value;if(keep.focused){input.focus({preventScroll:true});input.setSelectionRange(keep.start,keep.end);}}if(this.panel==='inventory'){if(focused?.id==='inv-search')this.dialog.querySelector<HTMLInputElement>('#inv-search')?.focus({preventScroll:true});const grid=this.dialog.querySelector<HTMLElement>('.inv-grid');if(grid&&gridScroll!==undefined)grid.scrollTop=gridScroll;}this.dialog.querySelector<HTMLButtonElement>('.close')!.hidden=this.panel==='class';
  if(focusData?.action){const match=Array.from(this.dialog.querySelectorAll<HTMLElement>('[data-action]')).find(el=>Object.entries(focusData).every(([k,v])=>el.dataset[k]===v));match?.focus({preventScroll:true});}this.dialog.scrollTop=scroll;
 }
}

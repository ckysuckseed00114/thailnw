import Phaser from 'phaser';
import type {Store} from '../../core/GameState';
import type {GameEvent,GameState} from '../../core/models';
import {stats} from '../../core/Formulas';
import {CLASSES} from '../../core/models';
import {HAND_FROM_FEET,MONSTERS,heroSprite,monsterSprite,weaponSprite,type Sprite} from '../PixelSprites';
import {ROOM_STRIDE,traversalPoint,traversalProgress} from '../../core/RoomTraversal';
import type {Element} from '../../core/Skills';
import {ELEMENT_COLOR} from '../../ui/theme/elements';
import {prefs} from '../../ui/hud/prefs';
type Actor={root:Phaser.GameObjects.Container;body:Phaser.GameObjects.Sprite;weapon:Phaser.GameObjects.Container;bar:Phaser.GameObjects.Graphics;plate:Phaser.GameObjects.Text;top:number;hand:{x:number;y:number};attackUntil:number};
/** Feet sit on this line inside every actor container; pixel sprites are anchored to it. */
/** Routine (non-important) damage numbers are skipped beyond this many on screen. */
const POPUP_CAP=28;
const FEET=24,PX=4,BOSS_PX=5,FONT='Silkscreen, "Courier New", monospace';
/** Presentation positions are independent of authoritative combat math. */
export class CatacombScene extends Phaser.Scene {
 private actors=new Map<number,Actor>();private hero!:Actor;private pet!:Phaser.GameObjects.Container;private caption!:Phaser.GameObjects.Text;private warn!:Phaser.GameObjects.Graphics;private unsubscribe?:()=>void;private room='';
 private reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
 private sections:{root:Phaser.GameObjects.Container;top:Phaser.GameObjects.Rectangle;bottom:Phaser.GameObjects.Rectangle}[]=[];
 private journey=0;private traversal:{x:number;y:number;until:number}|null=null;private wasDead=false;private travelAt=0;private lastStateAt=0;
 private lastHp=-1;private healed=0;private healShownAt=0;
 private popups=0;private stacks=new Map<number,{until:number;n:number}>();
 constructor(private store:Store){super('Catacombs');}
 create(){
  for(let i=0;i<3;i++){
   const before=new Set(this.children.list);this.environment();
   const frame=this.add.graphics();frame.fillStyle(0x121a2b).fillRect(1323,384,48,18).fillRect(1323,528,48,18);frame.lineStyle(3,0xa38b60).strokeRect(1327,388,40,12).strokeRect(1327,530,40,12);
   const top=this.add.rectangle(1347,400,27,65,0x625b50).setOrigin(.5,0).setStrokeStyle(3,0xc1a06b);
   const bottom=this.add.rectangle(1347,530,27,65,0x625b50).setOrigin(.5,1).setStrokeStyle(3,0xc1a06b);
   const children=this.children.list.filter(c=>!before.has(c));const root=this.add.container((i-1)*ROOM_STRIDE,0,children);this.sections.push({root,top,bottom});
  }
  this.makeTextures();this.warn=this.add.graphics().setDepth(5);this.hero=this.figure(0,590,460,false,true);
  this.pet=this.add.container(540,500,[this.add.ellipse(0,17,26,9,0x000000,.35),this.add.image(0,0,'companion').setScale(2.5)]);
  this.caption=this.add.text(720,740,'',{fontFamily:FONT,fontSize:'14px',color:'#b8c7df',stroke:'#080d1c',strokeThickness:5,letterSpacing:2}).setOrigin(.5).setDepth(1000);
  // Canvas text is rasterised once; redraw labels when the pixel font arrives.
  void document.fonts?.load(`16px ${FONT}`).then(()=>{if(this.hero?.plate.active){this.hero.plate.updateText();this.caption.updateText();}});
  this.resizeView();this.scale.on('resize',this.resizeView,this);
  this.unsubscribe=this.store.subscribe((s,e)=>this.render(s,e));this.events.once('shutdown',()=>{this.unsubscribe?.();this.scale.off('resize',this.resizeView,this);});
 }
 private resizeView(){const w=this.scale.width,h=this.scale.height;this.cameras.main.setZoom(w<761?Math.max(.8,Math.min(w/620,h/740)):Math.min(w/1440,h/900)).centerOn(w<761?this.hero.root.x+70:this.journey*ROOM_STRIDE+720,450);}
 private environment(){
  const g=this.add.graphics();
  const floor=(x:number,y:number,w:number,h:number)=>{g.fillStyle(0x252c45).fillRect(x,y,w,h);for(let yy=y;yy<y+h;yy+=48)for(let xx=x;xx<x+w;xx+=48){const v=Math.abs((xx*7+yy*11)%13);g.fillStyle([0x2c344d,0x303851,0x2b334a,0x323b54][v%4]).fillRect(xx+1,yy+1,46,46);g.lineStyle(1,0x8390af,.035).strokeRect(xx+2,yy+2,44,44);if(v%4===0){g.lineStyle(1,0x161f34,.4).lineBetween(xx+8,yy+37,xx+19,yy+35).lineBetween(xx+19,yy+35,xx+24,yy+40);}}};
  const wall=(x:number,y:number,w:number)=>{for(let row=0;row<3;row++)for(let xx=x;xx<x+w;xx+=48){g.fillStyle(0x161d30).fillRect(xx,y+row*16,47,16);g.fillStyle(row===0?0x737b9d:0x454f72).fillRect(xx+2,y+row*16+2,43,11);g.fillStyle(row===0?0xa0a7c2:0x667291).fillRect(xx+2,y+row*16+2,43,2);g.fillStyle(0x252e49).fillRect(xx+5,y+row*16+8,22,3);}g.fillStyle(0x070c1c,.5).fillRect(x,y+48,w,16);};
  floor(90,248,480,432);floor(570,344,192,240);floor(762,248,576,432);floor(1338,392,192,144);
  wall(90,200,480);wall(762,200,576);wall(90,680,480);wall(762,680,576);wall(570,296,192);wall(570,584,192);
  for(const x of [66,1338]){for(let y=248;y<728;y+=24){if(y>=392&&y<536)continue;g.fillStyle(0x161c30).fillRect(x,y,24,24);g.fillStyle(0x535e7e).fillRect(x+2,y+1,20,21);g.fillStyle(0x7d87a4).fillRect(x+2,y+1,20,3);}}
  g.fillStyle(0x343047,.65).fillRect(780,363,530,170);g.lineStyle(2,0x917347,.3).strokeRect(787,370,516,156);g.lineStyle(2,0x8191b0,.12).strokeCircle(1038,454,75).strokeCircle(1038,454,61);
  for(let i=0;i<8;i++){const a=i*Math.PI/4;g.lineBetween(1038+Math.cos(a)*61,454+Math.sin(a)*61,1038+Math.cos(a)*75,454+Math.sin(a)*75);}
  for(const [x,y] of [[215,330],[435,330],[215,600],[435,600],[850,310],[1245,310],[850,620],[1245,620]])this.column(x,y);
  for(const [x,y] of [[170,229],[482,229],[835,229],[1240,229]])this.flame(x,y);
  for(const [x,y] of [[1220,390],[1265,390],[1220,555],[1265,555],[140,485],[140,530]]){g.fillStyle(0x11192a).fillRect(x-19,y-18,39,33);g.fillStyle(0x614d41).fillRect(x-16,y-15,32,27);g.fillStyle(0x9f8662).fillRect(x-16,y-15,32,4);g.fillStyle(0x302c31).fillRect(x-16,y-4,32,5);g.fillStyle(0xc1a16e).fillRect(x-3,y-5,6,9);}
  for(let i=0;i<28;i++){g.fillStyle(0x9aa7bf,.08).fillRect(100+(i*131)%1230,280+(i*73)%370,3+(i%3)*3,3);}
  if(!this.reduced)for(let i=0;i<26;i++){const mote=this.add.circle(110+(i*127)%1200,260+(i*71)%410,1+(i%2),0x8dcfff,.15);this.tweens.add({targets:mote,y:'-=35',alpha:0,duration:4000+i*90,repeat:-1});}
 }
 private column(x:number,y:number){const g=this.add.graphics();g.fillStyle(0x070b17,.3).fillEllipse(x+5,y+37,65,22);g.fillStyle(0x111a2c).fillRect(x-19,y-15,38,52);g.fillStyle(0x536788).fillRect(x-15,y-12,30,45);g.fillStyle(0x8ea3bf).fillRect(x-11,y-10,9,36);g.fillStyle(0x273a57).fillRect(x+7,y-10,6,36);g.fillStyle(0x253b56).fillRect(x-24,y-31,48,27);g.fillStyle(0xa1bad2).fillRect(x-20,y-27,40,18);g.fillStyle(0x6f94b9).fillRect(x-17,y-24,34,14);g.fillStyle(0xb1c5dc).fillRect(x-24,y+30,48,7);this.flame(x,y-40);}
 private flame(x:number,y:number){const glow=this.add.circle(x,y,67,0x5ebcff,.035);this.add.circle(x,y,31,0x63bcff,.06);const flame=this.add.container(x,y,[this.add.rectangle(0,2,11,16,0x298bd2),this.add.rectangle(1,-5,6,18,0x61c9ff),this.add.rectangle(0,2,5,9,0xdbfaff),this.add.rectangle(3,-14,3,7,0x9dedff)]);if(!this.reduced)this.tweens.add({targets:[flame,glow],alpha:.55,scaleY:.88,duration:530+x%230,yoyo:true,repeat:-1});}
 private texture(key:string,rows:string[],palette:Record<string,number>){const g=this.make.graphics({x:0,y:0});rows.forEach((r,y)=>[...r].forEach((c,x)=>{if(c!=='.'&&palette[c]!==undefined)g.fillStyle(palette[c]).fillRect(x,y,1,1);}));g.generateTexture(key,rows[0].length,rows.length);g.destroy();}
 private sprite(key:string,s:Sprite){const palette:Record<string,number>={};for(const [c,hex] of Object.entries(s.palette))palette[c]=Number.parseInt(hex.slice(1),16);this.texture(key,s.rows,palette);}
 private makeTextures(){
  for(const kind of CLASSES){this.sprite(`hero-${kind}-0`,heroSprite(kind,0));this.sprite(`hero-${kind}-1`,heroSprite(kind,1));this.sprite(`weapon-${kind}`,weaponSprite(kind));}
  for(const [name,s] of Object.entries(MONSTERS))this.sprite(`mon-${name}`,s);
  this.texture('companion',['..g......g..','..gG....Gg..','...GGGGGG...','..GGGGGGGG..','..GkGGGGkG..','..GGGyyGGG..','...GGGGGG...','...gGGGGg...','....g..g....'],{g:0x4c7353,G:0xa9cc82,k:0x182d37,y:0xf3dfa1});
 }
 private figure(id:number,x:number,y:number,boss:boolean,hero=false,name=''):Actor{
  const kind=this.store.state.hero.class,scale=boss?BOSS_PX:PX;
  const look=hero?heroSprite(kind):monsterSprite(name,boss);const key=hero?`hero-${kind}-0`:boss?'mon-boss':`mon-${MONSTERS[name]?name:'Crypt Sentinel'}`;
  const shadow=this.add.ellipse(0,FEET+1,boss?96:hero?52:56,boss?22:14,0x050813,.5);
  const body=this.add.sprite(0,FEET,key).setOrigin(.5,1).setScale(scale);
  const hand={x:boss?42:17,y:FEET-(boss?8*BOSS_PX:HAND_FROM_FEET*PX)};
  const weapon=this.add.container(hand.x,hand.y).setAngle(25);const held=hero?kind:boss?'Axe':name==='Crypt Sentinel'?'Sword':null;
  if(held)weapon.add(this.add.image(0,0,`weapon-${held}`).setOrigin(.5,.85).setScale(boss?4.4:hero?PX:3.2));
  const plate=this.add.text(0,FEET+18,'',{fontFamily:FONT,fontSize:'11px',color:'#f6d88f',backgroundColor:'#120e18e0',padding:{x:6,y:3}}).setOrigin(.5).setVisible(hero);
  const bar=this.add.graphics();const root=this.add.container(x,y,[shadow,body,weapon,bar,plate]);root.setData('hero',hero);
  const a={root,body,weapon,bar,plate,top:FEET-look.rows.length*scale,hand,attackUntil:0};this.actors.set(id,a);return a;
 }
 update(time:number,delta:number){
  if(!this.hero)return;const s=this.store.state,dt=Math.min(delta,50)/1000,target=this.actors.get(s.enemies[0]?.id);
  this.hero.root.setDepth(this.hero.root.y);const cam=this.cameras.main;const focus=this.scale.width<761||this.traversal?this.hero.root.x+70:this.journey*ROOM_STRIDE+720;cam.centerOn(Phaser.Math.Linear(cam.midPoint.x,focus,1-Math.exp(-dt*5)),450);
  if(this.traversal&&s.nextRoomAt&&!s.respawnAt){
   const progress=traversalProgress(s.now+Math.max(0,time-this.lastStateAt),this.traversal.until);const position=traversalPoint(this.traversal,this.journey*ROOM_STRIDE,progress);this.hero.root.setPosition(position.x,position.y);this.hero.attackUntil=0;this.walkPose(this.hero,time,1);this.caption.x=this.hero.root.x;
   this.sections[1].top.setScale(1,1-Math.min(1,progress/.12));this.sections[1].bottom.setScale(1,1-Math.min(1,progress/.12));
  }else if(s.started&&!s.respawnAt){if(target)this.move(this.hero,target.root.x-this.reach(s,s.enemies[0].boss),target.root.y,dt,time,235);for(const e of s.enemies){const a=this.actors.get(e.id);if(!a||a.attackUntil>time)continue;const gap=e.boss?110:78;if(Phaser.Math.Distance.Between(a.root.x,a.root.y,this.hero.root.x,this.hero.root.y)>gap+17&&e.stunnedUntil<s.now)this.move(a,this.hero.root.x+gap,this.hero.root.y,dt,time,32);else this.idle(a,time);}}else this.idle(this.hero,time);
  this.pet.x=Phaser.Math.Linear(this.pet.x,this.hero.root.x-62,Math.min(1,dt*4));this.pet.y=Phaser.Math.Linear(this.pet.y,this.hero.root.y+12,Math.min(1,dt*4));this.pet.setDepth(this.pet.y);const body=this.pet.list[1] as Phaser.GameObjects.Image;body.setTint(s.pet==='Emberkit'?0xff9d59:s.pet==='Shellby'?0x8ac9ef:s.pet==='Craboulder'?0xc8b0a0:0xffffff);body.y=this.reduced?0:Math.sin(time/150)*2;
  this.telegraph(s,time);
  if(this.healed>=1&&time-this.healShownAt>450){this.popup(this.hero.root.x+18,this.hero.root.y+this.hero.top-4,`+${Math.round(this.healed)}`,'#7dff8a','#0d3315',17,true,-2);this.healed=0;this.healShownAt=time;}
 }
 /** Standing distance in front of a target; the boss sprite is much wider than regular monsters. */
 private reach(s:GameState,boss:boolean){return s.hero.class==='Wand'?145:boss?96:64;}
 /** Red ground marker under the hero while the boss winds up its every-third-hit slam. */
 private telegraph(s:GameState,time:number){
  this.warn.clear();const boss=s.enemies.find(e=>e.boss);if(!boss||s.respawnAt||s.nextRoomAt||(boss.attacks+1)%3!==0||boss.stunnedUntil>s.now)return;
  const left=boss.attackAt-(s.now+Math.max(0,time-this.lastStateAt));if(left<=0||left>1500)return;
  const p=1-left/1500,x=this.hero.root.x,y=this.hero.root.y+FEET,w=150,h=66;
  this.warn.fillStyle(0xff3b2f,.1+.15*p).fillEllipse(x,y,w,h).fillStyle(0xff5a3c,.35).fillEllipse(x,y,w*p,h*p).lineStyle(3,0xff6a4d,.55+.4*p).strokeEllipse(x,y,w,h);
 }
 private walkPose(a:Actor,time:number,face:number){
  a.body.setFlipX(face<0);a.weapon.setScale(face,1).setPosition(face*a.hand.x,a.hand.y);
  if(a===this.hero)a.body.setTexture(`hero-${this.store.state.hero.class}-${this.reduced?0:Math.floor(time/130)%2}`);
  if(!this.reduced){a.body.y=FEET-Math.abs(Math.sin(time/130))*2;a.weapon.angle=face*(20+Math.sin(time/95)*9);}
 }
 private move(a:Actor,x:number,y:number,dt:number,time:number,speed:number){if(a.attackUntil>time)return;const d=Phaser.Math.Distance.Between(a.root.x,a.root.y,x,y);if(d<5){this.idle(a,time);return;}const step=Math.min(d,speed*dt),face=x>=a.root.x?1:-1;a.root.x+=(x-a.root.x)/d*step;a.root.y+=(y-a.root.y)/d*step;a.root.setDepth(a.root.y);this.walkPose(a,time,face);}
 private idle(a:Actor,time:number){if(a.attackUntil>time)return;if(a===this.hero)a.body.setTexture(`hero-${this.store.state.hero.class}-0`);a.body.y=FEET+(this.reduced?0:Math.sin(time/340));}
 private render(s:GameState,events:GameEvent[]){
  this.lastStateAt=this.time.now;
  const room=`${s.floor}:${s.region}:${s.room}`;
  const relocated=s.travelAt!==this.travelAt;const crossed=!!this.traversal&&!s.nextRoomAt&&!s.respawnAt&&s.enemies.length>0&&!relocated&&room.split(':')[0]===this.room.split(':')[0];this.travelAt=s.travelAt;
  if(room!==this.room||crossed||relocated||(this.wasDead&&!s.respawnAt)){
   if(crossed){this.journey++;this.hero.root.setPosition(this.journey*ROOM_STRIDE+590,465);}
   else{this.journey=0;this.hero.root.setPosition(590,465);this.pet.setPosition(540,505);}
   this.room=room;this.traversal=null;this.tweens.killTweensOf(this.hero.root);
   this.sections.forEach((section,i)=>{section.root.x=(this.journey+i-1)*ROOM_STRIDE;section.top.setScale(1,i===0?0:1);section.bottom.setScale(1,i===0?0:1);});
   this.caption.x=this.journey*ROOM_STRIDE+720;
  }
  this.wasDead=!!s.respawnAt;
  if(s.respawnAt)this.traversal=null;
  if(s.nextRoomAt&&!this.traversal){this.tweens.killTweensOf(this.hero.root);this.traversal={x:this.hero.root.x,y:this.hero.root.y,until:s.nextRoomAt};}
  if(!this.hero.body.texture.key.startsWith(`hero-${s.hero.class}-`)){this.hero.body.setTexture(`hero-${s.hero.class}-0`);this.hero.top=FEET-heroSprite(s.hero.class).rows.length*PX;this.hero.weapon.removeAll(true);this.hero.weapon.add(this.add.image(0,0,`weapon-${s.hero.class}`).setOrigin(.5,.85).setScale(PX));}
  this.hero.plate.setText(`${s.hero.name} · Lv ${s.hero.level}`);
  if(s.respawnAt||this.lastHp<0)this.healed=0;else if(s.hero.hp>this.lastHp)this.healed+=s.hero.hp-this.lastHp;this.lastHp=s.respawnAt?-1:s.hero.hp;
  this.hero.root.setAlpha(s.respawnAt?.3:1);this.bar(this.hero,s.hero.hp/stats(s).maxHp,0x9bc9a2);
  s.enemies.forEach((e,i)=>{if(!this.actors.has(e.id))this.figure(e.id,this.journey*ROOM_STRIDE+780+i*125,420+(i%2)*100,e.boss,false,e.name);this.bar(this.actors.get(e.id)!,e.hp/e.maxHp,e.boss?0xe0604a:0x8eabb4);});
  this.caption.setText(s.respawnAt?`FALLEN · RETURNING IN ${Math.ceil((s.respawnAt-s.now)/1000)}s`:s.nextRoomAt?'GATE OPEN  ·  ENTERING THE NEXT CHAMBER':'');
  for(const e of events)this.effect(e,s);const ids=new Set(s.enemies.map(e=>e.id));for(const [id,a] of this.actors)if(id&&!ids.has(id)){this.actors.delete(id);this.time.delayedCall(330,()=>{if(a.root.active)this.tweens.add({targets:a.root,alpha:0,y:a.root.y+10,duration:300,onComplete:()=>{this.tweens.killTweensOf(a.weapon);a.root.destroy();}});});}
 }
 private bar(a:Actor,f:number,c:number){const y=a.top-10;a.bar.clear().fillStyle(0x0a0710).fillRect(-25,y,50,6).fillStyle(0x3a2230).fillRect(-24,y+1,48,4).fillStyle(c).fillRect(-24,y+1,48*Math.max(0,Math.min(1,f)),4);}
 /**
  * Pixel-font combat number that pops, then drifts up and fades (UI_UX_PLAN 2.2).
  * Respects the damage-number setting, drops routine numbers past a cap so bursts stay readable,
  * and stacks numbers that land on the same actor in quick succession instead of overlapping them.
  */
 private popup(x:number,y:number,text:string,color:string,stroke:string,size:number,important=true,stackKey?:number){
  const mode=prefs.value.damageNumbers;if(mode==='off'||(mode==='important'&&!important)||(!important&&this.popups>=POPUP_CAP))return;
  if(stackKey!==undefined){const now=this.time.now,st=this.stacks.get(stackKey);const n=st&&st.until>now?(st.n+1)%4:0;this.stacks.set(stackKey,{until:now+280,n});y-=n*15;x+=n%2?10:-6;}
  const t=this.add.text(x,y,text,{fontFamily:FONT,fontSize:`${size}px`,fontStyle:'bold',color,stroke,strokeThickness:Math.max(4,Math.round(size/5))}).setOrigin(.5).setDepth(1100+size).setScale(1.45);this.popups++;
  this.tweens.add({targets:t,scale:1,duration:110,ease:'Back.easeOut'});this.tweens.add({targets:t,y:y-46,alpha:0,delay:380,duration:620,ease:'Sine.easeIn',onComplete:()=>{this.popups--;t.destroy();}});
 }
 private swing(a:Actor,target:Actor,crit=false){
  const kind=a===this.hero?this.store.state.hero.class:'Sword';const face=target.root.x>=a.root.x?1:-1;
  a.attackUntil=this.time.now+(kind==='Axe'?420:kind==='Dagger'?190:330);this.tweens.killTweensOf(a.weapon);
  a.body.setFlipX(face<0);a.weapon.setScale(face,1).setPosition(face*a.hand.x,a.hand.y).setAngle(-70*face);
  if(kind==='Spear'){a.weapon.angle=90*face;this.tweens.add({targets:a.weapon,x:face*(a.hand.x+26),duration:130,yoyo:true});}
  else if(kind==='Wand'){a.weapon.angle=15*face;const bolt=this.add.circle(a.root.x,a.root.y-20,6,0xd1b6ff).setDepth(1000);this.tweens.add({targets:bolt,x:target.root.x,y:target.root.y,duration:180,onComplete:()=>bolt.destroy()});}
  else this.tweens.add({targets:a.weapon,angle:110*face,duration:kind==='Axe'?210:kind==='Dagger'?90:160,yoyo:true,onComplete:()=>{if(a.weapon.active)a.weapon.angle=25*face;}});
  const slash=this.add.graphics().setPosition(target.root.x,target.root.y+4).setDepth(1000);slash.lineStyle(crit?5:3,crit?0xffd66d:kind==='Wand'?0xc4a9ff:0xd9efff,.95).beginPath().arc(0,0,kind==='Axe'?43:33,-1.1,1.3).strokePath();this.tweens.add({targets:slash,alpha:0,scale:1.4,duration:240,onComplete:()=>slash.destroy()});
 }
 private effect(e:GameEvent,s:GameState){
  const target=this.actors.get(e.target);if(e.type==='hit'&&target){const attacker=e.target===0?this.actors.get(s.enemies[0]?.id):this.hero;const impact=()=>{if(!target.root.active)return;if(attacker?.root.active)this.swing(attacker,target,!!e.critical);
    const y=target.root.y+target.top-6,x=target.root.x+(Math.random()-.5)*16,key=e.target;
    const elem=e.element?ELEMENT_COLOR[e.element as Element]:null,boss=!!s.enemies.find(m=>m.id===e.target)?.boss;
    if(e.label==='SLAM')this.popup(x,y,e.amount?`SLAM -${e.amount}`:'SLAM','#ff6a4d','#3a0f12',18,true,key);
    else if(e.label)this.popup(x,y,e.label,e.label==='SHIELD'?'#7fd8ff':'#c9d7ea','#141824',15,true,key);
    else if(e.target===0)this.popup(x,y,`-${e.amount}`,'#ff8f7a','#3a0f12',18,true,key);
    else if(e.critical)this.popup(x,y-6,`${e.amount}!`,elem?elem.fill:'#ffd34d',elem?elem.stroke:'#3a1d0e',34,true,key);
    else this.popup(x,y,`${e.amount}`,elem?elem.fill:'#fff4d6',elem?elem.stroke:'#2a1a14',elem?24:21,!!elem||boss,key);};
   if(!s.nextRoomAt&&s.hero.class!=='Wand'&&e.target!==0&&this.hero.attackUntil<this.time.now&&Phaser.Math.Distance.Between(this.hero.root.x,this.hero.root.y,target.root.x,target.root.y)>100){this.walkPose(this.hero,this.time.now,target.root.x>=this.hero.root.x?1:-1);this.hero.attackUntil=this.time.now+220;this.tweens.add({targets:this.hero.root,x:target.root.x-this.reach(s,!!s.enemies.find(m=>m.id===e.target)?.boss),y:target.root.y,duration:200,ease:'Sine.easeOut',onComplete:impact});}else impact();
  }
  if(e.type==='skill'){const dest=this.actors.get(e.target)||this.hero;const tint=Number.parseInt((e.element?ELEMENT_COLOR[e.element as Element].fill:'#f1cf88').slice(1),16);const ring=this.add.circle(this.hero.root.x,this.hero.root.y+FEET,25,tint,.05).setStrokeStyle(3,tint,.85).setDepth(900);this.tweens.add({targets:ring,scale:s.hero.class==='Sword'?5:3,alpha:0,duration:500,onComplete:()=>ring.destroy()});if(s.hero.class==='Wand'){const bolt=this.add.circle(this.hero.root.x,this.hero.root.y-10,9,0xffb661).setDepth(1000);this.tweens.add({targets:bolt,x:dest.root.x,y:dest.root.y,duration:240,onComplete:()=>bolt.destroy()});}this.popup(this.hero.root.x,this.hero.root.y+this.hero.top-22,(e.label||'').toUpperCase(),'#f8d88c','#161927',15,true,-1);}
  if(e.type==='pet'){const ring=this.add.circle(this.pet.x,this.pet.y,15).setStrokeStyle(2,0xa4e2a2,.8).setDepth(950);this.tweens.add({targets:ring,scale:3,alpha:0,duration:600,onComplete:()=>ring.destroy()});}
 }
}

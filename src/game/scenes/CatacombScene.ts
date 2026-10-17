import Phaser from 'phaser';
import {SWORD_TEXTURE,prepareSword,dressSword} from '../SwordSprite';
import type {Store} from '../../core/GameState';
import type {GameEvent,GameState} from '../../core/models';
import {stats} from '../../core/Formulas';
import {CLASSES} from '../../core/models';
import {heroPixels,weaponPixels} from '../HeroArt';
import {ROOM_STRIDE,traversalPoint,traversalProgress} from '../../core/RoomTraversal';
type Actor={root:Phaser.GameObjects.Container;body:Phaser.GameObjects.Sprite;legs:Phaser.GameObjects.Rectangle[];weapon:Phaser.GameObjects.Container;bar:Phaser.GameObjects.Graphics;attackUntil:number};
/** Presentation positions are independent of authoritative combat math. */
export class CatacombScene extends Phaser.Scene {
 private actors=new Map<number,Actor>();private hero!:Actor;private pet!:Phaser.GameObjects.Container;private caption!:Phaser.GameObjects.Text;private unsubscribe?:()=>void;private room='';
 private reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
 private sections:{root:Phaser.GameObjects.Container;top:Phaser.GameObjects.Rectangle;bottom:Phaser.GameObjects.Rectangle}[]=[];
 private journey=0;private traversal:{x:number;y:number;until:number}|null=null;private wasDead=false;private travelAt=0;private lastStateAt=0;
 constructor(private store:Store){super('Catacombs');}
 preload(){this.load.image('sword-source',`${import.meta.env.BASE_URL}assets/heroes/sword-source-v1.png`);}
 create(){
  prepareSword(this);
  for(let i=0;i<3;i++){
   const before=new Set(this.children.list);this.environment();
   const frame=this.add.graphics();frame.fillStyle(0x121a2b).fillRect(1323,384,48,18).fillRect(1323,528,48,18);frame.lineStyle(3,0xa38b60).strokeRect(1327,388,40,12).strokeRect(1327,530,40,12);
   const top=this.add.rectangle(1347,400,27,65,0x625b50).setOrigin(.5,0).setStrokeStyle(3,0xc1a06b);
   const bottom=this.add.rectangle(1347,530,27,65,0x625b50).setOrigin(.5,1).setStrokeStyle(3,0xc1a06b);
   const children=this.children.list.filter(c=>!before.has(c));const root=this.add.container((i-1)*ROOM_STRIDE,0,children);this.sections.push({root,top,bottom});
  }
  this.makeTextures();this.hero=this.figure(0,590,460,false,true);
  this.pet=this.add.container(540,500,[this.add.ellipse(0,17,26,9,0x000000,.35),this.add.image(0,0,'companion').setScale(2.5)]);
  this.caption=this.add.text(720,740,'',{fontFamily:'Georgia',fontSize:'18px',color:'#b8c7df',stroke:'#080d1c',strokeThickness:5,letterSpacing:3}).setOrigin(.5).setDepth(1000);
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
 private makeTextures(){
  for(const kind of CLASSES){for(const [key,pixels] of [[`hero-${kind}`,heroPixels(kind)],[`weapon-${kind}`,weaponPixels(kind)]] as const){const g=this.make.graphics({x:0,y:0});for(const p of pixels)g.fillStyle(Number.parseInt(p.color.slice(1),16)).fillRect(p.x,p.y,p.w,p.h);g.generateTexture(key,32,key.startsWith('weapon')?48:34);g.destroy();}}
  this.texture('knight',['......rrr.......','.....rRRrr......','.....rrRrr......','....GGGGGG......','...GYYYYYYG.....','...GYyyyyYG.....','...GYkYYkYG.....','....YSSSSY......','.....SSSS.......','...GGYYYYGG.....','..GYYyYYyYYG....','..GYyBBBBYyG....','..SGBYYYYBGS....','..SSGYYYYGSS....','....GBBBBG......','....GYYYYG......'],{r:0x763d45,R:0xdd6a67,G:0x6c522f,Y:0xe7bd61,y:0xffe49a,k:0x1a2436,S:0xd8a780,B:0x3c455c});
  this.texture('bones',['.....bbbbbb.....','....bSSSSSSb....','....bSssssSb....','....bSkkSkSb....','.....SssSsS.....','......SttS......','.......bb.......','....bbSSSSbb....','...bSbsSSsbSb...','...SbSbSSbSbS...','...SbSbSSbSbS...','....bbSSSSbb....','.....bSSSSb.....','.....bbSSbb.....','......bSSb......','................'],{b:0x323a49,S:0xc6c5b3,s:0x8c9b9d,k:0x162134,t:0xf1dfb2});
  this.texture('warden',['..R..........R..','..RR........RR..','...RGGGGGGGGR...','...GYYYYYYYYG...','...GYkYYkYYYG...','....GrrrrrrG....','.....GttttG.....','....GGYYYYGG....','..GGYYYYYYYYGG..','.GYGGYYYYGGYYYG.','.GYGGYYYYGGYYYG.','..GGGYYYYYYGGG..','....GYYYYYYG....','....GGGGGGGG....','.....GGYYGG.....','.....GGYYGG.....'],{R:0xde8d75,G:0x493a49,Y:0x9e7482,k:0xffdf9c,r:0x202737,t:0xdac7a4});
  this.texture('companion',['..g......g..','..gG....Gg..','...GGGGGG...','..GGGGGGGG..','..GkGGGGkG..','..GGGyyGGG..','...GGGGGG...','...gGGGGg...','....g..g....'],{g:0x4c7353,G:0xa9cc82,k:0x182d37,y:0xf3dfa1});
 }
 private figure(id:number,x:number,y:number,boss:boolean,hero=false):Actor{
  const kind=this.store.state.hero.class;const shadow=this.add.ellipse(0,27,boss?67:52,14,0x050813,.5);const legs=[this.add.rectangle(-8,20,8,17,hero?0x526478:0x8d979d),this.add.rectangle(8,20,8,17,hero?0x526478:0x8d979d)];const body=this.add.sprite(0,hero?-12:-5,hero?`hero-${kind}`:boss?'warden':'bones').setScale(hero?2.3:boss?4.4:3);
  const weapon=this.add.container(20,5,[this.add.rectangle(0,-14,5,29,0xc6e4ee),this.add.rectangle(-2,-14,2,27,0x6985a5),this.add.rectangle(0,2,15,4,0xe5b962),this.add.rectangle(0,10,4,12,0x82603e)]).setAngle(25);const bar=this.add.graphics();const label=this.add.text(0,-46,hero?'WANDERER':boss?'HOLLOW WARDEN':'',{fontFamily:'monospace',fontSize:hero?'10px':'12px',color:hero?'#f4d087':'#e8b9ac',stroke:'#111725',strokeThickness:4}).setOrigin(.5);
  if(hero){weapon.removeAll(true);weapon.add(this.add.image(0,-17,`weapon-${kind}`).setScale(kind==='Spear'?1.7:1.55));if(kind==='Dagger'){const offhand=this.add.image(-21,7,`weapon-${kind}`).setScale(1.1).setAngle(-40);weapon.add(offhand);}label.setText(kind.toUpperCase());label.y=-62;}
  const root=this.add.container(x,y,[shadow,...legs,body,weapon,bar,label]);root.setData('hero',hero);const a={root,body,legs,weapon,bar,attackUntil:0};if(hero&&kind==='Sword'&&this.textures.exists(SWORD_TEXTURE)){dressSword(body);legs.forEach(l=>l.setVisible(false));weapon.setVisible(false);}this.actors.set(id,a);return a;
 }
 update(time:number,delta:number){
  if(!this.hero)return;const s=this.store.state,dt=Math.min(delta,50)/1000,target=this.actors.get(s.enemies[0]?.id);
  this.hero.root.setDepth(this.hero.root.y);const cam=this.cameras.main;const focus=this.scale.width<761||this.traversal?this.hero.root.x+70:this.journey*ROOM_STRIDE+720;cam.centerOn(Phaser.Math.Linear(cam.midPoint.x,focus,1-Math.exp(-dt*5)),450);
  if(this.traversal&&s.nextRoomAt&&!s.respawnAt){
   const progress=traversalProgress(s.now+Math.max(0,time-this.lastStateAt),this.traversal.until);const position=traversalPoint(this.traversal,this.journey*ROOM_STRIDE,progress);this.hero.root.setPosition(position.x,position.y);this.hero.attackUntil=0;this.walkPose(this.hero,time,1);this.caption.x=this.hero.root.x;
   this.sections[1].top.setScale(1,1-Math.min(1,progress/.12));this.sections[1].bottom.setScale(1,1-Math.min(1,progress/.12));
  }else if(s.started&&!s.respawnAt){if(target)this.move(this.hero,target.root.x-(s.hero.class==='Wand'?145:64),target.root.y,dt,time,235);for(const e of s.enemies){const a=this.actors.get(e.id);if(!a||a.attackUntil>time)continue;if(Phaser.Math.Distance.Between(a.root.x,a.root.y,this.hero.root.x,this.hero.root.y)>95&&e.stunnedUntil<s.now)this.move(a,this.hero.root.x+78,this.hero.root.y,dt,time,32);else this.idle(a,time);}}else this.idle(this.hero,time);
  this.pet.x=Phaser.Math.Linear(this.pet.x,this.hero.root.x-47,Math.min(1,dt*4));this.pet.y=Phaser.Math.Linear(this.pet.y,this.hero.root.y+39,Math.min(1,dt*4));this.pet.setDepth(this.pet.y);const body=this.pet.list[1] as Phaser.GameObjects.Image;body.setTint(s.pet==='Emberkit'?0xff9d59:s.pet==='Shellby'?0x8ac9ef:s.pet==='Craboulder'?0xc8b0a0:0xffffff);body.y=this.reduced?0:Math.sin(time/150)*2;
 }
 private walkPose(a:Actor,time:number,face:number){a.body.setFlipX(face<0);if(a.body.texture.key===SWORD_TEXTURE){a.body.y=28;a.body.play('sword-walk',true);return;}a.weapon.x=face*20;const base=a.root.getData('hero')?-12:-5;if(!this.reduced){a.legs[0].y=20+Math.sin(time/75)*5;a.legs[1].y=20-Math.sin(time/75)*5;a.body.y=base+Math.sin(time/75)*1.5;a.weapon.angle=face*(20+Math.sin(time/95)*9);}}
 private move(a:Actor,x:number,y:number,dt:number,time:number,speed:number){if(a.attackUntil>time)return;const d=Phaser.Math.Distance.Between(a.root.x,a.root.y,x,y);if(d<5){this.idle(a,time);return;}const step=Math.min(d,speed*dt),face=x>=a.root.x?1:-1;a.root.x+=(x-a.root.x)/d*step;a.root.y+=(y-a.root.y)/d*step;a.root.setDepth(a.root.y);this.walkPose(a,time,face);}
 private idle(a:Actor,time:number){if(a.attackUntil>time)return;if(a.body.texture.key===SWORD_TEXTURE){a.body.y=28;if(this.store.state.respawnAt)a.body.anims.stop();else a.body.play('sword-idle',true);return;}a.legs.forEach(l=>l.y=20);a.body.y=(a.root.getData('hero')?-12:-5)+(this.reduced?0:Math.sin(time/340));}
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
  const skin=s.hero.class==='Sword'&&this.textures.exists(SWORD_TEXTURE)?SWORD_TEXTURE:`hero-${s.hero.class}`;if(this.hero.body.texture.key!==skin){this.hero.body.anims.stop();this.hero.body.setTexture(skin).setOrigin(.5).setScale(2.3).setY(-12);const raster=skin===SWORD_TEXTURE;this.hero.legs.forEach(l=>l.setVisible(!raster));this.hero.weapon.setVisible(!raster);if(raster)dressSword(this.hero.body);(this.hero.root.list[this.hero.root.list.length-1] as Phaser.GameObjects.Text).setText(s.hero.class.toUpperCase());this.hero.weapon.removeAll(true);this.hero.weapon.add(this.add.image(0,-17,`weapon-${s.hero.class}`).setScale(s.hero.class==='Spear'?1.7:1.55));if(s.hero.class==='Dagger')this.hero.weapon.add(this.add.image(-26,9,'weapon-Dagger').setScale(1.1).setAngle(-40));}
  this.hero.root.setAlpha(s.respawnAt?.3:1);this.bar(this.hero,s.hero.hp/stats(s).maxHp,0x9bc9a2);
  s.enemies.forEach((e,i)=>{if(!this.actors.has(e.id))this.figure(e.id,this.journey*ROOM_STRIDE+780+i*125,420+(i%2)*100,e.boss);this.bar(this.actors.get(e.id)!,e.hp/e.maxHp,e.boss?0xd89875:0x8eabb4);});
  this.caption.setText(s.respawnAt?`FALLEN · RETURNING IN ${Math.ceil((s.respawnAt-s.now)/1000)}s`:s.nextRoomAt?'GATE OPEN  ·  ENTERING THE NEXT CHAMBER':s.enemies.some(e=>e.boss)?'◆  THE HOLLOW WARDEN  ◆':'');
  for(const e of events)this.effect(e,s);const ids=new Set(s.enemies.map(e=>e.id));for(const [id,a] of this.actors)if(id&&!ids.has(id)){this.actors.delete(id);this.time.delayedCall(330,()=>{if(a.root.active)this.tweens.add({targets:a.root,alpha:0,y:a.root.y+10,duration:300,onComplete:()=>{this.tweens.killTweensOf(a.weapon);a.root.destroy();}});});}
 }
 private bar(a:Actor,f:number,c:number){a.bar.y=a.body.texture.key===SWORD_TEXTURE?-17:0;a.bar.clear().fillStyle(0x080d19).fillRect(-24,-36,48,4).fillStyle(c).fillRect(-24,-36,48*Math.max(0,Math.min(1,f)),4);}
 private swing(a:Actor,target:Actor,crit=false){
  const kind=a===this.hero?this.store.state.hero.class:'Sword';const face=target.root.x>=a.root.x?1:-1;
  a.attackUntil=this.time.now+(kind==='Axe'?420:kind==='Dagger'?190:330);this.tweens.killTweensOf(a.weapon);
  if(a.body.texture.key===SWORD_TEXTURE){a.body.setFlipX(face<0).play('sword-attack',true);return;}
  a.weapon.setPosition(face*20,5).setAngle(-70*face);
  if(kind==='Spear'){a.weapon.angle=90*face;this.tweens.add({targets:a.weapon,x:face*42,duration:130,yoyo:true});}
  else if(kind==='Wand'){a.weapon.angle=15*face;const bolt=this.add.circle(a.root.x,a.root.y-20,6,0xd1b6ff).setDepth(1000);this.tweens.add({targets:bolt,x:target.root.x,y:target.root.y,duration:180,onComplete:()=>bolt.destroy()});}
  else this.tweens.add({targets:a.weapon,angle:110*face,duration:kind==='Axe'?210:kind==='Dagger'?90:160,yoyo:true,onComplete:()=>{if(a.weapon.active)a.weapon.angle=25*face;}});
  const slash=this.add.graphics().setPosition(target.root.x,target.root.y-4).setDepth(1000);slash.lineStyle(crit?5:3,crit?0xffd66d:kind==='Wand'?0xc4a9ff:0xd9efff,.95).beginPath().arc(0,0,kind==='Axe'?43:33,-1.1,1.3).strokePath();this.tweens.add({targets:slash,alpha:0,scale:1.4,duration:240,onComplete:()=>slash.destroy()});
 }
 private effect(e:GameEvent,s:GameState){
  const target=this.actors.get(e.target);if(e.type==='hit'&&target){const attacker=e.target===0?this.actors.get(s.enemies[0]?.id):this.hero;const impact=()=>{if(!target.root.active)return;if(attacker?.root.active)this.swing(attacker,target,!!e.critical);const t=this.add.text(target.root.x,target.root.y-50,e.label||`${e.amount}${e.critical?'!':''}`,{fontFamily:'Georgia',fontSize:e.critical?'40px':'25px',fontStyle:'bold',color:e.target===0?'#eeaa9d':e.critical?'#ffdc76':'#f5e7ba',stroke:'#493023',strokeThickness:e.critical?6:4}).setOrigin(.5).setDepth(1100);this.tweens.add({targets:t,y:t.y-48,x:t.x+10,alpha:0,duration:800,onComplete:()=>t.destroy()});};
   if(!s.nextRoomAt&&s.hero.class!=='Wand'&&e.target!==0&&this.hero.attackUntil<this.time.now&&Phaser.Math.Distance.Between(this.hero.root.x,this.hero.root.y,target.root.x,target.root.y)>100){this.walkPose(this.hero,this.time.now,target.root.x>=this.hero.root.x?1:-1);this.hero.attackUntil=this.time.now+220;this.tweens.add({targets:this.hero.root,x:target.root.x-64,y:target.root.y,duration:200,ease:'Sine.easeOut',onComplete:impact});}else impact();
  }
  if(e.type==='skill'){const dest=this.actors.get(e.target)||this.hero;const ring=this.add.circle(this.hero.root.x,this.hero.root.y,25,0xeac378,.04).setStrokeStyle(3,0xf1cf88,.8).setDepth(900);this.tweens.add({targets:ring,scale:s.hero.class==='Sword'?5:3,alpha:0,duration:500,onComplete:()=>ring.destroy()});if(s.hero.class==='Wand'){const bolt=this.add.circle(this.hero.root.x,this.hero.root.y-10,9,0xffb661).setDepth(1000);this.tweens.add({targets:bolt,x:dest.root.x,y:dest.root.y,duration:240,onComplete:()=>bolt.destroy()});}const t=this.add.text(this.hero.root.x,this.hero.root.y-78,e.label||'',{fontFamily:'Georgia',fontSize:'19px',color:'#f8d88c',stroke:'#161927',strokeThickness:4}).setOrigin(.5).setDepth(1100);this.tweens.add({targets:t,y:t.y-20,alpha:0,duration:1200,onComplete:()=>t.destroy()});}
  if(e.type==='pet'){const ring=this.add.circle(this.pet.x,this.pet.y,15).setStrokeStyle(2,0xa4e2a2,.8).setDepth(950);this.tweens.add({targets:ring,scale:3,alpha:0,duration:600,onComplete:()=>ring.destroy()});}
 }
}

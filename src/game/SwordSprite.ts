import Phaser from 'phaser';

export const SWORD_TEXTURE = 'sword-animated';
const CELL_W = 384, CELL_H = 256, PIVOT_X = 160, PIVOT_Y = 232;
// Hand registered feet: the concept sheet does not use evenly spaced cells.
const frames = [
 [35,184,98],[184,331,243],[331,470,383],[470,607,535],
 [607,756,671],[756,912,811],[912,1076,972],[1076,1250,1168],
 [1250,1465,1359],[1465,1780,1547],[1710,1978,1840],[1978,2140,2037],
];

/** Register the original artwork without modifying the source file. */
export function prepareSword(scene: Phaser.Scene): boolean {
 if(scene.textures.exists(SWORD_TEXTURE))return true;
 if(!scene.textures.exists('sword-source'))return false;
 const source=scene.textures.get('sword-source').getSourceImage() as HTMLImageElement;
 const canvas=document.createElement('canvas');canvas.width=source.width;canvas.height=source.height;
 const ctx=canvas.getContext('2d',{willReadFrequently:true})!;ctx.drawImage(source,0,0);
 const pixels=ctx.getImageData(0,0,canvas.width,canvas.height),{data}=pixels;
 const w=canvas.width,h=canvas.height,seen=new Uint8Array(w*h),queue=new Int32Array(w*h);let head=0,tail=0;
 const visit=(p:number)=>{if(seen[p])return;seen[p]=1;const i=p*4;if(Math.max(data[i],data[i+1],data[i+2])>48)return;queue[tail++]=p;};
 for(let x=0;x<w;x++){visit(x);visit((h-1)*w+x);}for(let y=0;y<h;y++){visit(y*w);visit(y*w+w-1);}
 // Only remove connected background; enclosed dark eyes and armor remain intact.
 while(head<tail){const p=queue[head++];data[p*4+3]=0;const x=p%w,y=Math.floor(p/w);if(x)visit(p-1);if(x<w-1)visit(p+1);if(y)visit(p-w);if(y<h-1)visit(p+w);}
 ctx.putImageData(pixels,0,0);
 const texture=scene.textures.createCanvas(SWORD_TEXTURE,CELL_W*frames.length,CELL_H)!;
 const out=texture.context;out.imageSmoothingEnabled=false;
 frames.forEach(([left,right,pivot],i)=>{
  out.save();out.beginPath();out.rect(i*CELL_W,0,CELL_W,CELL_H);out.clip();
  const dx=i*CELL_W+PIVOT_X+left-pivot,dy=PIVOT_Y-440+210;
  if(i===9){out.drawImage(canvas,left,210,right-left,180,dx,dy,right-left,180);out.drawImage(canvas,left,390,1710-left,55,dx,dy+180,1710-left,55);}
  else if(i===10){out.drawImage(canvas,1780,210,right-1780,180,dx+1780-left,dy,right-1780,180);out.drawImage(canvas,left,390,right-left,55,dx,dy+180,right-left,55);}
  else out.drawImage(canvas,left,210,right-left,235,dx,dy,right-left,235);
  out.restore();texture.add(i,0,i*CELL_W,0,CELL_W,CELL_H);
 });texture.refresh();texture.setFilter(Phaser.Textures.FilterMode.NEAREST);
 for(const [key,start,end,rate,repeat] of [['sword-idle',0,1,3,-1],['sword-walk',2,5,9,-1],['sword-attack',6,11,18,0]] as const){
  if(!scene.anims.exists(key))scene.anims.create({key,frames:scene.anims.generateFrameNumbers(SWORD_TEXTURE,{start,end}),frameRate:rate,repeat});
 }
 return true;
}

export function dressSword(body:Phaser.GameObjects.Sprite){
 body.setTexture(SWORD_TEXTURE,0).setOrigin(PIVOT_X/CELL_W,PIVOT_Y/CELL_H).setScale(.43).setPosition(0,28).play('sword-idle');
}

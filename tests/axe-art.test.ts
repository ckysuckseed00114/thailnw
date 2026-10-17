import {describe,expect,it} from 'vitest';
import {heroSVG} from '../src/game/HeroArt';
import {AXE_ART,axeAttackPath,axeWalkPath} from '../src/game/AxeArt';

describe('PixelLab Axe assets',()=>{
 it('ships every frame used by Phaser',()=>{
  const files=import.meta.glob('../public/assets/axe-veteran/*.png',{eager:true,query:'?url',import:'default'});
  const paths=[AXE_ART.idle,AXE_ART.portrait,
   ...Array.from({length:AXE_ART.walkFrames},(_,i)=>axeWalkPath(i)),
   ...Array.from({length:AXE_ART.attackFrames},(_,i)=>axeAttackPath(i))];
  for(const path of paths)expect(files[`../public${path}`],path).toBeTruthy();
 });
 it('uses the local portrait in character UI',()=>{
  expect(heroSVG('Axe')).toContain(AXE_ART.portrait);
 });
});

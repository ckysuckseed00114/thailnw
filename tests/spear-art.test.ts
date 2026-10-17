import {describe,expect,it} from 'vitest';
import {heroSVG} from '../src/game/HeroArt';
import {SPEAR_ART,spearAttackPath,spearIdlePath,spearWalkPath} from '../src/game/SpearArt';

describe('PixelLab Spear assets',()=>{
 it('ships every frame used by Phaser',()=>{
  const files=import.meta.glob('../public/assets/spear-lancer/*.png',{eager:true,query:'?url',import:'default'});
  const paths=[SPEAR_ART.idle,SPEAR_ART.portrait,
   ...Array.from({length:SPEAR_ART.idleFrames},(_,i)=>spearIdlePath(i)),
   ...Array.from({length:SPEAR_ART.walkFrames},(_,i)=>spearWalkPath(i)),
   ...Array.from({length:SPEAR_ART.attackFrames},(_,i)=>spearAttackPath(i))];
  for(const path of paths)expect(files[`../public${path}`],path).toBeTruthy();
 });
 it('uses the local portrait in character UI',()=>{
  expect(heroSVG('Spear')).toContain(SPEAR_ART.portrait);
 });
});

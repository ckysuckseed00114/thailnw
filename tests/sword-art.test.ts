import {describe,expect,it} from 'vitest';
import {heroSVG} from '../src/game/HeroArt';
import {SWORD_ART,swordAttackPath,swordWalkPath} from '../src/game/SwordArt';

describe('PixelLab Sword assets',()=>{
 it('ships every frame used by the game',()=>{
  const files=import.meta.glob('../public/assets/sword-veteran/*.png',{eager:true,query:'?url',import:'default'});
  const paths=[SWORD_ART.idle,SWORD_ART.portrait,
   ...Array.from({length:SWORD_ART.walkFrames},(_,i)=>swordWalkPath(i)),
   ...Array.from({length:SWORD_ART.attackFrames},(_,i)=>swordAttackPath(i))];
  for(const path of paths)expect(files[`../public${path}`],path).toBeTruthy();
 });
 it('uses the local Sword portrait in character UI',()=>{
  expect(heroSVG('Sword')).toContain(SWORD_ART.portrait);
 });
});

import {describe,expect,it} from 'vitest';
import {BOSS_ART,bossFramePath,type BossAnim} from '../src/game/BossArt';

describe('PixelLab boss assets',()=>{
 it('ships every frame used by Phaser',()=>{
  const files=import.meta.glob('../public/assets/hollow-warden/*.png',{eager:true,query:'?url',import:'default'});
  const counts:[BossAnim,number][]=[['idle',BOSS_ART.idleFrames],['walk',BOSS_ART.walkFrames],['slam',BOSS_ART.slamFrames],['summon',BOSS_ART.summonFrames]];
  for(const [anim,n] of counts)for(let i=0;i<n;i++){const path=bossFramePath(anim,i);expect(files[`../public${path}`],path).toBeTruthy();}
 });
 it('splits the slam into wind-up and impact frames',()=>{
  expect(BOSS_ART.slamImpact).toBeGreaterThan(0);expect(BOSS_ART.slamImpact).toBeLessThan(BOSS_ART.slamFrames);
 });
});

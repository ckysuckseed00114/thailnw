import {describe,it,expect} from 'vitest';
import {CLASSES} from '../src/core/models';
import {heroSprite,MONSTERS,weaponSprite,type Sprite} from '../src/game/PixelSprites';
const all:[string,Sprite][]=[...CLASSES.flatMap(c=>[[`${c} hero 0`,heroSprite(c,0)],[`${c} hero 1`,heroSprite(c,1)],[`${c} weapon`,weaponSprite(c)]] as [string,Sprite][]),...Object.entries(MONSTERS)];
describe('pixel sprites',()=>{
 it.each(all)('%s has rectangular rows and a colour for every pixel',(_name,sprite)=>{const width=sprite.rows[0].length;for(const row of sprite.rows){expect(row.length).toBe(width);for(const c of row)if(c!=='.')expect(sprite.palette[c],`missing colour for "${c}"`).toBeDefined();}});
 it('keeps hero bodies the same width so weapons line up',()=>{for(const c of CLASSES)expect(heroSprite(c).rows[0].length).toBe(16);});
});

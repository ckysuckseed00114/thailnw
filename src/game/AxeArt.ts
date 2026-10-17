/** PixelLab Axe character fd54b6d0-2b0e-45b0-895d-7779afea8234. Bundled PNGs only; no runtime API call. */
export const AXE_ART={
 size:88,
 originY:75/88,
 visualHeight:62,
 scale:1.4,
 idle:'/assets/axe-veteran/idle.png',
 portrait:'/assets/axe-veteran/portrait.png',
 walkFrames:5,
 attackFrames:5,
} as const;

export const axeWalkPath=(frame:number)=>`/assets/axe-veteran/walk-${frame}.png`;
export const axeAttackPath=(frame:number)=>`/assets/axe-veteran/attack-${frame}.png`;

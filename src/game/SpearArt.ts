/** PixelLab Spear character e50c4400-8c3e-4e91-aef3-9116414aa29c. All images ship with the game. */
export const SPEAR_ART={
 size:88,
 originY:74/88,
 visualHeight:61,
 scale:1.4,
 idle:'/assets/spear-lancer/idle.png',
 portrait:'/assets/spear-lancer/portrait.png',
 idleFrames:5,
 walkFrames:5,
 attackFrames:5,
} as const;

export const spearIdlePath=(frame:number)=>`/assets/spear-lancer/idle-${frame}.png`;
export const spearWalkPath=(frame:number)=>`/assets/spear-lancer/walk-${frame}.png`;
export const spearAttackPath=(frame:number)=>`/assets/spear-lancer/attack-${frame}.png`;

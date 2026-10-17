/** PixelLab character 84c47025-b60d-4497-902c-1d3a31728363. Files are bundled locally; no API call is made by the game. */
export const SWORD_ART={
 size:88,
 // PixelLab pads animation frames by 12 pixels; keep the visible boots on Phaser's feet line.
 originY:74/88,
 visualHeight:61,
 scale:1.4,
 idle:'/assets/sword-veteran/idle.png',
 portrait:'/assets/sword-veteran/portrait.png',
 walkFrames:5,
 attackFrames:5,
} as const;

export const swordWalkPath=(frame:number)=>`/assets/sword-veteran/walk-${frame}.png`;
export const swordAttackPath=(frame:number)=>`/assets/sword-veteran/attack-${frame}.png`;

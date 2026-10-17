/**
 * PixelLab boss "The Hollow Warden" — a temple-guardian giant (character 4b770271-7321-4d41-b406-e164c17c3124).
 * Animation frames are 196×196, drawn facing south-east and flipped in game to face the hero. All images ship with the game.
 */
export const BOSS_ART={
 size:196,
 /** Feet line (bottom of the lowest opaque pixel row) as a fraction of the frame height. */
 originY:164/196,
 /** Opaque height of the standing pose in source pixels. */
 visualHeight:135,
 scale:1.05,
 idleFrames:5,
 walkFrames:5,
 slamFrames:7,
 /** First slam frame where the fists come down; frames 0–4 raise the arms (wind-up). */
 slamImpact:5,
 summonFrames:7,
} as const;
export type BossAnim='idle'|'walk'|'slam'|'summon';
export const bossFramePath=(anim:BossAnim,frame:number)=>`/assets/hollow-warden/${anim}-${frame}.png`;
export const bossTexture=(anim:BossAnim,frame:number)=>`boss-${anim}-${frame}`;

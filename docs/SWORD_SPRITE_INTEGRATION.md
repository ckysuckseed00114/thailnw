# Sword artwork integration

> **Superseded (2026-10-17):** all classes now use the code-drawn sprites in `src/game/PixelSprites.ts`. `SwordSprite.ts` was removed and the source image moved to `artifacts/sword-source-v1.png`. This page is kept for history.

The Sword class now loads `public/assets/heroes/sword-source-v1.png` and uses registered raster animation frames in `src/game/SwordSprite.ts`.

- Idle: frames 0–1, 3 fps. Walk: 2–5, 9 fps. Attack: 6–11, 18 fps.
- Canvas processing removes only edge-connected dark background. Original artwork is preserved unchanged.
- Uneven source cells use individual foot pivots; two overlapping attack cells have explicit masks.
- Phaser hides the former procedural legs and weapon for Sword. Other classes keep their existing renderers.
- HUD and character gallery use the same source art, clipped to its first idle frame.
- Combat math, save format and class selection rules are unchanged.

Run `npm run dev`, open the printed localhost address, and choose Sword in a fresh save. Existing Sword saves use the new art automatically after refresh. A save belonging to a different class remains that class. Port 5175 was used for an independent browser test save.

Validated: TypeScript, 31 core/traversal tests, production build; browser combat and room progression with no console errors. This is the first animation pass from the supplied concept sheet; hand-authored equal-grid sprites may improve pose consistency in a later art pass.

# Embermarch

Idle dungeon crawler: TypeScript + Vite + Phaser 3, local-only (no backend). Package manager: **pnpm**.

**Start every session by reading [docs/HANDOFF.md](docs/HANDOFF.md). Before finishing, update its "สถานะล่าสุด" section and add a line to "บันทึกการส่งต่อ".**

## Commands
- `pnpm dev` → http://127.0.0.1:5173/ (needs localhost/HTTPS for Web Locks)
- `pnpm test` (Vitest, core only) · `pnpm build` (tsc strict + vite)

## Rules
- All game rules live in `src/core` (no DOM/Phaser imports). `src/game` and `src/ui` only render state and send `Command`s through `Store.dispatch`.
- Core randomness goes through `random(s)` in `DropTable.ts`, and core time through `s.now`. Never use `Math.random()` or `Date.now()` in core.
- New `*At` timers must also be shifted in `AFKManager.resume()`.
- Save format changes need `createState` + `validateSave` updates, a version bump and a migration.
- Match the existing dense code style unless the user agrees to reformat.
- New UI is Preact (`src/ui/hud`, `src/ui/components`) styled only with the `--tf-*` tokens in `src/ui/theme/tokens.css`; follow `docs/UI_UX_PLAN.md` task IDs. Preview components at `/design.html` in dev. Thai text needs line-height ≥ 1.4 wherever overflow is clipped.
- PixelLab MCP is configured in `.mcp.json` and reads its token from the `PIXELLAB_API_TOKEN` env var. Never write tokens into files, and never call PixelLab from browser code: generate assets ahead of time into `public/assets/`.

# Embermarch

Idle dungeon crawler (LootMarch-inspired) with a **TypeScript core**, **Phaser** presentation, and **immersive HUD**.

## Project layout

```
c:\new\
├── index.html              # Vite entry (main game)
├── src/
│   ├── main.ts             # Boot, save lock, tick loop
│   ├── core/               # Combat, formulas, models (no DOM/Phaser)
│   ├── game/scenes/        # Phaser scenes (CatacombScene)
│   ├── services/           # Storage, SoundFX
│   ├── styles/             # base.css + hud-immersive.css
│   └── ui/                 # UIManager, icons
├── tests/                  # Vitest (deterministic core)
├── demos/lootmarch-enhanced/  # Standalone UI/canvas prototype (no build)
├── docs/                   # Design & architecture markdown
└── artifacts/              # Screenshots
```

## Play the main game

```powershell
cd c:\new
pnpm install
pnpm dev
```

Open **http://127.0.0.1:5173/** (requires localhost/HTTPS for Web Locks + save).

```powershell
pnpm test    # 31 core + traversal tests
pnpm build   # production bundle → dist/
```

## Standalone demo mod

The **LootMarch Enhanced** mock (canvas + DOM HUD, mock economy) lives in [`demos/lootmarch-enhanced/`](demos/lootmarch-enhanced/). Open `demos/lootmarch-enhanced/index.html` in a browser — no Node required.

Sound synthesis from that demo is wired into the main game via `src/services/SoundFX.ts`.

## Documentation

| Doc | Topic |
|-----|--------|
| [docs/HANDOFF.md](docs/HANDOFF.md) | **Start here** — structure, status, handoff checklist (TH) |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Layer boundaries, formulas |
| [docs/VALIDATION.md](docs/VALIDATION.md) | Test & smoke checklist |
| [docs/GAME_STRUCTURE_DOCS.md](docs/GAME_STRUCTURE_DOCS.md) | Data models & systems |
| [docs/LOOTMARCH_DOCS.md](docs/LOOTMARCH_DOCS.md) | Player guide (TH) |
| [docs/LOOTMARCH_VS_CODEX_COMPARISON.md](docs/LOOTMARCH_VS_CODEX_COMPARISON.md) | UI vs implementation map |
| [docs/CHARACTER_DESIGN_DOCS.md](docs/CHARACTER_DESIGN_DOCS.md) | Art direction |
| [docs/CODEX_PROMPT.md](docs/CODEX_PROMPT.md) | Master build prompt |

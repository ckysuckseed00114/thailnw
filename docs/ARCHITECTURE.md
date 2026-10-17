# Embermarch architecture

> โครงสร้าง UI และผลตรวจล่าสุด (17 ต.ค. 2026): [CURRENT_STRUCTURE_TH.md](CURRENT_STRUCTURE_TH.md) เอกสารนี้เน้นกฎเกมและขอบเขตระบบ; HUD ปัจจุบันใช้ Preact ร่วมกับ `UIManager` เดิม และรูปแบบเซฟเป็น v5

## Boundaries

`src/core` imports no DOM or Phaser APIs. `CombatEngine` is the local implementation of the `Authority` interface; it accepts validated commands and emits combat events. `Store` publishes state and events to the HTML UI and Phaser scene. `src/game/scenes/CatacombScene` draws state and never decides damage, loot, progression, or currency. Its movement, weapon swings and companion follow behavior are presentation animations. `SaveRepository` isolates persistence; the supplied implementation uses LocalStorage with version and structural validation. An invalid save is preserved and startup is stopped rather than silently replacing progress.

```
HTML input → Store.dispatch → Authority / CombatEngine
                                  ↓
                       formulas, PRNG, drop table
                                  ↓
                    state snapshot + combat events
                      ↙                     ↘
                 HTML HUD             Phaser renderer
```

`main.ts` owns scheduling and lifecycle. The core uses 50ms substeps and a serializable xorshift seed. It can run headlessly for deterministic tests or on a future server. The application samples every 100ms and pauses live simulation while hidden. Visibility changes and long suspensions invoke the same offline calculation used on reload. A Web Lock prevents concurrent same-origin sessions from writing the same save. Serve over HTTPS or localhost. Storage is origin-specific; dev and preview ports have separate saves.

## Requested formulas

- Base: 100 HP, 14 damage, 600ms interval, 10% crit ×1.8, 12% block, 30% boss-slam dodge (50% cap).
- Basic enemy hits now have 12% dodge plus 0.5 percentage points per Agility (35% cap). Boss slam keeps 30% plus 1 percentage point per Agility (50% cap). A successful dodge emits `DODGE`; Phaser shows a backstep. A shield is consumed only when it actually blocks a hit.
- Exactly one class skill exists per hero, on key `1`, with a seven-second cooldown and optional auto-cast. There is no mana, SP, MP, or energy resource.
- Attributes: Strength +2 damage; Vitality +8 HP; Agility +2 speed and +1% dodge; Defense +1% block; Vampirism +0.25% life steal, 20-point cap.
- Speed is interpreted as percentage attack speed: `600 / (1 + speed/100)` milliseconds. Haste divides the interval by 1.5. Block has an additional balance cap at 85%.
- XP is the cost of the next level: level 2 costs 250; level L≥3 costs `round(1000 × 1.16^(L−2))`. Level-up fully heals and grants one point. A technical level ceiling of 1000 guards malformed/infinite progression.
- Regions use continuous index `(floor−1) × 11 + region`. HP scales by `1.4^(R−1)`; damage by `1.35^(R−1)`.
- Forge is compounded: `base × (1 + rarityRate)^forge`. Rates are 4/5/6/8/11/15%. Salvage is base Bone plus floor(25% invested Bone).
- Floor F costs `3000 × 2^(F−2)` LM and `800 × 2^(F−2)` Bone, gated by previous floor completion.
- Shrines roll 8% on room entry, last 60 seconds, and replace the previous blessing. Fortune doubles LM and item count. Renewal heals 3% max HP/s.
- Offline rewards use the ratio of reward totals to recorded active seconds in minute buckets over the preceding 24 hours. Dead time and room transitions count in the denominator. Each absence pays 75% for up to 8 hours; no history means no rewards. Rewards remain pending until claimed. The resume timestamp is saved immediately, preventing re-counting an absence on a normal reload. Pending rewards from multiple distinct absences can accumulate.

## Balance decisions where the brief did not specify values

| System | Initial implementation |
| --- | --- |
| Rooms per region | Seven encounters with three enemies each, then a boss in room 8 |
| Boss phases | At ≤2/3 and ≤1/3 HP, summon one guard per threshold; boss remains targetable and attacks on its normal 2.2s schedule while guards are alive; all enemies must die before the gate opens |
| Base enemies | 42 HP / 3 damage; boss 170 HP / 10 damage |
| Enemy timing | 2.4s attacks; boss 2.2s; every third boss hit is a 2.5× slam |
| Room transition | 6.5s walk through the opened door (`ROOM_TRAVERSE_MS`); death respawns after 3s in current region room 1 |
| Progression | Auto advance can be toggled; region 11 repeats until the seal is opened |
| Rewards | Normal: 8 LM / 18 XP / 3 Bone × region; boss: 45 / 100 / 15 × region |
| Item chance | 24% per normal kill, guaranteed per boss |
| Storage caps | Inventory 300, loot chest 150 (`MAX_INVENTORY`/`MAX_CHEST`). Drops and AFK loot that arrive at a full chest are auto-salvaged into Bone; Claim moves only what fits; the item cache cannot be bought into a full chest. Older saves above the cap still load. |
| Rarity weights | 50%, 27%, 15%, 6%, 1.8%, 0.2% |
| Item base power | round((3 + 2×region) × (1 + 0.65×rarityIndex)) |
| Gear stats | Weapon/Ring/Amulet: damage; Helmet/Armor/Shield: 5×power HP; Boots: speed |
| Forge price | ceil(40 LM and 20 Bone × (rarityIndex+1) × 1.14^forge) |
| Mythic salvage | 3000 Bone; other rarities use the requested values |
| Pets | All four available; one active; base cooldown 8s |
| Pet XP | 100×current level per level; feeding costs 1 Bone + 1 LM for 10 XP |
| Pet effects | Leafhopper heals 10% HP; Shellby blocks next hit; Craboulder 90% damage + 1s stun; Emberkit 120% damage |
| Pet scaling | 1 + 0.1×(level−1); Shellby reduces cooldown because its block is binary |
| Shop | 50 LM full heal; 150 LM random item cache |
| Quests | Three one-time milestones; not time-sensitive daily quests |
| Spear geometry | Enemy formation is a line, so Pierce hits the whole formation |

The forge interpretation and unspecified economy values should be confirmed during balancing. A new save starts with no gear or currency. Item name families are procedurally combined with slots and region power; this is not a hand-authored 200-item catalogue.

## Production and Web3 migration

This release is a local game, not an authoritative online economy. A player controls their local save and system clock. Do not attach token withdrawals or paid marketplace transactions to this implementation.

For a live service, move core simulation to a trusted server and replace local Authority/SaveRepository with a network command gateway and server database. The gateway must own time and RNG, validate ownership and progression, sequence commands, authenticate players, rate-limit requests, and atomically commit inventory/currency plus idempotency keys. Publish read-only snapshots to clients. Store wallet linkage, contract events, and an auditable ledger separately from rendering state. Add contract/network-specific wallet signing only after choosing and auditing the settlement design. Marketplace is explicitly unavailable until these services exist.

Remaining release work: long-duration balance/load testing; real-device browser matrix; server/session recovery; save export/migration UX; monitoring; accessibility review; and any production wallet/contract security review. Sprite animations are original procedural pixel art with tweened motion and effects, not a licensed character sprite pack. Fonts load from Google Fonts when available and fall back to local fonts. No sound assets are included.

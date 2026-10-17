# Master Prompt สำหรับสั่ง AI / Codex สร้างเกมสไตล์ LootMarch

> **คำแนะนำการใช้งาน:**
> คุณสามารถคัดลอกข้อความด้านล่างนี้ (ตั้งแต่ส่วน `--- BEGIN PROMPT ---` จนถึง `--- END PROMPT ---`) ไปวางให้ **Codex / AI Agent** เพื่อสั่งเริ่มสร้างโปรเจกต์เกมได้ทันที

---

--- BEGIN PROMPT ---

You are a Principal Game Developer and Web3 Systems Architect.
Your task is to build a complete, production-ready, fully functional 2D Idle Dungeon Crawler web game inspired by **LootMarch** (like lootmarch.xyz).

---

### 🛠️ 1. Technical Stack & Architecture
- **Framework & Bundler:** Vite + TypeScript
- **Game Engine (Canvas/WebGL):** Phaser 3 (or Modular Canvas Engine)
- **UI / HUD Overlay:** HTML5 + Vanilla CSS (Glassmorphism dark fantasy UI, hotkeys support)
- **State Management:** Decoupled Centralized Reactive State (Observer/Store Pattern)
- **Storage:** LocalStorage / IndexedDB (with clean abstraction for future Web3/Smart Contract integration)
- **Design Philosophy:** Server-authoritative architecture pattern (all combat math, RNG, and drop tables isolated in pure TypeScript services, decoupled from Phaser rendering).

---

### 🎮 2. Core Game Systems & Rules

#### A. Hero & Classes (5 Classes)
- **Base Stats:** HP: 100, Damage: 14, Attack Interval: 0.6s, Crit: 10% (x1.8), Block: 12%, Boss Slam Dodge: 30% (Cap at 50%).
- **5 Classes & Skills (Auto-casts every 7s, can Crit & Life Steal):**
  1. `Sword`: Whirlwind (AoE 360° spin hitting all enemies for 215% DMG)
  2. `Spear`: Pierce (Linear piercing thrust for 260% DMG)
  3. `Wand`: Fireball (Ranged explosive fireball for 270% AoE DMG)
  4. `Axe`: Cleave (Heavy strike for 310% DMG + Stuns enemy)
  5. `Dagger`: Shadow Step (Blinks to target and strikes for 200% DMG)
- **Attributes (1 Point per Level Up):**
  - Strength: +2 DMG
  - Vitality: +8 HP
  - Agility: +2 Speed, +1% Dodge
  - Defense: +1% Block
  - Vampirism: +0.25% Life Steal (Max 20 pts = 5%)
- **Leveling Formula:** Level 2 = 250 XP. Level $L \ge 3 = 1000 \times (1.16)^{L - 2}$. Leveling up completely refills HP.

#### B. Dungeon, Regions & Scaling
- **Structure:** Floors consisting of 11 Regions each (Stone Halls, Flooded Depths, Catacombs, etc.). Each region has a sequence of monster rooms ending with a Boss room.
- **Difficulty Scaling:**
  - $\text{Monster HP} = \text{BaseHP} \times (1.40)^{R - 1}$
  - $\text{Monster DMG} = \text{BaseDMG} \times (1.35)^{R - 1}$ (where $R$ is continuous region index).
- **Floor Seals:** After clearing region 11, unlock next floor with cost doubling:
  - Floor 2: 3,000 $LM + 800 Bone
  - Floor $F$: $3000 \times 2^{F-2}$ $LM + 800 \times 2^{F-2}$ Bone.
- **Shrines (8% spawn rate, 60s buff):**
  - `Fury`: 2x DMG | `Fortune`: 2x Drops & $LM | `Haste`: +50% Speed | `Renewal`: Heal 3% Max HP/sec.
- **Death:** Hero respawns after 3 seconds at Room 1 of current region without losing any items.
- **Travel (Cooldown 30m):** Allows fast traveling to any previously unlocked region to farm.

#### C. Equipment & Forge System
- **7 Gear Slots:** Weapon, Helmet, Armor, Shield, Boots, Ring, Amulet.
- **6 Rarities:** Common (Grey), Uncommon (Green), Rare (Blue), Epic (Purple), Legendary (Gold), Mythic (Red).
- **Loot Chest:** Dropped loot queues in a bottom-right chest; player clicks "Claim All".
- **Forge (+0 to +60):** Costs $LM + Bone.
  - Stat multiplier per + level: Common (+4%), Uncommon (+5%), Rare (+6%), Epic (+8%), Legendary (+11%), Mythic (+15%).
- **Salvage:** Turn gear into Bone (Common: 30, Uncommon: 80, Rare: 200, Epic: 500, Legendary: 1,200). Forged items return base + 25% of invested Bone.
- **Locking:** Prevent selling/salvaging locked gear.

#### D. Pets System (Lv 1 - 10)
- **4 Companions:**
  1. `Leafhopper`: Heals hero periodically
  2. `Shellby`: Blocks incoming boss attack
  3. `Craboulder`: Throws boulder (damage + stun)
  4. `Emberkit`: Fires flame bolts
- **Progression:** Feed Bone to gain XP (1 Bone = 10 XP + 1 $LM). Level increases stat bonus by +10% per level.

#### E. AFK Idle Rewards
- When player returns, calculate elapsed time up to 8 hours.
- Pay 75% of average clearing rate from recent 24h performance ($LM, XP, Bone, Loot).

#### F. UI & Control Hotkeys
- Hotkeys: `I` (Inventory), `C` (Character/Stats), `P` (Pet), `B` (Shop), `M` (Marketplace), `T` (Travel), `Q` (Quests).
- "Equip Best" button in inventory that equips the highest power gear.

---

### 📂 3. Desired Project Directory Structure

```text
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── src/
│   ├── main.ts                   # App entrypoint
│   ├── styles/                   # Modern dark-fantasy CSS
│   │   ├── main.css
│   │   ├── ui-panels.css
│   │   └── animations.css
│   ├── core/                     # Pure logic / decoupled engine
│   │   ├── GameState.ts          # Central reactive store
│   │   ├── Formulas.ts           # Math, XP curve, scaling, forge formulas
│   │   ├── CombatEngine.ts       # Ticks, damage calculation, cooldowns
│   │   ├── DropTable.ts          # Loot RNG, rarities, chest rates
│   │   └── AFKManager.ts         # Offline reward calculator
│   ├── data/                     # Definitions & databases
│   │   ├── classes.ts            # 5 classes & skills
│   │   ├── items.ts              # 200+ equipment definitions
│   │   ├── monsters.ts           # Monster types & bosses
│   │   ├── regions.ts            # 11 regions & floor seals
│   │   └── pets.ts               # 4 pets & skill tiers
│   ├── game/                     # Phaser 3 rendering layer
│   │   ├── GameConfig.ts
│   │   ├── scenes/
│   │   │   ├── BootScene.ts
│   │   │   └── DungeonScene.ts   # Room renderer, hero/monster sprites, effects
│   │   └── entities/
│   │       ├── HeroSprite.ts
│   │       └── MonsterSprite.ts
│   └── ui/                       # DOM HUD & UI overlays
│       ├── UIManager.ts          # Controls modals and hotkeys
│       ├── components/
│       │   ├── InventoryView.ts
│       │   ├── StatsView.ts
│       │   ├── PetView.ts
│       │   ├── TravelView.ts
│       │   └── LootChestModal.ts
```

---

### 🚀 4. Step-by-Step Implementation Instruction

Please build the application step-by-step:
1. **Phase 1: Project Setup & Core Math:** Create `package.json`, `tsconfig.json`, `vite.config.ts`, `Formulas.ts`, and `GameState.ts` with complete data schemas.
2. **Phase 2: Combat Engine & Data Models:** Implement the pure TypeScript combat loop, class skills, damage resolution (Crit, Block, Dodge), and monsters.
3. **Phase 3: Phaser 3 Visual Layer:** Set up the dungeon scene where the hero walks into rooms, auto-attacks monsters, triggers visual skill animations, and collects loot.
4. **Phase 4: UI Panels & Inventory System:** Build HUD, Inventory with "Equip Best", Stat Allocator, Forge, Salvage, and Loot Chest Claiming.
5. **Phase 5: AFK Rewards, Pets & Floor Seals:** Add Pet upgrading, AFK tracking via timestamp in LocalStorage, and region travel.

Start by setting up the project files and implementing the core systems with clean, modular TypeScript code. Ensure all game formulas and numbers strictly match the specifications above.

--- END PROMPT ---

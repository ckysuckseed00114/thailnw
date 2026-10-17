# เอกสารเปรียบเทียบสถาปัตยกรรม: LootMarch (ต้นฉบับ) vs Codex Game Architecture

เอกสารนี้วิเคราะห์โครงสร้างจริงของเกม **LootMarch** (อ้างอิงจาก Source Code และภาพหน้าจอ In-Game จริง) เปรียบเทียบกับ **สถาปัตยกรรมที่ Codex ออกแบบขึ้นมาเพื่อสร้างเกมใหม่** พร้อมการจัดวางโครงสร้างไฟล์ (File Structure) แยกส่วนอย่างเป็นระบบ

---

## 📌 สารบัญ (Table of Contents)
1. [วิเคราะห์องค์ประกอบจากภาพ In-Game จริงของ LootMarch](#1-วิเคราะห์องค์ประกอบจากภาพ-in-game-จริงของ-lootmarch)
2. [ตารางเปรียบเทียบเชิงลึก: LootMarch vs Codex Architecture](#2-ตารางเปรียบเทียบเชิงลึก-lootmarch-vs-codex-architecture)
3. [โครงสร้างไฟล์ของ LootMarch (Reverse-Engineered Bundle Stack)](#3-โครงสร้างไฟล์ของ-lootmarch-reverse-engineered-bundle-stack)
4. [โครงสร้างไฟล์ของเกมที่ Codex สร้างขึ้น (Clean Modular Architecture)](#4-โครงสร้างไฟล์ของเกมที่-codex-สร้างขึ้น-clean-modular-architecture)
5. [การจับคู่คอมโพเนนต์หน้าจอ (UI & In-Game Mapping)](#5-การจับคู่คอมโพเนนต์หน้าจอ-ui--in-game-mapping)

---

## 1. วิเคราะห์องค์ประกอบจากภาพ In-Game จริงของ LootMarch

จากภาพหน้าจอการเล่นจริง (ผู้เล่น `LuckyRohit`, Lv. 43, ดันเจี้ยน `Obsidian Sanctum` Floor 4, Room 3/8):

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ [Hero Card: LuckyRohit Lv.43]       [Zone: Obsidian Sanctum F4 R3/8]   [30,684 $LM | 93.2K Bone]│
│ [HP: 603/603 | XP Bar]              [Banner: Shapash found Celestial Glaive] [Map | World Boss]│
│ [Room Objective: Clear Ritual 4/4]                                                             │
│ [Holder Boost: +5% (20.1K LM)]                                                                 │
│                                                                                                │
│                                  [ 2D TILEMAP DUNGEON ]                                        │
│                        Hero (with Shield) + Emberkit Pet                                       │
│                        Torches / Dynamic Lighting / Breakable Pots                             │
│                        Enemies (Reaper Boss, Goblins) + [x4 Combo]                             │
│                                                                                                │
│ [Cleave 2.5s] [Inv][Stats][Pet][Shop][Market][Travel][Quest][Pass][Ranks][Guild][Codex][Loot] │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

### องค์ประกอบหลักที่ต้องจัดการในโค้ด:
1. **Dungeon Tilemap & Dynamic Lighting:** ฉากพื้นและกำแพงแบบ 2D Tilemap พร้อมเอฟเฟกต์แสงไฟสีม่วง/ส้มจากคบเพลิง (Torch Lighting Pipeline)
2. **Entity Rendering:** ตัวละครฮีโร่ถืออาวุธ/โล่, สัตว์เลี้ยงเดินตาม (Emberkit), มอนสเตอร์ทั่วไป, มินิบอส (Grim Reaper) และไหดินเผาที่ทำลายได้ (Breakable Pots)
3. **Combat Feedback:** ตัวนับคอมโบ (`x4 Combo`), แถบเลือดมอนสเตอร์, ดาเมจลอย (Floating Damage Numbers)
4. **Real-time Global Banners:** ระบบบรอดแคสต์แจ้งเตือนทั้งเซิร์ฟเวอร์เมื่อมีคนดรอปของระดับ Legendary/Mythic
5. **HUD Widgets:**
   - **World Boss Timer:** นับถอยหลังบอสโลก (เช่น `VARETH Portal opens in 01:05:03`)
   - **Holder Boost Widget:** แสดงสถานะการถือเหรียญ On-chain แบบ Real-time (`+5%`)
   - **Room Objective:** วัตถุประสงค์ประจำห้อง เช่น `Clear Ritual Circle 4/4`
   - **Live Online Counter:** แสดงจำนวนผู้เล่นออนไลน์พร้อมกัน (`1,334 online`)
   - **Global Chat:** ระบบแชตมุมขวาล่าง (`Chat 99+`)

---

## 2. ตารางเปรียบเทียบเชิงลึก: LootMarch vs Codex Architecture

| หัวข้อการเปรียบเทียบ | LootMarch (ต้นฉบับจริง) | Codex Architecture (สถาปัตยกรรมที่ออกแบบใหม่) |
| :--- | :--- | :--- |
| **Rendering Engine** | Phaser 3 (WebGL Canvas) | Phaser 3 + Custom WebGL Pipeline สำหรับ Lighting |
| **โครงสร้าง Client** | Vite Bundle รวม Script บางส่วน (`main-*.js`, `phaser-*.js`) | Clean Modular Component Architecture แยก Logic ชัดเจน |
| **Game State Logic** | ผูก Logic ส่วนหนึ่งไว้กับ Server ผ่าน WebSocket/REST | **Headless State & Engine** (รันได้ทั้ง Offline/Online ใน TS บริสุทธิ์) |
| **UI & HUD** | HTML/CSS Overlay ครอบบน Canvas ของ Phaser | DOM Component System (แยกเป็น Custom Components พร้อม Store Subscription) |
| **ระบบคอมโบและเควสต์** | Server ควบคุม Room Objectives และ Boss Spawns | `DungeonDirector` จัดการ Room State, Objectives, และ Combo Counter |
| **ระบบเครือข่าย (Networking)** | WebSocket สำหรับ Chat, World Boss, Server Announcements | `NetworkAdapter` (รองรับทั้ง Mock Socket สำหรับ Local Dev และ Real WebSocket) |
| **Web3 / Wallet Integration** | EVM (Robinhood Chain) ตรวจจับ Balance On-chain | `Web3ProviderService` (รองรับทั้ง Mock Balance สำหรับทดสอบ และ Ethers/Viem จริง) |
| **การคำนวณ AFK** | เซิร์ฟเวอร์คำนวณจากสถิติ 24 ชม. ล่าสุด | `AFKEngine` คำนวณตามสูตรคณิตศาสตร์เดียวกัน จัดเก็บ Timestamp บน LocalStorage/DB |

---

## 3. โครงสร้างไฟล์ของ LootMarch (Reverse-Engineered Bundle Stack)

โครงสร้างจริงของ LootMarch บน Production ที่ถูกคอมไพล์ผ่าน Vite:

```text
lootmarch-production/
├── index.html                       # หน้า Landing page
├── play.html                        # หน้าเข้าเกมหลัก (<div id="game"></div>)
├── docs.html                        # หน้าเอกสารคู่มือ
├── assets/
│   ├── main-CxMxRO1c.js             # Logic ตัวเกมหลัก, UI Controllers, Network Client
│   ├── phaser-CuQGXlx3.js           # Phaser 3 Runtime Core
│   ├── petChestDefinitions-CplWgXz9.js  # ข้อมูลสัตว์เลี้ยงและหีบ
│   ├── chestRewards-DQ1JhR33.js     # ตารางคำนวณของรางวัลหีบ
│   ├── main-X3bVieYJ.css            # สไตล์ชีต HUD, Glassmorphism, Bottom Bar
│   ├── docs-thByILdi.js             # สคริปต์หน้า Docs
│   └── site/                        # รูปภาพและ Assets UI ต่างๆ
│       ├── shot-dungeon.webp
│       ├── chest-legendary.webp
│       └── logo.webp
```

> **ข้อสังเกต:** โครงสร้างจริงใน Production รวมทุกอย่างไว้ใน Bundle ขนาดใหญ่ ทำให้ปรับแต่งหรือพัฒนาต่อเติมได้ยากหากไม่มี Source Code ต้นทาง

---

## 4. โครงสร้างไฟล์ของเกมที่ Codex สร้างขึ้น (Clean Modular Architecture)

สถาปัตยกรรมที่ Codex ออกแบบเพื่อสร้างเกมใหม่ เป็นโครงสร้างแบบ **Clean Architecture & Separation of Concerns** แยกฝั่ง Logic, Graphics, UI และ Network ออกจากกัน 100%:

```text
codex-lootmarch-engine/
├── index.html                       # HTML Shell สำหรับ Mount Canvas และ HUD
├── package.json
├── tsconfig.json
├── vite.config.ts
│
├── public/                          # Static Assets (Sprites, Audio, Fonts, Tiles)
│   ├── assets/
│   │   ├── tilesets/                # แผนที่ดันเจี้ยน (Stone, Magma, Obsidian)
│   │   ├── sprites/                 # สไปรต์ฮีโร่, สัตว์เลี้ยง, มอนสเตอร์
│   │   │   ├── heroes/              # Sword, Spear, Wand, Axe, Dagger
│   │   │   ├── pets/                # Leafhopper, Shellby, Craboulder, Emberkit
│   │   │   └── monsters/            # Goblins, Skeletons, Vareth World Boss
│   │   ├── icons/                   # ไอคอนสกิล (Cleave, Whirlwind, etc.)
│   │   └── audio/                   # ซาวด์เอฟเฟกต์การโจมตี, ดรอปของ, ตีบวก
│
└── src/
    ├── main.ts                      # Application Bootstrap (เชื่อม Phaser กับ UI)
    │
    ├── config/                      # การตั้งค่าระบบ
    │   ├── GameConfig.ts            # ขนาดจอ, อัตราเฟรม, ฟิสิกส์
    │   └── Constants.ts             # ค่าคงที่ (คูลดาวน์สกิล 7s, โจมตี 0.6s)
    │
    ├── core/                        # [HEADLESS LOGIC] ตรรกะเกมบริสุทธิ์ (ไม่พึ่งพา Canvas)
    │   ├── engine/
    │   │   ├── CombatEngine.ts      # วงลูปโจมตี, คำนวณ Crit, Block, Life Steal, Stun
    │   │   ├── DungeonDirector.ts   # จัดการห้อง (11 Regions, Room Objective, Boss)
    │   │   ├── ComboManager.ts      # ระบบตัวคูณคอมโบ (x4 Combo)
    │   │   └── AFKEngine.ts         # คำนวณผลผลิตออฟไลน์ (75% rate, 8 ชม.)
    │   ├── formulas/
    │   │   ├── LevelingFormulas.ts  # สูตร XP ตัวละคร (250 XP -> +16%/lvl)
    │   │   ├── ScalingFormulas.ts   # สเกลมอนสเตอร์ (+40% HP, +35% DMG)
    │   │   ├── ForgeFormulas.ts     # สูตรสเตตัสการตีบวก (+4% ถึง +15%)
    │   │   └── SealCostFormulas.ts  # สูตรค่าปลดผนึกชั้น (เพิ่ม 2 เท่าทุกชั้น)
    │   ├── state/
    │   │   ├── GameStore.ts         # Central Reactive Store (Observable State)
    │   │   ├── HeroState.ts         # ข้อมูลตัวละคร, สเตตัส, 7 Equipment Slots
    │   │   ├── InventoryState.ts    # จัดการกระเป๋า, ล็อกไอเทม, ระบบ Equip Best
    │   │   └── EconomyState.ts      # ยอดเงิน $LM, Bone, Holder Boost Tier
    │   └── loot/
    │       ├── DropTable.ts         # สุ่มไอเทมตามเกรดมอนสเตอร์ (Normal/Elite/Boss)
    │       └── SalvageManager.ts    # คำนวณการย่อยไอเทมคืนเป็น Bone
    │
    ├── data/                        # Static Databases
    │   ├── classes.data.ts          # สกิล 5 อาชีพ (Whirlwind, Pierce, Cleave...)
    │   ├── items.data.ts            # ข้อมูลอุปกรณ์กว่า 220+ ชิ้น
    │   ├── pets.data.ts             # สัตว์เลี้ยง 4 ชนิด และการอัปเกรด Lv 1-10
    │   └── regions.data.ts          # ข้อมูล 11 ภูมิภาคต่อชั้น
    │
    ├── game/                        # [PHASER VIEW LAYER] แสดงผลกราฟิกและแสงสี
    │   ├── scenes/
    │   │   ├── BootScene.ts         # โหลด Assets และตั้งค่า Animation Sprites
    │   │   └── scenes/CatacombScene.ts   # เรนเดอร์ห้องดันเจี้ยน (Phaser)
    │   ├── entities/
    │   │   ├── HeroSprite.ts        # ตัวละครฮีโร่ (เดิน, โจมตี, แอนิเมชันสกิล)
    │   │   ├── PetSprite.ts         # สัตว์เลี้ยงเดินตามหลังฮีโร่
    │   │   ├── MonsterSprite.ts     # มอนสเตอร์, บอส, แถบพลังชีวิต
    │   │   └── BreakableProp.ts     # ไหดินเผา (Pots) ที่ฟันแตกแล้วดรอปเหรียญ
    │   └── fx/
    │       ├── DamageSplats.ts      # ตัวเลขดาเมจลอย (สีขาวปกติ, สีเหลืองคริ)
    │       ├── SkillFX.ts           # เอฟเฟกต์สกิล (ไฟระเบิด, ดาบหมุน)
    │       └── LightingPipeline.ts  # แสง Dynamic Light รอบคบเพลิงและตัวละคร
    │
    ├── ui/                          # [DOM HUD OVERLAY] หน้าต่างอินเทอร์เฟซผู้ใช้
    │   ├── UIManager.ts             # ควบคุมการเปิด-ปิดหน้าต่าง และ Hotkeys (I, C, P, B...)
    │   ├── components/
    │   │   ├── HeaderHUD.ts         # แถบแสดงโซน (Obsidian Sanctum) และยอด $LM/Bone
    │   │   ├── HeroStatusCard.ts    # การ์ดซ้ายบน (HP 603/603, เลเวล, หลอด XP)
    │   │   ├── RoomObjectiveCard.ts # วัตถุประสงค์ห้อง (Clear Ritual Circle 4/4)
    │   │   ├── HolderBoostCard.ts   # วิดเจ็ต Holder Boost (+5%)
    │   │   ├── MinimapWidget.ts     # แผนที่ย่อ, ผู้เล่นออนไลน์, นับถอยหลัง World Boss
    │   │   ├── GlobalBanner.ts      # ป้ายประกาศทอง (เช่น Shapash found Legendary)
    │   │   ├── BottomBar.ts         # แถบปุ่มล่าง (13 เมนูหลัก + ไอคอนคูลดาวน์สกิล)
    │   │   └── ChatWidget.ts        # วิดเจ็ตแชตสดมุมขวาล่าง
    │   └── modals/                  # หน้าต่างป๊อปอัป
    │       ├── InventoryModal.ts    # ช่องเก็บของ พร้อมปุ่ม "Equip Best"
    │       ├── StatsModal.ts        # อัปแต้ม Attributes 5 สาย
    │       ├── PetModal.ts          # ให้อาหารและเปลี่ยนสัตว์เลี้ยง
    │       ├── ShopModal.ts         # ซื้อของ Mythic, Bone, เปลี่ยนคลาส
    │       ├── TravelModal.ts       # เลือกวาร์ปย้อนไปฟาร์มชั้นที่ผ่านมา
    │       ├── ForgeModal.ts        # ตีบวกอุปกรณ์ (+0 ถึง +60)
    │       └── LootChestModal.ts    # หีบรับของรางวัลตกหล่น (Claim All)
    │
    ├── network/                     # ระบบเชื่อมต่อเครือข่าย
    │   ├── WebSocketClient.ts       # รับข้อมูล Real-time (Chat, บอสเกิด, แจ้งเตือนดรอป)
    │   └── MockNetworkAdapter.ts    # จำลองผู้เล่นและข้อความประกาศสำหรับโหมดออฟไลน์
    │
    ├── web3/                        # ระบบเชื่อมต่อบล็อกเชน
    │   ├── WalletConnector.ts       # เชื่อมต่อ MetaMask / Rabby ผ่าน Viem
    │   ├── TokenService.ts          # เช็ค Balance เหรียญ $LM และคำนวณ Holder Boost
    │   └── MockWeb3Service.ts       # โหมดทดสอบโดยไม่ต้องใช้เหรียญจริง
    │
    └── styles/                      # สไตล์ชีต CSS
        ├── base.css                 # โครงสร้างหลักและ CSS Reset
        ├── ui/hud/hud.css           # Preact HUD แบบเต็มจอทับ Phaser
        ├── hud.css                  # สไตล์ HUD ด้านบน, ด้านข้าง และป้ายประกาศ
        ├── bottom-bar.css           # สไตล์ปุ่มเมนูล่างและคูลดาวน์สกิล
        └── modals.css               # สไตล์ Glassmorphism ของหน้าต่างป๊อปอัป
```

---

## 5. การจับคู่คอมโพเนนต์หน้าจอ (UI & In-Game Mapping)

ตารางนี้แสดงให้เห็นว่า แต่ละองค์ประกอบที่ปรากฏในภาพจริงของ LootMarch จะถูกดูแลโดยไฟล์โค้ดใดในโปรเจกต์ของ Codex:

| ตำแหน่งในภาพ LootMarch | สิ่งที่เห็นในภาพ | ไฟล์ที่รับผิดชอบใน Codex Project |
| :--- | :--- | :--- |
| **ซ้ายบน (Top-Left)** | โปรไฟล์ฮีโร่, HP 603/603, หลอด XP | `src/ui/components/HeroStatusCard.ts` |
| **ซ้ายกลาง (Mid-Left)** | เควสต์ห้อง: "Clear Ritual Circle 4/4" | `src/ui/components/RoomObjectiveCard.ts` |
| **ซ้ายล่าง (Bottom-Left)** | การ์ด "Holder Boost +5% (Hold 315K $LM)" | `src/ui/components/HolderBoostCard.ts` |
| **ตรงกลางบน (Top-Center)** | แถบชื่อโซน "Obsidian Sanctum F4 R3/8" | `src/ui/components/HeaderHUD.ts` |
| **ป้ายทองลอยกลางจอ** | "Shapash found Celestial Glaive (legendary)" | `src/ui/components/GlobalBanner.ts` |
| **ขวาบน (Top-Right)** | เหรียญ $LM (30,684), Bone (93,200) | `src/ui/components/HeaderHUD.ts` |
| **ขวากลาง (Mid-Right)** | แผนที่ย่อ, คนออนไลน์ 1,334 คน, World Boss Vareth | `src/ui/components/MinimapWidget.ts` |
| **ในแผนที่ดันเจี้ยน (Canvas)** | พื้น, กำแพง, คบเพลิงเรืองแสงม่วง | `src/game/scenes/CatacombScene.ts` |
| **ตัวละครและสัตว์เลี้ยง** | LuckyRohit (มีโล่) + หมาไฟ Emberkit | `src/game/entities/HeroSprite.ts` + `PetSprite.ts` |
| **ศัตรูและไหบนพื้น** | บอสยมทูต, มอนสเตอร์ขวาน, ไหดินเผา | `src/game/entities/MonsterSprite.ts` + `BreakableProp.ts` |
| **ระบบคอมโบดาเมจ** | ตัวนับข้อความ "x4 combo" | `src/core/engine/ComboManager.ts` |
| **สกิลมุมซ้ายล่าง** | ไอคอน Cleave พร้อมตัวเลขนับถอยหลัง 2.5s | `src/ui/components/BottomBar.ts` (Skill Overlay) |
| **แถบปุ่มเมนู 13 ปุ่ม** | Inventory, Stats, Pet, Shop, Market, Travel... | `src/ui/components/BottomBar.ts` |
| **มุมขวาล่าง** | ปุ่ม Chat (99+) | `src/ui/components/ChatWidget.ts` |
| **หีบสมบัติขวาล่าง** | กล่อง Loot สีทองเรืองแสง (รอรับของ) | `src/ui/modals/LootChestModal.ts` |

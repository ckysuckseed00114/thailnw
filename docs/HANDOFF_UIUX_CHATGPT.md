# ส่งต่องาน UI/UX — Thailnw (Thai Fantasy) → ChatGPT

> **อัปเดตเกมเพลย์ 17 ต.ค. 2026:** [GAMEPLAY_UPDATE_2026-10-17.md](GAMEPLAY_UPDATE_2026-10-17.md) เป็นกติกาล่าสุด: 1 สกิลต่ออาชีพ, cooldown อย่างเดียว, ไม่มี SP/MP, 8 ห้อง/region, บอสเรียกลูกน้อง เอกสารด้านล่างบันทึกสถานะ UI ก่อนการเปลี่ยนนี้; เมื่อทำ Phase 3 ห้ามนำ 6 สกิลหรือมานากลับมา

> สร้างเมื่อ 2026-10-17 · commit ล่าสุด `cc375bf` · ใช้คู่กับไฟล์ zip `thailnw-uiux-handoff.zip`
> ผู้รับงานไม่เห็นบทสนทนาเดิม เอกสารนี้จึงต้องอ่านเข้าใจได้ด้วยตัวเอง

---

## 0. Prompt สำหรับวางใน ChatGPT (คัดลอกทั้งบล็อก)

```
คุณคือ UI/UX Game Designer และ Lead Frontend Developer ที่รับช่วงต่อโปรเจกต์เกม "Thailnw"
(idle dungeon crawler แนว Thai Fantasy MMORPG, TypeScript + Vite + Phaser 3 + Preact)

ไฟล์ที่แนบมาเป็น source code ทั้งหมดของ src/, tests/, docs/ และภาพอ้างอิงงานศิลป์ 2 ภาพ
ให้อ่าน docs/HANDOFF_UIUX_CHATGPT.md ก่อนเป็นอย่างแรก แล้วอ่าน docs/UI_UX_PLAN.md และ CLAUDE.md

งานของคุณ: ทำ UI/UX Phase 3 ต่อ (เริ่มที่ 3.1, 3.2, 3.3) ตามกติกาในหัวข้อ 3 ของเอกสารส่งต่อ
- ห้ามย้ายกฎเกมออกจาก src/core และห้ามให้ UI คำนวณผลเกมเอง
- เขียนโค้ดต่อจากของเดิมให้เข้ากับสไตล์เดิม (token --tf-*, Preact, signals)
- ถ้าต้องแก้ core หรือรูปแบบเซฟ ให้ทำตามหัวข้อ 3 ข้อ 4–6 และเขียน test ทุกครั้ง
- ตอบกลับเป็น: (1) แผนสั้น ๆ (2) ไฟล์ที่เปลี่ยน แบบเนื้อหาเต็มไฟล์ หรือ unified diff ที่ apply ได้
  (3) test ที่เพิ่ม (4) วิธีตรวจด้วยมือ (5) สิ่งที่ยังไม่ได้ทำหรือไม่แน่ใจ
- ห้ามเดา API ที่ไม่มีอยู่ ถ้าไม่แน่ใจให้ถามหรือระบุสมมติฐานให้ชัด
```

---

## 1. ภาพรวมโปรเจกต์ (ตอนนี้)

| หัวข้อ | สถานะ |
| --- | --- |
| เกม | idle dungeon crawler เล่นในเบราว์เซอร์ ต่อสู้อัตโนมัติ มี 5 อาชีพ · 1 สกิล/อาชีพ · 11 region/floor · 8 ห้อง/region (ห้อง 8 คือบอส) |
| Stack | TypeScript 5.9 strict · Vite 7 · Phaser 3.90 (ฉาก) · **Preact 10 + @preact/signals** (HUD ใหม่) · Vitest 3 · pnpm |
| เซฟ | LocalStorage key `thailnw.save.v1` · **รูปแบบเวอร์ชัน 5** · มี migration v1→v5 และสำรองเซฟเดิมก่อน migrate |
| ทิศทาง | กำลังจะเปลี่ยนเป็นเกมออนไลน์ (ดู `docs/ONLINE_PLAN.md`) **ไม่มี NFT/token/wallet** · ตอนนี้ยังเป็น local ทั้งหมด |
| Test | `pnpm test` → **97 tests ผ่าน** · `pnpm build` ผ่าน |
| ภาพอ้างอิง | `references/shattered-siam.webp` (pixel โทนมืด ไม้+ทอง) และ `references/siam-spirit.webp` (chibi สว่าง) · **ใช้เป็นทิศทางเท่านั้น ห้ามคัดลอกภาพ/asset** |

คำสั่ง:
```bash
pnpm install
pnpm dev          # http://127.0.0.1:5173/  · หน้า design system: /design.html
pnpm test
pnpm build
```

---

## 2. สถาปัตยกรรม UI

```
CombatEngine (src/core)  ──tick/dispatch──▶  Store.notify(state, events)
        ▲                                         │
        │ Command                                 ├─▶ CatacombScene (Phaser: ฉาก ตัวละคร VFX ตัวเลขดาเมจ)
        │                                         ├─▶ UIManager (vanilla: modal เดิมทั้งหมด + เมนูล่าง)
  hotkeys.ts / ปุ่มต่าง ๆ                           └─▶ HUD v2 (Preact: src/ui/hud/*)
```

- **HUD v2** mount ที่ `src/ui/hud/Hud.tsx` → `#hud-root` (CSS grid เต็มจอ, `pointer-events:none` ยกเว้นลูก)
- **การอ่าน state:** `useGame()` ใน `gameSignal.ts` · state เป็น object เดียวที่ถูกแก้ในที่เดิม จึงใช้ signal `revision` ตัวนับเพื่อ re-render (ทุกประมาณ 100 ms)
- **การสั่งงาน:** `currentStore().dispatch(command)` ครอบด้วย try/catch แล้วโชว์ error ผ่าน `toast` · core โยน Error พร้อมข้อความเมื่อคำสั่งไม่ถูกต้อง
- **Event stream:** `feed` (ข้อความระบบสำหรับกล่องแชต) และ `lastCast` (แฟลช hotbar) อยู่ใน `gameSignal.ts`
- **ค่าตั้ง UI ต่อเครื่อง:** `prefs.ts` (localStorage `thailnw.ui.v1`): `scale` 0.9–1.25, `muted`, `trackerOpen`, `chatOpen`, `damageNumbers` (all/important/off), `shake` · บนมือถือ chat กับ tracker เปิดได้ทีละอัน
- **ปุ่มลัด:** `src/ui/keybinds.ts` (ตารางเดียว + บันทึก**เฉพาะค่าที่ผู้เล่นเปลี่ยน**) + `hud/hotkeys.ts` (ตัวรับ keydown ตัวเดียวของทั้งเกม) + `hud/KeybindsDialog.tsx`
- **Modal เดิม** (กระเป๋า, ตัวละคร, สัตว์เลี้ยง, ร้าน, แผนที่, เควส, AFK, เลือกอาชีพ) ยังเป็น HTML string ใน `src/ui/UIManager.ts` ผ่าน `<dialog id="modal">` · **Phase 3 คือย้ายทีละหน้าต่างมาเป็น Preact**
- **ฉาก Phaser:** `src/game/scenes/CatacombScene.ts` วาดตัวละครจาก `src/game/PixelSprites.ts` (sprite string rows เขียนเอง) · ตอน dev ใช้ `window.__thailnw.scene` debug ได้

### ไฟล์ UI ที่สำคัญ

| ไฟล์ | หน้าที่ |
| --- | --- |
| `src/ui/theme/tokens.css` | design tokens `--tf-*` + คลาส `.tf-frame .tf-bar .tf-plate .tf-key .tf-title .tf-ornate` |
| `src/ui/theme/elements.ts` | สีตามธาตุสกิล (holy, lightning, arcane, earth, shadow, nature, spirit) |
| `src/ui/components/Frame.tsx` | `Frame` (กรอบไม้/หมึก + มุมลายกนก SVG ต้นฉบับ), `Bar` (HP/XP) |
| `src/ui/hud/hud.css` | layout grid + breakpoint (≤1279, ≤1100, ≤1023, ≤760) + style ของ HUD ทั้งหมด |
| `src/ui/hud/PlayerFrame.tsx` | รูป ชื่อ Lv HP / XP / buff (ไม่มีมานาหรือ SP) |
| `src/ui/hud/TopBar.tsx` | ป้ายชื่อพื้นที่ + QuickSettings (ขนาด UI, เสียง, ตัวเลขดาเมจ, สั่นจอ, เต็มจอ, ปุ่มลัด) + `Purse` |
| `src/ui/hud/Minimap.tsx` | มินิแมพวงกลม (SVG): ห้อง 1–8, ตำแหน่งตอนเดิน, นาฬิกา, ปุ่ม M |
| `src/ui/hud/QuestTracker.tsx` | เป้าหมายห้อง + เควสหลักที่ยังไม่รับรางวัล (`trackedItems()` มี test) |
| `src/ui/hud/Hotbar.tsx` | สกิลเดียวปุ่ม 1, วงคูลดาวน์, auto toggle, ปุ่มเดินหน้าอัตโนมัติ |
| `src/ui/hud/Targets.tsx` | `TargetFrame` + `BossBar` (ระยะ 66/33% เรียกลูกน้องจริง + ตัวนับทุบหนัก) |
| `src/ui/hud/ChatBox.tsx` | แท็บ ทั้งหมด/ทั่วไป/ระบบ/กระซิบ (ตอนนี้มีแค่ "ระบบ") |
| `src/ui/design/DesignDemo.tsx` + `design.html` | หน้า design system (dev เท่านั้น) |
| `src/ui/UIManager.ts` | modal เดิม + เมนูล่าง (`nav`) + toast + แบนเนอร์บอส |

---

## 3. กติกาที่ห้ามละเมิด

1. **กฎเกมทั้งหมดอยู่ใน `src/core`** (ห้าม import DOM/Phaser) · UI แค่อ่าน state และส่ง `Command`
2. ความสุ่มใน core ต้องผ่าน `random(s)` และเวลาต้องใช้ `s.now` (ห้ามใช้ `Math.random()` / `Date.now()` ใน core)
3. **ห้ามเปลี่ยนลำดับการสุ่มในจังหวะศัตรูโจมตี** (`CombatEngine` ส่วน dodge/shield/block) เพราะผลลัพธ์จะเปลี่ยน
4. ถ้าเปลี่ยนรูปแบบเซฟ: เพิ่ม `version` → แก้ `createState` + `validateSave` → เพิ่มขั้นใน `STEPS` ของ `migrateSave()` (`src/services/Storage.ts`) → เขียน test migration
5. timer ใหม่แบบ `*At` และ `cooldowns` ต้องเลื่อนใน `AFKManager.resume()` ด้วย
6. ทุกการแก้ core ต้องมี test (Vitest, deterministic)
7. **UI ใหม่ใช้ Preact + token `--tf-*` เท่านั้น** ห้าม hardcode สีใหม่ถ้ามี token อยู่แล้ว
8. **ปุ่มคีย์บอร์ดทุกปุ่มต้องผ่าน `keybinds.ts` + `hotkeys.ts`** ห้ามเพิ่ม keydown listener แยก · **ห้ามจับ Tab** (ใช้เลื่อนโฟกัส)
9. **ข้อความไทย:** ที่ไหนมี `overflow:hidden` ต้องใช้ `line-height ≥ 1.4` ไม่งั้นวรรณยุกต์จะโดนตัด (เคยเจอแล้ว) · ฟอนต์ Silkscreen ไม่มีอักษรไทย จะ fallback ไปฟอนต์อื่นเอง
10. ทุก element ของ HUD ต้องรองรับ `zoom:var(--tf-ui-scale)` และ**ห้ามทับกัน**ที่ 375 / 768 / 1024 / 1280 / 1920 px (ดูสคริปต์ในหัวข้อ 8)
11. เคารพ `prefers-reduced-motion` และค่า `prefs.shake`
12. localStorage ต้องครอบด้วย try/catch เสมอ (อาจถูกบล็อก) · ห้ามบันทึกค่าเริ่มต้นทั้งก้อน ให้บันทึกเฉพาะที่ผู้เล่นเปลี่ยน
13. ห้ามคัดลอกภาพ/asset จากภาพอ้างอิง (ต้องเป็นงานต้นฉบับ) · ห้ามใส่เนื้อหา NFT/token/wallet
14. สไตล์โค้ดเดิมเป็นแบบอัดแน่นบรรทัดยาว ให้เขียนตามนั้น · comment เฉพาะเหตุผลที่ไม่ชัดจากโค้ด

---

## 4. Core API ที่ UI ใช้

**State (`GameState` ใน `src/core/models.ts`)** — ฟิลด์ที่ UI ใช้บ่อย:
`hero{name,class,level,xp,hp,points,attributes}` · `lm` (สกุลเงิน TH · ชื่อฟิลด์ยังเป็น lm) · `bone` · `inventory: Item[]` (สูงสุด 300) · `chest` (สูงสุด 150) · `equipped: {slot→itemId}` · `floor region room unlocked cleared` · `enemies: Enemy[]` · `target` (0 = อัตโนมัติ) · `cooldowns` / `autoCast` (ต่อ id สกิล) · `shrine` · `pets` / `pet` · `shield` · `kills` / `bosses` · `questClaims` · `afk` · `log` · `respawnAt` / `nextRoomAt` / `travelAt` · `autoAdvance`

**Command** (`store.dispatch`):
`class{value,name?}` · `name{value}` · `allocate{value}` · `equip|forge|salvage|lock{id}` · `claim` · `best` · `seal` · `advance` · `afk` · `pet{value}` · `feed{amount}` · `travel{region}` · `quest{id}` · `buy{offer:'potion'|'cache'}` · `cast{id}` · `autocast{id,value}` · `target{id}`

**Event** (`GameEvent`): `hit` (amount, critical, label = DODGE/SHIELD/BLOCK/SLAM, skill, element) · `skill` · `pet` · `death` · `room` · `log`

**Helper:**
- `Formulas.ts`: `stats(s)` (maxHp, damage, interval, crit, block, dodge, lifeSteal), `itemPower`, `forgeCost`, `salvageValue`, `sealCost`, `xpForLevel`, `regionIndex`, `petXp`
- `Skills.ts`: `skillsFor`, `findSkill`, `readyAt`, `isUnlocked`, `isAuto`, `CLASS_SKILLS`
- `Targeting.ts`: `focusEnemy`, `nextTarget`
- `CombatEngine.ts`: `QUESTS`
- `models.ts`: `MAX_INVENTORY`, `MAX_CHEST`, `REGIONS`, `ROOMS`, `cleanName`, `SLOTS`, `RARITIES`

---

## 5. งานที่เสร็จแล้ว (UI/UX Phase 1–2)

| รหัส | สิ่งที่ได้ |
| --- | --- |
| 1.1 | ติดตั้ง Preact, design tokens, ฟอนต์ไทย (Kanit, Sarabun, Srisakdi) + Silkscreen สำหรับตัวเลข, `Frame`/`Bar`, หน้า `/design.html` |
| 1.2 | Player frame (HP/XP; ตัด SP/MP แล้ว) |
| 1.3 | มินิแมพวงกลม + ปุ่ม M เปิดแผนที่โลก |
| 1.4 | Quest tracker ย่อได้ คลิกแล้วเปิดสมุดภารกิจ |
| 1.5 | Top bar + ตั้งค่าด่วน + Purse |
| 1.6 | Grid + safe area + UI scale 90–125% |
| 2.1 | **ระบบสกิลเดียว/คลาสใน core** (save v5) + Hotbar |
| 2.2 | ตัวเลขดาเมจ v2 (สีตามธาตุ, หลบ/กัน/โล่, ตั้งค่า, จำกัดจำนวน, ซ้อนไม่ทับ) |
| 2.3 | **เลือกเป้าหมายใน core** (save v4) + Target frame + Boss bar + ป้ายชื่อศัตรู + คลิกศัตรูเพื่อเลือก |
| 2.4 | Hit flash, knockback, สั่นจอ, VFX ตามธาตุ |
| 2.5 | ระบบปุ่มลัดกลาง + หน้าต่างเปลี่ยนปุ่ม |
| 2.6 | กล่องแชต/ระบบแบบแท็บ |

ค่าเริ่มต้นปุ่มลัด: `1–5`, `R` = สกิล · `T` = เป้าถัดไป · `X` = เป้าอัตโนมัติ · `I C P B M Q` = กระเป๋า / ตัวละคร / สัตว์เลี้ยง / ร้าน / แผนที่โลก / ภารกิจ

---

## 6. งานถัดไป (Phase 3 → 4)

### Phase 3 — เมนูและการนำทาง (เริ่มตามลำดับนี้)

| รหัส | งาน | รายละเอียดที่ต้องรู้ | เกณฑ์เสร็จ |
| --- | --- | --- | --- |
| **3.1** | แถบเมนูไอคอน + badge | แทน `nav` เดิมใน UIManager (ปุ่มใหญ่ 84 px บังพื้นที่) ด้วยแถวไอคอนเล็กมุมขวาล่าง (แบบภาพอ้างอิง A) · badge: ตัวละครมีแต้มเหลือ (`hero.points`), กระเป๋า/กล่องมีของ (`chest.length`), เควสพร้อมรับ · ป้ายปุ่มลัดอ่านจาก `keybinds` · Loot chest ยังเป็นปุ่มเด่น | ไม่ทับ hotbar/chat ที่ 5 ขนาด · ใช้คีย์บอร์ดได้ครบ |
| **3.2** | ระบบหน้าต่าง (WindowManager) | Preact component เปิดหน้าต่างตาม id · desktop: ลากได้ (จำตำแหน่งใน prefs), เปิดได้ 2 อันพร้อมกัน, Esc ปิดอันบนสุด, focus trap · มือถือ: sheet เต็มจอ · ต้องทำงานกับ `host.toggle(id)` ของ hotkeys · **ย้าย modal จาก UIManager ทีละอัน** (ระหว่างนี้อันที่ยังไม่ย้ายใช้ `#modal` เดิมไปก่อน) | Esc/โฟกัส/ARIA ถูกต้อง · ไม่ขัดกับ `KeybindsDialog` |
| **3.3** | กระเป๋าแบบ grid | ช่องสี่เหลี่ยม + กรอบสีตาม rarity (Common→Mythic) · tooltip เทียบกับของที่ใส่อยู่ช่องเดียวกัน (ใช้ `itemPower`, แสดง +/−) · กรอง slot/rarity, เรียงตามพลัง/ใหม่ · ปุ่ม equip/forge/lock/salvage (คำสั่งเดิม) · claim/equip best · แสดง `x/300` · **virtual list** ต้องลื่นที่ 300 ชิ้น · auto-salvage ตาม rarity **ต้องเพิ่มใน core** (command ใหม่ + setting ใน state + migration v5 + test) หรือแยกเป็นงานย่อยแล้วแจ้ง | 300 ชิ้นไม่หน่วง · ใช้คีย์บอร์ดได้ |
| 3.4 | หน้าตัวละคร paper-doll | 7 ช่องสวมใส่ + สถิติจาก `stats(s)` + ลงแต้ม `allocate` + เปลี่ยนชื่อ (มีอยู่แล้วใน modal เดิม ให้ย้ายมา) | เปลี่ยนของแล้วเห็นตัวเลขเปลี่ยนทันที |
| 3.5 | หน้าทักษะ | รายการ `CLASS_SKILLS` ของคลาส + ปลดล็อก + auto · "ลากลง hotbar" ตอนนี้ slot ผูกกับสกิลตายตัว ถ้าจะให้สลับได้ต้องเพิ่ม `hotbarOrder` ใน core | — |
| 3.6 | สมุดภารกิจ | ตอนนี้มีแค่ `QUESTS` 3 อัน · daily quest ต้องเพิ่มระบบใน core | ติดตามหรือเลิกติดตามแล้ว sync กับ tracker |
| 3.7 | แผนที่โลกแบบกระดาษ | SVG 11 จุดตาม `REGIONS` · ล็อก / ปลด / อยู่ที่นี่ / เคลียร์ (`unlocked`, `cleared`, `regionIndex`) · `travel` (คูลดาวน์ 30 นาที `travelAt`) · `seal` (`sealCost`) · **ชื่อสถานที่ไทยรอการตัดสินใจ U5** | ทุก region คลิกได้ สถานะถูกต้อง |
| 3.8 | หน้าตั้งค่าเต็ม | รวม QuickSettings + ภาษา TH/EN (ต้องทำ i18n ตาม 4.6) + ปุ่มลัด | ค่าที่ตั้งยังอยู่หลัง reload |
| 3.9 | หน้าเลือก/สร้างตัวละคร | ย้ายจาก modal `class` เดิม · การ์ดแบบภาพ A · ช่องชื่อ (`cleanName`) · ใช้ `heroSVG` | — |

### Phase 4 — Polish (ย่อ)
4.1 กรอบ 9-slice ลายไทย (SVG ต้นฉบับ) · 4.2 ชุดไอคอนไทยแทนสัญลักษณ์ Unicode (⚔ ♜ ◇ ฯลฯ) · 4.3 Typography · 4.4 โหมดสี Warm Gold / Spiritual Blue ตามพื้นที่ · 4.5 Motion + เสียง UI · 4.6 i18n (TH เป็นค่าเริ่มต้น; ตอนนี้ข้อความใน core/modal เดิมเป็นภาษาอังกฤษ) · 4.7 QA (contrast AA, focus, screen reader, performance HUD < 2 ms/frame)

---

## 7. ข้อตัดสินใจที่ยังค้าง (ถามเจ้าของงานก่อนทำส่วนที่เกี่ยวข้อง)

| # | เรื่อง | สถานะ |
| --- | --- | --- |
| U2 | จำนวนอาชีพ (ภาพอ้างอิงมี 3/4 แต่เกมมี 5) | ตอนนี้คงไว้ 5 |
| U4 | MP จริง (สกิลใช้ MP) | **ยกเลิกตามคำขอ 17 ต.ค. 2026: ใช้ cooldown อย่างเดียว** |
| U5 | ชื่อ 11 region เป็นภาษาไทยแฟนตาซี | ยังไม่ตั้ง |
| D1 | เปลี่ยน `TH` → Gold | ยังไม่ทำ (P0 ใน ONLINE_PLAN) · UI ยังแสดง TH |
| — | Balance v2 | sim ล่าสุด: Sword ตายบ่อยขึ้น, Axe แซงคลาสอื่น · ยังไม่จูน (ไม่ใช่งาน UI) |

---

## 8. วิธีตรวจงาน

1. `pnpm test` และ `pnpm build` ต้องผ่าน
2. `pnpm dev` แล้วเปิด `http://127.0.0.1:5173/` · console ต้องไม่มี error · **เปิดได้ทีละแท็บ** (มี Web Lock ป้องกันเซฟชนกัน)
3. ตรวจ 5 ขนาด: 375×812, 768×1024, 1024×768, 1280×800, 1920×1080 และที่ UI scale 125%
4. สคริปต์หาการทับกัน (วางใน DevTools console):
```js
(()=>{const sel=['.pf','.tb','.purse','.mm','.qt','.tg','.bb','.hb','.chat','nav','.chest-card','.screen-tools'];
const R=sel.map(s=>{const e=document.querySelector(s);if(!e||getComputedStyle(e).display==='none')return null;const r=e.getBoundingClientRect();return r.width&&r.height?{s,l:r.left,t:r.top,r:r.right,b:r.bottom}:null}).filter(Boolean);
const hits=[];for(let i=0;i<R.length;i++)for(let j=i+1;j<R.length;j++){const a=R[i],b=R[j];if(a.l<b.r&&b.l<a.r&&a.t<b.b&&b.t<a.b)hits.push(a.s+' x '+b.s)}
return {overlaps:hits,offscreen:R.filter(r=>r.l<0||r.t<0||r.r>innerWidth||r.b>innerHeight).map(r=>r.s)}})()
```
(เพิ่ม selector ของหน้าต่างใหม่ลงไปด้วย)
5. ทดสอบคีย์บอร์ด: เลื่อนโฟกัสด้วย Tab ได้ · Esc ปิดหน้าต่าง · ปุ่มลัดไม่ทำงานขณะพิมพ์ในช่องข้อความ
6. อัปเดต `docs/UI_UX_PLAN.md` (ติ๊ก ✅ + รายละเอียด) และเพิ่มบรรทัดใน `docs/HANDOFF.md` หัวข้อ 9

---

## 9. รูปแบบคำตอบที่ต้องการจาก ChatGPT

- แบ่งตามงาน (3.1, 3.2, …) งานละหัวข้อ
- ไฟล์ใหม่ให้เนื้อหา**เต็มไฟล์** · ไฟล์ที่แก้ให้เป็น **unified diff** หรือเต็มไฟล์ถ้าแก้เยอะ (ระบุ path จาก root ให้ชัด)
- test ใหม่ใน `tests/*.test.ts`
- ระบุว่าแก้ core / เซฟหรือไม่ ถ้าแก้ ให้บอกเวอร์ชันใหม่และ migration
- รายการสิ่งที่ยังไม่ได้ตรวจ (เช่น ยังไม่ได้รันในเบราว์เซอร์) ให้บอกตรง ๆ

---

## 10. ไฟล์ใน zip

`docs/HANDOFF_UIUX_CHATGPT.md` (ไฟล์นี้) · `docs/UI_UX_PLAN.md` · `docs/HANDOFF.md` · `docs/ONLINE_PLAN.md` · `docs/ARCHITECTURE.md` · `CLAUDE.md` · `package.json` · `tsconfig.json` · `vite.config.ts` · `index.html` · `design.html` · `src/**` · `tests/**` · `references/*.webp` (ภาพอ้างอิง)

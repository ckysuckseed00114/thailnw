# Embermarch — เอกสารส่งต่องาน (Handoff)

> อ่านไฟล์นี้ก่อนเริ่มงานทุกครั้ง แล้ว **อัปเดตหัวข้อ "สถานะล่าสุด" และ "บันทึกการส่งต่อ"** ก่อนจบงาน
> ตรวจล่าสุด: 2026-10-17
> **กติกาปัจจุบัน:** ดู [GAMEPLAY_UPDATE_2026-10-17.md](GAMEPLAY_UPDATE_2026-10-17.md) ก่อนอ่านบันทึกเก่าที่อาจกล่าวถึง 6 สกิล/MP/5 ห้อง

## 1. ภาพรวม

เกม idle dungeon crawler (แนว LootMarch) เล่นในเบราว์เซอร์ ทำงานแบบ local อย่างเดียว ไม่มี backend
- **Stack:** TypeScript 5.9 (strict) · Vite 7 · Phaser 3.90 · Vitest 3 · pnpm
- **Git:** repo local บน branch `main` · ตั้ง `origin` = `github.com/ckysuckseed00114/embermarch` แล้ว แต่ **push ยังไม่สำเร็จ** (GitHub ตอบว่า "Repository not found" ให้เช็กชื่อ repo/บัญชี) · baseline commit วันที่ 2026-10-17 · ติดตั้ง Git ไว้ที่ `C:\Program Files\Git` ถ้า shell เดิมหา `git` ไม่เจอ ให้เปิด terminal ใหม่

```powershell
pnpm install
pnpm dev      # http://127.0.0.1:5173/  (ต้องเป็น localhost/HTTPS เพราะใช้ Web Locks)
pnpm test     # vitest — 105 tests
pnpm build    # tsc --noEmit + vite build → dist/
```

## 2. โครงสร้างและหน้าที่ของแต่ละไฟล์

```
index.html                 entry ของ Vite (#app)
src/main.ts                boot, Web Lock กันเปิดหลายแท็บ, tick loop 100ms, autosave 5s, offline resume
src/core/                  ★ กฎเกมทั้งหมด — ห้าม import DOM/Phaser
  models.ts                type ทั้งหมด: GameState, Command, GameEvent, ค่าคงที่ (CLASSES, SLOTS, RARITIES, REGIONS, SKILLS, ROOMS=8)
  GameState.ts             createState() เซฟเริ่มต้น · interface Authority · Store (pub/sub)
  CombatEngine.ts          Authority ตัวจริง: tick() เป็น substep 50ms, dispatch(Command) ทุก action ของผู้เล่น, QUESTS
  Formulas.ts              สูตร stats/XP/forge/salvage/seal/monster
  DropTable.ts             PRNG xorshift (random) + สุ่มไอเทม (drop)
  AFKManager.ts            offlineReward() + resume() (เลื่อน timer ทุกตัวตามเวลาที่หายไป)
  Targeting.ts             เป้าหมายที่ใช้ตีจริง (`focusEnemy`: ตัวที่ผู้เล่นเลือก ไม่งั้นตัวหน้าแถว) + `nextTarget`
  Skills.ts                สกิลเดียวต่อคลาส (ปุ่ม 1, cooldown 7 วิ), helper (`skillsFor`, `readyAt`, `isAuto`)
  RoomTraversal.ts         ROOM_TRAVERSE_MS=3000 และเส้นทางเดินข้ามห้อง (ใช้ร่วม core กับ renderer)
src/game/                  ★ presentation อย่างเดียว — ห้ามตัดสินดาเมจ/ของดรอป/เงิน
  scenes/CatacombScene.ts  Phaser scene เดียวที่ใช้งาน: ห้อง 3 ส่วนวนกัน, actor, เลขดาเมจ/ฮีล, วงเตือนบอส, ป้ายชื่อ, กล้อง
  PixelSprites.ts          ข้อมูล pixel art แบบโค้ด: ฮีโร่เดิม 5 อาชีพ, อาวุธ, มอน 3 แบบ + บอส (Sword/Spear/Axe ในเกมใช้ PNG แล้ว)
  SwordArt.ts              path/ขนาด/จุดยึดภาพ Sword ใหม่จาก PixelLab
  SpearArt.ts              path/ขนาด/จุดยึดภาพ Spear + เฟรม idle/walk/attack
  AxeArt.ts                path/ขนาด/จุดยึดภาพ Axe + เฟรม walk/attack
  HeroArt.ts               HERO_DESIGNS + heroSVG() ใช้ PNG Sword/Spear/Axe ใน HUD/roster
src/ui/
  UIManager.ts             modal ทั้งหมด + HUD ส่วนที่เหลือ (HTML string), คีย์ลัด I/C/P/B/M/Q (M = แผนที่โลก)
  theme/tokens.css         ★ design tokens ธีม Thai Fantasy (`--tf-*`) + คลาส .tf-frame/.tf-bar/.tf-plate/.tf-key
  components/Frame.tsx     Preact: Frame (กรอบไม้/หมึก + มุมลายกนก SVG), Bar (HP/XP)
  hud/                     HUD v2 (Preact, CSS grid): Hud.tsx mount, gameSignal.ts (state → signal), prefs.ts (ขนาด UI/เสียง/tracker ใน localStorage `embermarch.ui.v1`), PlayerFrame, TopBar (+Purse, QuickSettings), Minimap, QuestTracker, hud.css
  design/DesignDemo.tsx    หน้า design system (dev เท่านั้น: http://127.0.0.1:5173/design.html)
  ui/hud/                  Preact HUD (PlayerFrame, Hotbar, Minimap, …)
src/services/
  Storage.ts               LocalSaveRepository (key `embermarch.save.v1`) + validateSave()
  SoundFX.ts               เสียงสังเคราะห์ด้วย Web Audio (ไม่มีไฟล์เสียง)
src/styles/                base.css · characters.css · ui/hud/hud.css
tests/                     Vitest 105 tests รวม core/traversal/sprites/UI และ integrity ของ Sword/Spear/Axe PNG
public/assets/sword-veteran/  Sword PNG จาก PixelLab: portrait, idle, walk 5 เฟรม, attack 5 เฟรม
public/assets/spear-lancer/   Spear PNG: portrait, idle 5, walk 5, thrust 5 เฟรม
public/assets/axe-veteran/    Axe PNG: portrait, idle, walk 5, cleave 5 เฟรม
demos/lootmarch-enhanced/  prototype แยกต่างหาก (เปิด index.html ตรง ๆ ได้) ไม่ถูก build
docs/                      เอกสารออกแบบ (ดูตารางข้อ 7)
artifacts/                 ภาพหน้าจอ/ภาพทดสอบ ไม่ถูก build
.mcp.json                  เชื่อม PixelLab MCP (ดูข้อ 5)
```

## 3. การไหลของข้อมูล (กฎที่ห้ามทำลาย)

```
คลิก/คีย์ใน HTML → Store.dispatch(Command) → CombatEngine.dispatch → แก้ GameState
main.ts setInterval 100ms → Store.tick(ms) → CombatEngine.tick → GameEvent[]
Store.notify(state, events) → UIManager (HUD)  +  CatacombScene (วาด)  +  SoundFX
```

1. **กฎเกมอยู่ใน `src/core` เท่านั้น** — renderer/UI แค่อ่าน state แล้ววาด ถ้าจะเพิ่มกลไกใหม่ ให้เพิ่ม `Command` ใน `models.ts` → จัดการใน `CombatEngine.dispatch` → เขียน test
2. **ความสุ่มต้องผ่าน `random(s)`** ใน DropTable (seed อยู่ในเซฟ) ห้ามใช้ `Math.random()` ใน core ไม่งั้น test ไม่ deterministic
3. **เวลาใน core ใช้ `s.now`** ไม่ใช่ `Date.now()` (ยกเว้น main.ts ตอน resume)
4. **เปลี่ยนรูปแบบเซฟ** → แก้ `createState` + `validateSave` แล้วเพิ่มขั้นใน `STEPS` ของ `migrateSave()` (Storage.ts) พร้อม test · ตอนนี้ **`version:5`** (v1→v2 เพิ่มชื่อ, v2→v3 cooldown, v3→v4 target, v4→v5 สกิลเดียว/8 ห้อง/boss summons) ตอนโหลดจะ migrate ใน memory และเก็บเซฟเดิมครั้งเดียว · ชื่อ key `embermarch.save.v1` เป็นแค่ชื่อช่องเก็บ ไม่ใช่เวอร์ชัน ถ้าเซฟไม่ผ่าน validation เกมจะหยุดและไม่ลบเซฟ
5. timer ใหม่ใน state (`xxxAt`) ต้องเพิ่มใน `resume()` ของ AFKManager ด้วย ไม่งั้นจะเพี้ยนหลังกลับมาจาก offline

## 4. ระบบเกมสรุปสั้น

- 5 อาชีพ: Sword, Spear, Wand, Axe, Dagger; คลาสละ 1 สกิล cooldown 7 วินาที ไม่มีมานา (Sword/Spear/Wand ตีทั้งแถว, Axe มี stun)
- 11 region ต่อ floor, region ละ 8 ห้อง (7 ห้องมอน 3 ตัว + ห้องบอส) ข้ามห้องใช้เวลา 3 วินาที (เดิม 6.5)
- บอสเรียกผู้คุ้มกันที่ HP 2/3 และ 1/3 แต่ยังตีต่อ; ตัวละครมีโอกาสหลบการโจมตีปกติและแสดงท่าถอย/กระโดด
- ตายแล้วเกิดใหม่ใน 3 วินาทีที่ห้อง 1 · Seal เปิด floor ถัดไป
- ไอเทม 7 slot × 6 rarity, forge / salvage / lock / equip best · สัตว์เลี้ยง 4 ตัว · shrine 4 แบบ · quest 3 อัน · shop
- รางวัลตอน offline: 75% ของอัตราเฉลี่ย 24 ชม. สูงสุด 8 ชม. ต้องกด claim
- สูตรตัวเลขละเอียดอยู่ใน [ARCHITECTURE.md](ARCHITECTURE.md)

## 5. การเชื่อม PixelLab (สร้าง pixel art)

- `.mcp.json` ชี้ไปที่ `https://api.pixellab.ai/mcp` ใช้ token จาก environment variable ระดับผู้ใช้ชื่อ **`PIXELLAB_API_TOKEN`** (ไม่มี key อยู่ในไฟล์โปรเจกต์)
- เครื่องใหม่: ตั้งค่า `PIXELLAB_API_TOKEN` แล้วเปิด Claude Code session ใหม่ จากนั้นอนุมัติ MCP server `pixellab`
- REST: `https://api.pixellab.ai/v2` (ใช้ header `Authorization: Bearer <token>`) · เช็กเครดิตที่ `GET /v2/balance` · คู่มือ: https://api.pixellab.ai/mcp/docs
- token ที่ผู้ใช้ระบุล่าสุดตรงกับ `PIXELLAB_API_TOKEN` ใน Windows User environment ที่ตั้งไว้ก่อนหน้าแล้ว; trial เหลือ 27/40 generations และเครดิต USD 0 หลังสร้าง Axe/Spear (ตรวจ 2026-10-17); เปิดโปรแกรม/terminal ใหม่เพื่อให้ MCP อ่าน environment ล่าสุด
- **ห้ามเรียก PixelLab จากโค้ดฝั่ง browser** ให้สร้าง asset ไว้ล่วงหน้าแล้วเก็บใน `public/assets/`

## 6. สถานะล่าสุด (2026-10-17)

**อัปเดตฉากและศัตรู:** กล้อง desktop ถอยออกตามสัดส่วนหน้าจอเพื่อเห็นห้องและทางเชื่อมกว้างขึ้น (จอสูงยังรักษาขนาดตัวละคร) · ขยาย sprite ศัตรูเล็กน้อยให้ยังอ่านได้ · มอนสเตอร์แต่ละชนิดมีจังหวะเคลื่อน/หายใจ/กะพริบตาต่างกัน, บอสมีท่าเตรียมทุบและคำรามเมื่อเรียกผู้คุ้มกัน · ทั้งหมดอยู่ใน renderer `CatacombScene.ts`; combat core และเซฟไม่เปลี่ยน · ภาพตรวจ desktop `artifacts/wider-dungeon-lively-enemies.png` · เล่นจริงผ่านหลายห้องและบอส ไม่มี console error ในแท็บทดสอบใหม่

**อัปเดตกระเป๋ารอบ 2:** แยกของสวมใส่ออกจาก grid และความจุกระเป๋า (ยังเก็บใน `inventory` ภายในเพื่อคงเซฟเดิม), กดช่องอุปกรณ์เพื่อดูรายละเอียด/ถอดได้; ถอดไม่ได้เมื่อกระเป๋าเต็ม · เหลือ 4 หมวด ทั้งหมด/อุปกรณ์สวมใส่/วัสดุ/กล่องสมบัติ · วัสดุแสดง Bone และเงิน $LM ตามข้อมูลเกมที่มีจริง · กล่องสมบัติแสดงของที่รอรับและรับได้จากแท็บนั้น · ปรับโทน UI เป็น dark fantasy แบบอ่านง่าย · ภาพ `artifacts/inventory-ui-modern.png` · เพิ่มคำสั่ง `unequip` โดยไม่เปลี่ยนรูปแบบเซฟ · test 109/109 และ build ผ่าน

**อัปเดตกระเป๋า:** ปรับหน้าต่างกระเป๋าตามภาพอ้างอิงเป็น 3 คอลัมน์: ตัวละครและช่องสวมใส่, ช่องไอเท็มพร้อมกรอง/ค้นหา, และรายละเอียดไอเท็มที่เลือกพร้อมปุ่มคำสั่งเดิม (`src/ui/inventoryView.ts`, `src/ui/inventory.css`, `UIManager.ts`) · ใช้ข้อมูลเซฟและ core เดิม ไม่มีการเปลี่ยนกฎเกมหรือรูปแบบเซฟ · ภาพตรวจหน้าจอ desktop: `artifacts/inventory-ui-reference.png` · ยังไม่ได้ตรวจภาพบน viewport มือถือจริง

| ตรวจ | ผล |
| --- | --- |
| `pnpm test` | ✅ 109/109 ผ่าน |
| `node node_modules/typescript/bin/tsc --noEmit` + `node node_modules/vite/bin/vite.js build` | ✅ ผ่าน · Phaser chunk 1.2 MB / 332 KB gzip (มี warning chunk ใหญ่ ซึ่งเป็นเรื่องปกติ) |
| ทดสอบในเบราว์เซอร์ (port 5180/5181, เซฟแยก) | ✅ เลือก Axe/Spear, ภาพหน้า roster/HUD/ฉาก, เฟรมยืน/เดิน/โจมตี, จอมือถือ 390×844 · ไม่มี console error; ภาพ `artifacts/axe-veteran-roster.png`, `artifacts/axe-veteran-in-game.png`, `artifacts/spear-lancer-roster.png`, `artifacts/spear-lancer-in-game.png` |

**เสร็จแล้ว:** core ครบระบบ local · HUD แบบ immersive · เมนู dock พับเก็บ/ย้าย/ย่อหน้าต่าง/ดูดขอบได้ · Sword/Spear/Axe ใหม่จาก PixelLab ใช้ PNG ในฉากและ HUD จริง; Spear มี idle/walk/thrust, Axe มี idle/walk/cleave, Sword มี idle/walk/slash · Wand/Dagger ยังใช้ pixel code เดิม · มอน 3 แบบ + บอส · เลขดาเมจ/ฮีล · วงเตือนบอส slam · บอสเรียกลูกน้องตาม HP โดยยังโจมตีต่อ · หลบแล้วถอย/กระโดด · ห้องเชื่อมต่อกัน 8 ห้องต่อ region · เสียง Web Audio

**ข้อสังเกต / ความเสี่ยง**
- ยังไม่มี remote/backup นอกเครื่อง (ยังไม่ได้ติดตั้ง `gh`)
- เคยเจอบั๊กจอดำ: ถ้า Phaser boot ตอน `#game` มีขนาด 0 (เช่น tab เปิดอยู่เบื้องหลัง) WebGL จะ error `Framebuffer status: Incomplete Attachment` แล้วไม่ฟื้น ตอนนี้แก้แล้วใน `main.ts` ให้รอจน `#game` มีขนาดจริงก่อนสร้าง Phaser (ใช้ ResizeObserver) แต่กรณีขนาด 0 ยังไม่ได้ทดสอบซ้ำในเบราว์เซอร์
- `.claude/launch.json` (`embermarch-dev`) รัน dev server ที่ port 5176 เพื่อให้ทดสอบโดยไม่ทับเซฟจริงที่ port 5173
- โค้ดเขียนแบบอัดแน่นหนึ่งบรรทัดยาว (UIManager 22 KB, CatacombScene 19 KB, characters.css ทั้งไฟล์อยู่บรรทัดเดียว) ทำให้ diff/review ยาก ถ้าจะแก้ให้ใช้รูปแบบเดิม หรือตกลงกันก่อนว่าจะ format ใหม่
- มี smoke test ของ shell/dock แล้ว แต่ยังไม่มี automated visual regression ของ Phaser และไม่มี test ของ Web Lock
- Marketplace มีปุ่มอยู่แต่ตั้งใจปิดไว้ (เงินจำลองเท่านั้น ห้ามผูกกับ wallet/token จริง ดูเหตุผลใน ARCHITECTURE.md)
- ฟอนต์ Silkscreen โหลดจาก Google Fonts ถ้าออฟไลน์จะใช้ monospace แทน และฟอนต์นี้ไม่มีอักษรไทย ชื่อไทยบนป้ายจึงใช้ฟอนต์ระบบ
- shell นี้เรียก `pnpm test/build` แล้ว pnpm พยายามติดตั้ง dependency ใหม่และหยุดเพราะไม่มี TTY; เรียก binary ใน `node_modules` โดยตรงได้และผ่านครบ
- ภาพ Sword/Spear/Axe ในเกมใช้อนิเมชันทิศ south-east และพลิกภาพเมื่อหันซ้าย; ข้อมูล 8 ทิศอยู่ใน ZIP แต่ยังไม่ผูกกับระบบหันหลายทิศจริง (Spear ภาพด้าน east ถูกตัดปลายหอก จึงใช้ south-east)
- ตอนเริ่มงานรอบนี้ working tree มีการแก้ไฟล์/ลบไฟล์หลายรายการค้างอยู่แล้ว (รวม `UIManager.ts`, เอกสาร, package/lockfile) จึงยังไม่ commit เพื่อไม่รวมงานก่อนหน้าที่ไม่ได้ตรวจขอบเขตไว้ใน commit เดียว
- ภาพ Sword เดิมย้ายไปไว้ที่ `artifacts/sword-source-v1.png` แล้ว (ไม่ถูก build) และ `SwordSprite.ts` ถูกลบ (ถ้าต้องการกู้คืน ดูได้ใน git ที่ commit f51180b)

**งานถัดไปที่แนะนำ**
1. ตั้ง remote (เช่น GitHub private repo) แล้ว push
2. เพิ่มภาพแบบเดียวกันให้ Wand/Dagger และทำบอสหลายแบบตาม region
3. ปรับสมดุลเกมช่วง floor สูง (ยังไม่เคยทดสอบ) และทำ export/import เซฟ

## 7. เอกสารอื่น

| ไฟล์ | เนื้อหา |
| --- | --- |
| [HANDOFF_UIUX_CHATGPT.md](HANDOFF_UIUX_CHATGPT.md) | ★ เอกสารส่งต่องาน UI/UX ให้ AI/ทีมอื่น (อ่านเข้าใจได้โดยไม่ต้องมีบริบทอื่น) |
| [SWORD_PIXELLAB_V2.md](SWORD_PIXELLAB_V2.md) | ★ รายละเอียดการสร้าง/ใช้ Sword ใหม่, PixelLab job IDs, ไฟล์ภาพ, ข้อจำกัด |
| [AXE_PIXELLAB_TEST.md](AXE_PIXELLAB_TEST.md) | ★ Axe จากคลิปอ้างอิง, เฟรมเดิน/Cleave, วิธีทดสอบ |
| [SPEAR_PIXELLAB_TEST.md](SPEAR_PIXELLAB_TEST.md) | ★ Spear จาก prompt ล่าสุด, เฟรม idle/walk/thrust, วิธีทดสอบ |
| [UI_UX_PLAN.md](UI_UX_PLAN.md) | ★ แผน UI/UX ธีม Thai Fantasy: แยก component, 4 เฟส, รหัสงาน 1.1–4.7, ข้อตัดสินใจ U1–U6 |
| [ONLINE_PLAN.md](ONLINE_PLAN.md) | ★ แผนเปลี่ยนเป็นเกมออนไลน์: ตัด NFT/Token, Balance v2 (ตัวเลข baseline จาก sim), UI/UX ใหม่, สถาปัตยกรรม server, roadmap, ข้อตัดสินใจ D1–D8 |
| [ARCHITECTURE.md](ARCHITECTURE.md) | ขอบเขตแต่ละชั้น, สูตรทั้งหมด, ค่า balance, แนวทางย้ายขึ้น server |
| [VALIDATION.md](VALIDATION.md) | ประวัติการตรวจแต่ละรอบ |
| [CHARACTERS_AND_CONNECTED_ROOMS.md](CHARACTERS_AND_CONNECTED_ROOMS.md) | ดีไซน์ 5 อาชีพ + ลำดับการข้ามห้อง (TH) |
| [SWORD_SPRITE_INTEGRATION.md](SWORD_SPRITE_INTEGRATION.md) | (เลิกใช้แล้ว) การตัดเฟรม sprite ของ Sword แบบเดิม |
| [GAME_STRUCTURE_DOCS.md](GAME_STRUCTURE_DOCS.md) | data model ตามสเปกต้นฉบับ |
| [CHARACTER_DESIGN_DOCS.md](CHARACTER_DESIGN_DOCS.md) | art direction |
| [LOOTMARCH_DOCS.md](LOOTMARCH_DOCS.md) · [LOOTMARCH_VS_CODEX_COMPARISON.md](LOOTMARCH_VS_CODEX_COMPARISON.md) · [CODEX_PROMPT.md](CODEX_PROMPT.md) | เอกสารอ้างอิงเกมต้นแบบและ prompt เดิม |

## 8. Checklist ก่อนส่งต่องาน (ทำทุกครั้ง)

- [ ] `pnpm test` และ `pnpm build` ผ่าน (แปะจำนวน test ในข้อ 6)
- [ ] ถ้าแก้ UI/renderer: เปิด `pnpm dev` ลองเล่นจริง ดู console ว่าไม่มี error และเช็กจอมือถือ
- [ ] อัปเดตข้อ 6 (เสร็จแล้ว / ความเสี่ยง / งานถัดไป) และเพิ่มบรรทัดในข้อ 9
- [ ] ถ้าเปลี่ยนสูตรหรือค่า balance → อัปเดต ARCHITECTURE.md
- [ ] ถ้าเปลี่ยนรูปแบบเซฟ → bump version + migration + test
- [ ] ห้าม commit/เขียน API token ลงไฟล์
- [ ] commit งานพร้อม message ที่บอกว่าเปลี่ยนอะไร

## 9. บันทึกการส่งต่อ (ใหม่สุดอยู่บน)

- **2026-10-18 (25)** — แก้ฮีโร่ "วาร์ป" ข้ามโถงในห้องเดียวกัน: พุ่งเข้าหาเฉพาะระยะ ≤ 240 px (`DASH_MAX`) โดยเวลาพุ่งขึ้นกับระยะ · ถ้าไกลกว่านั้นจะวิ่ง (430 px/วิ) · ท่าฟันระยะประชิด (ทั้งฮีโร่และมอน) เล่นเฉพาะตอนอยู่ในระยะ แต่ตัวเลขดาเมจยังขึ้น · วัดในเบราว์เซอร์แล้ว ขยับสูงสุด 18 px/เฟรม (เดิมราว 40–50) · แสดงผลอย่างเดียว
- **2026-10-17 (24)** — บอสใหม่ "The Hollow Warden" (ยักษ์ผู้พิทักษ์วัด) จาก PixelLab: ยืน/เดิน/ทุบพื้น/เรียกผู้คุ้มกัน นำเข้าฉากแล้ว (`BossArt.ts`, `public/assets/hollow-warden/`) · ใช้ 15 generations (เหลือ 12) · เก็บสคริปต์ PixelLab ที่ใช้ซ้ำได้ใน `tools/pixellab/` · ดู [BOSS_PIXELLAB.md](BOSS_PIXELLAB.md) · test 111/111
- **2026-10-17 (23)** — เปลี่ยน PixelLab API key เป็นตัวใหม่ใน env `PIXELLAB_API_TOKEN` (ไม่อยู่ใน repo)
- **2026-10-17 (22)** — แก้ปัญหาโถงซ้ายว่าง: ฮีโร่เข้าห้องที่ปากโถงซ้าย (`ROOM_ENTRY_X=250` ใน `RoomTraversal.ts`, ปรับ `TRAVERSE_BREAKS`) · มอนตัวหน้าอยู่โถงซ้าย ที่เหลืออยู่โถงขวา (`spawnSpot` ใน `CatacombScene.ts`) · มอนที่อยู่ไกลกว่า 300 px และไม่ถูกเล็งจะเดินวนในโถงตัวเอง · ฮีโร่เดินไปหาเป้าที่เลือก (`focusEnemy`) แทนตัวแรกในรายการ · แสดงผลอย่างเดียว ไม่เปลี่ยนกฎ/เซฟ · test 109/109, ตรวจเบราว์เซอร์แล้ว · commit รวมกับงานรอบ (13)–(20) ใน `38ccd50`
- **2026-10-17 (21)** — ลดเวลาเดินข้ามห้องจาก 6.5 เป็น 3 วินาที (commit `435aa28`)
- **2026-10-17 (20)** — ขยายมุมมองแผนที่ผ่านกล้องตามอัตราส่วนจอ; เพิ่มการขยับเฉพาะชนิด กะพริบตา ท่าเตรียมโจมตี การพุ่งโจมตี และท่าเตรียมทุบ/เรียกผู้คุ้มกันของบอสใน `CatacombScene.ts` · ไม่เปลี่ยนผลต่อสู้หรือรูปแบบเซฟ · test 109/109, build ผ่าน
- **2026-10-17 (19)** — ปรับกระเป๋าตาม feedback: ของสวมใส่หายจากรายการกระเป๋าแต่กดตรวจได้จากช่องสวมใส่, ถอดได้, แท็บ 4 หมวด, วัสดุ/กล่องสมบัติ, รูปลักษณ์ใหม่; เพิ่ม test การถอดและสลับแท็บ, ตรวจเบราว์เซอร์ desktop · ภาพ `artifacts/inventory-ui-modern.png`
- **2026-10-17 (18)** — ออกแบบหน้ากระเป๋าตามภาพอ้างอิง: paper doll + 7 ช่องสวมใส่, grid rarity, filter/search, inspector และปุ่ม equip/forge/lock/salvage/claim/best ที่เชื่อม core เดิม · ตรวจในเบราว์เซอร์ desktop และ console ไม่มี error · ภาพ `artifacts/inventory-ui-reference.png` · ไม่เปลี่ยนเซฟหรือกฎเกม
- **2026-10-17 (17)** — สร้าง Spear ด้วย PixelLab (API key ล่าสุดตรงกับที่ตั้งไว้) ตาม prompt side-scrolling/GBA: เกราะทอง-แดงเข้ม, ผ้าคลุมมืด, หอกประดับ; idle/walk/thrust อย่างละ 5 เฟรม, portrait HUD/roster, นำเข้าฉากจริง · ใช้ south-east เพื่อเก็บหอกครบ · ดู [SPEAR_PIXELLAB_TEST.md](SPEAR_PIXELLAB_TEST.md) · test 105/105, TypeScript/build, desktop/mobile browser ผ่าน
- **2026-10-17 (16)** — ดูวิดีโออ้างอิงของผู้ใช้แล้วสร้าง Axe ผู้ใหญ่เกราะทอง/เหล็ก ผ้าคลุมน้ำเงิน ขวานสองคมจาก PixelLab; walk/cleave 5 เฟรม + portrait UI ใช้จริงในเกม · ดู [AXE_PIXELLAB_TEST.md](AXE_PIXELLAB_TEST.md) · test 103/103 ณ รอบนั้น, desktop/mobile ผ่าน
- **2026-10-17 (15)** — เชื่อม PixelLab API ด้วย token ใน Windows User environment (ไม่เก็บใน repo), สร้าง Sword สัดส่วนผู้ใหญ่ เกราะทอง/ผ้าคลุมน้ำเงิน 8 ทิศทาง + เดิน/ฟันอย่างละ 5 เฟรม; นำ PNG เข้า Phaser และ portrait/roster พร้อมแก้การจัดแนวเฟรม 88×88 และหน้า roster ไม่ให้ถูกตัดขอบ · ดู [SWORD_PIXELLAB_V2.md](SWORD_PIXELLAB_V2.md) · test 101/101, TypeScript/build, desktop/mobile browser ผ่าน
- **2026-10-17 (14)** — เพิ่ม dock เมนูบน HUD ล่าสุด: พับ/ขยาย, ย้ายชิดซ้าย-กลาง-ขวา, จำค่าใน `embermarch.dock.v1`; หน้าต่างเมนูเปิดแบบไม่หยุดฉาก, ย่อเข้า dock และเรียกคืน, ลากหัวหน้าต่างหรือกดปุ่มดูดเข้าขอบจอ; มือถือเป็นแถบไอคอนเลื่อนแนวนอน · ไม่เปลี่ยนกฎเกม/เซฟ · เพิ่ม shell interaction test · test 99/99, build และ browser desktop/mobile ผ่าน
- **2026-10-17 (13)** — ปรับเกมเพลย์ตามคำขอ: 1 สกิล/อาชีพ, cooldown อย่างเดียว ไม่มี SP/MP, หลบโจมตีปกติแล้วแสดงท่าถอย, 8 ห้อง/region, บอสเรียกลูกน้อง 2 เฟสโดยยังโจมตีและถูกเลือกเป้าได้, save v5 + migration; ดู [GAMEPLAY_UPDATE_2026-10-17.md](GAMEPLAY_UPDATE_2026-10-17.md) · test 97/97, TypeScript/build ผ่าน, browser smoke ผ่าน
- **2026-10-17 (12)** — ส่งต่องาน UI/UX ให้ ChatGPT: [HANDOFF_UIUX_CHATGPT.md](HANDOFF_UIUX_CHATGPT.md) (มี prompt พร้อมวาง, สถาปัตยกรรม UI, กติกา, core API, งานที่เสร็จ/เหลือ, วิธีตรวจ) + `handoff/embermarch-uiux-handoff.zip` (สร้างใหม่ได้, ไม่ commit) · งานต่อไปของผู้รับคือ Phase 3 เริ่มที่ 3.1–3.3
- **2026-10-17 (11)** — UI/UX Phase 2 ครบ (2.3–2.5): เลือกเป้าหมายได้ (คลิกศัตรู / T / X) ซึ่งใช้กับการตีปกติ สกิลเป้าเดี่ยว และสัตว์เลี้ยง · ถ้าไม่เลือกจะทำงานแบบเดิมทุกอย่าง · save v4 · Target frame + Boss bar ใหม่ (ระยะ + ตัวนับทุบหนัก) แทน boss-hud เดิม · ป้ายชื่อศัตรู · hit flash / knockback / สั่นจอ (ปิดได้) / VFX ตามธาตุ · ระบบปุ่มลัดกลาง + หน้าต่างเปลี่ยนปุ่ม (บันทึกเฉพาะที่เปลี่ยน) · มือถือ: แชตกับ tracker เปิดได้ทีละอัน · hook debug `window.__embermarch` (มีแค่ตอน dev) · test 101 · ตรวจไม่ทับกันครบทุกขนาด
- **2026-10-17 (10)** — UI/UX 2.1 / 2.2 / 2.6: **ระบบสกิลใหม่ใน core** (6 สกิล/คลาส, คูลดาวน์แยกต่อสกิล, `cast`/`autocast`, save v3 + backup-v2) · event จาก `dispatch` ไม่หายแล้ว (`tick` คืน event ที่สะสมไว้) · core บอกเหตุผลที่หลบได้ DODGE/SHIELD/BLOCK โดยลำดับการสุ่มเหมือนเดิม · Hotbar (ปุ่ม 1–5/R + auto + เดินหน้าอัตโนมัติ แทน battle-footer เดิม) · ตัวเลขดาเมจตามธาตุ + ตั้งค่า + จำกัดจำนวน · กล่องแชต/ระบบแบบแท็บ · toast ย้ายขึ้นไม่ทับ hotbar · ตรวจไม่ทับกันที่ 375/768/1024/1280/1920 · test 88 · **balance sim (seed เดียว):** ความเร็วโดยรวมใกล้เดิม แต่ Sword ตายเพิ่มจาก 901 เป็น 1,809 ครั้งใน 12 ชม. และ Axe แซงคลาสอื่น (region 26 vs 21–23 ใน 3 ชม.) → ต้องจูนใน Balance v2
- **2026-10-17 (9)** — UI/UX Phase 1 ครบ (1.4–1.6): Quest tracker (ย่อได้, คลิกเปิดสมุดภารกิจ, มือถือเริ่มแบบย่อ) · Top bar ชื่อพื้นที่ + ตั้งค่าด่วน (ขนาด UI 90–125%, เสียง, เต็มจอ) · Purse · HUD เปลี่ยนเป็น CSS grid + safe area (`viewport-fit=cover`) · ซ่อน DOM เดิม (dungeon-title, header, room-objective, shrine-card) · ตรวจไม่ทับกันที่ 375/768/1280/1920 ทั้งที่ 100% และ 125% · test 69 · JS app 100 KB (38 KB gzip)
- **2026-10-17 (8)** — UI/UX งาน 1.1–1.3 เสร็จ: ติดตั้ง Preact 10 + @preact/signals (JSX ผ่าน tsconfig `jsxImportSource`) · design tokens + ฟอนต์ไทย (Kanit/Sarabun/Srisakdi) · Frame/Bar component · HUD v2 แทนการ์ดเดิม: Player frame (รูป, ชื่อ, Lv, HP, **SP = ชาร์จสกิล ยังไม่ใช่ MP**, XP, buff ศาลเจ้า/โล่/สัตว์เลี้ยง) + มินิแมพวงกลม (node ห้อง, ตำแหน่งตอนเดิน, นาฬิกาจาก `s.now`, M เปิดแผนที่โลก) · หน้า `/design.html` · แก้ปัญหาวรรณยุกต์ไทยโดนตัด (line-height) · test 66 · ทดสอบ desktop+mobile แล้วไม่มี error · JS app 64→94 KB
- **2026-10-17 (7)** — ได้ภาพอ้างอิง UI แนว Thai Fantasy MMORPG 2 ชุด ("The Shattered Siam" pixel โทนมืด, "Siam Spirit Chronicles" chibi สว่าง) → เขียน [UI_UX_PLAN.md](UI_UX_PLAN.md): แยก component เทียบกับโค้ดปัจจุบัน, 4 เฟส 28 งาน (มีรหัสงาน), palette/ฟอนต์ไทย, ข้อตัดสินใจ U1–U6 (สไตล์ผสม, คง 5 อาชีพ, hotbar+auto, เพิ่ม MP, ชื่อสถานที่ไทย, Preact) · ยังไม่ได้เริ่มเขียนโค้ด
- **2026-10-17 (6)** — ทิศทางใหม่: เปลี่ยนเป็นเกมออนไลน์และตัด NFT/Token ทั้งหมด → เขียน [ONLINE_PLAN.md](ONLINE_PLAN.md) (ยังเป็นร่าง รอยืนยัน D1–D8) · balance baseline จาก sim 12 ชม.: Floor 1 จบใน 8 นาที, ตาย 901 ครั้ง, forge โตแบบทวีคูณ (สคริปต์ sim ยังอยู่นอก repo จะย้ายเข้า `tools/sim` ในเฟส P1)
- **2026-10-17 (5)** — ชื่อผู้เล่น: กรอกตอนเลือกอาชีพ และเปลี่ยนภายหลังได้ใน Character panel (Enter หรือปุ่ม Save name) แสดงบน HUD, หัว panel และป้ายใต้ตัวละคร · กติกาชื่อ (`cleanName`) 2–16 ตัว ตัวอักษร/ตัวเลขทุกภาษา รวมไทย + เว้นวรรค _ ' . - · เซฟ v1→v2 พร้อม backup · ช่องชื่อยังเก็บที่พิมพ์และตำแหน่ง caret ไว้แม้ panel จะ re-render · test 63 · ทดสอบในเบราว์เซอร์แล้ว: migrate เซฟจริง, เปลี่ยนชื่อระหว่างต่อสู้, ใส่ชื่อผิดแล้วขึ้นแจ้งเตือน, ชื่อไทย
- **2026-10-17 (4)** — เปลี่ยนตัวละครทั้งหมดเป็นสไตล์ใกล้ภาพอ้างอิง (LootMarch) แต่เป็นดีไซน์ต้นฉบับ: `PixelSprites.ts` ใหม่ ฮีโร่ 5 อาชีพมุม 3/4 พร้อมเดิน 2 เฟรม มอน 3 แบบ (Mossling/Crypt Sentinel/Cave Stalker) บอสใหม่ · เลขดาเมจ/ฮีล pixel font · วงเตือนบอส · แบนเนอร์และแถบ HP บอส · ป้ายชื่อ · เลิกใช้ Sword raster · test 57 · ทดสอบในเบราว์เซอร์ desktop + mobile แล้วไม่มี error · PixelLab trial เครดิตหมด จึงยังสร้างภาพไม่ได้
- **2026-10-17 (3)** — จำกัดขนาดคลัง: inventory 300 / chest 150 ของที่ล้นจะ auto-salvage เป็น Bone (กันเซฟโตจนเกินโควตา LocalStorage) · UI แสดง x/300 · เพิ่ม 6 tests (รวม 37) · ทดสอบในเบราว์เซอร์ที่ 127.0.0.1:5176 (localhost:5176 ติด Web Lock จาก tab อื่น)
- **2026-10-17 (2)** — smoke test ในเบราว์เซอร์ผ่าน · แก้บั๊กจอดำเมื่อ boot ตอน container มีขนาด 0 (`main.ts`) · เพิ่ม `.claude/launch.json` · PixelLab tools ต้องใช้ session ใหม่ถึงจะโหลด
- **2026-10-17** — เชื่อม PixelLab MCP (`.mcp.json` + env `PIXELLAB_API_TOKEN`) · วิเคราะห์โครงสร้างแล้วสร้างเอกสารนี้ + `CLAUDE.md` · test 31/31 และ build ผ่าน · แก้ README/ARCHITECTURE ที่ข้อมูลเก่า (จำนวน test และเวลาข้ามห้อง) · ติดตั้ง Git, `git init`, baseline commit (ไม่มี token ใน repo, ignore `.pnpm-store`/`.env`)
- **2026-10-16** — Sword sprite จริง · ห้องเชื่อมต่อกัน 6.5 วินาที · 5 อาชีพ · จัดระเบียบ repo · HUD แบบ immersive (ดู VALIDATION.md)

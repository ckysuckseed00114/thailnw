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
pnpm test     # vitest — 97 tests
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
  RoomTraversal.ts         ROOM_TRAVERSE_MS=6500 และเส้นทางเดินข้ามห้อง (ใช้ร่วม core กับ renderer)
src/game/                  ★ presentation อย่างเดียว — ห้ามตัดสินดาเมจ/ของดรอป/เงิน
  scenes/CatacombScene.ts  Phaser scene เดียวที่ใช้งาน: ห้อง 3 ส่วนวนกัน, actor, เลขดาเมจ/ฮีล, วงเตือนบอส, ป้ายชื่อ, กล้อง
  PixelSprites.ts          ★ ข้อมูล pixel art ทั้งหมด (string rows + palette): ฮีโร่ 5 อาชีพ × 2 เฟรมเดิน, อาวุธ, มอน 3 แบบ + บอส · ไม่มี Phaser จึง test ได้
  HeroArt.ts               HERO_DESIGNS (ชื่อ/คำอธิบาย/สี) + heroSVG() วาด sprite เดียวกันเป็น SVG ให้ UI
src/ui/
  UIManager.ts             modal ทั้งหมด + HUD ส่วนที่เหลือ (HTML string), คีย์ลัด I/C/P/B/M/Q (M = แผนที่โลก)
  theme/tokens.css         ★ design tokens ธีม Thai Fantasy (`--tf-*`) + คลาส .tf-frame/.tf-bar/.tf-plate/.tf-key
  components/Frame.tsx     Preact: Frame (กรอบไม้/หมึก + มุมลายกนก SVG), Bar (HP/XP)
  hud/                     HUD v2 (Preact, CSS grid): Hud.tsx mount, gameSignal.ts (state → signal), prefs.ts (ขนาด UI/เสียง/tracker ใน localStorage `embermarch.ui.v1`), PlayerFrame, TopBar (+Purse, QuickSettings), Minimap, QuestTracker, hud.css
  design/DesignDemo.tsx    หน้า design system (dev เท่านั้น: http://127.0.0.1:5173/design.html)
  icons.ts                 SVG icon ของแถบเมนู
src/services/
  Storage.ts               LocalSaveRepository (key `embermarch.save.v1`) + validateSave()
  SoundFX.ts               เสียงสังเคราะห์ด้วย Web Audio (ไม่มีไฟล์เสียง)
src/styles/                base.css · hud-immersive.css · characters.css
tests/                     core.test.ts (37) · traversal.test.ts (6) · sprites.test.ts (20 — ความกว้างแถว/สีครบ)
public/                    ตอนนี้ว่าง (sprite วาดจากโค้ดทั้งหมด)
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
- 11 region ต่อ floor, region ละ 8 ห้อง (7 ห้องมอน 3 ตัว + ห้องบอส) ข้ามห้องใช้เวลา 6.5 วินาที
- บอสเรียกผู้คุ้มกันที่ HP 2/3 และ 1/3 แต่ยังตีต่อ; ตัวละครมีโอกาสหลบการโจมตีปกติและแสดงท่าถอย/กระโดด
- ตายแล้วเกิดใหม่ใน 3 วินาทีที่ห้อง 1 · Seal เปิด floor ถัดไป
- ไอเทม 7 slot × 6 rarity, forge / salvage / lock / equip best · สัตว์เลี้ยง 4 ตัว · shrine 4 แบบ · quest 3 อัน · shop
- รางวัลตอน offline: 75% ของอัตราเฉลี่ย 24 ชม. สูงสุด 8 ชม. ต้องกด claim
- สูตรตัวเลขละเอียดอยู่ใน [ARCHITECTURE.md](ARCHITECTURE.md)

## 5. การเชื่อม PixelLab (สร้าง pixel art)

- `.mcp.json` ชี้ไปที่ `https://api.pixellab.ai/mcp` ใช้ token จาก environment variable ระดับผู้ใช้ชื่อ **`PIXELLAB_API_TOKEN`** (ไม่มี key อยู่ในไฟล์โปรเจกต์)
- เครื่องใหม่: ตั้งค่า `PIXELLAB_API_TOKEN` แล้วเปิด Claude Code session ใหม่ จากนั้นอนุมัติ MCP server `pixellab`
- REST: `https://api.pixellab.ai/v2` (ใช้ header `Authorization: Bearer <token>`) · เช็กเครดิตที่ `GET /v2/balance` · คู่มือ: https://api.pixellab.ai/mcp/docs
- บัญชีเป็น **trial และ generations หมดแล้ว** (ข้อมูลวันที่ 2026-10-17: 0/40, $0) ต้องเติมเครดิตก่อน แล้วรีสตาร์ทแอป Claude ให้โหลด env ใหม่ (ไม่งั้น MCP จะตอบ 401)
- **ห้ามเรียก PixelLab จากโค้ดฝั่ง browser** ให้สร้าง asset ไว้ล่วงหน้าแล้วเก็บใน `public/assets/`

## 6. สถานะล่าสุด (2026-10-17)

| ตรวจ | ผล |
| --- | --- |
| `pnpm test` | ✅ 97/97 ผ่าน |
| `pnpm build` (tsc strict + vite) | ✅ ผ่าน · Phaser chunk 1.2 MB / 332 KB gzip (มี warning chunk ใหญ่ ซึ่งเป็นเรื่องปกติ) |
| ทดสอบในเบราว์เซอร์ (port 5177, เซฟแยก) | ✅ เลือก Sword ได้ · HUD เหลือ 1 สกิล ไม่มี SP/MP · มินิแมพแสดง 1/8 · ไม่มี console error; การผ่านบอส 8 ห้องตรวจด้วย core tests |

**เสร็จแล้ว:** core ครบระบบ local · HUD แบบ immersive · ตัวละคร pixel ครบ 5 อาชีพ + มอน 3 แบบ + บอส · เลขดาเมจ/ฮีล · วงเตือนบอส slam · บอสเรียกลูกน้องตาม HP โดยยังโจมตีต่อ · หลบแล้วถอย/กระโดด · ห้องเชื่อมต่อกัน 8 ห้องต่อ region · เสียง Web Audio

**ข้อสังเกต / ความเสี่ยง**
- ยังไม่มี remote/backup นอกเครื่อง (ยังไม่ได้ติดตั้ง `gh`)
- เคยเจอบั๊กจอดำ: ถ้า Phaser boot ตอน `#game` มีขนาด 0 (เช่น tab เปิดอยู่เบื้องหลัง) WebGL จะ error `Framebuffer status: Incomplete Attachment` แล้วไม่ฟื้น ตอนนี้แก้แล้วใน `main.ts` ให้รอจน `#game` มีขนาดจริงก่อนสร้าง Phaser (ใช้ ResizeObserver) แต่กรณีขนาด 0 ยังไม่ได้ทดสอบซ้ำในเบราว์เซอร์
- `.claude/launch.json` (`embermarch-dev`) รัน dev server ที่ port 5176 เพื่อให้ทดสอบโดยไม่ทับเซฟจริงที่ port 5173
- โค้ดเขียนแบบอัดแน่นหนึ่งบรรทัดยาว (UIManager 22 KB, CatacombScene 19 KB, characters.css ทั้งไฟล์อยู่บรรทัดเดียว) ทำให้ diff/review ยาก ถ้าจะแก้ให้ใช้รูปแบบเดิม หรือตกลงกันก่อนว่าจะ format ใหม่
- ไม่มี test ของ UI/renderer และไม่มี test ของ Web Lock
- Marketplace มีปุ่มอยู่แต่ตั้งใจปิดไว้ (เงินจำลองเท่านั้น ห้ามผูกกับ wallet/token จริง ดูเหตุผลใน ARCHITECTURE.md)
- ฟอนต์ Silkscreen โหลดจาก Google Fonts ถ้าออฟไลน์จะใช้ monospace แทน และฟอนต์นี้ไม่มีอักษรไทย ชื่อไทยบนป้ายจึงใช้ฟอนต์ระบบ
- ภาพ Sword เดิมย้ายไปไว้ที่ `artifacts/sword-source-v1.png` แล้ว (ไม่ถูก build) และ `SwordSprite.ts` ถูกลบ (ถ้าต้องการกู้คืน ดูได้ใน git ที่ commit f51180b)

**งานถัดไปที่แนะนำ**
1. ตั้ง remote (เช่น GitHub private repo) แล้ว push
2. เพิ่มเฟรมโจมตีให้ sprite (ตอนนี้มีแค่ยืน/เดิน การโจมตีใช้วิธีหมุนอาวุธ) และทำบอสหลายแบบตาม region
3. ปรับสมดุลเกมช่วง floor สูง (ยังไม่เคยทดสอบ) และทำ export/import เซฟ

## 7. เอกสารอื่น

| ไฟล์ | เนื้อหา |
| --- | --- |
| [HANDOFF_UIUX_CHATGPT.md](HANDOFF_UIUX_CHATGPT.md) | ★ เอกสารส่งต่องาน UI/UX ให้ AI/ทีมอื่น (อ่านเข้าใจได้โดยไม่ต้องมีบริบทอื่น) |
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

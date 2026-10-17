# Embermarch — เอกสารส่งต่องาน (Handoff)

> อ่านไฟล์นี้ก่อนเริ่มงานทุกครั้ง แล้ว **อัปเดตหัวข้อ "สถานะล่าสุด" และ "บันทึกการส่งต่อ"** ก่อนจบงาน
> ตรวจล่าสุด: 2026-10-17

## 1. ภาพรวม

เกม idle dungeon crawler (แนว LootMarch) เล่นในเบราว์เซอร์ ทำงานแบบ local อย่างเดียว ไม่มี backend
- **Stack:** TypeScript 5.9 (strict) · Vite 7 · Phaser 3.90 · Vitest 3 · pnpm
- **Git:** repo local บน branch `main` (ยังไม่มี remote) · baseline commit วันที่ 2026-10-17 · ติดตั้ง Git ไว้ที่ `C:\Program Files\Git` ถ้า shell เดิมหา `git` ไม่เจอ ให้เปิด terminal ใหม่

```powershell
pnpm install
pnpm dev      # http://127.0.0.1:5173/  (ต้องเป็น localhost/HTTPS เพราะใช้ Web Locks)
pnpm test     # vitest — 31 tests
pnpm build    # tsc --noEmit + vite build → dist/
```

## 2. โครงสร้างและหน้าที่ของแต่ละไฟล์

```
index.html                 entry ของ Vite (#app)
src/main.ts                boot, Web Lock กันเปิดหลายแท็บ, tick loop 100ms, autosave 5s, offline resume
src/core/                  ★ กฎเกมทั้งหมด — ห้าม import DOM/Phaser
  models.ts                type ทั้งหมด: GameState, Command, GameEvent, ค่าคงที่ (CLASSES, SLOTS, RARITIES, REGIONS, SKILLS, ROOMS=5)
  GameState.ts             createState() เซฟเริ่มต้น · interface Authority · Store (pub/sub)
  CombatEngine.ts          Authority ตัวจริง: tick() เป็น substep 50ms, dispatch(Command) ทุก action ของผู้เล่น, QUESTS
  Formulas.ts              สูตร stats/XP/forge/salvage/seal/monster
  DropTable.ts             PRNG xorshift (random) + สุ่มไอเทม (drop)
  AFKManager.ts            offlineReward() + resume() (เลื่อน timer ทุกตัวตามเวลาที่หายไป)
  RoomTraversal.ts         ROOM_TRAVERSE_MS=6500 และเส้นทางเดินข้ามห้อง (ใช้ร่วม core กับ renderer)
src/game/                  ★ presentation อย่างเดียว — ห้ามตัดสินดาเมจ/ของดรอป/เงิน
  scenes/CatacombScene.ts  Phaser scene เดียวที่ใช้งาน: ห้อง 3 ส่วนวนกัน, actor, แอนิเมชันโจมตี, กล้อง
  HeroArt.ts               pixel geometry ของ 5 อาชีพ → ใช้ทั้ง texture ใน Phaser และ SVG ใน UI
  SwordSprite.ts           ตัด sprite sheet ของ Sword จาก public/assets/heroes/sword-source-v1.png (12 เฟรม, pivot กำหนดเอง)
src/ui/
  UIManager.ts             HUD และ modal ทั้งหมด (HTML string), คีย์ลัด I/C/P/B/M/T/Q
  icons.ts                 SVG icon ของแถบเมนู
src/services/
  Storage.ts               LocalSaveRepository (key `embermarch.save.v1`) + validateSave()
  SoundFX.ts               เสียงสังเคราะห์ด้วย Web Audio (ไม่มีไฟล์เสียง)
src/styles/                base.css · hud-immersive.css · characters.css
tests/                     core.test.ts (25) · traversal.test.ts (6) — ทดสอบ core แบบ deterministic
public/assets/heroes/      ภาพต้นฉบับ sprite
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
4. **เปลี่ยนรูปแบบเซฟ** → ต้องแก้ `createState`, `validateSave` และเพิ่ม migration (ตอนนี้ `version:1` ถ้าเซฟไม่ผ่าน validation เกมจะหยุดและไม่ลบเซฟ)
5. timer ใหม่ใน state (`xxxAt`) ต้องเพิ่มใน `resume()` ของ AFKManager ด้วย ไม่งั้นจะเพี้ยนหลังกลับมาจาก offline

## 4. ระบบเกมสรุปสั้น

- 5 อาชีพ: Sword, Spear, Wand, Axe, Dagger (สกิลอัตโนมัติทุก 7 วินาที, Sword/Spear/Wand ตีทั้งแถว, Axe มี stun)
- 11 region ต่อ floor, region ละ 5 ห้อง (4 ห้องมอน 3 ตัว + ห้องบอส) ข้ามห้องใช้เวลา 6.5 วินาที
- ตายแล้วเกิดใหม่ใน 3 วินาทีที่ห้อง 1 · Seal เปิด floor ถัดไป
- ไอเทม 7 slot × 6 rarity, forge / salvage / lock / equip best · สัตว์เลี้ยง 4 ตัว · shrine 4 แบบ · quest 3 อัน · shop
- รางวัลตอน offline: 75% ของอัตราเฉลี่ย 24 ชม. สูงสุด 8 ชม. ต้องกด claim
- สูตรตัวเลขละเอียดอยู่ใน [ARCHITECTURE.md](ARCHITECTURE.md)

## 5. การเชื่อม PixelLab (สร้าง pixel art)

- `.mcp.json` ชี้ไปที่ `https://api.pixellab.ai/mcp` ใช้ token จาก environment variable ระดับผู้ใช้ชื่อ **`PIXELLAB_API_TOKEN`** (ไม่มี key อยู่ในไฟล์โปรเจกต์)
- เครื่องใหม่: ตั้งค่า `PIXELLAB_API_TOKEN` แล้วเปิด Claude Code session ใหม่ จากนั้นอนุมัติ MCP server `pixellab`
- REST: `https://api.pixellab.ai/v2` (ใช้ header `Authorization: Bearer <token>`) · เช็กเครดิตที่ `GET /v2/balance` · คู่มือ: https://api.pixellab.ai/mcp/docs
- บัญชีเป็น **trial** (ข้อมูลวันที่ 2026-10-17: เครดิต $0, generations 0/40) — เช็กก่อนสั่ง generate จำนวนมาก
- **ห้ามเรียก PixelLab จากโค้ดฝั่ง browser** ให้สร้าง asset ไว้ล่วงหน้าแล้วเก็บใน `public/assets/`

## 6. สถานะล่าสุด (2026-10-17)

| ตรวจ | ผล |
| --- | --- |
| `pnpm test` | ✅ 37/37 ผ่าน |
| `pnpm build` (tsc strict + vite) | ✅ ผ่าน · Phaser chunk 1.2 MB / 332 KB gzip (มี warning chunk ใหญ่ ซึ่งเป็นเรื่องปกติ) |
| ทดสอบในเบราว์เซอร์ (port 5176, เซฟแยก) | ✅ เลือก Sword → สู้ → ข้ามห้อง → เข้า region 2 ได้ · desktop 1024×768 และ mobile 375×812 แสดงผลถูก · tab ใหม่ไม่มี console error |

**เสร็จแล้ว:** core ครบทุกระบบ · HUD แบบ immersive · 5 อาชีพแบบ procedural pixel · ห้องเชื่อมต่อกันและเดินข้ามประตูได้ · Sword ใช้ sprite sheet จริง (อาชีพอื่นยังเป็น procedural) · เสียง Web Audio · เชื่อม PixelLab MCP แล้ว

**ข้อสังเกต / ความเสี่ยง**
- ยังไม่มี remote/backup นอกเครื่อง (ยังไม่ได้ติดตั้ง `gh`)
- เคยเจอบั๊กจอดำ: ถ้า Phaser boot ตอน `#game` มีขนาด 0 (เช่น tab เปิดอยู่เบื้องหลัง) WebGL จะ error `Framebuffer status: Incomplete Attachment` แล้วไม่ฟื้น ตอนนี้แก้แล้วใน `main.ts` ให้รอจน `#game` มีขนาดจริงก่อนสร้าง Phaser (ใช้ ResizeObserver) แต่กรณีขนาด 0 ยังไม่ได้ทดสอบซ้ำในเบราว์เซอร์
- `.claude/launch.json` (`embermarch-dev`) รัน dev server ที่ port 5176 เพื่อให้ทดสอบโดยไม่ทับเซฟจริงที่ port 5173
- โค้ดเขียนแบบอัดแน่นหนึ่งบรรทัดยาว (UIManager 22 KB, CatacombScene 19 KB, characters.css ทั้งไฟล์อยู่บรรทัดเดียว) ทำให้ diff/review ยาก ถ้าจะแก้ให้ใช้รูปแบบเดิม หรือตกลงกันก่อนว่าจะ format ใหม่
- ไม่มี test ของ UI/renderer และไม่มี test ของ Web Lock
- Marketplace มีปุ่มอยู่แต่ตั้งใจปิดไว้ (เงินจำลองเท่านั้น ห้ามผูกกับ wallet/token จริง ดูเหตุผลใน ARCHITECTURE.md)
- sprite ของ Sword ตัดจาก concept sheet ที่ระยะห่างเฟรมไม่เท่ากัน pose อาจไม่สม่ำเสมอ

**งานถัดไปที่แนะนำ**
1. ตั้ง remote (เช่น GitHub private repo) แล้ว push
2. ใช้ PixelLab สร้าง sprite sheet แบบ grid เท่ากันให้ทั้ง 5 อาชีพ (+ มอนสเตอร์/บอส) แล้วทำ loader ทั่วไปแทน `SwordSprite.ts` ที่ hardcode อยู่
3. ปรับสมดุลเกมช่วง floor สูง (ยังไม่เคยทดสอบ) และทำ export/import เซฟ

## 7. เอกสารอื่น

| ไฟล์ | เนื้อหา |
| --- | --- |
| [ARCHITECTURE.md](ARCHITECTURE.md) | ขอบเขตแต่ละชั้น, สูตรทั้งหมด, ค่า balance, แนวทางย้ายขึ้น server |
| [VALIDATION.md](VALIDATION.md) | ประวัติการตรวจแต่ละรอบ |
| [CHARACTERS_AND_CONNECTED_ROOMS.md](CHARACTERS_AND_CONNECTED_ROOMS.md) | ดีไซน์ 5 อาชีพ + ลำดับการข้ามห้อง (TH) |
| [SWORD_SPRITE_INTEGRATION.md](SWORD_SPRITE_INTEGRATION.md) | การตัดเฟรม sprite ของ Sword |
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

- **2026-10-17 (3)** — จำกัดขนาดคลัง: inventory 300 / chest 150 ของที่ล้นจะ auto-salvage เป็น Bone (กันเซฟโตจนเกินโควตา LocalStorage) · UI แสดง x/300 · เพิ่ม 6 tests (รวม 37) · ทดสอบในเบราว์เซอร์ที่ 127.0.0.1:5176 (localhost:5176 ติด Web Lock จาก tab อื่น)
- **2026-10-17 (2)** — smoke test ในเบราว์เซอร์ผ่าน · แก้บั๊กจอดำเมื่อ boot ตอน container มีขนาด 0 (`main.ts`) · เพิ่ม `.claude/launch.json` · PixelLab tools ต้องใช้ session ใหม่ถึงจะโหลด
- **2026-10-17** — เชื่อม PixelLab MCP (`.mcp.json` + env `PIXELLAB_API_TOKEN`) · วิเคราะห์โครงสร้างแล้วสร้างเอกสารนี้ + `CLAUDE.md` · test 31/31 และ build ผ่าน · แก้ README/ARCHITECTURE ที่ข้อมูลเก่า (จำนวน test และเวลาข้ามห้อง) · ติดตั้ง Git, `git init`, baseline commit (ไม่มี token ใน repo, ignore `.pnpm-store`/`.env`)
- **2026-10-16** — Sword sprite จริง · ห้องเชื่อมต่อกัน 6.5 วินาที · 5 อาชีพ · จัดระเบียบ repo · HUD แบบ immersive (ดู VALIDATION.md)

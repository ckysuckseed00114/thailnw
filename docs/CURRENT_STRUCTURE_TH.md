# โครงสร้างและสถานะล่าสุดของ Embermarch

อัปเดตเกมเพลย์ 17 ตุลาคม 2026; อ่านคู่กับ [HANDOFF.md](HANDOFF.md)

## ภาพรวมง่าย ๆ

เกมแบ่งเป็นสามส่วน: **Core คิดผล**, **Phaser วาดฉาก**, และ **UI แสดงข้อมูล/รับคำสั่ง** ผู้เล่นเลือกอาชีพหนึ่งใน Sword, Spear, Wand, Axe, Dagger แล้วตัวละครต่อสู้อัตโนมัติ เก็บของ ปรับอุปกรณ์และเดินผ่านประตูไปห้องถัดไป ห้องที่ 8 ของแต่ละ region เป็นบอส มี 11 region ต่อ floor

```text
ปุ่ม / hotkey / เมนู
       ↓ Command
Store → CombatEngine + Formulas + Skills + DropTable + Targeting
       ↓ state และ events
       ├─ Phaser CatacombScene: ห้อง ตัวละคร การเดิน เอฟเฟกต์
       ├─ Preact HUD: สถานะ แผนที่ hotbar เป้าหมาย แชตระบบ
       └─ UIManager: หน้าต่างกระเป๋า ตัวละคร สัตว์เลี้ยง ร้าน ฯลฯ

main.ts → วงรอบ tick / save / AFK → LocalSaveRepository
```

`src/core` ไม่พึ่ง DOM หรือ Phaser จึงทดสอบกฎเกมแบบกำหนด seed ได้ แต่ตอนนี้ `CombatEngine` ยังทำงานในเบราว์เซอร์ ไม่ใช่เซิร์ฟเวอร์ที่เชื่อถือได้สำหรับเศรษฐกิจออนไลน์

## ไฟล์และหน้าที่

| กลุ่ม | ไฟล์สำคัญ | สิ่งที่ทำ |
| --- | --- | --- |
| เริ่มระบบ | `src/main.ts` | โหลดเซฟ, resume AFK, สร้าง Store, mount HUD, เริ่ม Phaser, tick ทุก 100 ms |
| กฎเกม | `src/core/CombatEngine.ts`, `GameState.ts`, `models.ts` | คำสั่งและ state กลาง, ต่อสู้, เลเวล, เงิน/ของ, การเดินทาง |
| ระบบย่อย | `src/core/Skills.ts`, `Targeting.ts`, `Formulas.ts`, `DropTable.ts`, `AFKManager.ts`, `RoomTraversal.ts` | 1 สกิลต่ออาชีพ, เลือกศัตรู, คำนวณ, ดรอป, รางวัลออฟไลน์, จังหวะเดินข้ามห้อง |
| ฉาก | `src/game/scenes/CatacombScene.ts`, `PixelSprites.ts`, `HeroArt.ts` | ห้องต่อกัน การเดิน/โจมตี ศัตรู เอฟเฟกต์ และตัวละครพิกเซลที่สร้างจากโค้ด |
| HUD ใหม่ | `src/ui/hud/*.tsx`, `gameSignal.ts`, `hud.css` | Preact + signals; สถานะ HP/XP, แผนที่, hotbar คูลดาวน์, target/boss bar, quest tracker, แชตระบบ |
| เมนูเดิม | `src/ui/UIManager.ts` | `<dialog>` และ HTML string สำหรับ inventory/forge, stats, pets, shop, travel, quests, AFK |
| ปุ่ม/ค่า UI | `src/ui/keybinds.ts`, `src/ui/hud/hotkeys.ts`, `prefs.ts`, `src/ui/theme/` | เปลี่ยนปุ่มลัด, ขนาด UI, เสียง, ตัวเลขดาเมจ, ธีม |
| บันทึก/เสียง | `src/services/Storage.ts`, `SoundFX.ts` | LocalStorage save v5 พร้อม migration v1–v4 และตรวจรูปแบบ; เสียงสังเคราะห์ |

## สิ่งที่เล่นได้แล้ว

- เลือกอาชีพ 5 แบบ; มีสกิลประจำอาชีพเพียง 1 ท่า กดปุ่ม 1 หรือให้ร่ายอัตโนมัติ คูลดาวน์ 7 วินาที ไม่มีมานา/SP/MP
- การโจมตีปกติมีโอกาสหลบ 12% + 0.5% ต่อ Agility (สูงสุด 35%); บอสทุบหนักใช้โอกาสหลบเดิม 30% + 1% ต่อ Agility (สูงสุด 50%) ท่าถอย/กระโดดใน Phaser เกิดเมื่อ core ตัดสินว่าหลบสำเร็จ
- ห้อง 1–7 เป็นมอนสเตอร์; ห้อง 8 เป็นบอส บอสเรียกผู้คุ้มกัน 1 ตัวที่ HP 2/3 และอีก 1 ตัวที่ HP 1/3 บอสยังตีได้ขณะลูกน้องอยู่ และต้องกำจัดทุกตัวก่อนประตูเปิด
- เลือกเป้าหมายด้วยการคลิก หรือปุ่ม T; X กลับเป็นเป้าหมายอัตโนมัติ
- ห้องเชื่อมด้วยทางเดิน: กำจัดศัตรู เปิดประตู เดินเข้าห้องใหม่; ตายแล้วเกิดใหม่โดยไม่เสียไอเทม
- ของ 7 ช่อง 6 ระดับ rarity, loot chest, Equip Best, forge, salvage, lock, pet 4 แบบ, shrine, seal, travel, AFK reward และ quest milestone
- HUD ใช้ Preact แล้ว แต่หน้าต่างเมนูหลักยังใช้ `UIManager` แบบเดิม; ระบบแชตแสดงข้อความระบบ ส่วนแชตผู้เล่นยังไม่เชื่อมออนไลน์
- Sprite Sword ปัจจุบันเป็นพิกเซลที่สร้างด้วย `PixelSprites.ts` เช่นเดียวกับคลาสอื่น; ไฟล์ภาพ Sword รุ่นทดลองและเอกสาร `SWORD_SPRITE_INTEGRATION.md` เป็นประวัติของแนวทางเดิม ไม่ใช่ renderer ปัจจุบัน

## ผลตรวจและข้อจำกัด

- 17 ต.ค. 2026: TypeScript ผ่าน; Vitest **97/97** ผ่านใน 8 ไฟล์; Vite build ผ่าน
- Build แจ้งเพียงขนาด chunk ของ Phaser ประมาณ 1.2 MB ก่อนบีบอัด (332 KB gzip); เป็นเรื่องขนาดดาวน์โหลดที่ควรวัดบนอุปกรณ์เป้าหมาย
- Save อยู่ใน LocalStorage (`embermarch.save.v1`, format v5), ไม่ได้ซิงก์ข้ามอุปกรณ์ และผู้เล่นแก้ข้อมูลฝั่งเครื่องได้ เซฟ v4 ที่กำลังอยู่ห้องบอสเดิม 5 จะถูกย้ายเป็นห้อง 8 ระหว่าง migration
- ระบบ marketplace ยังเป็นหน้ารอใช้งาน; ไม่มี backend, multiplayer, wallet, smart contract หรือเงินจริง
- เอกสารเก่าบางฉบับอธิบายสถาปัตยกรรมก่อน HUD v2 และก่อน save v4; ใช้ไฟล์นี้และ `HANDOFF_UIUX_CHATGPT.md` อ่านสถานะล่าสุด

## งานถัดไปที่แนะนำ

1. ทำ Phase 3 ของ UI: เมนูหลักขนาดกะทัดรัด, ระบบหน้าต่าง Preact, กระเป๋าแบบ grid พร้อมกรอง/เรียง (ดู `UI_UX_PLAN.md`)
2. ทดสอบ UI จริงหลายขนาดจอและอุปกรณ์ รวมถึงเกมยาว/สมดุลการต่อสู้ แล้วปรับก่อนใช้จริง
3. ถ้าจะเปิดออนไลน์ ย้ายการคำนวณผลและการถือครองเงิน/ของไปเซิร์ฟเวอร์ พร้อมบัญชีและฐานข้อมูล ก่อนเปิดซื้อขายระหว่างผู้เล่น (ดู `ONLINE_PLAN.md`)

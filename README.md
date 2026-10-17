# Embermarch

เกม 2D idle dungeon crawler ที่เล่นในเบราว์เซอร์ ขณะนี้เป็นเกม **local single-player**: การต่อสู้และความคืบหน้าคำนวณในเครื่องผู้เล่นและบันทึกด้วย LocalStorage ยังไม่มีเซิร์ฟเวอร์ บัญชีผู้เล่น ตลาดซื้อขาย หรือธุรกรรม Web3

## เริ่มเล่นและตรวจสอบ

```powershell
cd C:\new
pnpm install
pnpm dev
```

เปิด `http://127.0.0.1:5173/` (หรือพอร์ตที่ Vite แสดง) แล้วเลือกหนึ่งในห้าอาชีพ เซฟแยกตาม origin/พอร์ต และ Web Locks จำกัดการเปิดเกมพร้อมกันหลายแท็บบน origin เดียวกัน

```powershell
pnpm test    # 98 tests ใน 9 ไฟล์
pnpm build   # ตรวจ TypeScript และสร้าง dist/
```

## โครงสร้างปัจจุบัน

| ตำแหน่ง | หน้าที่ |
| --- | --- |
| `src/core/` | กฎเกมล้วน: combat, สกิล, เป้าหมาย, สูตร, loot, AFK, การเดินข้ามห้อง และ state/commands |
| `src/game/` | Phaser 3: ฉากดันเจี้ยน ตัวละครที่วาดจากข้อมูลพิกเซล และเอฟเฟกต์ |
| `src/ui/hud/` | HUD ใหม่ด้วย Preact และ signals: สถานะตัวละคร แผนที่ hotbar เป้าหมาย แชตระบบ และปุ่มลัด |
| `src/ui/UIManager.ts` | หน้าต่าง `<dialog>` เท่านั้น (กระเป๋า, stats, สัตว์เลี้ยง, ร้าน, travel, AFK) — HUD สดอยู่ที่ `ui/hud/` |
| `src/services/` | LocalStorage พร้อม migration/validation และเสียงสังเคราะห์ |
| `src/main.ts` | เริ่มเกม วงรอบ tick ระบบเซฟ/AFK และการเชื่อม HUD กับ Phaser |
| `tests/` | ชุดทดสอบ core, sprites, HUD, สกิล, targeting, traversal และ keybinds |

กติกาล่าสุด: **1 สกิลต่ออาชีพ ใช้คูลดาวน์ 7 วินาที ไม่มีมานา**, region ละ **8 ห้อง** (ห้อง 8 เป็นบอส) และบอสเรียกผู้คุ้มกันที่ HP 2/3 กับ 1/3 โดยยังโจมตีได้ต่อเนื่อง

อ่านภาพรวมที่ [docs/CURRENT_STRUCTURE_TH.md](docs/CURRENT_STRUCTURE_TH.md) · ความเสี่ยงและขอบเขตเกมหลัก vs demo ที่ [docs/RISKS.md](docs/RISKS.md) · แผน UI ที่ [docs/UI_UX_PLAN.md](docs/UI_UX_PLAN.md)

หน้า `/design.html` เป็นตัวอย่าง design system ส่วน `demos/lootmarch-enhanced/` เป็นเดโมแยก ไม่ใช่เกมหลัก

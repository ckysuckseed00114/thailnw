# ความเสี่ยงและวิธีจัดการ (Embermarch)

อัปเดต: 2026-10-17

## 1. เกมหลัก vs โมเด standalone

| ความเสี่ยง | การจัดการ |
| --- | --- |
| ผู้เล่นคิดว่า `demos/lootmarch-enhanced/` คือเกมเดียวกับ `pnpm dev` | README ระบุชัด · โมเดอยู่ใต้ `demos/` เท่านั้น · ไม่เพิ่ม logic เกมใน `game.js` |
| ข้อมูล mock ในโมเด sync ไม่ได้กับ core | ใช้โมเดเป็น reference UI/เสียง · ฟีเจอร์ใหม่ทำใน `src/core` + `src/ui/hud` |

## 2. HUD สองชั้น (Preact + Modal)

| ความเสี่ยง | การจัดการ |
| --- | --- |
| DOM เก่าซ้ำกับ Preact HUD | `UIManager` เหลือแค่ `#game`, modal, toast · HUD สดอยู่ที่ `src/ui/hud/` |
| ปุ่ม Auto advance / Claim ผิด command | แก้ dispatch แยก `advance` / `seal` / `claim` · ทดสอบใน `tests/core.test.ts` |

## 3. Save และความปลอดภัย

| ความเสี่ยง | การจัดการ |
| --- | --- |
| LocalStorage แก้ได้ · ไม่ sync ข้ามเครื่อง | เอกสารใน ARCHITECTURE · ไม่ผูก wallet/เงินจริง |
| หลายแท็บเขียนทับเซฟ | Web Lock ใน `main.ts` · ต้อง localhost/HTTPS |

## 4. เอกสารล้าสมัย

| ความเสี่ยง | การจัดการ |
| --- | --- |
| Codex prompt อ้าง `DungeonScene` / `main.css` | อ่านสถานะล่าสุดจาก `CURRENT_STRUCTURE_TH.md`, `HANDOFF.md`, `RISKS.md` |
| เอกสารซ้ำหลายไฟล์ | index ใน README · handoff zip ถูกลบ (มี markdown ใน repo แล้ว) |

## 5. Regression

| การจัดการ |
| --- |
| `pnpm test` — core, HUD, shell, traversal, skills |
| `pnpm build` ก่อน release |
| Smoke: เปิด `pnpm dev` → เลือก class → ต่อสู้ → กด I เปิดกระเป๋า |

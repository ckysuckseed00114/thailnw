# ส่งต่องานเกมเพลย์ — 17 ตุลาคม 2026

เอกสารนี้เป็นกติกาปัจจุบันและมีลำดับเหนือข้อความประวัติในแผน UI เดิมที่กล่าวถึง 6 สกิล, SP/MP หรือ 5 ห้อง

## สิ่งที่เปลี่ยน

| เรื่อง | กติกาปัจจุบัน |
| --- | --- |
| อาชีพและสกิล | 5 อาชีพ แต่ละอาชีพมี **1 สกิล**: Sword Whirlwind, Spear Pierce, Wand Fireball, Axe Cleave, Dagger Shadow Step; คงตัวคูณและเป้าหมายของสกิลเดิม |
| การใช้สกิล | กด `1` หรือเปิด auto-cast; ทุกคลาสมี cooldown 7 วินาที; ไม่มี mana/MP/SP/energy และไม่มีสกิลช่อง 2–5/R |
| การหลบ | การโจมตีปกติ: 12% + 0.5% ต่อ Agility, เพดาน 35%; boss slam: 30% + 1% ต่อ Agility, เพดาน 50% เมื่อ core ตัดสินว่า DODGE ฉาก Phaser แสดงการกระโดดถอยหลัง โล่ไม่ถูกใช้ถ้าหลบสำเร็จ |
| ดันเจี้ยน | 8 ห้องต่อ region: ห้อง 1–7 มีมอนสเตอร์ปกติ ห้อง 8 เป็นบอส; 11 region ต่อ floor; ทางเดินประตูและการเกิดใหม่ใช้กติกาเดิม |
| บอส | HP ≤2/3 เรียก Warden's Guard ตัวแรก, HP ≤1/3 เรียกตัวที่สอง; เรียกไม่ซ้ำ บอสยังถูกเลือกเป้าและโจมตีทุก 2.2 วินาทีตามเดิม (เว้นแต่ถูก stun) ลูกน้องโจมตีด้วย ต้องกำจัดศัตรูทั้งหมดก่อนประตูเปิดและปลดล็อก region ถัดไป |
| เซฟ | `GameState.version:5`; migration v4→v5 ลบ cooldown/auto-cast ของสกิลที่ถูกยกเลิก เพิ่มตัวนับการเรียกลูกน้อง และย้ายเซฟที่อยู่ห้องบอสเดิม 5 ไปห้อง 8; LocalStorage key ยังคง `thailnw.save.v1` |

## จุดเชื่อมในโค้ด

- `src/core/Skills.ts`: ตารางสกิลเดียว; `CombatEngine.ts`: dodge, boss summons และการโจมตี; `models.ts`: `ROOMS=8`, `Enemy.summons`, `GameEvent.source`
- `src/services/Storage.ts`: migration และ validation v5; `src/core/AFKManager.ts` ยังเลื่อน cooldown ระหว่าง offline
- `src/game/scenes/CatacombScene.ts`: ภาพถอย/กระโดดตาม event DODGE, portal ของ guard, แหล่งโจมตีของบอส/guard
- `src/ui/hud/PlayerFrame.tsx`, `Hotbar.tsx`, `Minimap.tsx`, `Targets.tsx`, `QuestTracker.tsx`, `src/ui/keybinds.ts`: HUD สกิลเดียว ไม่มีแถบ SP แผนที่ 8 ห้อง แสดงเฟสบอสจริง

## การตรวจ

- TypeScript strict ผ่าน
- Vitest 97/97 ผ่านใน 8 ไฟล์ รวมทดสอบ boss summons ทั้งสองเฟส, boss โจมตีขณะมี guard, ประตูและ region ไม่ปลดล็อกก่อน guard ตาย, dodge ปกติ, cooldown และ migration
- Vite production build ผ่าน; Phaser chunk ประมาณ 1.2 MB ก่อนบีบอัด
- Browser smoke ที่พอร์ต 5177 (เซฟทดสอบแยก): เลือก Sword ได้ HUD มีหนึ่งสกิล ไม่มี SP และแผนที่แสดง 1/8 โดยไม่มี console error
- ภาพผลตรวจ: [`artifacts/gameplay-update-2026-10-17.png`](../artifacts/gameplay-update-2026-10-17.png)

## ขอบเขตและงานต่อ

- ท่าหลบเป็นการเคลื่อนไหวตามผล combat ใน core ไม่ใช่ระบบควบคุมการเดินเอง; ผู้เล่นยังเล่นแบบ idle/auto
- สมดุล 8 ห้องและบอสลูกน้องยังต้องวัดจากการเล่นยาวหลายระดับ โดยเฉพาะ Sword/Axe และ floor สูง
- เกมยัง local single-player; ห้ามใช้เซฟฝั่งเบราว์เซอร์เป็นแหล่งจริงของไอเทมหรือเงินในระบบออนไลน์
- เอกสาร `UI_UX_PLAN.md` และ `HANDOFF_UIUX_CHATGPT.md` มีบันทึกแนวคิดเก่าเรื่อง MP และ 6 สกิล; ใช้กติกาในไฟล์นี้เมื่อต่อยอด UI

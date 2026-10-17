# Axe PixelLab — ทดสอบดีไซน์จากวิดีโออ้างอิง

วันที่ 2026-10-17 · วิดีโออ้างอิงของผู้ใช้แสดงนักรบพิกเซลสัดส่วนผู้ใหญ่ในเกราะทอง น้ำเงิน เข้าต่อสู้ในดันเจียนมุมเฉียง งานนี้นำภาษา visual นั้นมาทำเป็น **Axe** ต้นฉบับ: นักรบเคราสั้น เกราะทองเหล็ก ผ้าคลุมสีน้ำเงิน และขวานสองคมลายรูน โดยไม่คัดลอกฉากหรือ UI ในคลิป

## การใช้งาน

- ภาพอยู่ใน `public/assets/axe-veteran/` และโหลดจากเกมโดยตรง ไม่มี API call จาก browser
- `src/game/AxeArt.ts` ระบุขนาด/ตำแหน่งยืน/path, `CatacombScene.ts` เล่นเฟรมเดินและเหวี่ยงขวานในฉาก, `HeroArt.ts` ใช้ portrait ใน HUD และหน้าเลือกอาชีพ
- ไม่วาดอาวุธแบบ code ซ้ำบน Axe อีก เพราะ PNG มีขวานอยู่แล้ว
- เปลี่ยนเฉพาะภาพ ไม่เปลี่ยนตัวเลขดาเมจ สกิล Cleave, cooldown หรือเซฟ

PixelLab character ID `fd54b6d0-2b0e-45b0-895d-7779afea8234`, create job `7da2f795-68c6-467b-b5f7-d18171183937` (ID ไม่ใช่ token). ไฟล์ต้นฉบับ 8 ทิศอยู่ใน `artifacts/axe-veteran-v1/`.
Walk group `a29ee599-bdee-4e10-964c-b414664cc0b3` · Cleave job `715b3677-dd61-4a3c-8d1e-f648b39952ad` · Cleave group `fd5dbe56-4e0f-4bf2-93a8-3e4830708175`. ไฟล์ใช้จริง: portrait 64×64, idle/walk 5 เฟรม/attack 5 เฟรม ขนาด 88×88.

## การตรวจและข้อจำกัด

- ใช้ทิศ south-east สำหรับเดิน/ฟัน แล้วพลิกภาพเมื่อหันซ้าย เหมือน Sword ปัจจุบัน; ภาพ 8 ทิศเก็บไว้สำหรับระบบหันทิศในอนาคต
- ทดสอบได้โดยเปิดเกมที่ `http://127.0.0.1:5180/` เลือก Axe ในเซฟใหม่ แล้วดู portrait, หน้าอาชีพ, เดินเข้าหาศัตรู และเหวี่ยงขวาน
- ทดสอบอัตโนมัติ: `node node_modules/vitest/vitest.mjs run`, `node node_modules/typescript/bin/tsc --noEmit`, `node node_modules/vite/bin/vite.js build`
- ผลรอบนี้: 103/103 tests, TypeScript/build, ทดสอบเล่นผ่านเดสก์ท็อปและมือถือ 390×844, ไม่มี console error. ภาพตรวจ: `artifacts/axe-veteran-roster.png`, `artifacts/axe-veteran-in-game.png`, `artifacts/axe-veteran-mobile-roster.png`

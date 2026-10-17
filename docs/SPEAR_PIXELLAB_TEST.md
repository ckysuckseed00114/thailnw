# Spear PixelLab — งานทดสอบดีไซน์และอนิเมชัน

วันที่ 2026-10-17 · ผู้ใช้ขอ Spearman แบบ side-scrolling GBA RPG: ผู้ใหญ่ เกราะละเอียดสีทอง/แดงเข้ม ผ้าคลุมมืด หอกยาวหัวประดับ อ่านทรงชัดบนฉากตัดกันสูง พร้อม **ยืน เดิน โจมตี**

## การออกแบบและเชื่อมเกม

- สร้างตัวละคร Spear ใหม่ด้วย PixelLab API v2 ในมุม `side`; ออกแบบต้นฉบับตามคำบรรยายของผู้ใช้
- ใช้พื้นหลังโปร่งใสในไฟล์ PNG เพื่อวางทับฉากดันเจียนได้; หน้า roster มีฉากพื้นหลังเข้มอยู่แล้ว
- ไฟล์เกมอยู่ใน `public/assets/spear-lancer/`; `SpearArt.ts` รวม path/scale/origin; `CatacombScene.ts` โหลดและสลับเฟรมยืน เดิน แทงหอก; `HeroArt.ts` ใช้ portrait เดียวกันใน HUD/roster
- ไฟล์เกมคือ portrait 64×64 และ idle 5/walk 5/thrust 5 เฟรมขนาด 88×88; ชุดต้นฉบับ 8 ทิศและไฟล์ทั้งหมดอยู่ที่ `artifacts/spear-lancer-v1/pixellab-complete.zip`
- หอกอยู่ใน PNG จึงซ่อนอาวุธแบบโค้ดเดิมเฉพาะฮีโร่ Spear. ไม่เปลี่ยนค่าพลัง, สกิล Pierce หรือเซฟ

PixelLab character ID `e50c4400-8c3e-4e91-aef3-9116414aa29c` · create job `2743b7b1-736f-4b26-934f-91b735d076da` (ID เหล่านี้ไม่ใช่ token). Token ที่ผู้ใช้ระบุ **ตรงกับ** `PIXELLAB_API_TOKEN` ใน Windows User environment ที่ตั้งไว้ก่อนหน้าแล้ว; ไม่มี token ใน repo หรือ browser build.
Idle job `8edc94f3-82d9-4d2b-b9f7-d3ec612ae074` · group `e9e11f94-adfa-4700-a93b-27d887e24ea3`.
Walk group `7ce1d3d0-7420-40db-93c1-218c62a13c6e` · Thrust job `50a72791-e8b6-4c2e-86a2-1fed3ac6f7e8` · group `2d1a798c-6e8e-4c90-a101-cacfd616cb6e`.

## ข้อจำกัดและการทดสอบ

- เกมแสดงเฟรม south-east สำหรับยืน/เดิน/โจมตีและพลิกแนวนอนเมื่อหันซ้าย; ภาพหมุนทิศอื่นอยู่ในชุดต้นฉบับสำหรับงานต่อไป. มุม east จาก PixelLab ตัดปลายหอก จึงเลือก south-east ที่เก็บหอกได้ครบและเข้ากับกล้องในเกม
- ทดสอบเกมที่ `http://127.0.0.1:5180/` ด้วยเซฟใหม่แล้วเลือก Spear. ตรวจ HUD/roster, ยืน, เดินเข้าหามอนสเตอร์, แทงหอก และจอมือถือ
- คำสั่งตรวจ: `node node_modules/vitest/vitest.mjs run`, `node node_modules/typescript/bin/tsc --noEmit`, `node node_modules/vite/bin/vite.js build`
- ผลรอบนี้: 105/105 tests, TypeScript/build ผ่าน; ทดสอบเลือก Spear, เดิน/ต่อสู้, portrait HUD/roster และมือถือ 390×844 ไม่มี console error. ภาพ: `artifacts/spear-lancer-roster.png`, `artifacts/spear-lancer-in-game.png`, `artifacts/spear-lancer-mobile.png`

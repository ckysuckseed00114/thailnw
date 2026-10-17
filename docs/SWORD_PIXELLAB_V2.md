# Sword เวอร์ชัน PixelLab — ส่งต่องาน

วันที่ 2026-10-17 · เป้าหมายคือให้ตัวละคร Sword ดูเป็นนักรบผู้ใหญ่แทน sprite เดิมที่หัวโตและดูเด็ก โดยอิงภาพตัวอย่างที่ผู้ใช้แนบ: เกราะทอง, โทนน้ำเงิน, พู่สีแดง, ดาบเหล็กยาว และมุมมอง 3/4 ในดันเจียน

## สิ่งที่ทำ

- เชื่อม PixelLab REST API v2 ด้วย token ที่ผู้ใช้ให้มา และบันทึกไว้ใน Windows **User environment** ชื่อ `PIXELLAB_API_TOKEN`; `.mcp.json` เดิมอ่านชื่อนี้อยู่แล้ว ไม่มี token ใน repo หรือ browser build (ต้องเปิดโปรแกรม/terminal ใหม่จึงจะเห็นค่า environment ล่าสุด)
- สร้างตัวละคร `Sword Dawnwarden Veteran` แบบ 8 ทิศทาง ขนาด 64×64 จาก prompt ที่ย้ำสัดส่วนผู้ใหญ่/ไหล่กว้าง/หัวเล็ก/เกราะทอง/ผ้าคลุมน้ำเงิน/ดาบยาว แล้วสร้าง Walk และ Sword Slash อย่างละ 5 เฟรมในทิศ south-east
- ตัวเกมใช้ PNG ใน `public/assets/sword-veteran/` แบบ local เท่านั้น: `portrait.png` สำหรับ UI (64×64), `idle.png` และ `walk-0..4.png`/`attack-0..4.png` สำหรับ Phaser (88×88 เพราะ PixelLab เติมขอบให้เฟรมอนิเมชัน)
- `SwordArt.ts` รวม path/ขนาด/origin, `CatacombScene.ts` โหลดภาพและเล่นเฟรมเดิน/ฟัน, `HeroArt.ts` ใช้ portrait เดียวกันใน HUD/หน้าเลือกอาชีพ; ซ่อนดาบโค้ดเดิมสำหรับผู้เล่น Sword เพื่อไม่ให้ซ้อนกับดาบใน PNG
- บันทึกชุดภาพ 8 ทิศทางและ animation ต้นฉบับไว้ใน `artifacts/sword-veteran-v2/pixellab-complete.zip` เพื่อทำรุ่นต่อไป โดยไม่ต้องเรียก API ใหม่หากแค่เปลี่ยนการตัดเฟรม/วางตำแหน่ง

PixelLab character ID: `84c47025-b60d-4497-902c-1d3a31728363` · create job: `ef73d6a9-1a6d-4c51-b796-28f37e02ce4f` · walk job: `653aae08-5b60-4a7e-b5ac-109b5a1cf17f` · slash job: `365b8e0a-866a-4e12-9203-4afa2d0bd264` (ID เหล่านี้ไม่ใช่ token)

## ตรวจแล้ว / ข้อจำกัด

- ตรวจ Sword ในหน้าเลือกอาชีพ, HUD และฉากจริงทั้ง desktop/mobile; เฟรมเดินและฟันโหลดได้ ไม่มี console error · ภาพ: `artifacts/sword-veteran-design.png`, `artifacts/sword-veteran-in-game.png`
- การเดิน/ฟันใช้เฉพาะทิศ south-east และพลิกแนวนอนเมื่อหันซ้าย; ชุด 8 ทิศอยู่ใน ZIP สำหรับเพิ่มระบบหันทิศจริงภายหลัง
- สกิลและสมดุลเกมไม่ได้เปลี่ยน; ภาพ Sword ใหม่ยังต่างระดับรายละเอียดจาก 4 อาชีพที่เหลือ ซึ่งรอแนวทางภาพของแต่ละอาชีพ
- โควตา PixelLab trial หลังงานนี้: 36/40 generations (ตรวจ 2026-10-17); ไม่ควรผูก API token เข้ากับโค้ดเกมฝั่ง client

## วิธีทดสอบ

```powershell
node node_modules/vite/bin/vite.js --host 127.0.0.1 --port 5179 --strictPort
node node_modules/vitest/vitest.mjs run
node node_modules/typescript/bin/tsc --noEmit
node node_modules/vite/bin/vite.js build
```

เปิด `http://127.0.0.1:5179/` เลือก Sword แล้วดูตอนเดินเข้าหามอนสเตอร์และออกดาบ ภาพ portrait อยู่มุมซ้ายบน; กดปุ่ม **อาชีพ** เพื่อดูภาพเต็มใน roster

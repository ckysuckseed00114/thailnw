# บอส The Hollow Warden — PixelLab

วันที่ 2026-10-17 · ออกแบบบอสใหม่ด้วย PixelLab API v2 แล้วนำเข้าเกม

## ดีไซน์

ยักษ์ผู้พิทักษ์ประตูวัดโบราณ ได้แรงบันดาลใจจากยักษ์ทวารบาล (เป็นดีไซน์ต้นฉบับ): ผิวหินสีเทาอมน้ำเงิน, ชฎายอดทองประดับพลอยแดง, ตาแดง มีเขี้ยว, เกราะไหล่ทอง, ผ้าคาดเอวแดงเข้ม และต่อสู้ด้วยกำปั้น
- **ที่ไม่ออกมาตามคำสั่ง:** กระบองเหล็ก และอกที่เรืองไฟ เพราะโหมด standard ใช้โครงคนเป็นแม่แบบ
- **ท่าทุบ:** PixelLab วาดเป็น "ยกแขนแล้วต่อยลง" มากกว่าทุบพื้นสองมือ จึงเสริมด้วยฝุ่นที่พื้นและการสั่นจอ (ตอนทุบหนัก) ในโค้ด

ภาพ: `artifacts/hollow-warden-v1-preview.png` (หันข้าง/เฉียง/หน้าตรง) · `artifacts/hollow-warden-idle-walk.png` · `artifacts/hollow-warden-warden_ground_slam.png` · `artifacts/hollow-warden-warden_summon.png`

## ไฟล์และการเชื่อมเกม

| ไฟล์ | หน้าที่ |
| --- | --- |
| `public/assets/hollow-warden/{idle,walk,slam,summon}-N.png` | เฟรมที่ใช้ในเกม 196×196 มุม south-east (เกมพลิกภาพเมื่อหันซ้าย) |
| `src/game/BossArt.ts` | ขนาด, จุดเท้า (`originY=164/196`), `visualHeight=135`, `scale=1.05` (สูงประมาณ 142 px ในโลก ≈ 1.7× ฮีโร่), จำนวนเฟรม, `slamImpact=5` |
| `src/game/scenes/CatacombScene.ts` | ยืน/เดินใช้เฟรมจริง · ง้างตี (`anticipate`) และง้างทุบหนัก 1.5 วิ (`telegraph`) ใช้เฟรม slam 0–4 · ตอนโดน (`bossStrike`) เล่นเฟรม 5–6 + ฝุ่น · event `summon` เล่นเฟรม summon 0–6 · บอสไม่ถือขวานแบบโค้ดแล้ว |
| `tests/boss-art.test.ts` | ตรวจว่ามีไฟล์ทุกเฟรมที่โค้ดเรียกใช้ |
| `artifacts/hollow-warden-v1/` | zip ต้นฉบับจาก PixelLab (8 ทิศ + อนิเมชัน) |
| `tools/pixellab/` | สคริปต์เรียก API (`pl.mjs`: balance/create/animate/char/zip) + `bbox.ps1` วัดขอบภาพ + `preview.ps1` ทำภาพตัวอย่าง + `requests/` body ที่ใช้สร้างบอสนี้ |

ไม่ได้เปลี่ยนกฎเกมหรือรูปแบบเซฟ (ผลการต่อสู้ยังคำนวณใน core) · sprite pixel แบบเดิมของบอส (`MONSTERS.boss` ใน `PixelSprites.ts`) ยังอยู่ ใช้ในหน้า design และ test

## ค่าใช้จ่าย (บัญชี trial)

| ขั้น | generations |
| --- | --- |
| สร้างตัว (standard, 128 → PixelLab ขยายพื้นที่ภาพเป็น 180) | 1 |
| ยืน 4 เฟรม | 3 |
| เดิน 4 เฟรม | 3 |
| ทุบพื้น 6 เฟรม | 4 |
| เรียกผู้คุ้มกัน 6 เฟรม | 4 |
| **รวม** | **15** (27 → 12) |

**ข้อสังเกต:** ตัวใหญ่ทำให้อนิเมชันแพงขึ้นประมาณ 3 เท่าของตัวขนาด 64 · ตอนแรกส่งคำบรรยายยาวพร้อม `"mode":"v3"` แล้วได้ 422 "Generation failed" (ไม่เสีย generation) พอใช้คำบรรยายสั้นและไม่ระบุ mode ก็ผ่าน · อนิเมชันใช้เวลาท่าละ 3–8 นาที

ID: character `4b770271-7321-4d41-b406-e164c17c3124` · animation groups: idle `dd3276ab-45a0-4ead-b368-43b23d085718`, walk `d10e5427-b6af-453b-9903-ee6e817e3fdf`, slam `1f154435-4686-4c5e-bada-13b62e40530e`, summon `833f7cc4-a805-44e0-8d30-ab544c4e98f6` (เป็น ID ไม่ใช่ token)

## วิธีใช้สคริปต์ (ครั้งถัดไป)

```powershell
$env:PIXELLAB_API_TOKEN=[Environment]::GetEnvironmentVariable('PIXELLAB_API_TOKEN','User')
node tools/pixellab/pl.mjs balance
node tools/pixellab/pl.mjs create tools/pixellab/requests/<create>.json out.json
node tools/pixellab/pl.mjs animate tools/pixellab/requests/<anim>.json out.json
node tools/pixellab/pl.mjs zip <character_id> artifacts/<name>/pixellab-complete.zip
```

## ทดสอบ

test 111/111, TypeScript และ build ผ่าน · ตรวจในเบราว์เซอร์ (dev hook `window.__embermarch`): ห้องบอสใช้เฟรมครบทุกท่า (ยืน 5, เดิน, ทุบ 7, เรียก 7) · ง้างทุบหนักพร้อมวงแดง · เรียก Warden's Guard ที่ HP 2/3 · มือถือ 375×812 ไม่บัง HUD · ไม่มี console error

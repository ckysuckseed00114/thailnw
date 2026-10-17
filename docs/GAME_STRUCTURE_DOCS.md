# โครงสร้างและสถาปัตยกรรมระบบเกม LootMarch (Game Architecture & System Design DOCS)

เอกสารนี้ระบุรายละเอียดโครงสร้างเชิงระบบ (System Architecture), วงจรการทำงานของเกม (Core Game Loop), โครงสร้างข้อมูล (Data Schemas), สูตรคำนวณทางคณิตศาสตร์ (Game Mathematics & Formulas) และโมเดลเศรษฐกิจ (Tokenomics Flow) ของเกม **LootMarch**

---

## 📌 สารบัญ (Table of Contents)
1. [สถาปัตยกรรมระบบโดยรวม (System Architecture Overview)](#1-สถาปัตยกรรมระบบโดยรวม-system-architecture-overview)
2. [วงจรการทำงานหลักของเกม (Core Game Loop & State Machine)](#2-วงจรการทำงานหลักของเกม-core-game-loop--state-machine)
3. [โครงสร้างโมเดลข้อมูล (Entity Data Models & Schemas)](#3-โครงสร้างโมเดลข้อมูล-entity-data-models--schemas)
4. [สูตรการคำนวณทางคณิตศาสตร์ของเกม (Game Math & Formulas)](#4-สูตรการคำนวณทางคณิตศาสตร์ของเกม-game-math--formulas)
5. [ระบบเศรษฐกิจและการหมุนเวียนเหรียญ (Tokenomics Flow: Faucets & Sinks)](#5-ระบบเศรษฐกิจและการหมุนเวียนเหรียญ-tokenomics-flow-faucets--sinks)
6. [ระบบความปลอดภัยและการทำธุรกรรม (Security & Transaction Architecture)](#6-ระบบความปลอดภัยและการทำธุรกรรม-security--transaction-architecture)

---

## 1. สถาปัตยกรรมระบบโดยรวม (System Architecture Overview)

LootMarch ออกแบบสถาปัตยกรรมในรูปแบบ **Server-Authoritative Web3 Game** โดยที่ตรรกะเกม การต่อสู้ การดรอปไอเทม และการคำนวณรางวัลทั้งหมดจะถูกประมวลผลและตรวจสอบโดย Server เพื่อป้องกันการโกง ส่วนหน้าบ้าน (Client) ทำหน้าที่เพียงแสดงผล (Rendering) และรับคำสั่งจากผู้เล่นเท่านั้น

```mermaid
graph TB
    subgraph Client ["Client Layer (Web Application)"]
        UI["User Interface (HUD, Panels, Modals)"]
        Renderer["Combat & Animation Renderer"]
        WalletAdapter["Web3 Wallet Adapter (MetaMask, Rabby)"]
        KeyController["Hotkey & Input Handler"]
    end

    subgraph Backend ["Server-Authoritative Layer (Game Backend)"]
        AuthService["Auth & Signature Verifier"]
        GameLoop["Combat & Dungeon Engine"]
        AFKEngine["AFK Rewards Calculator"]
        DropEngine["RNG & Loot Drop System"]
        MarketService["Marketplace Engine"]
        EconomicService["Token & Reward Ledger"]
        AntiCheat["Anti-Bot / Multi-Account Guard"]
    end

    subgraph Database ["Persistence Layer"]
        UserDB[("User / Hero Profile")]
        InventoryDB[("Inventory & Items")]
        GuildDB[("Guilds & Ranks")]
        LedgerDB[("Transactions & History")]
    end

    subgraph Blockchain ["Blockchain & Web3 Layer"]
        LMCurrency["$LM Token Contract"]
        Treasury["Treasury Vault"]
        Oracle["Price Feed (USD / $LM)"]
    end

    WalletAdapter -->|1. Sign Message / Auth| AuthService
    UI -->|2. Actions: Forge, Equip, Travel, Shop| GameLoop
    GameLoop --> DropEngine
    GameLoop --> AFKEngine
    GameLoop --> Database
    EconomicService --> Blockchain
    AuthService --> UserDB
    MarketService --> InventoryDB
    Treasury --> Oracle
```

### รายละเอียดแต่ละเลเยอร์:
1. **Client Layer (หน้าบ้าน):**
   - พัฒนาด้วย Web Standard จัดการแสดงผลกราฟิก อนิเมชันตัวละคร หน้าต่างกระเป๋า (Inventory), ค่าสถานะ (Stats), แผนที่ (Travel) และร้านค้า (Shop)
   - เชื่อมต่อกระเป๋า Web3 ผ่าน EIP-712 / Personal Sign ในการยืนยันตัวตน
2. **Server-Authoritative Layer (เซิร์ฟเวอร์หลัก):**
   - **Combat & Dungeon Engine:** จำลองการต่อสู้ (Tick rate), จัดการคูลดาวน์สกิล (ทุก 7s), การคำนวณบัฟศาลเจ้า และการเกิดใหม่ของมอนสเตอร์
   - **RNG & Loot Engine:** สุ่มไอเทมดรอป คำนวณ Rarity และไอเทมเข้า Loot Chest
   - **AFK Calculator:** คำนวณผลผลิตออฟไลน์ย้อนหลังอิงจากข้อมูลการเล่นจริง 24 ชั่วโมงล่าสุด
   - **Anti-Bot Guard:** สแกนพฤติกรรม ตรวจสอบการเปิดหลายบัญชี และตรวจสอบสิทธิ์การถือครอง 20,000 $LM
3. **Blockchain & Web3 Layer:**
   - เหรียญ $LM (On-chain Token), Smart Contract คลังรับฝาก (Treasury), ระบบเช็ค Balance กระเป๋า และระบบแปลงราคา Real-time USD ต่อ $LM

---

## 2. วงจรการทำงานหลักของเกม (Core Game Loop & State Machine)

### 2.1 วงจรการลุยห้องดันเจี้ยน (Room State Machine)

```mermaid
stateDiagram-v2
    [*] --> RoomStart: เข้าสู่ห้องใหม่
    RoomStart --> SpawnCheck: ตรวจสอบประเภทห้อง
    
    state SpawnCheck {
        [*] --> CheckShrine
        CheckShrine --> ApplyShrineBuff: สุ่มเจอศาลเจ้า (8%)
        CheckShrine --> SpawnEnemies: ไม่เจอศาลเจ้า
        ApplyShrineBuff --> SpawnEnemies
    }

    SpawnEnemies --> CombatLoop: ศัตรูปรากฏตัว
    
    state CombatLoop {
        [*] --> AutoAttack: โจมตีพื้นฐาน (ทุก 0.6 วินาที)
        AutoAttack --> SkillCheck: ตรวจสอบคูลดาวน์สกิล (7 วินาที)
        SkillCheck --> CastSkill: ปล่อยสกิลตามคลาส (Whirlwind, Pierce, etc.)
        SkillCheck --> CalculateDamage: คำนวณ Crit / Block / Life Steal
        CastSkill --> CalculateDamage
        CalculateDamage --> BossSlamCheck: บอสใช้ท่าทุบ (Slam)
        BossSlamCheck --> DodgeResolution: โอกาสหลบหลีก (Max 50%)
    }

    CombatLoop --> Victory: มอนสเตอร์ตายทั้งหมด
    CombatLoop --> Defeat: ฮีโร่พลังชีวิตเหลือ 0

    state Victory {
        [*] --> RollDrops: สุ่มรับ Loot, XP, $LM, Bone
        RollDrops --> PushToLootChest: ส่งเข้า Loot Chest
        PushToLootChest --> CheckRegionBoss: บอสภูมิภาคหรือไม่?
        CheckRegionBoss --> UnlockNextRegion: ผ่านบอส -> เปิดภูมิภาคถัดไป
        CheckRegionBoss --> NextRoom: ห้องทั่วไป
    }

    state Defeat {
        [*] --> RespawnDelay: รอเวลาเกิดใหม่ 2-3 วินาที
        RespawnDelay --> ResetToRoom1: รีสตาร์ทที่ห้อง 1 ของภูมิภาคปัจจุบัน (ไม่เสียของ)
    }

    NextRoom --> RoomStart
    UnlockNextRegion --> RoomStart
    ResetToRoom1 --> RoomStart
```

---

## 3. โครงสร้างโมเดลข้อมูล (Entity Data Models & Schemas)

### 3.1 ตัวละครผู้เล่น (Hero Entity)
```typescript
interface Hero {
  id: string;
  walletAddress: string;          // ผูกกับกระเป๋าเงิน (1 Hero ต่อ Wallet)
  name: string;                   // ชื่อตัวละคร
  class: 'sword' | 'spear' | 'wand' | 'axe' | 'dagger';
  level: number;                  // เลเวลตัวละคร (เริ่มต้น 1)
  currentXP: number;              // XP สะสมในเลเวลปัจจุบัน
  power: number;                  // ค่าคะแนนพลังรบโดยรวม
  
  // แต้ม Attributes (1 แต้มต่อเลเวล)
  attributes: {
    strength: number;             // +2 Damage ต่อแต้ม
    vitality: number;             // +8 Health ต่อแต้ม
    agility: number;              // +2 Speed, +1% Dodge ต่อแต้ม
    defense: number;              // +1% Block ต่อแต้ม
    vampirism: number;            // +0.25% Life Steal ต่อแต้ม (สูงสุด 20 แต้ม)
  };

  // อุปกรณ์สวมใส่ 7 ช่อง
  equipment: {
    weapon: Item | null;
    helmet: Item | null;
    armor: Item | null;
    shield: Item | null;
    boots: Item | null;
    ring: Item | null;
    amulet: Item | null;
  };

  equippedPetId: string | null;   // สัตว์เลี้ยงที่สวมใส่อยู่ (ได้ครั้งละ 1 ตัว)
  
  // ตำแหน่งในดันเจี้ยนปัจจุบัน
  dungeonProgress: {
    currentFloor: number;         // ชั้นปัจจุบัน (เช่น Floor 1)
    currentRegionIndex: number;   // ภูมิภาคปัจจุบัน (1 - 11)
    currentRoom: number;          // ห้องปัจจุบันในภูมิภาคนั้น
    maxUnlockedFloor: number;     // ชั้นสูงสุดที่ปลดผนึกแล้ว
    maxUnlockedRegion: number;    // ภูมิภาคสูงสุดที่ผ่านแล้ว
    travelCooldownUntil: Date;    // Timestamp คูลดาวน์การ Travel (30 นาที)
  };
}
```

### 3.2 ไอเทมและอุปกรณ์ (Item Entity)
```typescript
type ItemRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'mythic';
type ItemSlot = 'weapon' | 'helmet' | 'armor' | 'shield' | 'boots' | 'ring' | 'amulet';

interface Item {
  id: string;                     // Unique Item ID (ของแต่ละชิ้นมี ID เฉพาะตัว)
  name: string;
  slot: ItemSlot;
  rarity: ItemRarity;
  requiredClass?: 'sword' | 'spear' | 'wand' | 'axe' | 'dagger'; // สำหรับ Weapon เท่านั้น
  
  baseStats: {
    damage?: number;
    health?: number;
    defense?: number;
    speed?: number;
    critChance?: number;
    lifeSteal?: number;
    skillCooldownReduction?: number;
  };

  forgeLevel: number;             // ระดับการตีบวก (0 ถึง +60)
  lmEarningsBonus: number;        // โบนัสเพิ่มการได้รับ $LM (เฉพาะของตีบวกหรืออาวุธ Mythic)
  isLocked: boolean;              // สถานะล็อกไอเทม (ป้องกันการขาย/ย่อย)
}
```

### 3.3 สัตว์เลี้ยง (Pet Entity)
```typescript
type PetType = 'leafhopper' | 'shellby' | 'craboulder' | 'emberkit';

interface Pet {
  id: string;
  type: PetType;
  rarity: ItemRarity;             // สัตว์เลี้ยงมี 6 ระดับความหายาก
  level: number;                  // เลเวลสูงสุด 10
  currentXP: number;              // XP สัตว์เลี้ยง (1 Bone = 10 XP + 1 $LM)
  skill: {
    name: string;
    effectDescription: string;
    value: number;                // ค่าประสิทธิภาพ เพิ่มขึ้น 10% ต่อเลเวล
  };
  isLocked: boolean;
}
```

### 3.4 ข้อมูลเศรษฐกิจผู้เล่น (Economy & Wallet State)
```typescript
interface PlayerEconomyState {
  walletAddress: string;
  gameLMBalance: number;          // ยอดเงินในเกม (In-game balance)
  boneBalance: number;            // ยอดกระดูกวัตถุดิบ (Bone)
  onChainLMBalance: number;       // ยอดที่ถือจริงในกระเป๋า (เช็คย้อนหลัง 12 ชม.)
  
  dailyEarnings: {
    dateUTC: string;              // ว-ด-ป (Reset 00:00 UTC)
    lmEarnedToday: number;        // ยอดรวมฟาร์มวันนี้ (สำหรับคิดเพดาน Daily Line)
    roomsClearedToday: number;    // สูงสุด 400 ห้องต่อวัน (คิด Pass XP)
  };

  vaultKey: {
    tier: 'none' | 'bronze' | 'silver' | 'golden';
    expiresAt: Date | null;
  };

  lastWithdrawAt: Date | null;    // ถอนได้วันละ 1 ครั้ง
}
```

---

## 4. สูตรการคำนวณทางคณิตศาสตร์ของเกม (Game Math & Formulas)

### 4.1 สูตรคำนวณเลเวลตัวละคร (Character Leveling Curve)
- เลเวล 1 ไป เลเวล 2 ต้องการ:
  $$\text{XP}_{\text{Req}}(2) = 250\text{ XP}$$
- ตั้งแต่เลเวล 3 ขึ้นไป อัตราการเติบโตแบบ Exponential เพิ่มขึ้น 16% ทุกเลเวล:
  $$\text{XP}_{\text{Req}}(L) = 1,000 \times (1.16)^{L - 2} \quad (L \ge 3)$$

### 4.2 สูตรการสเกลความยากของดันเจี้ยน (Dungeon Monster Scaling)
คำนวณความแข็งแกร่งของมอนสเตอร์ตามดัชนีภูมิภาคสะสม ($R$):
$$\text{HP}(R) = \text{BaseHP} \times (1.40)^{R - 1}$$
$$\text{Damage}(R) = \text{BaseDMG} \times (1.35)^{R - 1}$$
*(โดยที่แต่ละชั้นมี 11 ภูมิภาค ชั้นที่ 2 ภูมิภาคที่ 1 จะมีค่า $R = 12$)*

### 4.3 สูตรค่าใช้จ่ายในการปลดผนึกชั้น (Floor Seal Cost Formula)
ค่าใช้จ่ายในการปลดผนึกชั้นที่ $F$ ($F \ge 2$):
$$\text{Cost}_{\$LM}(F) = 3,000 \times 2^{F - 2}$$
$$\text{Cost}_{\text{Bone}}(F) = 800 \times 2^{F - 2}$$

### 4.4 สูตรการเพิ่มพลังจากการตีบวก (Forge Stat Scaling)
สเตตัสรวมหลังตีบวกระดับ $+N$ (สูงสุด $N = 60$):
$$\text{Stat}(N) = \text{BaseStat} \times \left(1 + N \times M_{\text{rarity}}\right)$$
โดยที่ค่าตัวคูณความหายาก ($M_{\text{rarity}}$) คือ:
- **Common:** $0.04$ (+4%/เลเวล)
- **Uncommon:** $0.05$ (+5%/เลเวล)
- **Rare:** $0.06$ (+6%/เลเวล)
- **Epic:** $0.08$ (+8%/เลเวล)
- **Legendary:** $0.11$ (+11%/เลเวล)
- **Mythic:** $0.15$ (+15%/เลเวล)

### 4.5 สูตรการย่อยไอเทมที่ตีบวกแล้ว (Forged Salvage Formula)
$$\text{Bone}_{\text{Salvage}} = \text{BaseBone}_{\text{rarity}} + 0.25 \times \sum_{i=1}^{N} \text{BoneCost}(i)$$
*(เหรียญ $LM$ ที่เคยใช้ตีบวกจะไม่ได้รับคืน)*

### 4.6 สูตรการคำนวณรางวัลออฟไลน์ (AFK Rewards Calculation)
$$\text{Reward}_{\text{AFK}} = \text{Duration}_{\text{hours}} \times \left(\overline{\text{Rate}}_{\text{last24h}} \times 0.75\right)$$
- โดยจำกัดระยะเวลาสะสม: $\text{Duration}_{\text{hours}} = \min(\text{TimeElapsed}, 8.0)$

### 4.7 โบนัสการถือเหรียญในกระเป๋า (Holder Bonus Tier)
คำนวณจากยอดคงเหลือต่ำสุดของมูลค่า $LM ในกระเป๋าในรอบ 12 ชั่วโมง ($\text{MinUSD}_{12h}$):
$$\text{Bonus}_{\text{Holder}} = \begin{cases} 
25\% & \text{เมื่อ } \text{MinUSD}_{12h} \ge \$1,000 \\
15\% & \text{เมื่อ } \text{MinUSD}_{12h} \ge \$300 \\
10\% & \text{เมื่อ } \text{MinUSD}_{12h} \ge \$100 \\
5\% & \text{เมื่อ } \text{MinUSD}_{12h} \ge \$20 \\
0\% & \text{เมื่อ } \text{MinUSD}_{12h} < \$20 
\end{cases}$$

---

## 5. ระบบเศรษฐกิจและการหมุนเวียนเหรียญ (Tokenomics Flow: Faucets & Sinks)

```mermaid
flowchart TD
    subgraph Faucets ["แหล่งผลิตเหรียญเข้าสู่ระบบ (Faucets)"]
        F1["Dungeon Room Clears"]
        F2["AFK Rewards (75% rate)"]
        F3["March Pass (Free & Premium)"]
        F4["Referral Rewards (5% bonus)"]
    end

    subgraph PlayerWallet ["กระเป๋าผู้เล่น (In-game / On-chain)"]
        Bal["Player $LM Balance"]
    end

    subgraph Sinks ["ระบบการเผาเหรียญออกจากระบบ (Burn / Sinks)"]
        S1["Forge Upgrades (+1 ถึง +60)"]
        S2["Floor Seals (ปลดผนึกชั้น)"]
        S3["Guild Creation (500,000 $LM BURN)"]
        S4["Marketplace Fees (2.5% Seller + 5% Buyer BURN)"]
        S5["Pet Feeding (1 $LM per 10 XP)"]
        S6["Shop Purchases (Mythic Gear, Vault Keys, Pass)"]
    end

    F1 --> Bal
    F2 --> Bal
    F3 --> Bal
    F4 --> Bal

    Bal --> S1
    Bal --> S2
    Bal --> S3
    Bal --> S4
    Bal --> S5
    Bal --> S6

    S3 -->|Burned forever| DeadAddress[("🔥 Dead / Burn Address")]
    S4 -->|Burned forever| DeadAddress
```

### การควบคุมอัตราเงินเฟ้อ (Anti-Inflation Mechanisms):
1. **Daily Line Decay:** จำกัดอัตราการได้รับ $LM รายวัน เมื่อฟาร์มเกินเพดาน ผลตอบแทนจะลดลงเหลือ 50% และ 20%
2. **Heavy Burn Points:**
   - การสร้างกิลด์เผาทำลายเหรียญ **500,000 $LM** ทันที
   - ค่าธรรมเนียมตลาด 7.5% รวม (ผู้ขาย 2.5% + ผู้ซื้อ 5%) ถูกเผาทำลายทั้งหมด 100%
   - ค่าปลดผนึกชั้นเพิ่มเป็น 2 เท่าแบบทวีคูณ (Exponential)

---

## 6. ระบบความปลอดภัยและการทำธุรกรรม (Security & Transaction Architecture)

### แผนผังขั้นตอนการถอนเงิน (Withdrawal Verification Flow)

```mermaid
sequenceDiagram
    autonumber
    actor Player as ผู้เล่น
    participant Client as Web Client
    participant Server as Game Server (Backend)
    participant Oracle as Anti-Bot & Balance Oracle
    participant Admin as Security Review
    participant Treasury as Smart Contract Vault

    Player->>Client: ส่งคำขอถอนเงิน (ขั้นต่ำ 10,000 $LM)
    Client->>Server: RequestWithdraw(amount, wallet)
    
    Server->>Server: 1. ตรวจสอบการเปิด Floor 4 ขึ้นไป?
    Server->>Server: 2. ตรวจสอบการผูกบัญชี X (Twitter)?
    Server->>Server: 3. ตรวจสอบโควตารายวันตาม Vault Key?
    Server->>Server: 4. ตรวจสอบว่าเคยถอนไปแล้วในรอบวันหรือไม่?
    
    Server->>Oracle: 5. เช็คยอด On-chain Balance 12 ชม. ย้อนหลัง (>= 20,000 $LM)
    Oracle-->>Server: Balance ยืนยันถูกต้อง
    
    Server->>Server: หักยอด $LM ออกจาก Game Balance ทันที
    Server->>Admin: ส่งคำขอเข้าคิวตรวจสอบ (Under Review)
    
    alt ผ่านการตรวจสอบความปลอดภัย
        Admin->>Treasury: Approve & Trigger Contract Transfer
        Treasury-->>Player: โอนเหรียญ $LM เข้า Wallet ผู้เล่นบนบล็อกเชน
    else พบพฤติกรรมผิดปกติ / บอท
        Admin->>Server: Reject Request
        Server-->>Player: คืนยอด $LM เข้าบัญชีเกม หรือพิจารณาแบนหากโกง
    end
```

### มาตรการรักษาความปลอดภัย (Security Rules):
1. **Zero Private Key Exposure:** เซิร์ฟเวอร์ไม่เคยมีส่วนเกี่ยวข้องกับกุญแจส่วนตัว (Private Key) หรือรหัสลับ (Seed Phrase) ของผู้เล่น
2. **Server-Side Authorization:** สิทธิ์การดรอปไอเทม คำนวณความเสียหาย และการคำนวณเหรียญถูกคำนวณบนเซิร์ฟเวอร์แบบปิด 100%
3. **Sybil / Multi-Account Defense:** จำกัดจำนวนกระเป๋าที่เข้าสู่ระบบจากเครื่องเดียวกัน และมีการตรวจสอบความเร็วในการเคลียร์ห้องแบบผิดธรรมชาติ

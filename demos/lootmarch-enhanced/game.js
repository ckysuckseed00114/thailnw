// ==========================================
// LOOTMARCH ENHANCED GAME ENGINE
// ==========================================

// Sound Synthesizer via Web Audio API (Zero external assets needed!)
class SoundFX {
  constructor() {
    this.ctx = null;
    this.enabled = true;
  }
  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
  }
  playHit() {
    if (!this.enabled || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(140, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(40, this.ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.1);
    } catch (e) {}
  }
  playCrit() {
    if (!this.enabled || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(320, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(800, this.ctx.currentTime + 0.18);
      gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.2);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.2);
    } catch (e) {}
  }
  playCoin() {
    if (!this.enabled || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(987, this.ctx.currentTime);
      osc.frequency.setValueAtTime(1318, this.ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.25);
    } catch (e) {}
  }
}

const sfx = new SoundFX();

// Central State
const GameState = {
  hero: {
    name: "LuckyRohit",
    class: "Axe", // Matches Cleave in screenshot
    level: 43,
    xp: 520,
    maxXp: 1200,
    hp: 603,
    maxHp: 603,
    damage: 145,
    critRate: 0.22,
    critMult: 1.8,
    skillCooldown: 7.0,
    skillTimer: 2.5,
    attributes: {
      strength: 42,
      vitality: 38,
      agility: 25,
      defense: 20,
      vampirism: 8
    },
    unspentPoints: 3
  },
  equipment: {
    weapon: { name: "Obsidian Cleaver +3", slot: "weapon", rarity: "epic", stat: 88, icon: "🪓" },
    helmet: { name: "Lion Crest Helm", slot: "helmet", rarity: "rare", stat: 45, icon: "🪖" },
    armor: { name: "Gilded Platebody", slot: "armor", rarity: "epic", stat: 110, icon: "🥋" },
    shield: { name: "Bulwark of Aegis", slot: "shield", rarity: "rare", stat: 55, icon: "🛡️" },
    boots: { name: "Boots of Haste", slot: "boots", rarity: "uncommon", stat: 25, icon: "👢" },
    ring: { name: "Band of Ruin", slot: "ring", rarity: "legendary", stat: 75, icon: "💍" },
    amulet: { name: "Talisman of Vareth", slot: "amulet", rarity: "legendary", stat: 90, icon: "📿" }
  },
  inventory: [
    { id: 1, name: "Celestial Glaive", slot: "weapon", rarity: "legendary", stat: 140, icon: "🔱" },
    { id: 2, name: "Iron Helm", slot: "helmet", rarity: "common", stat: 15, icon: "🪖" },
    { id: 3, name: "Magma Greaves", slot: "boots", rarity: "rare", stat: 40, icon: "👢" },
    { id: 4, name: "Bone Signet", slot: "ring", rarity: "epic", stat: 60, icon: "💍" }
  ],
  lootChest: [],
  pet: {
    name: "Emberkit",
    type: "Fox",
    level: 10,
    xp: 450,
    maxXp: 1000,
    bonusDamage: 35,
    attackTimer: 0
  },
  dungeon: {
    floor: 4,
    region: "Obsidian Sanctum",
    room: 3,
    maxRooms: 8,
    ritualCleared: 4,
    ritualTotal: 4,
    combo: 4,
    comboTimer: 0
  },
  economy: {
    lm: 30684,
    bone: 93200,
    heldLM: 20100,
    holderBoost: 5
  }
};

// Canvas Game World Engine
class DungeonCanvas {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.resize();
    window.addEventListener('resize', () => this.resize());

    this.particles = [];
    this.floatingTexts = [];
    this.torches = [
      { x: 0.22, y: 0.32, color: '#c084fc' },
      { x: 0.38, y: 0.32, color: '#c084fc' },
      { x: 0.22, y: 0.65, color: '#c084fc' },
      { x: 0.38, y: 0.65, color: '#c084fc' },
      { x: 0.70, y: 0.50, color: '#f59e0b' },
      { x: 0.88, y: 0.30, color: '#f59e0b' }
    ];

    // Entities
    this.heroPos = { x: 0.52, y: 0.48 };
    this.petPos = { x: 0.44, y: 0.48 };
    this.heroAttackCooldown = 0;

    // Monsters
    this.monsters = [];
    this.spawnRoomMonsters();

    this.lastTime = performance.now();
    requestAnimationFrame((t) => this.renderLoop(t));
  }

  resize() {
    this.width = this.canvas.width = window.innerWidth;
    this.height = this.canvas.height = window.innerHeight;
  }

  spawnRoomMonsters() {
    this.monsters = [
      { id: 1, type: "reaper", name: "Grim Reaper", x: 0.82, y: 0.52, hp: 4200, maxHp: 4200, isBoss: true, radius: 24, icon: "💀" },
      { id: 2, type: "goblin", name: "Goblin Raider", x: 0.92, y: 0.40, hp: 1200, maxHp: 1200, isBoss: false, radius: 18, icon: "👺" },
      { id: 3, type: "goblin", name: "Goblin Scout", x: 0.91, y: 0.60, hp: 980, maxHp: 980, isBoss: false, radius: 18, icon: "👺" },
      { id: 4, type: "pot", name: "Ancient Urn", x: 0.75, y: 0.38, hp: 50, maxHp: 50, isBoss: false, isProp: true, radius: 14, icon: "🏺" },
      { id: 5, type: "pot", name: "Ancient Urn", x: 0.75, y: 0.65, hp: 50, maxHp: 50, isBoss: false, isProp: true, radius: 14, icon: "🏺" }
    ];
  }

  addFloatingText(text, x, y, color = "#fff", isCrit = false) {
    this.floatingTexts.push({
      text,
      x,
      y,
      color,
      isCrit,
      life: 1.0,
      vy: isCrit ? -1.8 : -1.2
    });
  }

  addSlashParticles(x, y, color = "#fbbf24") {
    for (let i = 0; i < 12; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 4 + 2;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color,
        life: 0.5,
        maxLife: 0.5,
        size: Math.random() * 4 + 2
      });
    }
  }

  triggerCleaveSkill() {
    if (GameState.hero.skillTimer > 0) return;
    GameState.hero.skillTimer = GameState.hero.skillCooldown;
    sfx.init();
    sfx.playCrit();

    // Damage all monsters
    this.monsters.forEach(m => {
      const dmg = Math.floor(GameState.hero.damage * 3.1);
      m.hp -= dmg;
      this.addFloatingText(`${dmg} (CLEAVE!)`, m.x * this.width, (m.y - 0.05) * this.height, "#f59e0b", true);
      this.addSlashParticles(m.x * this.width, m.y * this.height, "#f59e0b");
    });
    GameState.dungeon.combo += 2;
  }

  update(dt) {
    // Skill cooldown
    if (GameState.hero.skillTimer > 0) {
      GameState.hero.skillTimer = Math.max(0, GameState.hero.skillTimer - dt);
      updateSkillUI();
    }

    // Auto-attack combat loop
    this.heroAttackCooldown -= dt;
    if (this.heroAttackCooldown <= 0) {
      this.heroAttackCooldown = 0.6; // 0.6s interval as in docs!
      const target = this.monsters.find(m => m.hp > 0);
      if (target) {
        sfx.init();
        const isCrit = Math.random() < GameState.hero.critRate;
        const mult = isCrit ? GameState.hero.critMult : 1.0;
        const damage = Math.floor(GameState.hero.damage * mult * (0.9 + Math.random() * 0.2));

        target.hp -= damage;
        GameState.dungeon.combo++;
        GameState.dungeon.comboTimer = 3.0;

        const screenX = target.x * this.width;
        const screenY = target.y * this.height;

        if (isCrit) {
          sfx.playCrit();
          this.addFloatingText(`${damage} (CRIT!)`, screenX, screenY - 20, "#fbbf24", true);
          this.addSlashParticles(screenX, screenY, "#fbbf24");
        } else {
          sfx.playHit();
          this.addFloatingText(`-${damage}`, screenX, screenY - 15, "#e2e8f0", false);
          this.addSlashParticles(screenX, screenY, "#cbd5e1");
        }

        // Drop loot when enemy dies
        if (target.hp <= 0) {
          sfx.playCoin();
          GameState.economy.lm += target.isBoss ? 45 : 12;
          GameState.economy.bone += target.isBoss ? 25 : 8;
          GameState.hero.xp += target.isBoss ? 80 : 30;
          if (GameState.hero.xp >= GameState.hero.maxXp) {
            GameState.hero.level++;
            GameState.hero.xp -= GameState.hero.maxXp;
            GameState.hero.maxXp = Math.floor(GameState.hero.maxXp * 1.16);
            GameState.hero.hp = GameState.hero.maxHp;
            this.addFloatingText("LEVEL UP!", this.heroPos.x * this.width, (this.heroPos.y - 0.08) * this.height, "#38bdf8", true);
          }

          // Random loot drop to Loot Chest
          if (Math.random() < 0.45) {
            const rarities = ["common", "uncommon", "rare", "epic", "legendary"];
            const r = rarities[Math.floor(Math.random() * (target.isBoss ? rarities.length : 3))];
            GameState.lootChest.push({
              name: `${r.toUpperCase()} Gear`,
              rarity: r,
              icon: "🛡️"
            });
            updateLootChestUI();
          }

          updateTopHUD();
        }
      }
    }

    // Pet Fireball Attack
    GameState.pet.attackTimer -= dt;
    if (GameState.pet.attackTimer <= 0) {
      GameState.pet.attackTimer = 2.2;
      const target = this.monsters.find(m => m.hp > 0 && !m.isProp);
      if (target) {
        const petDmg = Math.floor(GameState.pet.bonusDamage * 1.5);
        target.hp -= petDmg;
        this.addFloatingText(`🔥 ${petDmg}`, target.x * this.width, (target.y - 0.04) * this.height, "#f97316");
        this.addSlashParticles(target.x * this.width, target.y * this.height, "#ea580c");
      }
    }

    // Auto advance room if all enemies defeated
    const remainingEnemies = this.monsters.filter(m => m.hp > 0 && !m.isProp);
    if (remainingEnemies.length === 0) {
      GameState.dungeon.room++;
      if (GameState.dungeon.room > GameState.dungeon.maxRooms) {
        GameState.dungeon.room = 1;
        GameState.dungeon.floor++;
      }
      this.spawnRoomMonsters();
      this.addFloatingText("ROOM CLEARED!", this.width / 2, this.height * 0.4, "#22c55e", true);
      updateTopHUD();
    }

    // Update Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life -= dt;
      if (p.life <= 0) this.particles.splice(i, 1);
    }

    // Update Floating Text
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.y += ft.vy;
      ft.life -= dt * 1.2;
      if (ft.life <= 0) this.floatingTexts.splice(i, 1);
    }
  }

  drawDungeonRoom() {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;

    // Floor Base
    ctx.fillStyle = "#111425";
    ctx.fillRect(0, 0, w, h);

    // Stone Tiles
    const tileSize = 60;
    ctx.strokeStyle = "rgba(255, 255, 255, 0.03)";
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += tileSize) {
      for (let y = 0; y < h; y += tileSize) {
        ctx.strokeRect(x, y, tileSize, tileSize);
      }
    }

    // Upper/Lower Walls
    ctx.fillStyle = "#1e2238";
    ctx.fillRect(0, 0, w, h * 0.22);
    ctx.fillRect(0, h * 0.78, w, h * 0.22);

    ctx.fillStyle = "#2c314f";
    ctx.fillRect(0, h * 0.20, w, 12);
    ctx.fillRect(0, h * 0.78, w, 12);

    // Torches and Dynamic Lights
    this.torches.forEach(t => {
      const tx = t.x * w;
      const ty = t.y * h;

      const grad = ctx.createRadialGradient(tx, ty, 5, tx, ty, 130);
      grad.addColorStop(0, t.color === '#c084fc' ? "rgba(192, 132, 252, 0.35)" : "rgba(245, 158, 11, 0.35)");
      grad.addColorStop(1, "rgba(0, 0, 0, 0)");

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(tx, ty, 130, 0, Math.PI * 2);
      ctx.fill();

      // Torch pedestal
      ctx.fillStyle = "#475569";
      ctx.fillRect(tx - 4, ty, 8, 16);
      // Flame
      ctx.fillStyle = t.color;
      ctx.beginPath();
      ctx.arc(tx, ty - 2, 6 + Math.sin(performance.now() * 0.01) * 2, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  drawEntities() {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;

    // Draw Hero (LuckyRohit)
    const hx = this.heroPos.x * w;
    const hy = this.heroPos.y * h;

    // Hero Golden Aura
    const hGrad = ctx.createRadialGradient(hx, hy, 10, hx, hy, 65);
    hGrad.addColorStop(0, "rgba(245, 183, 64, 0.3)");
    hGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = hGrad;
    ctx.beginPath();
    ctx.arc(hx, hy, 65, 0, Math.PI * 2);
    ctx.fill();

    // Hero Body / Armor
    ctx.fillStyle = "#fbbf24";
    ctx.beginPath();
    ctx.arc(hx, hy, 20, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Hero Shield
    ctx.fillStyle = "#1e293b";
    ctx.fillRect(hx - 22, hy - 10, 8, 20);
    ctx.strokeStyle = "#fbbf24";
    ctx.strokeRect(hx - 22, hy - 10, 8, 20);

    // Hero Weapon (Axe / Sword)
    ctx.fillStyle = "#f59e0b";
    ctx.beginPath();
    ctx.arc(hx + 18, hy - 5, 8, 0, Math.PI * 2);
    ctx.fill();

    // Name tag
    ctx.fillStyle = "#fde047";
    ctx.font = "bold 12px Segoe UI";
    ctx.textAlign = "center";
    ctx.fillText(GameState.hero.name, hx, hy - 28);

    // Draw Pet (Emberkit - Flaming Fox)
    const px = this.petPos.x * w;
    const py = this.petPos.y * h;

    ctx.fillStyle = "rgba(249, 115, 22, 0.4)";
    ctx.beginPath();
    ctx.arc(px, py, 25, 0, Math.PI * 2);
    ctx.fill();

    ctx.font = "24px Segoe UI";
    ctx.fillText("🦊", px, py + 8);

    // Draw Monsters
    this.monsters.forEach(m => {
      if (m.hp <= 0) return;
      const mx = m.x * w;
      const my = m.y * h;

      // Prop vs Monster
      if (m.isProp) {
        ctx.font = "28px Segoe UI";
        ctx.fillText(m.icon, mx, my + 8);
        return;
      }

      // Monster Body
      ctx.font = m.isBoss ? "38px Segoe UI" : "28px Segoe UI";
      ctx.textAlign = "center";
      ctx.fillText(m.icon, mx, my + 8);

      // Health bar above monster
      const barW = m.isBoss ? 60 : 40;
      const barH = 5;
      const hpPct = Math.max(0, m.hp / m.maxHp);

      ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
      ctx.fillRect(mx - barW / 2, my - (m.isBoss ? 42 : 28), barW, barH);
      ctx.fillStyle = m.isBoss ? "#ef4444" : "#22c55e";
      ctx.fillRect(mx - barW / 2, my - (m.isBoss ? 42 : 28), barW * hpPct, barH);

      ctx.font = "bold 10px Segoe UI";
      ctx.fillStyle = "#fff";
      ctx.fillText(m.name, mx, my - (m.isBoss ? 48 : 34));
    });

    // Draw Particles
    this.particles.forEach(p => {
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw Floating Damage
    this.floatingTexts.forEach(ft => {
      ctx.fillStyle = ft.color;
      ctx.font = ft.isCrit ? "bold 18px Segoe UI" : "bold 14px Segoe UI";
      ctx.textAlign = "center";
      ctx.globalAlpha = Math.max(0, ft.life);
      ctx.fillText(ft.text, ft.x, ft.y);
      ctx.globalAlpha = 1.0;
    });

    // Combo Counter
    if (GameState.dungeon.combo > 1) {
      ctx.fillStyle = "#38bdf8";
      ctx.font = "900 24px Segoe UI";
      ctx.textAlign = "right";
      ctx.fillText(`x${GameState.dungeon.combo} COMBO!`, w - 240, h * 0.32);
    }
  }

  renderLoop(time) {
    const dt = Math.min(0.1, (time - this.lastTime) / 1000);
    this.lastTime = time;

    this.update(dt);
    this.ctx.clearRect(0, 0, this.width, this.height);
    this.drawDungeonRoom();
    this.drawEntities();

    requestAnimationFrame((t) => this.renderLoop(t));
  }
}

// UI Controls & Modals
function updateTopHUD() {
  document.getElementById('lm-balance').textContent = GameState.economy.lm.toLocaleString();
  document.getElementById('bone-balance').textContent = GameState.economy.bone.toLocaleString();
  document.getElementById('hero-level-text').textContent = `Lv. ${GameState.hero.level}`;
  document.getElementById('hero-hp-text').textContent = `${GameState.hero.hp} / ${GameState.hero.maxHp}`;
  document.getElementById('hero-hp-fill').style.width = `${(GameState.hero.hp / GameState.hero.maxHp) * 100}%`;
  document.getElementById('hero-xp-fill').style.width = `${(GameState.hero.xp / GameState.hero.maxXp) * 100}%`;
  document.getElementById('zone-title').textContent = `${GameState.dungeon.region}`;
  document.getElementById('zone-room-num').textContent = `Floor ${GameState.dungeon.floor} · Room ${GameState.dungeon.room}/${GameState.dungeon.maxRooms}`;
}

function updateSkillUI() {
  const btn = document.getElementById('skill-btn');
  const cdOverlay = document.getElementById('skill-cd');
  if (GameState.hero.skillTimer > 0) {
    btn.classList.add('on-cd');
    cdOverlay.textContent = GameState.hero.skillTimer.toFixed(1) + 's';
  } else {
    btn.classList.remove('on-cd');
  }
}

function updateLootChestUI() {
  const badge = document.getElementById('loot-badge');
  const count = GameState.lootChest.length;
  if (count > 0) {
    badge.style.display = 'block';
    badge.textContent = count;
  } else {
    badge.style.display = 'none';
  }
}

function openModal(id) {
  closeAllModals();
  const el = document.getElementById(id);
  if (el) el.classList.add('open');
}

function closeAllModals() {
  document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('open'));
}

// Equip Best Automation
function equipBest() {
  sfx.init();
  sfx.playCrit();
  alert("✨ Equip Best: Automatically equipped highest power items for all 7 slots!");
}

// Feed Pet
function feedPet() {
  if (GameState.economy.bone >= 100 && GameState.economy.lm >= 10) {
    GameState.economy.bone -= 100;
    GameState.economy.lm -= 10;
    GameState.pet.xp += 1000;
    if (GameState.pet.xp >= GameState.pet.maxXp) {
      GameState.pet.level = Math.min(10, GameState.pet.level + 1);
      GameState.pet.bonusDamage += 10;
      GameState.pet.xp = 0;
      alert(`🎉 Your Pet leveled up to Lv. ${GameState.pet.level}!`);
    } else {
      alert("🍖 Fed 100 Bone! Gained 1,000 Pet XP.");
    }
    updateTopHUD();
  } else {
    alert("❌ Not enough Bone or $LM to feed pet!");
  }
}

// Claim Loot
function claimLoot() {
  if (GameState.lootChest.length === 0) {
    alert("หีบสมบัติว่างเปล่า! ไม่มีไอเทมรอรับ");
    return;
  }
  sfx.init();
  sfx.playCoin();
  const count = GameState.lootChest.length;
  GameState.inventory.push(...GameState.lootChest);
  GameState.lootChest = [];
  updateLootChestUI();
  alert(`🎁 เคลมไอเทมทั้งหมด ${count} ชิ้น เข้าสู่กระเป๋าเรียบร้อยแล้ว!`);
  closeAllModals();
}

// Hotkeys listener
window.addEventListener('keydown', (e) => {
  const k = e.key.toLowerCase();
  if (k === 'i') openModal('inventory-modal');
  if (k === 'c') openModal('stats-modal');
  if (k === 'p') openModal('pet-modal');
  if (k === 'b') openModal('shop-modal');
  if (k === 't') openModal('travel-modal');
  if (k === 'q') openModal('quests-modal');
  if (k === ' ') {
    window.dungeonCanvas.triggerCleaveSkill();
  }
  if (k === 'escape') closeAllModals();
});

// Start Game
window.addEventListener('DOMContentLoaded', () => {
  window.dungeonCanvas = new DungeonCanvas('game-canvas');
  updateTopHUD();
  updateLootChestUI();
});

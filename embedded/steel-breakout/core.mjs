const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const integer = (v, a, b, fallback = a) => Number.isFinite(v) ? clamp(Math.floor(v), a, b) : fallback;
export const WEAPONS = [
  { name: '脉冲步枪', rate: .24, damage: 24, speed: 29, count: 1, color: 0x72ecf4, description: '均衡单发，稳定制压' },
  { name: '转轮机枪', rate: .085, damage: 11, speed: 32, count: 1, color: 0xffd27a, description: '高射速，弹道轻微散布' },
  { name: '破门霰弹', rate: .64, damage: 19, speed: 26, count: 5, color: 0xffa469, description: '五发扇面，近距爆发' },
  { name: '穿甲轨炮', rate: .8, damage: 84, speed: 48, count: 1, pierce: 5, color: 0x93acff, description: '贯穿装甲与多个目标' },
  { name: '蜂巢飞弹', rate: .48, damage: 44, speed: 19, count: 1, homing: true, splash: 2.1, color: 0xff7878, description: '自动追踪，爆炸波及周围' },
  { name: '灼热喷流', rate: .065, damage: 8, speed: 18, count: 1, life: .3, pierce: 3, color: 0xff7a36, description: '短程持续灼烧，穿透人群' },
  { name: '弹跳电弧', rate: .36, damage: 31, speed: 25, count: 1, bounce: 3, color: 0xb5ff89, description: '触地反弹，跨过低掩体' },
  { name: '重力榴炮', rate: .75, damage: 75, speed: 17, count: 1, gravity: 12, splash: 3, color: 0xf6a4ff, description: '抛物线榴弹，大范围爆破' },
];
export const CHAPTERS = [
  { name: '锈港登陆', area: '吊桥 · 仓库 · 岸防炮', ground: 0x4e6068, back: 0x162b38, glow: 0xf7bb65, boss: '堡垒步行者' },
  { name: '赤砂熔炉', area: '输矿带 · 冶炼塔 · 钻掘场', ground: 0x856150, back: 0x38231d, glow: 0xff824a, boss: '深井钻掘机' },
  { name: '寒脊哨站', area: '冰桥 · 雷达站 · 雪线', ground: 0x6c8c9b, back: 0x142c40, glow: 0x7ce9ff, boss: '冰脊六足蛛' },
  { name: '云上都市', area: '天台 · 通讯阵列 · 航路', ground: 0x586581, back: 0x26263e, glow: 0xa6a2ff, boss: '暮光炮艇' },
  { name: '零号反应堆', area: '冷却管 · 电容室 · 核心', ground: 0x3e6763, back: 0x102f30, glow: 0x7cfac0, boss: '棱镜反应炉' },
  { name: '天穹铸舰厂', area: '装甲线 · 加速环 · 舰桥', ground: 0x6b5a75, back: 0x251d35, glow: 0xff9ec8, boss: '天穹无畏舰' },
];
export const LEVELS = Array.from({ length: 18 }, (_, id) => {
  const chapter = Math.floor(id / 3), stage = id % 3, length = 58 + chapter * 5 + stage * 7;
  const platforms = [{ x: 0, y: 0, w: length }];
  const hazards = [];
  for (let j = 0; j < 4 + chapter; j++) {
    const x = 12 + j * (length - 22) / (4 + chapter);
    platforms.push({ x, y: 2.2 + ((j + stage) % 3) * .9, w: 4 + ((id + j) % 3), moving: chapter === 3 && j % 2 === 1 });
    if ((j + stage) % 2 === 0) hazards.push({ x: x + 1.4, w: 2 + (chapter % 2), type: chapter === 2 ? 'ice' : chapter === 4 ? 'electric' : 'fire', phase: j * .8 });
  }
  const objectives = stage === 1 ? [Math.round(length * .38), Math.round(length * .7)] : [];
  return { id, chapter, stage, name: ['突破封锁', '切断能源', '决战'][stage], length, platforms, hazards, objectives, boss: stage === 2 ? chapter : null };
});

export function createSteel(levelId = 0, weapon = 0) {
  const level = LEVELS[integer(levelId, 0, 17)], enemies = [];
  const types = ['guard', 'drone', 'turret', 'shield', 'hopper', 'sniper'];
  let id = 1;
  for (let j = 0; j < 7 + level.chapter * 2 + level.stage; j++) {
    const x = 14 + j * (level.length - 24) / (7 + level.chapter * 2 + level.stage), type = types[(j + level.chapter + level.stage) % types.length];
    const hp = type === 'shield' ? 100 : type === 'turret' ? 85 : type === 'drone' ? 36 : 52;
    enemies.push({ id: id++, type, x, origin: x, y: type === 'drone' ? 3.2 : 0, hp, maxHp: hp, cooldown: 1.4 + j * .21, phase: j });
  }
  if (level.boss !== null) {
    const hp = 600 + level.chapter * 135;
    enemies.push({ id: id++, type: 'boss', boss: level.boss, x: level.length - 9, origin: level.length - 9, y: level.boss === 3 ? 4 : 0, hp, maxHp: hp, cooldown: 2, phase: 0 });
  }
  return {
    level, player: { x: 2, y: 0, vy: 0, grounded: true, facing: 1, hp: 100, invuln: 0, cooldown: 0, weapon: integer(weapon, 0, 7), arsenal: [...new Set([0, integer(weapon, 0, 7)])], grenades: 4, grenadeCooldown: 0 },
    enemies, bullets: [], particles: [], time: 0, score: 0, status: 'playing', nextId: 100,
    targets: level.objectives.map(x => ({ id: id++, x, y: 0, hp: 100, maxHp: 100 })),
    pickups: Array.from({ length: 4 }, (_, j) => ({ id: id++, x: 8 + j * (level.length - 14) / 4, y: 0, weapon: (level.id + j + 1) % 8 })),
  };
}
function spark(s, x, y, color, count = 8) {
  for (let i = 0; i < count; i++) s.particles.push({ id: s.nextId++, x, y, vx: Math.cos(i * 2.4) * (2 + i % 3), vy: Math.sin(i * 2.4) * 4 + 3, life: .5, color });
}
function hurt(s, damage) {
  if (s.player.invuln > 0) return;
  s.player.hp = Math.max(0, s.player.hp - damage); s.player.invuln = 1.15; spark(s, s.player.x, s.player.y + .8, 0xff6677);
}
function fire(s, owner, x, y, vx, vy, damage, extras = {}) {
  s.bullets.push({ id: s.nextId++, owner, x, y, vx, vy, damage, life: 2.4, r: .16, hit: [], ...extras });
}
function explode(s, b) {
  spark(s, b.x, b.y, b.color || 0xffbc64, 15);
  if (b.splash) for (const e of [...s.enemies, ...s.targets]) if (Math.hypot(e.x - b.x, e.y + .7 - b.y) < b.splash) e.hp -= b.damage * .65;
}
export function stepSteel(s, input = {}, dt = 1 / 60) {
  if (s.status !== 'playing') return;
  dt = clamp(Number.isFinite(dt) ? dt : 0, 0, .04); s.time += dt;
  const p = s.player, move = clamp(input.move || 0, -1, 1);
  p.invuln = Math.max(0, p.invuln - dt); p.cooldown = Math.max(0, p.cooldown - dt); p.grenadeCooldown = Math.max(0, p.grenadeCooldown - dt);
  if (move) p.facing = Math.sign(move);
  p.x = clamp(p.x + move * 6.8 * dt, .5, s.level.length - .5);
  if (input.jump && p.grounded) { p.vy = 10.4; p.grounded = false; }
  const oldY = p.y; p.vy -= 23 * dt; p.y += p.vy * dt; p.grounded = false;
  for (const platform of s.level.platforms) {
    const top = platform.y + (platform.moving ? Math.sin(s.time * 1.2 + platform.x) * .5 : 0);
    if (p.x > platform.x - .2 && p.x < platform.x + platform.w + .2 && p.vy <= 0 && oldY >= top - .06 && p.y <= top) { p.y = top; p.vy = 0; p.grounded = true; }
  }
  if (p.y < -5) { hurt(s, 30); p.y = 0; p.x = Math.max(2, p.x - 3); p.vy = 0; }
  if (input.switch && p.arsenal.length > 1) p.weapon = p.arsenal[(p.arsenal.indexOf(p.weapon) + 1) % p.arsenal.length];
  if (input.shoot && p.cooldown <= 0) {
    const w = WEAPONS[p.weapon]; p.cooldown = w.rate;
    const base = input.aimUp ? Math.PI / 2 : p.facing < 0 ? Math.PI : 0;
    for (let i = 0; i < w.count; i++) {
      const spread = (i - (w.count - 1) / 2) * .14 + (p.weapon === 1 ? Math.sin(s.time * 53) * .04 : 0), a = base + spread;
      fire(s, 'player', p.x + p.facing * .7, p.y + .85, Math.cos(a) * w.speed, Math.sin(a) * w.speed + (w.gravity ? 6 : w.bounce ? -2 : 0), w.damage, { ...w, life: w.life || 2.4, hit: [] });
    }
    spark(s, p.x + p.facing * .9, p.y + .85, w.color, 2);
  }
  if (input.grenade && p.grenades > 0 && p.grenadeCooldown <= 0) { p.grenades--; p.grenadeCooldown = .7; fire(s, 'player', p.x + p.facing * .6, p.y + 1, p.facing * 13, 7, 120, { gravity: 15, splash: 3.4, color: 0xffca7a }); }
  for (const pickup of s.pickups) if (Math.abs(p.x - pickup.x) < 1 && Math.abs(p.y - pickup.y) < 1.4) {
    p.weapon = pickup.weapon; if (!p.arsenal.includes(p.weapon)) p.arsenal.push(p.weapon); pickup.taken = true; p.hp = Math.min(100, p.hp + 9); s.notice = `获得 ${WEAPONS[p.weapon].name} · 生命恢复`;
  }
  s.pickups = s.pickups.filter(v => !v.taken);
  for (const h of s.level.hazards) if (h.type !== 'ice' && p.x > h.x && p.x < h.x + h.w && p.y < .4 && Math.sin(s.time * 1.7 + h.phase) > .15) hurt(s, h.type === 'electric' ? 18 : 12);
  for (const e of s.enemies) {
    if (Math.abs(e.x - p.x) > 24 || e.hp <= 0) continue;
    e.phase = (e.phase || 0) + dt; e.cooldown -= dt;
    const delta = p.x - e.x;
    if (e.type === 'drone') { e.x = e.origin + Math.sin(e.phase) * 2; e.y = 2.2 + Math.sin(e.phase * 1.4) * 1.2; }
    else if (e.type === 'hopper') { e.x += Math.sign(delta) * dt * 1.5; e.y = Math.max(0, Math.sin(e.phase * 2.8) * 2); }
    else if (e.type === 'shield') e.x += Math.sign(delta) * dt * .8;
    else if (e.type === 'boss') { e.x = e.origin + Math.sin(e.phase * .7) * 2; e.y = e.boss === 3 ? 3.3 + Math.sin(e.phase) : e.boss === 2 ? Math.max(0, Math.sin(e.phase * 1.2) * 1.8) : 0; }
    else if (e.type === 'guard') e.x = e.origin + Math.sin(e.phase) * .6;
    if (Math.abs(delta) < (e.type === 'boss' ? 2.2 : .9) && Math.abs(p.y - e.y) < 1.4) hurt(s, e.type === 'boss' ? 22 : 12);
    if (e.cooldown <= 0) {
      const a = Math.atan2(p.y + .8 - (e.y + .8), delta), boss = e.type === 'boss';
      const count = boss ? [5, 3, 7, 4, 10, 9][e.boss] : e.type === 'turret' ? 3 : 1;
      for (let j = 0; j < count; j++) {
        const angle = e.boss === 4 ? s.time * 1.5 + j * Math.PI * 2 / count : a + (j - (count - 1) / 2) * (boss ? .13 : .12);
        fire(s, 'enemy', e.x, e.y + (boss ? 1.2 : .85), Math.cos(angle) * (e.type === 'sniper' ? 17 : boss ? 10 : 8), Math.sin(angle) * (boss ? 10 : 8), boss ? 14 : 10, { color: 0xff5f7b, life: 4, r: boss ? .22 : .16 });
      }
      if (boss && e.boss === 1) fire(s, 'enemy', e.x, .25, Math.sign(delta) * 12, 0, 20, { color: 0xffa064, life: 5, r: .3 });
      e.cooldown = boss ? (e.hp < e.maxHp / 2 ? .8 : 1.25) : e.type === 'sniper' ? 2.6 : 2 + e.id % 3 * .3;
    }
  }
  for (const b of s.bullets) {
    b.life -= dt;
    if (b.homing) { const target = s.enemies.filter(e => e.hp > 0).sort((a, c) => Math.hypot(a.x - b.x, a.y - b.y) - Math.hypot(c.x - b.x, c.y - b.y))[0]; if (target) { const a = Math.atan2(target.y + .7 - b.y, target.x - b.x); b.vx += (Math.cos(a) * 19 - b.vx) * dt * 4; b.vy += (Math.sin(a) * 19 - b.vy) * dt * 4; } }
    b.vy -= (b.gravity || 0) * dt; b.x += b.vx * dt; b.y += b.vy * dt;
    if (b.y < .13 && b.owner === 'player') {
      if (b.bounce > 0) { b.y = .15; b.vy = 6; b.bounce--; } else { explode(s, b); b.life = 0; }
    }
    if (b.owner === 'player' && b.life > 0) for (const e of [...s.enemies, ...s.targets]) {
      if (e.hp <= 0 || b.hit.includes(e.id)) continue;
      const radius = e.type === 'boss' ? 2 : .65;
      if (Math.abs(b.x - e.x) < radius && b.y > e.y - .2 && b.y < e.y + (e.type === 'boss' ? 3 : 1.7)) {
        e.hp -= e.type === 'shield' && !(b.pierce > 1) && Math.sign(b.vx) === -Math.sign(p.x - e.x) ? b.damage * .55 : b.damage;
        b.hit.push(e.id); spark(s, b.x, b.y, b.color, 4);
        if (b.splash) explode(s, b);
        if ((b.pierce || 1) <= b.hit.length) { b.life = 0; break; }
      }
    }
    if (b.owner === 'enemy' && Math.abs(b.x - p.x) < .48 + b.r && Math.abs(b.y - (p.y + .8)) < .7 + b.r) { hurt(s, b.damage); b.life = 0; }
  }
  s.bullets = s.bullets.filter(b => b.life > 0 && b.x > -10 && b.x < s.level.length + 10 && b.y > -2 && b.y < 20);
  for (const e of s.enemies) if (e.hp <= 0) { s.score += e.type === 'boss' ? 2000 : 100; spark(s, e.x, e.y + .8, 0xffbc68, e.type === 'boss' ? 35 : 12); }
  s.enemies = s.enemies.filter(e => e.hp > 0);
  for (const t of s.targets) if (t.hp <= 0) { s.score += 400; spark(s, t.x, 1, 0x72ffd0, 15); }
  s.targets = s.targets.filter(t => t.hp > 0);
  for (const q of s.particles) { q.life -= dt; q.x += q.vx * dt; q.y += q.vy * dt; q.vy -= 12 * dt; }
  s.particles = s.particles.filter(q => q.life > 0);
  if (p.hp <= 0) s.status = 'lost';
  else if (p.x >= s.level.length - 2 && !s.targets.length && !s.enemies.some(e => e.type === 'boss')) { s.status = 'won'; s.score += Math.max(0, Math.round(1500 - s.time * 4)) + p.hp * 5; }
}
export function normalizeSave(value) {
  const v = value && typeof value === 'object' ? value : {}, best = {};
  for (const [k, n] of Object.entries(v.best && typeof v.best === 'object' ? v.best : {})) if (/^\d+$/.test(k) && +k < 18 && Number.isFinite(n) && n >= 0) best[k] = Math.min(9999999, Math.floor(n));
  return { version: 1, unlocked: integer(v.unlocked, 1, 18), best };
}
export function recordResult(save, state) { const next = normalizeSave(save); if (state.status === 'won') { next.unlocked = Math.min(18, Math.max(next.unlocked, state.level.id + 2)); next.best[state.level.id] = Math.max(next.best[state.level.id] || 0, state.score); } return next; }

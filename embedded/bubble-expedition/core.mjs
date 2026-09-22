const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
const integer = (n, a, b) => Number.isFinite(n) ? clamp(Math.floor(n), a, b) : a;
export const WORLDS = [
  { name: '苔糖花园', description: '树冠阶梯 · 温和风场', sky: 0x183c38, floor: 0x7caa78, accent: 0xd4f296, wind: .12, gravity: 23 },
  { name: '汽水海湾', description: '浮动珊瑚 · 上升气流', sky: 0x153745, floor: 0x69aab9, accent: 0x95e8ea, wind: .7, gravity: 21 },
  { name: '烘焙云城', description: '弹簧台面 · 跳跃追兵', sky: 0x3c2a43, floor: 0xc790a1, accent: 0xf6ca9b, wind: -.5, gravity: 19 },
  { name: '玻璃极光', description: '滑动冰台 · 冰刺节律', sky: 0x233747, floor: 0x7cabca, accent: 0xb8c5ff, wind: 1.1, gravity: 22 },
  { name: '月桂钟楼', description: '升降平台 · 齿轮卫兵', sky: 0x30283e, floor: 0x8c85b2, accent: 0xefd99b, wind: -.8, gravity: 23 },
];
export const ENEMY_TYPES = [
  { id: 'walker', name: '栗栗', description: '沿平台来回巡游', hp: 1, color: 0xefb876 },
  { id: 'hopper', name: '蹦豆', description: '会跳跃追赶玩家', hp: 1, color: 0xbfa0e8 },
  { id: 'flyer', name: '云蝠', description: '在空中巡航，需要抬高泡泡', hp: 1, color: 0x83d1d7 },
  { id: 'shell', name: '壳卫', description: '第一发打碎外壳，第二发捕获', hp: 2, color: 0xe7918c },
  { id: 'spitter', name: '胡椒壶', description: '会投掷小种子，利用平台遮挡', hp: 1, color: 0xa6bd73 },
];
const BOSS_NAMES = ['树心长老', '汽泡领航鲸', '焦糖钟卫', '冰冠水母', '月桂梦龙'];
export const LEVELS = Array.from({ length: 50 }, (_, id) => {
  const world = Math.floor(id / 10), stage = id % 10, platforms = [{ x: -11, y: 0, w: 22 }];
  const patterns = [
    [[-9, 2.4, 5], [3, 2.4, 5], [-3, 4.8, 6], [-9, 7.2, 5], [4, 7.2, 5], [-3, 9.6, 6]],
    [[-9, 2.2, 5], [-2, 4.4, 4], [4, 6.6, 5], [-2, 8.8, 4], [-9, 6.6, 4]],
    [[-7, 2.3, 4], [3, 2.3, 4], [-3, 4.6, 6], [-8, 6.9, 4], [4, 6.9, 4], [-3, 9.2, 6]],
    [[-10, 2.2, 7], [3, 2.2, 7], [-5, 4.4, 10], [-10, 6.6, 6], [4, 6.6, 6], [-4, 8.8, 8]],
    [[-8, 2.2, 5], [0, 4.4, 5], [-7, 6.6, 5], [0, 8.8, 5], [-4, 10.6, 6]],
  ];
  for (const [j, [x, y, w]] of patterns[stage % 5].entries()) platforms.push({ x: x + (stage >= 5 ? .4 * ((j % 2) ? -1 : 1) : 0), y, w, moving: world === 4 && j % 2 === 0, spring: world === 2 && j % 3 === 0, ice: world === 3 });
  const enemies = Array.from({ length: 3 + Math.floor(stage / 2) + world }, (_, j) => {
    const platform = platforms[1 + (j + stage) % (platforms.length - 1)], type = ENEMY_TYPES[(j + world + Math.floor(stage / 3)) % Math.min(5, 2 + world)].id;
    return { type, x: platform.x + platform.w * (.25 + (j % 3) * .22), y: platform.y, platform: 1 + (j + stage) % (platforms.length - 1) };
  });
  const hazards = world >= 3 ? Array.from({ length: 1 + stage % 3 }, (_, j) => ({ x: -4 + j * 4 + stage % 2, y: 0, w: 1.5, phase: j + stage })) : [];
  return { id, world, stage, name: ['树枝阶梯', '风的回廊', '双塔花台', '蜂蜜横桥', '螺旋空庭', '薄暮阶梯', '回声长廊', '竞速双塔', '钟声横桥', '守护者之庭'][stage], platforms, enemies, hazards, wind: WORLDS[world].wind + (stage % 3) * .1, boss: stage === 9 ? BOSS_NAMES[world] : null };
});
export function createBubble(levelId = 0, character = 0) {
  const level = LEVELS[integer(levelId, 0, 49)]; let id = 1;
  const enemies = level.enemies.map(e => ({ ...e, id: id++, origin: e.x, vx: id % 2 ? 1.1 : -1.1, vy: 0, hp: ENEMY_TYPES.find(t => t.id === e.type).hp, captured: false, angry: false, cooldown: 2 + id % 3, grounded: true, phase: id }));
  if (level.boss) enemies.push({ id: id++, type: 'boss', boss: true, x: 0, origin: 0, y: 0, vx: 1.4, vy: 0, hp: 5 + level.world * 2, maxHp: 5 + level.world * 2, captured: false, angry: false, cooldown: 2, grounded: true, phase: 0 });
  return { level, character: integer(character, 0, 2), player: { x: -8.5, y: 0, vx: 0, vy: 0, hp: 3, facing: 1, grounded: true, cooldown: 0, popCooldown: 0, invuln: 0 }, enemies, bubbles: [], seeds: [], particles: [], fruit: [], score: 0, combo: 0, bestCombo: 0, time: 0, status: 'playing', nextId: 100 };
}
export const CHARACTERS = [
  { name: '露米', description: '均衡 · 泡泡持续12秒', color: 0x96dfba, speed: 5.4, jump: 11.2, bubbleLife: 12, rate: .28 },
  { name: '桃桃', description: '轻快 · 跳跃更高', color: 0xf3aaa6, speed: 6.3, jump: 12.4, bubbleLife: 9, rate: .3 },
  { name: '团团', description: '巧手 · 吹泡更快', color: 0xb0b9f4, speed: 4.8, jump: 11.2, bubbleLife: 10, rate: .19 },
];
function spark(s, x, y, color, n = 10) { for (let i = 0; i < n; i++) s.particles.push({ id: s.nextId++, x, y, vx: Math.cos(i * 2.4) * 2.5, vy: Math.sin(i * 2.4) * 2.5 + 2, life: .6, color }); }
function hurt(s) { if (s.player.invuln > 0) return; s.player.hp = Math.max(0, s.player.hp - 1); s.player.invuln = 2; spark(s, s.player.x, s.player.y + .8, 0xffa7ad, 12); }
function platformY(s, platform) { return platform.y + (platform.moving ? Math.sin(s.time * .8 + platform.x) * .55 : 0); }
function gravity(s, e, dt, gravityValue) {
  const oldY = e.y; e.vy -= gravityValue * dt; e.y += e.vy * dt; e.grounded = false;
  for (const [index, platform] of s.level.platforms.entries()) {
    const top = platformY(s, platform);
    if (e.x > platform.x - .15 && e.x < platform.x + platform.w + .15 && e.vy <= 0 && oldY >= top - .08 && e.y <= top) { e.y = top; e.vy = 0; e.grounded = true; e.platform = index; if (platform.spring) { e.vy = 13; e.grounded = false; } }
  }
}
export function popChain(s, bubbleId) {
  const first = s.bubbles.find(b => b.id === bubbleId); if (!first) return 0;
  const queue = [first], visited = new Set(); let count = 0;
  while (queue.length) {
    const b = queue.shift(); if (visited.has(b.id)) continue; visited.add(b.id);
    if (b.enemy !== undefined && b.enemy !== null) { const enemy = s.enemies.find(e => e.id === b.enemy); if (enemy) { enemy.hp = 0; enemy.popped = true; count++; s.score += count * (enemy.boss ? 1000 : 100); s.fruit.push({ id: s.nextId++, x: b.x, y: b.y, vy: 2, value: 50, age: 0 }); } }
    spark(s, b.x, b.y, 0xb5f0e0, 12);
    for (const other of s.bubbles) if (!visited.has(other.id) && other.enemy !== undefined && Math.hypot(other.x - b.x, other.y - b.y) < 2.1) queue.push(other);
  }
  s.combo = count; s.bestCombo = Math.max(s.bestCombo, count); s.bubbles = s.bubbles.filter(b => !visited.has(b.id)); s.enemies = s.enemies.filter(e => !e.popped); if (count > 1) s.notice = `${count} 连泡！`; return count;
}
export function stepBubble(s, input = {}, dt = 1 / 60) {
  if (s.status !== 'playing') return;
  dt = clamp(Number.isFinite(dt) ? dt : 0, 0, .04); s.time += dt;
  const p = s.player, character = CHARACTERS[s.character], world = WORLDS[s.level.world];
  for (const key of ['cooldown', 'popCooldown', 'invuln']) p[key] = Math.max(0, p[key] - dt);
  const move = clamp(input.move || 0, -1, 1); if (move) p.facing = Math.sign(move);
  if (s.level.world === 3 && p.grounded) p.vx += (move * character.speed - p.vx) * Math.min(1, dt * 5); else p.vx = move * character.speed;
  p.x = clamp(p.x + p.vx * dt, -10.3, 10.3);
  if (input.jump && p.grounded) { p.vy = character.jump; p.grounded = false; }
  if (p.y < -4) { hurt(s); p.x = -8.5; p.y = 0; p.vy = 0; p.grounded = true; }
  gravity(s, p, dt, world.gravity);
  if (input.blow && p.cooldown <= 0) { p.cooldown = character.rate; s.bubbles.push({ id: s.nextId++, x: p.x + p.facing * .75, y: p.y + .85, vx: p.facing * 8.5, vy: .5, life: 5, age: 0 }); }
  if (input.pop && p.popCooldown <= 0) { const near = s.bubbles.filter(b => b.enemy !== undefined && Math.hypot(b.x - p.x, b.y - p.y - .8) < 2.7).sort((a, b) => Math.hypot(a.x - p.x, a.y - p.y) - Math.hypot(b.x - p.x, b.y - p.y))[0]; if (near) { p.popCooldown = .2; popChain(s, near.id); } }
  for (const e of s.enemies) {
    if (e.captured || e.hp <= 0) continue; e.phase = (e.phase || 0) + dt; e.cooldown -= dt; if (s.time > 180) e.angry = true;
    const speed = (e.angry ? 1.8 : 1) * (e.boss ? 1.5 : e.type === 'hopper' ? 1.35 : 1);
    if (e.type === 'flyer') { e.x = clamp(e.origin + Math.sin(e.phase) * 3, -10, 10); e.y += (4.5 + Math.sin(e.phase * 1.4) * 3 - e.y) * dt; }
    else {
      if (e.type === 'hopper' && e.grounded && e.cooldown <= 0) { e.vy = 10.8; e.vx = Math.sign(p.x - e.x) * 2; e.cooldown = 1.8; }
      if (e.boss && e.grounded && e.cooldown <= 0) { e.vy = 11.5; e.vx = Math.sign(p.x - e.x) * 1.8; e.cooldown = 2.4; for (let i = -1; i <= 1; i++) s.seeds.push({ id: s.nextId++, x: e.x, y: e.y + 1.7, vx: i * 3.8, vy: 6, life: 5 }); }
      e.x += (e.vx || 0) * speed * dt;
      const platform = s.level.platforms[e.platform];
      if (e.grounded && platform && !e.boss && e.type !== 'hopper' && (e.x < platform.x + .25 || e.x > platform.x + platform.w - .25)) e.vx *= -1;
      if (e.x < -10 || e.x > 10) { e.x = clamp(e.x, -10, 10); e.vx *= -1; }
      gravity(s, e, dt, world.gravity);
      if (e.y < -5) { e.x = 0; e.y = 10; e.vy = 0; }
    }
    if (e.type === 'spitter' && e.cooldown <= 0) { s.seeds.push({ id: s.nextId++, x: e.x, y: e.y + 1, vx: Math.sign(p.x - e.x) * 4, vy: 4, life: 4 }); e.cooldown = 3; }
    if (Math.abs(e.x - p.x) < (e.boss ? 1.4 : .68) && Math.abs(e.y - p.y) < (e.boss ? 2 : 1.1)) hurt(s);
  }
  for (const b of s.bubbles) {
    b.life -= dt; b.age = (b.age || 0) + dt;
    b.vx = Number.isFinite(b.vx) ? b.vx : 0; b.vy = Number.isFinite(b.vy) ? b.vy : 0;
    if (b.enemy !== undefined) { b.vx += (s.level.wind - b.vx) * dt * 3; b.vy = .9; }
    else { b.vx *= Math.exp(-dt * 1.45); b.vx += s.level.wind * dt; b.vy = Math.min(1.4, b.vy + dt * .8); }
    b.x += b.vx * dt; b.y = Math.min(11.5, b.y + b.vy * dt); if (Math.abs(b.x) > 10.4) { b.x = clamp(b.x, -10.4, 10.4); b.vx *= -.65; }
    if (b.enemy === undefined) for (const e of s.enemies) if (!e.captured && e.hp > 0 && Math.abs(e.x - b.x) < (e.boss ? 1.7 : .8) && Math.abs(e.y + .75 - b.y) < (e.boss ? 1.7 : .9)) {
      if (e.hp > 1) { e.hp--; b.life = 0; spark(s, b.x, b.y, 0xffc686, 6); } else { e.captured = true; b.enemy = e.id; b.life = character.bubbleLife; b.vx *= .15; b.vy = .9; } break;
    }
    if (b.enemy !== undefined) { const e = s.enemies.find(e => e.id === b.enemy); if (e) { e.x = b.x; e.y = b.y - .7; if (b.life <= 0) { e.captured = false; e.angry = true; e.vy = 0; e.vx = Math.sign(p.x - e.x) * 1.4; } } }
    if (input.jump && b.enemy === undefined && p.vy < 0 && Math.abs(p.x - b.x) < .7 && Math.abs(p.y - b.y) < .5) { p.vy = 11.5; b.life = 0; }
  }
  s.bubbles = s.bubbles.filter(b => b.life > 0);
  for (const seed of s.seeds) { seed.x += seed.vx * dt; seed.vy -= 7 * dt; seed.y += seed.vy * dt; seed.life -= dt; if (Math.hypot(seed.x - p.x, seed.y - p.y - .65) < .65) { hurt(s); seed.life = 0; } }
  s.seeds = s.seeds.filter(q => q.life > 0 && q.y > -.5);
  for (const h of s.level.hazards) if (Math.sin(s.time * 1.8 + h.phase) > .4 && p.x > h.x && p.x < h.x + h.w && p.y < .5) hurt(s);
  for (const fruit of s.fruit) { fruit.age += dt; fruit.vy -= 10 * dt; fruit.y = Math.max(.35, fruit.y + fruit.vy * dt); if (fruit.age > .4 && Math.hypot(fruit.x - p.x, fruit.y - p.y - .5) < 1) { s.score += fruit.value; fruit.taken = true; } }
  s.fruit = s.fruit.filter(v => !v.taken);
  for (const q of s.particles) { q.x += q.vx * dt; q.y += q.vy * dt; q.vy -= 5 * dt; q.life -= dt; } s.particles = s.particles.filter(q => q.life > 0);
  if (p.hp <= 0) s.status = 'lost'; else if (!s.enemies.length) s.status = 'won';
}
export function normalizeSave(value) {
  const v = value && typeof value === 'object' ? value : {}, best = {};
  for (const [k, n] of Object.entries(v.best && typeof v.best === 'object' ? v.best : {})) if (/^\d+$/.test(k) && +k < 50 && Number.isFinite(n) && n >= 0) best[k] = Math.min(9999999, Math.floor(n));
  return { version: 1, unlocked: integer(v.unlocked, 1, 50), best, combo: integer(v.combo, 0, 99) };
}
export function recordResult(save, s) { const v = normalizeSave(save); if (s.status === 'won') { v.unlocked = Math.min(50, Math.max(v.unlocked, s.level.id + 2)); v.best[s.level.id] = Math.max(v.best[s.level.id] || 0, s.score); v.combo = Math.max(v.combo, s.bestCombo); } return v; }

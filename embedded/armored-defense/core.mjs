const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
const integer = (n, a, b) => Number.isFinite(n) ? clamp(Math.floor(n), a, b) : a;
export const TANKS = [
  { name: '游隼', role: '均衡主战', hp: 150, speed: 5.2, rate: .5, damage: 38, shots: 1, color: 0x73cab5, skill: '超速：6秒加速与快射' },
  { name: '铁犀', role: '重甲攻坚', hp: 240, speed: 3.5, rate: .95, damage: 85, shots: 1, splash: 2.2, color: 0xe7bc76, skill: '堡垒：6秒伤害降低75%' },
  { name: '针尾', role: '远程穿甲', hp: 105, speed: 5.6, rate: .95, damage: 100, shots: 1, pierce: 4, color: 0x88a9f3, skill: '电磁脉冲：周围敌军停机' },
  { name: '双子', role: '双联火力', hp: 135, speed: 4.8, rate: .48, damage: 26, shots: 2, color: 0xdf96d1, skill: '弹幕：6秒双联快射' },
  { name: '园丁', role: '战地支援', hp: 170, speed: 4.7, rate: .6, damage: 32, shots: 1, color: 0xa3cf74, skill: '维修：基地+35，车体+55' },
  { name: '猎狐', role: '极速散射', hp: 100, speed: 6.5, rate: .72, damage: 23, shots: 3, color: 0xf39970, skill: '燃烧圈：周围敌军重创' },
];
export const ENEMY_TYPES = [
  { name: '侦察车', hp: 46, speed: 2.3, rate: 2, damage: 12, color: 0xe79769 },
  { name: '突击车', hp: 85, speed: 1.6, rate: 1.65, damage: 16, color: 0xcb6565 },
  { name: '迫击炮', hp: 66, speed: 1.05, rate: 3, damage: 27, color: 0xe0b870 },
  { name: '冲撞车', hp: 120, speed: 2.8, rate: 99, damage: 25, color: 0xa56652 },
  { name: '盾卫', hp: 185, speed: .9, rate: 2.3, damage: 20, color: 0x8a91a9 },
  { name: '爆破手', hp: 72, speed: 1.9, rate: 2, damage: 30, color: 0xf4894b },
  { name: '修复车', hp: 95, speed: 1.25, rate: 2.6, damage: 11, color: 0x9eae71 },
  { name: '指挥重坦', hp: 290, speed: .85, rate: 1.5, damage: 25, color: 0xb884b6 },
];
export const REGIONS = [
  { name: '苔原前哨', floor: 0x536f65, sky: 0x17282b, detail: '林道与砖墙' },
  { name: '沙洲要塞', floor: 0x9a8560, sky: 0x342b24, detail: '水渠与碉堡' },
  { name: '铁锈城区', floor: 0x665b57, sky: 0x2d282d, detail: '巷道与钢掩体' },
  { name: '冰河中继', floor: 0x83969d, sky: 0x23384a, detail: '冰面与长射界' },
  { name: '火山船坞', floor: 0x695951, sky: 0x2d2326, detail: '熔沟与交叉火力' },
];
export const MAPS = Array.from({ length: 40 }, (_, id) => {
  const region = Math.floor(id / 8), layout = id % 8, walls = [], water = []; let next = 1;
  for (let row = 0; row < 4; row++) for (let col = 0; col < 5; col++) {
    if ((col + row + layout) % 4 === 0 || (col === 2 && row === 3)) continue;
    const x = -9 + col * 4.5 + ((row + layout) % 2 ? 1 : 0), y = -7 + row * 4.2 + (layout % 3) * .35;
    walls.push({ id: next++, x: clamp(x, -10, 10), y, w: 1.7 + ((layout + col) % 2) * .7, h: 1.35, hp: 80, kind: (region + row + col + layout) % 5 === 0 ? 'steel' : 'brick' });
  }
  // 基地前的可破坏胸墙让防御和修理具有实际价值。
  for (const x of [-2.3, 0, 2.3]) walls.push({ id: next++, x, y: 9.4, w: 1.5, h: .8, hp: 110, kind: 'brick' });
  if (region !== 0) for (let i = 0; i < 2; i++) water.push({ x: (i ? 1 : -1) * (5 + layout % 3), y: -4 + ((layout + i * 2) % 4) * 3, w: 2, h: 3.4 + region * .2 });
  const waves = Array.from({ length: 3 + Math.floor(region / 2) }, (_, wave) => Array.from({ length: 4 + wave + Math.floor(layout / 3) }, (_, j) => (j + wave + region + Math.floor(layout / 2)) % Math.min(8, 3 + region + Math.floor(layout / 3))));
  if (layout === 7) waves[waves.length - 1].push(7);
  return { id, region, layout, name: ['双侧登陆', '中央长廊', '折线推进', '运河侧翼', '交叉守备', '断桥防线', '四面楚歌', '装甲会战'][layout], walls, water, waves };
});
export function createDefense(mapId = 0, tankId = 0, mode = 'campaign') {
  const map = MAPS[integer(mapId, 0, 39)], tank = TANKS[integer(tankId, 0, 5)];
  return { map, tankId: integer(tankId, 0, 5), mode: mode === 'survival' ? 'survival' : 'campaign', player: { x: 0, y: 7.5, hp: tank.hp, angle: 0, aim: 0, cooldown: 0, skillCooldown: 0, buff: 0, invuln: 0 }, base: { x: 0, y: 12, hp: 160, maxHp: 160 }, walls: map.walls.map(w => ({ ...w })), water: map.water.map(w => ({ ...w })), enemies: [], bullets: [], particles: [], supplies: [], spawnQueue: [], wave: 0, waveDelay: 1.5, spawnDelay: 0, time: 0, score: 0, kills: 0, status: 'playing', nextId: 100 };
}
export function hitWall(wall, damage) { if (wall.kind === 'steel') return false; wall.hp = Math.max(0, wall.hp - Math.max(0, damage)); return wall.hp === 0; }
function blocked(s, x, y, radius = .72) { return x < -11.2 || x > 11.2 || y < -13.2 || y > 13.3 || [...s.walls, ...s.water].some(w => Math.abs(x - w.x) < w.w / 2 + radius && Math.abs(y - w.y) < w.h / 2 + radius); }
function moveBody(s, e, dx, dy) { if (!blocked(s, e.x + dx, e.y)) e.x += dx; if (!blocked(s, e.x, e.y + dy)) e.y += dy; }
function particle(s, x, y, color, n = 8) { for (let i = 0; i < n; i++) s.particles.push({ id: s.nextId++, x, y, vx: Math.cos(i * 2.4) * 3, vy: Math.sin(i * 2.4) * 3, life: .6, color }); }
function shot(s, owner, x, y, angle, damage, extras = {}) { s.bullets.push({ id: s.nextId++, owner, x: x + Math.sin(angle) * 1.1, y: y - Math.cos(angle) * 1.1, vx: Math.sin(angle) * 20, vy: -Math.cos(angle) * 20, damage, life: 2.2, hit: [], ...extras }); }
function splash(s, b) { particle(s, b.x, b.y, 0xffbd74, 14); if (b.splash && b.owner === 'player') for (const e of s.enemies) if (Math.hypot(e.x - b.x, e.y - b.y) < b.splash) e.hp -= b.damage * .45; }
function beginWave(s) {
  const next = s.map.waves[s.wave] || Array.from({ length: Math.min(18, 6 + s.wave) }, (_, i) => (i + s.wave) % 8);
  s.wave++; s.spawnQueue = [...next]; s.spawnDelay = .2; s.notice = `第 ${s.wave} 波 · 敌军 ${next.length} 辆`;
}
export function stepDefense(s, input = {}, dt = 1 / 60) {
  if (s.status !== 'playing') return;
  dt = clamp(Number.isFinite(dt) ? dt : 0, 0, .04); s.time += dt;
  const p = s.player, tank = TANKS[s.tankId];
  for (const k of ['cooldown', 'skillCooldown', 'buff', 'invuln']) p[k] = Math.max(0, p[k] - dt);
  let x = clamp(input.x || 0, -1, 1), y = clamp(input.y || 0, -1, 1), length = Math.hypot(x, y);
  if (length > 1) { x /= length; y /= length; }
  if (length) { p.angle = Math.atan2(x, -y); moveBody(s, p, x * tank.speed * dt * (p.buff && s.tankId === 0 ? 1.6 : 1), y * tank.speed * dt * (p.buff && s.tankId === 0 ? 1.6 : 1)); }
  if (Number.isFinite(input.aim)) p.aim = input.aim; else if (input.turn) p.aim += input.turn * 2.7 * dt; else if (length) p.aim = p.angle;
  if (input.skill && p.skillCooldown <= 0) {
    p.skillCooldown = 20; p.buff = 6;
    if (s.tankId === 4) { p.hp = Math.min(tank.hp, p.hp + 55); s.base.hp = Math.min(160, s.base.hp + 35); }
    if (s.tankId === 2) for (const e of s.enemies) if (Math.hypot(e.x - p.x, e.y - p.y) < 9) e.stunned = 5;
    if (s.tankId === 5) for (const e of s.enemies) if (Math.hypot(e.x - p.x, e.y - p.y) < 6) e.hp -= 140;
    particle(s, p.x, p.y, tank.color, 20); s.notice = tank.skill;
  }
  if (input.shoot && p.cooldown <= 0) {
    p.cooldown = tank.rate * (p.buff && (s.tankId === 0 || s.tankId === 3) ? .5 : 1);
    for (let i = 0; i < tank.shots; i++) {
      const side = tank.shots === 2 ? (i ? .35 : -.35) : 0, spread = tank.shots === 3 ? (i - 1) * .18 : 0;
      shot(s, 'player', p.x + Math.cos(p.aim) * side, p.y + Math.sin(p.aim) * side, p.aim + spread, tank.damage, { color: tank.color, pierce: tank.pierce || 1, splash: tank.splash || 0 });
    }
  }
  if (!s.enemies.length && !s.spawnQueue.length) {
    if (s.wave >= s.map.waves.length && s.mode === 'campaign') s.status = 'won';
    else { s.waveDelay -= dt; if (s.waveDelay <= 0) { beginWave(s); s.waveDelay = 3; } }
  }
  if (s.spawnQueue.length) {
    s.spawnDelay -= dt;
    if (s.spawnDelay <= 0) {
      const type = s.spawnQueue.shift(), t = ENEMY_TYPES[type], id = s.nextId++, hp = Math.round(t.hp * (1 + Math.max(0, s.wave - 3) * .09));
      s.enemies.push({ id, type, x: [-9, 0, 9][id % 3], y: -12.5, hp, maxHp: hp, aim: Math.PI, angle: Math.PI, cooldown: 2, stunned: 0, stuck: 0 }); s.spawnDelay = 1.1;
    }
  }
  for (const e of s.enemies) {
    const t = ENEMY_TYPES[e.type]; e.cooldown -= dt; e.stunned = Math.max(0, (e.stunned || 0) - dt); if (e.stunned > 0) continue;
    const target = e.type === 3 || Math.hypot(p.x - e.x, p.y - e.y) > 7 ? s.base : p;
    const dx = target.x - e.x, dy = target.y - e.y, distance = Math.max(.1, Math.hypot(dx, dy)); e.aim = Math.atan2(dx, -dy);
    let mx = dx / distance, my = dy / distance;
    if (e.type === 2 && distance < 9) { mx = 0; my = 0; }
    const step = t.speed * dt * (e.type === 3 ? 1.2 : 1), wasX = e.x, wasY = e.y;
    if (blocked(s, e.x + mx * .9, e.y + my * .9)) {
      // 尝试沿掩体边缘绕行；直射砖墙同时会开辟新通道。
      const sign = (e.id % 2 ? 1 : -1); const candidates = [[my * sign, -mx * sign], [-my * sign, mx * sign], [1, 0], [-1, 0]];
      const free = candidates.find(([a, b]) => !blocked(s, e.x + a * 1.1, e.y + b * 1.1)); if (free) [mx, my] = free;
    }
    if (distance > 1.7) moveBody(s, e, mx * step, my * step);
    if (Math.hypot(e.x - wasX, e.y - wasY) > .001) e.angle = Math.atan2(mx, -my);
    if (e.type === 6) for (const other of s.enemies) if (other !== e && Math.hypot(other.x - e.x, other.y - e.y) < 4) other.hp = Math.min(other.maxHp, other.hp + 4 * dt);
    if (e.type === 3 && distance < 1.9) { target.hp = Math.max(0, target.hp - 40); e.hp = 0; particle(s, e.x, e.y, 0xff795c, 18); }
    if (e.cooldown <= 0 && e.type !== 3) {
      const count = e.type === 7 ? 3 : 1;
      for (let j = 0; j < count; j++) shot(s, 'enemy', e.x, e.y, e.aim + (j - (count - 1) / 2) * .15, t.damage, { color: 0xff6c6c, life: 3, mortar: e.type === 2, splash: e.type === 5 ? 2 : 0 });
      e.cooldown = t.rate;
    }
  }
  for (const b of s.bullets) {
    b.x += b.vx * dt; b.y += b.vy * dt; b.life -= dt;
    if (!b.mortar) for (const wall of s.walls) if (Math.abs(b.x - wall.x) < wall.w / 2 + .16 && Math.abs(b.y - wall.y) < wall.h / 2 + .16 && wall.hp > 0) {
      hitWall(wall, b.damage); b.life = 0; splash(s, b); break;
    }
    if (b.life <= 0) continue;
    if (b.owner === 'player') for (const e of s.enemies) if (e.hp > 0 && !b.hit.includes(e.id) && Math.hypot(b.x - e.x, b.y - e.y) < 1) {
      e.hp -= b.damage * (e.type === 4 && b.pierce < 2 ? .65 : 1); b.hit.push(e.id); splash(s, b); if (b.hit.length >= b.pierce) { b.life = 0; break; }
    }
    if (b.owner === 'enemy') {
      if (Math.hypot(b.x - p.x, b.y - p.y) < .85) { if (p.invuln <= 0) { p.hp = Math.max(0, p.hp - b.damage * (s.tankId === 1 && p.buff ? .25 : 1)); p.invuln = .25; } b.life = 0; particle(s, p.x, p.y, 0xff7777); }
      else if (Math.hypot(b.x - s.base.x, b.y - s.base.y) < 1.3) { s.base.hp = Math.max(0, s.base.hp - b.damage); b.life = 0; particle(s, s.base.x, s.base.y, 0xffaa77); }
    }
  }
  s.walls = s.walls.filter(w => w.hp > 0); s.bullets = s.bullets.filter(b => b.life > 0 && Math.abs(b.x) < 14 && Math.abs(b.y) < 17);
  for (const e of s.enemies) if (e.hp <= 0) { s.score += 100 + e.type * 30; s.kills++; particle(s, e.x, e.y, 0xffbd73, 15); if (s.kills % 5 === 0) s.supplies.push({ id: s.nextId++, x: e.x, y: e.y }); }
  s.enemies = s.enemies.filter(e => e.hp > 0);
  s.supplies = s.supplies.filter(a => { if (p.hp > 0 && Math.hypot(a.x - p.x, a.y - p.y) < 1.2) { p.hp = Math.min(tank.hp, p.hp + 40); p.skillCooldown = Math.max(0, p.skillCooldown - 5); s.notice = '已拾取修理补给'; return false; } return true; });
  for (const q of s.particles) { q.x += q.vx * dt; q.y += q.vy * dt; q.life -= dt; } s.particles = s.particles.filter(q => q.life > 0);
  if (p.hp <= 0 || s.base.hp <= 0) s.status = 'lost';
}
export function normalizeSave(value) {
  const v = value && typeof value === 'object' ? value : {}, best = {};
  for (const [k, n] of Object.entries(v.best && typeof v.best === 'object' ? v.best : {})) if (/^\d+$/.test(k) && +k < 40 && Number.isFinite(n) && n >= 0) best[k] = Math.min(9999999, Math.floor(n));
  return { version: 1, unlocked: integer(v.unlocked, 1, 40), best, survival: Number.isFinite(v.survival) ? clamp(Math.floor(v.survival), 0, 9999) : 0 };
}
export function recordResult(save, s) { const v = normalizeSave(save); if (s.mode === 'survival') v.survival = Math.max(v.survival, Math.max(0, s.wave - 1)); else if (s.status === 'won') { v.unlocked = Math.min(40, Math.max(v.unlocked, s.map.id + 2)); v.best[s.map.id] = Math.max(v.best[s.map.id] || 0, s.score + s.base.hp * 10); } return v; }

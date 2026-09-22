const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
const number = (n, max = 999999) => typeof n === 'number' && Number.isFinite(n) ? clamp(Math.floor(n), 0, max) : 0;
const dist = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);
function random(s) { s.seed = (Math.imul(s.seed, 1664525) + 1013904223) >>> 0; return s.seed / 4294967296; }

export const MAPS = [
  { name: '萤苔秘林', tag: '盘根与生命泉', duration: 180, color: 0x26574e, hazard: 'roots', boss: '荆冠长老', detail: '绕过古树；靠近泉眼缓慢回复。长老召唤荆棘与幼兽。' },
  { name: '沉钟回廊', tag: '浅水与拱廊', duration: 190, color: 0x335c7f, hazard: 'water', boss: '沉钟守望者', detail: '水渠减速，石廊形成通道。守望者发射交叉钟波。' },
  { name: '余烬火山', tag: '喷发与热浪', duration: 200, color: 0x773e38, hazard: 'lava', boss: '熔核巨像', detail: '熔岩池周期喷发。巨像冲锋，提前离开红色预警。' },
  { name: '镜砂荒原', tag: '流沙与风暴', duration: 210, color: 0x807451, hazard: 'sand', boss: '镜羽女王', detail: '流沙拖慢脚步，飞蛾从侧面包抄。女王会分身。' },
  { name: '望月星台', tag: '引力与脉冲', duration: 220, color: 0x4e486d, hazard: 'gravity', boss: '失序星核', detail: '星环脉冲周期扫过场地，星核发射旋转弹幕。' },
];
export const WEAPONS = [
  { id: 'wisp', name: '萤火杖', mode: 'bolt', damage: 18, cooldown: .68, range: 13, color: 0x9af5d1, catalyst: 'focus', evolution: '千萤星河', desc: '追踪最近目标；进化后穿透并三连发。' },
  { id: 'orbit', name: '月牙刃', mode: 'orbit', damage: 13, cooldown: .55, range: 3.2, color: 0xe6e8ff, catalyst: 'area', evolution: '月相轮舞', desc: '近身旋转双刃；进化后四刃扩大守护圈。' },
  { id: 'sun', name: '晨曦冠', mode: 'radial', damage: 16, cooldown: 2.2, range: 11, color: 0xffcd73, catalyst: 'cooldown', evolution: '不落之日', desc: '八向光矢；进化后十六方向穿透攻击。' },
  { id: 'frost', name: '霜晶扇', mode: 'cone', damage: 15, cooldown: 1.3, range: 8, color: 0x99dfff, catalyst: 'area', evolution: '绝冬羽翼', desc: '面向敌人的霜扇，减速；进化后扩大扇区与减速时间。' },
  { id: 'storm', name: '雷鸣珠', mode: 'chain', damage: 30, cooldown: 1.8, range: 10, color: 0xc7adff, catalyst: 'focus', evolution: '紫电天网', desc: '在附近敌人间跳跃；进化增加链数和距离。' },
  { id: 'thorn', name: '荆棘种', mode: 'field', damage: 10, cooldown: 2.6, range: 8, color: 0xb7da87, catalyst: 'vitality', evolution: '万叶花园', desc: '在敌人脚下铺设持续伤害花阵；进化扩大花阵并回血。' },
  { id: 'return', name: '回声镰', mode: 'return', damage: 24, cooldown: 1.6, range: 12, color: 0xffaaae, catalyst: 'haste', evolution: '逆光双镰', desc: '镰刃飞出再回到身边，两段命中；进化为双刃。' },
  { id: 'comet', name: '陨星锤', mode: 'meteor', damage: 60, cooldown: 3.1, range: 12, color: 0xffa16b, catalyst: 'area', evolution: '天穹碎片', desc: '延迟陨石打击范围目标；进化引发二次冲击。' },
  { id: 'ward', name: '守灯笼', mode: 'aura', damage: 10, cooldown: .9, range: 2.8, color: 0xffe8ad, catalyst: 'vitality', evolution: '万家灯火', desc: '近身光环持续灼烧；进化击退敌人与回复生命。' },
  { id: 'drone', name: '星蜂巢', mode: 'drone', damage: 15, cooldown: .9, range: 13, color: 0x9df1ec, catalyst: 'cooldown', evolution: '蜂群指令', desc: '偏移位置的两只星蜂轮流射击；进化四蜂齐发。' },
  { id: 'spear', name: '贯虹枪', mode: 'pierce', damage: 40, cooldown: 1.5, range: 15, color: 0xe5afd9, catalyst: 'haste', evolution: '虹贯长夜', desc: '穿透直线目标；进化向相反方向同时穿刺。' },
  { id: 'siphon', name: '血月镜', mode: 'siphon', damage: 20, cooldown: 2.8, range: 6, color: 0xf484a4, catalyst: 'focus', evolution: '绯红契约', desc: '吸取附近三名敌人的生命；进化扩大吸取范围。' },
];
export const CHARACTERS = [
  { name: '提灯人 · 洛萤', weapon: 'wisp', hp: 100, speed: 5.2, armor: 0, color: 0x87dac3, passive: '拾取半径 +35%', magnet: 1.35, damage: 1 },
  { name: '守月者 · 岩', weapon: 'orbit', hp: 145, speed: 4.35, armor: 5, color: 0xaeb2dd, passive: '护甲 +5，生命 +45', magnet: 1, damage: 1 },
  { name: '逐日客 · 曦', weapon: 'sun', hp: 90, speed: 5.45, armor: 0, color: 0xf4bf6e, passive: '攻击伤害 +18%', magnet: 1, damage: 1.18 },
  { name: '雪巡者 · 白羽', weapon: 'frost', hp: 105, speed: 5.75, armor: 1, color: 0x9bd6ed, passive: '移动更快，冲刺冷却更短', magnet: 1, damage: 1 },
  { name: '雷语者 · 紫弦', weapon: 'storm', hp: 85, speed: 5.15, armor: 0, color: 0xbca3e2, passive: '所有武器冷却 -15%', magnet: 1.1, damage: 1 },
  { name: '育森者 · 葵', weapon: 'thorn', hp: 115, speed: 4.8, armor: 1, color: 0xbacb76, passive: '每秒恢复 0.55 生命', magnet: 1, damage: 1 },
];
export const PASSIVES = [
  { id: 'focus', name: '聚光镜', desc: '伤害 +12%；萤火 / 雷鸣 / 血月的进化媒介' },
  { id: 'area', name: '广域透镜', desc: '范围 +12%；月刃 / 霜晶 / 陨星的进化媒介' },
  { id: 'cooldown', name: '时砂', desc: '攻击冷却 -7%；晨曦 / 星蜂的进化媒介' },
  { id: 'vitality', name: '生命芽', desc: '生命上限 +15 并治疗；荆棘 / 守灯的进化媒介' },
  { id: 'magnet', name: '引星石', desc: '拾取半径 +35%，额外经验 +8%' },
  { id: 'haste', name: '游风靴', desc: '速度 +8%；回声镰 / 贯虹枪的进化媒介' },
];
export function sanitizeSave(value) {
  const s = value && typeof value === 'object' ? value : {};
  return { version: 1, shards: number(s.shards), vitality: number(s.vitality, 10), power: number(s.power, 10), best: MAPS.map((_, i) => number(s.best?.[i], 99999)), wins: number(s.wins, 99999) };
}
export function createRun({ map = 0, character = 0, save = null, seed = 7613 } = {}) {
  map = number(map, 4); character = number(character, 5); const meta = sanitizeSave(save); const c = CHARACTERS[character];
  const terrain = [];
  for (let i = 0; i < 10; i++) {
    const a = i * Math.PI * .618 + map * .52, r = 7 + i % 3 * 3;
    terrain.push({ x: Math.cos(a) * r, z: Math.sin(a) * r, radius: map === 0 ? 1.15 : map === 1 ? 1.7 : 2, kind: MAPS[map].hazard, solid: map < 2 });
  }
  return { map, character, seed, phase: 'playing', paused: false, time: 0, level: 1, xp: 0, needed: 12, kills: 0, nextId: 1, spawnClock: .65, eliteCount: 0, bossSpawned: false, bossDefeated: false,
    player: { x: 0, z: 0, hp: c.hp + meta.vitality * 5, maxHp: c.hp + meta.vitality * 5, speed: c.speed, armor: c.armor, invulnerable: 0, dashCooldown: 0, dash: 0, facingX: 0, facingZ: -1 },
    damageScale: c.damage * (1 + meta.power * .04), terrain, weapons: [{ id: c.weapon, rank: 1, evolved: false, cooldown: .2 }], passives: {}, choices: [], enemies: [], projectiles: [], enemyShots: [], gems: [], fields: [], effects: [], events: [], rewardClaimed: false };
}
export function damagePlayer(s, amount) {
  if (s.phase !== 'playing' || s.player.invulnerable > 0) return 0;
  const damage = Math.max(1, amount - s.player.armor); s.player.hp = Math.max(0, s.player.hp - damage); s.player.invulnerable = .6;
  s.events.push({ type: 'hurt', amount: damage });
  if (s.player.hp <= 0) s.phase = 'lost'; return damage;
}
function choices(s) {
  const owned = s.weapons.filter(w => w.rank < 4).map(w => ({ id: `weapon:${w.id}`, kind: 'weapon', key: w.id, name: WEAPONS.find(x => x.id === w.id).name, desc: `升至 ${w.rank + 1} 级 · 伤害与频率提高` }));
  const newWeapons = s.weapons.length < 6 ? WEAPONS.filter(w => !s.weapons.some(x => x.id === w.id)).map(w => ({ id: `weapon:${w.id}`, kind: 'weapon', key: w.id, name: w.name, desc: w.desc })) : [];
  const passive = PASSIVES.filter(p => (s.passives[p.id] || 0) < 4).map(p => ({ ...p, id: `passive:${p.id}`, kind: 'passive', key: p.id }));
  const pick = list => list.length ? list.splice(Math.floor(random(s) * list.length), 1)[0] : null;
  const out = [pick(owned), pick(newWeapons), pick(passive)].filter(Boolean);
  const rest = [...owned, ...newWeapons, ...passive]; while (out.length < 3 && rest.length) out.push(pick(rest));
  if (!out.length) out.push({ id: 'heal', kind: 'heal', name: '生命回响', desc: '回复 45 生命' });
  return out;
}
export function grantExperience(s, amount) {
  s.xp += Math.max(0, amount) * (1 + (s.passives.magnet || 0) * .08);
  if (s.phase === 'playing' && s.xp >= s.needed) {
    s.xp -= s.needed; s.level++; s.needed = Math.floor(12 * Math.pow(1.2, s.level - 1)); s.phase = 'upgrade'; s.choices = choices(s);
  }
}
export function evolveWeapons(s) {
  let count = 0;
  for (const w of s.weapons) { const def = WEAPONS.find(x => x.id === w.id);
    if (w.rank === 4 && s.passives[def.catalyst] > 0 && !w.evolved) { w.evolved = true; count++; s.events.push({ type: 'evolve', name: def.evolution }); }
  } return count;
}
export function chooseUpgrade(s, id) {
  if (s.phase !== 'upgrade') return false; const choice = s.choices.find(x => x.id === id); if (!choice) return false;
  if (choice.kind === 'weapon') { const w = s.weapons.find(x => x.id === choice.key); if (w) w.rank++; else s.weapons.push({ id: choice.key, rank: 1, evolved: false, cooldown: .1 }); }
  else if (choice.kind === 'passive') { s.passives[choice.key] = (s.passives[choice.key] || 0) + 1; if (choice.key === 'vitality') { s.player.maxHp += 15; s.player.hp = Math.min(s.player.maxHp, s.player.hp + 30); } }
  else s.player.hp = Math.min(s.player.maxHp, s.player.hp + 45);
  s.choices = []; s.phase = 'playing'; evolveWeapons(s); grantExperience(s, 0); return true;
}
function effect(s, kind, x, z, radius, color, ttl = .35, extra = {}) { s.effects.push({ id: s.nextId++, kind, x, z, radius, color, ttl, life: ttl, ...extra }); }
function strike(s, e, damage, kind) { e.hp -= damage; e.flash = .12; if (kind === 'frost') e.slow = 2; if (kind === 'sun') e.burn = 2; }
function nearEnemies(s, origin, range) { return s.enemies.filter(e => e.hp > 0 && dist(e, origin) <= range).sort((a, b) => dist(a, origin) - dist(b, origin)); }
function projectile(s, origin, direction, w, damage, options = {}) {
  const speed = options.speed || 13;
  s.projectiles.push({ id: s.nextId++, x: origin.x, z: origin.z, vx: Math.cos(direction) * speed, vz: Math.sin(direction) * speed, damage, radius: .22, ttl: 1.6, pierce: 0, kind: w.id, color: w.color, hit: [], ...options });
}
function fireWeapon(s, weapon) {
  const w = WEAPONS.find(x => x.id === weapon.id), p = s.player, evolved = weapon.evolved, rank = weapon.rank;
  const range = w.range * (1 + (s.passives.area || 0) * .12) * (evolved ? 1.22 : 1);
  const targets = nearEnemies(s, p, range), damage = w.damage * (1 + (rank - 1) * .3) * s.damageScale * (1 + (s.passives.focus || 0) * .12) * (evolved ? 1.55 : 1);
  const angle = targets[0] ? Math.atan2(targets[0].z - p.z, targets[0].x - p.x) : Math.atan2(p.facingZ, p.facingX);
  if (w.mode === 'bolt' || w.mode === 'pierce') {
    if (!targets.length) return .12;
    const count = evolved ? w.mode === 'bolt' ? 3 : 2 : 1;
    for (let i = 0; i < count; i++) projectile(s, p, angle + (w.mode === 'pierce' ? i * Math.PI : (i - (count - 1) / 2) * .18), w, damage, { pierce: w.mode === 'pierce' ? 8 : evolved ? 3 : 0, speed: w.mode === 'pierce' ? 22 : 14 });
  } else if (w.mode === 'radial') {
    const count = evolved ? 16 : 8;
    for (let i = 0; i < count; i++) projectile(s, p, i / count * Math.PI * 2 + s.time * .15, w, damage, { pierce: evolved ? 2 : 0 });
  } else if (w.mode === 'orbit') {
    const count = evolved ? 4 : 2;
    for (const e of targets) for (let i = 0; i < count; i++) { const a = s.time * 3.5 + i * Math.PI * 2 / count; if (Math.hypot(e.x - p.x - Math.cos(a) * range * .75, e.z - p.z - Math.sin(a) * range * .75) < 1.5) strike(s, e, damage, w.id); }
    effect(s, 'orbit', p.x, p.z, range, w.color, .3);
  } else if (w.mode === 'cone') {
    for (const e of targets) { const a = Math.atan2(e.z - p.z, e.x - p.x); if (Math.cos(a - angle) > (evolved ? -.1 : .5)) { strike(s, e, damage, 'frost'); if (evolved) e.slow = 3.5; } }
    effect(s, 'cone', p.x, p.z, range, w.color, .35, { angle });
  } else if (w.mode === 'chain') {
    if (!targets.length) return .12; let origin = p; const hit = new Set();
    for (let i = 0; i < (evolved ? 9 : 3 + rank); i++) { const e = nearEnemies(s, origin, i ? evolved ? 7 : 4.5 : range).find(e => !hit.has(e.id)); if (!e) break; hit.add(e.id); strike(s, e, damage * Math.pow(.92, i), w.id); effect(s, 'line', origin.x, origin.z, .1, w.color, .18, { toX: e.x, toZ: e.z }); origin = e; }
  } else if (w.mode === 'field') {
    if (!targets.length) return .12;
    s.fields.push({ id: s.nextId++, x: targets[0].x, z: targets[0].z, radius: evolved ? 3.8 : 2.2, damage, ttl: evolved ? 5 : 3.5, tick: 0, kind: 'thorn', color: w.color, evolved });
  } else if (w.mode === 'return') {
    for (let i = 0; i < (evolved ? 2 : 1); i++) projectile(s, p, angle + i * Math.PI, w, damage, { pierce: 30, ttl: 2, returnAt: 1, age: 0, speed: 12 });
  } else if (w.mode === 'meteor') {
    if (!targets.length) return .12;
    s.fields.push({ id: s.nextId++, x: targets[0].x, z: targets[0].z, radius: evolved ? 4 : 2.8, damage, ttl: .85, tick: .65, kind: 'meteor', color: w.color, evolved, struck: false });
  } else if (w.mode === 'aura') {
    for (const e of targets) { strike(s, e, damage, 'sun'); const d = dist(e, p) || 1; e.x += (e.x - p.x) / d * .3; e.z += (e.z - p.z) / d * .3; }
    if (evolved && targets.length) p.hp = Math.min(p.maxHp, p.hp + 1.5); effect(s, 'ring', p.x, p.z, range, w.color, .5);
  } else if (w.mode === 'drone') {
    if (!targets.length) return .12;
    for (let i = 0; i < (evolved ? 4 : 2); i++) { const a = s.time * 1.8 + i * Math.PI / 2; const origin = { x: p.x + Math.cos(a) * 1.5, z: p.z + Math.sin(a) * 1.5 }; const target = targets[i % targets.length]; projectile(s, origin, Math.atan2(target.z - origin.z, target.x - origin.x), w, damage, { speed: 16 }); }
  } else if (w.mode === 'siphon') {
    for (const e of targets.slice(0, evolved ? 7 : 3)) { strike(s, e, damage, w.id); effect(s, 'line', e.x, e.z, .15, w.color, .3, { toX: p.x, toZ: p.z }); }
    p.hp = Math.min(p.maxHp, p.hp + Math.min(targets.length, evolved ? 7 : 3) * (evolved ? 2 : 1));
  }
  s.events.push({ type: 'attack', weapon: w.id });
  return w.cooldown / (1 + (rank - 1) * .09) * (1 - (s.passives.cooldown || 0) * .07) * (s.character === 4 ? .85 : 1);
}
function spawnEnemy(s, kind, elite = false) {
  const a = random(s) * Math.PI * 2, r = 16.3, scale = 1 + s.time / 180 + s.map * .12;
  const defs = { crawler: [20, 1.65, .48, 9], runner: [15, 3.15, .4, 8], brute: [72, .95, .85, 17], spitter: [35, 1.35, .6, 10], moth: [22, 2.1, .45, 9], boss: [1100 + s.map * 250, 1.15, 1.65, 27] };
  const d = defs[kind]; const hp = d[0] * (elite ? 4 : kind === 'boss' ? 1 : scale);
  s.enemies.push({ id: s.nextId++, kind, x: Math.cos(a) * r, z: Math.sin(a) * r, hp, maxHp: hp, speed: d[1] * (elite ? 1.1 : 1), radius: d[2] * (elite ? 1.4 : 1), touch: d[3], timer: 1, slow: 0, burn: 0, elite, direction: a, charge: 0, flash: 0 });
}
function enemyShot(s, e, angle, speed = 5) { s.enemyShots.push({ id: s.nextId++, x: e.x, z: e.z, vx: Math.cos(angle) * speed, vz: Math.sin(angle) * speed, ttl: 6, radius: .28, damage: e.kind === 'boss' ? 15 : 9 }); }
function moveWithTerrain(s, unit, dx, dz, radius = .4) {
  unit.x = clamp(unit.x + dx, -17, 17); unit.z = clamp(unit.z + dz, -17, 17);
  for (const t of s.terrain) if (t.solid) { const d = dist(t, unit); if (d < t.radius + radius) { const a = Math.atan2(unit.z - t.z, unit.x - t.x); unit.x = t.x + Math.cos(a) * (t.radius + radius); unit.z = t.z + Math.sin(a) * (t.radius + radius); } }
}
export function stepRun(s, input = {}, elapsed = .016) {
  if (s.paused || s.phase !== 'playing') return;
  const dt = clamp(Number.isFinite(elapsed) ? elapsed : 0, 0, .1); const p = s.player; s.events = []; s.time += dt;
  p.invulnerable = Math.max(0, p.invulnerable - dt); p.dashCooldown = Math.max(0, p.dashCooldown - dt); p.dash = Math.max(0, p.dash - dt);
  let x = Number(input.x) || 0, z = Number(input.z) || 0, length = Math.hypot(x, z); if (length > 1) { x /= length; z /= length; }
  if (length > .1) { p.facingX = x; p.facingZ = z; }
  if (input.dash && p.dashCooldown <= 0) { p.dash = .18; p.invulnerable = .24; p.dashCooldown = s.character === 3 ? 2.3 : 3.5; s.events.push({ type: 'dash' }); }
  let speed = p.speed * (1 + (s.passives.haste || 0) * .08) * (p.dash > 0 ? 3.6 : 1);
  if (s.terrain.some(t => (t.kind === 'water' || t.kind === 'sand') && dist(t, p) < t.radius + .8)) speed *= .6;
  moveWithTerrain(s, p, x * speed * dt, z * speed * dt);
  if (s.character === 5 || s.map === 0 && Math.hypot(p.x, p.z) < 2.2) p.hp = Math.min(p.maxHp, p.hp + (s.character === 5 ? .55 : .35) * dt);
  for (const t of s.terrain) if (t.kind === 'lava' && s.time % 8 > 5 && dist(t, p) < t.radius) damagePlayer(s, 11);
  if (s.map === 4 && s.time % 12 > 10.5 && Math.abs(Math.hypot(p.x, p.z) - 8) < .7) damagePlayer(s, 12);
  s.spawnClock -= dt;
  if (s.spawnClock <= 0 && s.enemies.length < 100) { const table = s.time < 25 ? ['crawler', 'crawler', 'runner'] : ['crawler', 'runner', 'brute', 'spitter', s.map === 3 ? 'moth' : 'runner']; spawnEnemy(s, table[Math.floor(random(s) * table.length)]); s.spawnClock = Math.max(.22, 1.1 - s.time / 240); }
  if (s.eliteCount < 2 && s.time >= 45 + s.eliteCount * 50) { spawnEnemy(s, s.eliteCount ? 'spitter' : 'brute', true); s.eliteCount++; s.events.push({ type: 'elite' }); }
  if (!s.bossSpawned && s.time >= MAPS[s.map].duration - 30) { spawnEnemy(s, 'boss'); s.bossSpawned = true; s.events.push({ type: 'boss', name: MAPS[s.map].boss }); }
  for (const e of s.enemies) {
    if (e.hp <= 0) continue; e.timer -= dt; e.slow = Math.max(0, e.slow - dt); e.flash = Math.max(0, (e.flash || 0) - dt);
    if (e.burn > 0) { e.burn -= dt; e.hp -= 5 * dt; }
    const d = dist(e, p) || .01; let vx = (p.x - e.x) / d, vz = (p.z - e.z) / d;
    if (e.kind === 'moth') { const sway = Math.sin(s.time * 3 + e.id) * .8; const old = vx; vx += -vz * sway; vz += old * sway; }
    let speedE = e.speed * (e.slow > 0 ? .35 : 1);
    if (e.kind === 'spitter' && d < 7) speedE *= d < 4 ? -.5 : 0;
    if (e.kind === 'boss') {
      if (e.charge > 0) { e.charge -= dt; vx = Math.cos(e.direction); vz = Math.sin(e.direction); speedE = 10; }
      if (e.timer <= 0) {
        const a = Math.atan2(p.z - e.z, p.x - e.x), count = [8, 4, 6, 10, 14][s.map];
        for (let i = 0; i < count; i++) enemyShot(s, e, a + i / count * Math.PI * 2 + s.time * .06, 4.2 + s.map * .25);
        if (s.map === 2) { e.direction = a; e.charge = .65; }
        if (s.map === 0 || s.map === 3) spawnEnemy(s, s.map === 0 ? 'crawler' : 'moth');
        e.timer = 2.8; effect(s, 'ring', e.x, e.z, 3, 0xff8686, .6);
      }
    } else if (e.kind === 'spitter' && e.timer <= 0) { enemyShot(s, e, Math.atan2(vz, vx), 5); e.timer = e.elite ? 1.2 : 2.5; }
    if (e.kind === 'moth') { e.x += vx * speedE * dt; e.z += vz * speedE * dt; } else moveWithTerrain(s, e, vx * speedE * dt, vz * speedE * dt, e.radius);
    if (dist(e, p) < e.radius + .4) damagePlayer(s, e.touch);
  }
  for (const w of s.weapons) { w.cooldown -= dt; if (w.cooldown <= 0) w.cooldown = fireWeapon(s, w); }
  for (const shot of s.projectiles) {
    shot.ttl -= dt; shot.age = (shot.age || 0) + dt;
    if (shot.returnAt && shot.age > shot.returnAt) { const d = dist(shot, p) || .01; shot.vx = (p.x - shot.x) / d * 13; shot.vz = (p.z - shot.z) / d * 13; if (!shot.returned) { shot.hit = []; shot.returned = true; } if (d < .4) shot.ttl = 0; }
    shot.x += shot.vx * dt; shot.z += shot.vz * dt;
    for (const e of s.enemies) if (e.hp > 0 && !shot.hit.includes(e.id) && dist(shot, e) < shot.radius + e.radius) { strike(s, e, shot.damage, shot.kind); shot.hit.push(e.id); if (shot.pierce-- <= 0) { shot.ttl = 0; break; } }
  }
  s.projectiles = s.projectiles.filter(x => x.ttl > 0);
  for (const shot of s.enemyShots) { shot.x += shot.vx * dt; shot.z += shot.vz * dt; shot.ttl -= dt; if (dist(shot, p) < shot.radius + .35) { damagePlayer(s, shot.damage); shot.ttl = 0; } }
  s.enemyShots = s.enemyShots.filter(x => x.ttl > 0);
  for (const f of s.fields) {
    f.ttl -= dt; f.tick -= dt;
    if (f.tick <= 0 && (!f.struck || f.kind !== 'meteor')) { for (const e of nearEnemies(s, f, f.radius)) { strike(s, e, f.damage, f.kind); e.slow = .7; } if (f.evolved && f.kind === 'thorn') p.hp = Math.min(p.maxHp, p.hp + .8); if (f.kind === 'meteor') { f.struck = true; effect(s, 'burst', f.x, f.z, f.radius, f.color, .6); if (f.evolved) s.fields.push({ id: s.nextId++, x: f.x, z: f.z, radius: f.radius * 1.15, damage: f.damage * .5, ttl: .8, tick: .45, kind: 'meteor', color: f.color, evolved: false, struck: false }); } f.tick = .6; }
  }
  s.fields = s.fields.filter(x => x.ttl > 0);
  for (const e of s.enemies) if (e.hp <= 0) { s.kills++; if (e.kind === 'boss') s.bossDefeated = true; const value = e.kind === 'boss' ? 50 : e.elite ? 18 : e.kind === 'brute' ? 4 : 2; s.gems.push({ id: s.nextId++, x: e.x, z: e.z, value }); effect(s, 'burst', e.x, e.z, e.radius * 2, e.elite ? 0xffd78c : 0x9ce6ce); }
  s.enemies = s.enemies.filter(e => e.hp > 0);
  const magnet = 2.2 * CHARACTERS[s.character].magnet * (1 + (s.passives.magnet || 0) * .35);
  for (const gem of s.gems) { const d = dist(gem, p); if (d < magnet) { gem.x += (p.x - gem.x) * Math.min(1, dt * 9); gem.z += (p.z - gem.z) * Math.min(1, dt * 9); } if (d < .55) { grantExperience(s, gem.value); gem.taken = true; } }
  s.gems = s.gems.filter(x => !x.taken); if (s.gems.length > 300) { const oldest = s.gems.shift(); s.gems[0].value += oldest.value; }
  for (const e of s.effects) e.ttl -= dt; s.effects = s.effects.filter(e => e.ttl > 0);
  if (p.hp <= 0) s.phase = 'lost'; else if (s.time >= MAPS[s.map].duration && s.bossDefeated && s.phase === 'playing') s.phase = 'won';
}
export function settleRun(s, value) {
  const save = sanitizeSave(value); if (s.rewardClaimed || !['won', 'lost'].includes(s.phase)) return save;
  s.rewardClaimed = true; save.shards += Math.floor(s.kills / 4) + s.level * 2 + (s.phase === 'won' ? 60 : 0); save.best[s.map] = Math.max(save.best[s.map], Math.floor(s.time)); if (s.phase === 'won') save.wins++; return sanitizeSave(save);
}
export function buyGrowth(value, key) { const save = sanitizeSave(value); if (!['power', 'vitality'].includes(key) || save[key] >= 10) return null; const cost = 30 + save[key] * 25; if (save.shards < cost) return null; save.shards -= cost; save[key]++; return save; }

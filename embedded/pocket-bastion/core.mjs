const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
const number = (n, max = 999999) => typeof n === 'number' && Number.isFinite(n) ? clamp(Math.floor(n), 0, max) : 0;
const distance = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);
export const BIOMES = [
  { name: '苔原城门', color: 0x577469, rule: '古道狭窄，适合范围火力', modifier: 'none' },
  { name: '赤铜峡谷', color: 0x89654b, rule: '上升热流：火塔伤害 +20%，水系敌军增多', modifier: 'heat' },
  { name: '雾潮群礁', color: 0x47737d, rule: '海雾：射程 -12%，水塔减速更久', modifier: 'fog' },
  { name: '霜钟高地', color: 0x788294, rule: '极寒：敌军移速 -10%，钢甲敌军增多', modifier: 'frost' },
  { name: '星门裂隙', color: 0x696084, rule: '裂隙：暗影波与双入口，光塔伤害 +20%', modifier: 'void' },
];
export const TOWERS = [
  { id: 'arrow', name: '游隼弩塔', element: 'physical', cost: 70, damage: 19, range: 4.6, rate: .7, color: 0xdcc398, desc: '便宜的单体火力；压制轻装快敌。', branches: [{ id: 'rapid', name: '连弩', desc: '射速提高 65%，伤害略减' }, { id: 'long', name: '猎鹰', desc: '射程 +45%，穿甲并优先精英' }] },
  { id: 'fire', name: '赤焰熔炉', element: 'fire', cost: 105, damage: 25, range: 3.8, rate: 1.25, color: 0xfa9a64, desc: '小范围爆焰，灼烧木系敌人。', branches: [{ id: 'inferno', name: '焚城', desc: '爆炸半径 +70%，持续灼烧' }, { id: 'forge', name: '炽锻', desc: '破甲，伤害 +70%' }] },
  { id: 'frost', name: '霜羽冰棱', element: 'ice', cost: 85, damage: 12, range: 4.3, rate: 1.1, color: 0x99ddf1, desc: '减速近路敌军，为主炮争取时间。', branches: [{ id: 'glacier', name: '冰川', desc: '范围减速，冻结已潮湿目标' }, { id: 'lance', name: '冰枪', desc: '伤害三倍，减速较弱' }] },
  { id: 'storm', name: '雷环线圈', element: 'storm', cost: 125, damage: 23, range: 4.4, rate: 1.3, color: 0xc3a0ef, desc: '连锁三目标；潮湿目标额外受伤。', branches: [{ id: 'chain', name: '天网', desc: '连锁六目标，跳跃距离增加' }, { id: 'overload', name: '过载', desc: '单体高压，短暂眩晕' }] },
  { id: 'thorn', name: '森棘苗圃', element: 'nature', cost: 90, damage: 14, range: 4.1, rate: 1.1, color: 0xb1cc7c, desc: '持续毒伤，腐蚀高生命敌人。', branches: [{ id: 'venom', name: '蚀骨', desc: '毒伤按目标生命上限计算' }, { id: 'root', name: '缠根', desc: '定身并削弱护甲' }] },
  { id: 'light', name: '晨星棱镜', element: 'light', cost: 135, damage: 44, range: 5.1, rate: 1.4, color: 0xffec9c, desc: '无视护甲，克制暗影。', branches: [{ id: 'beam', name: '贯星', desc: '穿过目标的直线光束' }, { id: 'sanctuary', name: '庇护', desc: '附近防御塔攻击加速 25%' }] },
  { id: 'mortar', name: '岩壳迫击炮', element: 'physical', cost: 115, damage: 52, range: 5.5, rate: 2.3, color: 0xbcb7ad, desc: '延迟大范围炮弹；不适合追逐快敌。', branches: [{ id: 'cluster', name: '集束', desc: '爆炸范围与伤害提高' }, { id: 'siege', name: '破城', desc: '精英伤害三倍，无视护甲' }] },
  { id: 'water', name: '潮汐莲座', element: 'water', cost: 80, damage: 10, range: 4, rate: 1.2, color: 0x77d6cc, desc: '潮湿与减速，配合雷电/冰霜。', branches: [{ id: 'torrent', name: '洪流', desc: '击退范围内敌军' }, { id: 'bounty', name: '丰潮', desc: '击杀潮湿目标额外赏金' }] },
];
const ENEMIES = {
  scout: { name: '步卒', hp: 52, speed: 1.25, armor: 0, element: 'neutral', reward: 11, leak: 1 },
  runner: { name: '疾行蜂', hp: 34, speed: 2.5, armor: 0, element: 'nature', reward: 12, leak: 1 },
  plated: { name: '铁甲兽', hp: 130, speed: .8, armor: .45, element: 'neutral', reward: 20, leak: 2 },
  ember: { name: '余烬魔', hp: 76, speed: 1.35, armor: .1, element: 'fire', reward: 14, leak: 1 },
  tide: { name: '潮灵', hp: 85, speed: 1.15, armor: 0, element: 'water', reward: 15, leak: 1 },
  healer: { name: '复苏先知', hp: 95, speed: .95, armor: 0, element: 'nature', reward: 22, leak: 2 },
  shade: { name: '影翼', hp: 105, speed: 1.65, armor: .15, element: 'dark', reward: 20, leak: 2 },
  boss: { name: '攻城巨兽', hp: 620, speed: .68, armor: .25, element: 'dark', reward: 90, leak: 5 },
};
export { ENEMIES };
const ROUTES = [
  [[-14, -7], [-7, -7], [-7, 5], [1, 5], [1, -3], [8, -3], [12, 0]],
  [[-14, 7], [7, 7], [7, -6], [-6, -6], [-6, 1], [3, 1], [12, 0]],
  [[-14, -6], [-4, -6], [-4, 6], [4, 6], [4, -6], [9, -6], [12, 0]],
  [[-14, 0], [-9, 7], [-2, 7], [3, -6], [8, -6], [12, 0]],
  [[-14, -7], [-9, -7], [-9, 0], [-2, 0], [-2, 7], [7, 7], [7, 0], [12, 0]],
  [[-14, 7], [-8, 7], [-8, -6], [0, -6], [0, 3], [6, 3], [6, -3], [12, 0]],
];
function segmentDistance(x, z, a, b) { const dx = b[0] - a[0], dz = b[1] - a[1]; const t = clamp(((x - a[0]) * dx + (z - a[1]) * dz) / (dx * dx + dz * dz), 0, 1); return Math.hypot(x - a[0] - dx * t, z - a[1] - dz * t); }
export function levelConfig(index = 0) {
  index = number(index, 29); const biome = Math.floor(index / 6), layout = index % 6;
  const main = ROUTES[layout].map(([x, z], i, list) => [i === 0 || i === list.length - 1 ? x : x + Math.sin(i + biome) * biome * .5, i === list.length - 1 ? z : z * (1 - biome * .035) + (i % 2 ? biome * .2 : -biome * .15)]);
  const paths = [main];
  if (index >= 12) paths.push([[-14, main[0][1] > 0 ? -8 : 8], [-10, main[0][1] > 0 ? -8 : 8], [-10, 0], ...main.slice(2)]);
  const pads = [];
  for (let z = -8; z <= 8; z += 3.2) for (let x = -10; x <= 9; x += 3.2) {
    const d = Math.min(...paths.flatMap(p => p.slice(1).map((point, j) => segmentDistance(x, z, p[j], point))));
    if (d >= 1.55 && d <= 4.8) pads.push({ x: Number(x.toFixed(2)), z: Number(z.toFixed(2)) });
  }
  const pool = [['scout', 'runner', 'plated'], ['ember', 'runner', 'tide', 'plated'], ['tide', 'healer', 'runner', 'shade'], ['plated', 'healer', 'ember', 'runner'], ['shade', 'tide', 'healer', 'plated']][biome];
  const waves = Array.from({ length: 3 + Math.floor(index / 5) }, (_, wave) => {
    const count = 6 + wave * 2 + Math.floor(index / 3); const result = Array.from({ length: count }, (_, i) => ({ kind: pool[(i + wave + layout) % Math.min(pool.length, 2 + Math.floor(wave / 2))], path: i % paths.length, delay: i * Math.max(.4, 1.15 - index * .018) }));
    if (wave === 2 + Math.floor(index / 5)) result.push({ kind: 'boss', path: 0, delay: count * .85 });
    return result;
  });
  return { index, biome, name: `${BIOMES[biome].name} · ${['曲折关', '回环垒', '双折桥', '斜风口', '高台路', '交错门'][layout]}`, paths, pads, waves, gold: 260 + Math.floor(index / 6) * 30, healthScale: 1 + index * .07, rule: BIOMES[biome].rule };
}
export function sanitizeSave(value) { const s = value && typeof value === 'object' ? value : {}; return { version: 1, stars: Array.from({ length: 30 }, (_, i) => number(s.stars?.[i], 3)), tokens: number(s.tokens), power: number(s.power, 10), economy: number(s.economy, 8), challenges: number(s.challenges, 99999) }; }
export function createBattle({ level = 0, challenge = 'standard', save = null } = {}) {
  const config = levelConfig(level), meta = sanitizeSave(save); if (!['standard', 'iron', 'rush'].includes(challenge)) challenge = 'standard';
  return { config, challenge, phase: 'build', paused: false, gold: config.gold + meta.economy * 12, lives: challenge === 'iron' ? 1 : 20, wave: 0, waveTime: 0, time: 0, queue: [], enemies: [], towers: [], impacts: [], effects: [], events: [], nextId: 1, kills: 0, skillCooldown: 0, damageScale: 1 + meta.power * .025, rewardClaimed: false };
}
export function elementDamage(raw, element, enemy) {
  const weak = { fire: 'nature', water: 'fire', storm: 'water', nature: 'water', ice: 'fire', light: 'dark' };
  const resist = { fire: 'water', water: 'nature', storm: 'nature', nature: 'fire', ice: 'ice' };
  const multiplier = weak[element] === enemy.element ? 1.6 : resist[element] === enemy.element || element === enemy.element && element !== 'physical' ? .55 : 1;
  return Math.round(raw * multiplier * (element === 'physical' ? 1 - clamp(enemy.armor || 0, 0, .85) : 1) * 100) / 100;
}
export function towerStats(tower, s = null) {
  const def = TOWERS.find(x => x.id === tower.type); let damage = def.damage * (1 + (tower.level - 1) * .45), range = def.range + (tower.level - 1) * .3, rate = def.rate * (1 - (tower.level - 1) * .08), splash = tower.type === 'fire' ? 1.35 : tower.type === 'mortar' ? 2.1 : 0;
  if (tower.branch === 'rapid') { rate *= .48; damage *= .8; } if (tower.branch === 'long') { range *= 1.45; damage *= 1.3; }
  if (tower.branch === 'inferno') splash *= 1.7; if (tower.branch === 'forge') damage *= 1.7;
  if (tower.branch === 'lance') damage *= 3; if (tower.branch === 'overload') damage *= 2.3;
  if (tower.branch === 'cluster') { splash *= 1.55; damage *= 1.2; } if (tower.branch === 'siege') damage *= 1.65;
  if (s) { damage *= s.damageScale; if (s.config.biome === 1 && tower.type === 'fire' || s.config.biome === 4 && tower.type === 'light') damage *= 1.2; if (s.config.biome === 2) range *= .88;
    if (s.towers.some(t => t !== tower && t.branch === 'sanctuary' && distance(t, tower) < 4.5)) rate *= .75;
  }
  return { ...def, damage, range, rate, splash };
}
export function buildTower(s, slot, type) {
  if (!['build', 'wave'].includes(s.phase) || !Number.isInteger(slot) || !s.config.pads[slot] || s.towers.some(t => t.slot === slot)) return false;
  const def = TOWERS.find(t => t.id === type); if (!def || s.gold < def.cost) return false;
  s.gold -= def.cost; s.towers.push({ id: s.nextId++, slot, type, level: 1, branch: null, cooldown: .15, spent: def.cost, angle: 0, ...s.config.pads[slot] }); s.events.push({ type: 'build' }); return true;
}
export function upgradeCost(tower) { return tower.level === 1 ? Math.round(TOWERS.find(x => x.id === tower.type).cost * .8) : Math.round(TOWERS.find(x => x.id === tower.type).cost * 1.2); }
export function upgradeTower(s, slot, branch = null) {
  const t = s.towers.find(t => t.slot === slot); if (!t || t.level >= 3 || !['build', 'wave'].includes(s.phase)) return false;
  const def = TOWERS.find(x => x.id === t.type); if (t.level === 2 && !def.branches.some(x => x.id === branch)) return false;
  const cost = upgradeCost(t); if (s.gold < cost) return false;
  s.gold -= cost; t.spent += cost; t.level++; if (t.level === 3) t.branch = branch; return true;
}
export function sellTower(s, slot) { const i = s.towers.findIndex(t => t.slot === slot); if (i < 0 || !['build', 'wave'].includes(s.phase)) return 0; const gold = Math.floor(s.towers[i].spent * .7); s.towers.splice(i, 1); s.gold += gold; return gold; }
export function pathLength(path) { return path.slice(1).reduce((total, b, i) => total + Math.hypot(b[0] - path[i][0], b[1] - path[i][1]), 0); }
export function pointOnPath(path, progress) {
  let left = Math.max(0, progress);
  for (let i = 1; i < path.length; i++) { const a = path[i - 1], b = path[i], len = Math.hypot(b[0] - a[0], b[1] - a[1]); if (left < len) return { x: a[0] + (b[0] - a[0]) * left / len, z: a[1] + (b[1] - a[1]) * left / len, ended: false }; left -= len; }
  return { x: path.at(-1)[0], z: path.at(-1)[1], ended: true };
}
export function startWave(s) { if (s.phase !== 'build' || s.wave >= s.config.waves.length) return false; s.queue = s.config.waves[s.wave].map(x => ({ ...x })); s.wave++; s.waveTime = 0; s.phase = 'wave'; s.events.push({ type: 'wave' }); return true; }
function addEffect(s, kind, origin, target, color, radius = 1, life = .3) { s.effects.push({ id: s.nextId++, kind, x: origin.x, z: origin.z, toX: target?.x ?? origin.x, toZ: target?.z ?? origin.z, color, radius, ttl: life, life }); }
export function castSkill(s, x, z) {
  if (s.phase !== 'wave' || s.skillCooldown > 0 || !Number.isFinite(x) || !Number.isFinite(z)) return false;
  s.skillCooldown = 26;
  for (const e of s.enemies) if (Math.hypot(e.x - x, e.z - z) <= 3.8) { e.hp -= 210; e.slow = 2; e.flash = .3; }
  addEffect(s, 'meteor', { x, z }, null, 0xffd084, 3.8, 1); s.events.push({ type: 'skill' }); return true;
}
function hit(s, tower, enemy, stat, factor = 1) {
  let raw = stat.damage * factor; if (tower.branch === 'siege' && enemy.kind === 'boss') raw *= 3; if (enemy.wet > 0 && stat.element === 'storm') raw *= 1.5;
  const ignore = tower.branch === 'long' || tower.branch === 'siege'; enemy.hp -= elementDamage(raw, ignore ? 'light' : stat.element, enemy); enemy.flash = .15;
  if (tower.type === 'fire') { enemy.burn = tower.branch === 'inferno' ? 5 : 2.5; enemy.burnDamage = stat.damage * .18; if (tower.branch === 'forge') enemy.armor = Math.max(0, enemy.armor - .1); }
  if (tower.type === 'frost') { enemy.slow = tower.branch === 'lance' ? .8 : 2.2; if (tower.branch === 'glacier' && enemy.wet > 0) enemy.stun = 1; }
  if (tower.type === 'thorn') { enemy.poison = 4; enemy.poisonDamage = tower.branch === 'venom' ? enemy.maxHp * .035 : stat.damage * .25; if (tower.branch === 'root') { enemy.stun = .7; enemy.armor = Math.max(0, enemy.armor - .08); } }
  if (tower.type === 'water') { enemy.wet = 4; enemy.slow = s.config.biome === 2 ? 2.5 : 1.5; if (tower.branch === 'bounty') enemy.bounty = true; if (tower.branch === 'torrent') { const push = Math.min(1.1, Math.max(0, 6 - (enemy.pushed || 0))); enemy.distance = Math.max(0, enemy.distance - push); enemy.pushed = (enemy.pushed || 0) + push; } }
  if (tower.branch === 'overload') enemy.stun = .6;
}
function towerFire(s, tower, stat, target) {
  tower.angle = Math.atan2(target.x - tower.x, target.z - tower.z); tower.fired = .15;
  if (tower.type === 'mortar') { s.impacts.push({ id: s.nextId++, x: target.x, z: target.z, ttl: .65, radius: stat.splash, towerId: tower.id, stat, tower: { type: tower.type, branch: tower.branch } }); addEffect(s, 'arc', tower, target, stat.color, .25, .65); return; }
  hit(s, tower, target, stat); addEffect(s, tower.type === 'light' ? 'beam' : 'shot', tower, target, stat.color, .14, .23);
  if (stat.splash > 0 || tower.branch === 'glacier' || tower.branch === 'torrent') { const r = stat.splash || 2; for (const e of s.enemies) if (e !== target && distance(e, target) < r) hit(s, tower, e, stat, .75); addEffect(s, 'ring', target, null, stat.color, r, .4); }
  if (tower.type === 'storm' && tower.branch !== 'overload') { let previous = target; const used = new Set([target.id]); for (let i = 1; i < (tower.branch === 'chain' ? 6 : 3); i++) { const next = s.enemies.filter(e => e.hp > 0 && !used.has(e.id) && distance(e, previous) < (tower.branch === 'chain' ? 4.5 : 3)).sort((a, b) => distance(a, previous) - distance(b, previous))[0]; if (!next) break; hit(s, tower, next, stat, .8); addEffect(s, 'beam', previous, next, stat.color, .1, .23); used.add(next.id); previous = next; } }
  if (tower.branch === 'beam') { const dx = target.x - tower.x, dz = target.z - tower.z, len = Math.hypot(dx, dz); for (const e of s.enemies) if (e !== target) { const projection = ((e.x - tower.x) * dx + (e.z - tower.z) * dz) / len; if (projection > 0 && projection < stat.range && Math.abs((e.x - tower.x) * dz - (e.z - tower.z) * dx) / len < .5) hit(s, tower, e, stat, .8); } }
  s.events.push({ type: 'fire', tower: tower.type });
}
export function stepBattle(s, elapsed = .016) {
  if (s.paused || !['build', 'wave'].includes(s.phase)) return; const dt = clamp(Number.isFinite(elapsed) ? elapsed : 0, 0, .1);
  s.events = []; s.time += dt; s.skillCooldown = Math.max(0, s.skillCooldown - dt);
  for (const e of s.effects) e.ttl -= dt; s.effects = s.effects.filter(e => e.ttl > 0);
  if (s.lives <= 0) { s.phase = 'lost'; return; } if (s.phase === 'build') return;
  s.waveTime += dt;
  while (s.queue.length && s.queue[0].delay <= s.waveTime) { const spawn = s.queue.shift(), def = ENEMIES[spawn.kind]; const hp = def.hp * s.config.healthScale * (1 + (s.wave - 1) * .08); s.enemies.push({ ...def, id: s.nextId++, kind: spawn.kind, hp, maxHp: hp, path: spawn.path, distance: 0, ...pointOnPath(s.config.paths[spawn.path], 0), slow: 0, burn: 0, poison: 0, wet: 0, stun: 0, timer: 2, flash: 0 }); }
  for (const e of s.enemies) {
    if (e.hp <= 0) continue; e.slow = Math.max(0, (e.slow || 0) - dt); e.stun = Math.max(0, (e.stun || 0) - dt); e.wet = Math.max(0, (e.wet || 0) - dt); e.flash = Math.max(0, (e.flash || 0) - dt);
    if (e.burn > 0) { e.burn -= dt; e.hp -= (e.burnDamage || 0) * dt; } if (e.poison > 0) { e.poison -= dt; e.hp -= (e.poisonDamage || 0) * dt; }
    // 持续伤害致死后留给统一击杀结算，不能再移动、漏怪或施放治疗。
    if (e.hp <= 0) continue;
    e.distance += e.speed * dt * (e.stun > 0 ? 0 : e.slow > 0 ? .5 : 1) * (s.challenge === 'rush' ? 1.35 : 1) * (s.config.biome === 3 ? .9 : 1);
    Object.assign(e, pointOnPath(s.config.paths[e.path], e.distance));
    if (e.ended) { s.lives = Math.max(0, s.lives - e.leak); e.leaked = true; s.events.push({ type: 'leak' }); }
    if (e.kind === 'healer') { e.timer -= dt; if (e.timer <= 0) { for (const friend of s.enemies) if (friend !== e && friend.hp > 0 && distance(friend, e) < 3.5) friend.hp = Math.min(friend.maxHp, friend.hp + friend.maxHp * .08); addEffect(s, 'ring', e, null, 0xb9eead, 3.5, .6); e.timer = 3; } }
  }
  for (const tower of s.towers) {
    tower.cooldown -= dt; tower.fired = Math.max(0, (tower.fired || 0) - dt); if (tower.cooldown > 0) continue;
    const stat = towerStats(tower, s), targets = s.enemies.filter(e => e.hp > 0 && !e.leaked && distance(e, tower) <= stat.range);
    targets.sort((a, b) => tower.branch === 'long' || tower.branch === 'siege' ? b.maxHp - a.maxHp : b.distance / pathLength(s.config.paths[b.path]) - a.distance / pathLength(s.config.paths[a.path]));
    if (targets[0]) { towerFire(s, tower, stat, targets[0]); tower.cooldown = stat.rate; }
  }
  for (const impact of s.impacts) { impact.ttl -= dt; if (impact.ttl <= 0) { for (const e of s.enemies) if (distance(e, impact) < impact.radius) hit(s, impact.tower, e, impact.stat); addEffect(s, 'explosion', impact, null, 0xf2c896, impact.radius, .65); } }
  s.impacts = s.impacts.filter(e => e.ttl > 0);
  for (const e of s.enemies) if (e.hp <= 0 && !e.leaked) { s.kills++; s.gold += e.reward + (e.bounty ? 6 : 0); addEffect(s, 'burst', e, null, 0xf6d88d, .7, .4); }
  s.enemies = s.enemies.filter(e => e.hp > 0 && !e.leaked);
  if (s.lives <= 0) s.phase = 'lost';
  else if (!s.enemies.length && !s.queue.length) { if (s.wave >= s.config.waves.length) s.phase = 'won'; else { s.phase = 'build'; const bonus = 40 + s.wave * 12; s.gold += bonus; s.events.push({ type: 'clear', bonus }); } }
}
export function settleBattle(s, value) { const save = sanitizeSave(value); if (s.rewardClaimed || !['won', 'lost'].includes(s.phase)) return save; s.rewardClaimed = true; const stars = s.phase === 'won' ? s.challenge === 'iron' || s.lives === 20 ? 3 : s.lives >= 12 ? 2 : 1 : 0; const delta = Math.max(0, stars - save.stars[s.config.index]); save.stars[s.config.index] = Math.max(stars, save.stars[s.config.index]); save.tokens += delta * 10 + (s.phase === 'won' ? 5 : Math.floor(s.kills / 15)); if (s.phase === 'won' && s.challenge !== 'standard') save.challenges++; return sanitizeSave(save); }
export function buyResearch(value, key) { const save = sanitizeSave(value); if (!['power', 'economy'].includes(key) || save[key] >= (key === 'power' ? 10 : 8)) return null; const cost = 20 + save[key] * 15; if (save.tokens < cost) return null; save.tokens -= cost; save[key]++; return save; }

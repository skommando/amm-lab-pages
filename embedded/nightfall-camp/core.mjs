const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
const number = (n, max = 999999) => typeof n === 'number' && Number.isFinite(n) ? clamp(Math.floor(n), 0, max) : 0;
const dist = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);
function random(s) { s.seed = (Math.imul(s.seed, 1664525) + 1013904223) >>> 0; return s.seed / 4294967296; }
export const REGIONS = [
  { name: '松风林地', color: 0x4b7360, weather: '林风', desc: '木材丰饶，树林形成天然掩护；夜袭以狼群为主。', resource: ['wood', 'wood', 'food', 'stone', 'ore', 'crystal'], drain: 1 },
  { name: '雾萤湿地', color: 0x527b78, weather: '夜雨', desc: '沼泽减速，矿脉更近；夜雨加快燃料消耗。', resource: ['food', 'stone', 'wood', 'ore', 'ore', 'crystal'], drain: 1.3 },
  { name: '霜脊山麓', color: 0x848e9b, weather: '寒潮', desc: '石料与晶体丰厚，食物稀少；寒夜饥饿更快。', resource: ['stone', 'ore', 'wood', 'crystal', 'stone', 'food'], drain: 1.15 },
];
export const NIGHTS = Array.from({ length: 15 }, (_, i) => ({ night: i + 1, title: ['林缘试探', '双向狼群', '救援信号', '潜行突袭', '裂角首领', '雾中射手', '四面围营', '饥饿兽潮', '失散旅人', '铁背首领', '暗影渗透', '最后讯号', '风暴前沿', '营火围城', '长夜之王'][i], count: 5 + i * 2, gap: Math.max(.65, 2.2 - i * .09), kinds: i < 3 ? ['wolf', 'raider'] : i < 7 ? ['wolf', 'raider', 'spitter'] : i < 11 ? ['brute', 'wolf', 'spitter', 'shade'] : ['brute', 'shade', 'spitter', 'wolf'], boss: (i + 1) % 5 === 0 }));
export const RECIPES = [
  { id: 'axe', name: '精制斧', desc: '每次采集多获得 1 份资源（最多两级）', cost: { wood: 8, stone: 4 }, max: 2 },
  { id: 'spear', name: '守夜长矛', desc: '攻击 +15，范围 +0.3（最多两级）', cost: { wood: 8, stone: 6, ore: 2 }, max: 2 },
  { id: 'lantern', name: '萤晶提灯', desc: '近身敌军减速，燃料消耗 -15%（最多两级）', cost: { wood: 4, ore: 4, crystal: 2 }, max: 2 },
  { id: 'pack', name: '远行背包', desc: '移动速度 +8%，采集冷却缩短（最多两级）', cost: { wood: 6, food: 4, ore: 2 }, max: 2 },
  { id: 'medkit', name: '草药包', desc: '立即恢复 55 生命', cost: { food: 5, wood: 2 } },
  { id: 'meal', name: '篝火炖菜', desc: '恢复 55 饱腹与 12 生命', cost: { food: 4, wood: 1 } },
  { id: 'beacon', name: '长明救援信标', desc: '第 10 夜后可造；守过 15 夜且救回 3 人即可撤离', cost: { wood: 25, stone: 15, ore: 12, crystal: 4 } },
];
export const BUILDINGS = [
  { id: 'barricade', name: '荆木路障', color: 0xb79a6d, hp: 150, cost: { wood: 8, stone: 3 }, desc: '吸引并阻挡近处敌军；靠前建造保护内圈。' },
  { id: 'turret', name: '猎弓岗楼', color: 0xd9b17c, hp: 95, cost: { wood: 14, stone: 8, ore: 2 }, desc: '自动射击 7 米内最近敌人。' },
  { id: 'garden', name: '药草菜圃', color: 0xadc67d, hp: 75, cost: { wood: 10, stone: 4 }, desc: '每个黎明提供 5 份食物。' },
  { id: 'collector', name: '集雨冷凝器', color: 0x86b9c8, hp: 100, cost: { wood: 8, stone: 6 }, desc: '每秒恢复营火耐久，潮湿区效果提高。' },
  { id: 'infirmary', name: '守望帐篷', color: 0xd5c7ac, hp: 110, cost: { wood: 14, stone: 8, food: 5 }, desc: '在营地中心缓慢治疗玩家；救援同伴增强火力。' },
  { id: 'kiln', name: '炭石窑炉', color: 0x9a8780, hp: 125, cost: { wood: 10, stone: 10 }, desc: '每个黎明产出矿石；夜晚降低营火燃料消耗。' },
];
export const PLOTS = Array.from({ length: 8 }, (_, i) => ({ x: Math.sin(i * Math.PI / 4) * 5.7, z: Math.cos(i * Math.PI / 4) * 5.7 }));
export const ENEMIES = { wolf: { hp: 40, speed: 2.15, damage: 9, radius: .55 }, raider: { hp: 62, speed: 1.55, damage: 13, radius: .6 }, spitter: { hp: 52, speed: 1.25, damage: 10, radius: .6 }, brute: { hp: 155, speed: .85, damage: 24, radius: .95 }, shade: { hp: 62, speed: 2.5, damage: 11, radius: .5 }, boss: { hp: 620, speed: 1.1, damage: 35, radius: 1.5 } };
export function sanitizeSave(value) { const s = value && typeof value === 'object' ? value : {}; return { version: 1, best: REGIONS.map((_, i) => number(s.best?.[i], 99999)), knowledge: number(s.knowledge), mastery: number(s.mastery, 8), rescues: number(s.rescues, 99999), victories: number(s.victories, 99999) }; }
export function createExpedition({ region = 0, endless = false, save = null, seed = 7839 } = {}) {
  region = number(region, 2); const meta = sanitizeSave(save), def = REGIONS[region], nodes = [];
  for (let i = 0; i < 36; i++) { const a = i * 2.399 + region * .45, r = 8 + i % 4 * 2; nodes.push({ id: i + 1, x: Math.cos(a) * r, z: Math.sin(a) * r, resource: def.resource[i % def.resource.length], amount: 7 + i % 4, max: 7 + i % 4, respawn: 0 }); }
  return { region, endless: Boolean(endless), seed, phase: 'day', paused: false, phaseTime: 0, time: 0, night: 1, weather: def.weather, player: { x: 0, z: 2, hp: 100 + meta.mastery * 5, maxHp: 100 + meta.mastery * 5, hunger: 100, facingX: 0, facingZ: -1, attackCooldown: 0, gatherCooldown: 0, invulnerable: 0 },
    fire: { x: 0, z: 0, hp: 260 + meta.mastery * 12, maxHp: 260 + meta.mastery * 12, fuel: 100 }, resources: { wood: 25 + meta.mastery * 2, stone: 15, food: 12, ore: 4, crystal: 0 }, tools: { axe: 0, spear: 0, lantern: 0, pack: 0 }, nodes, buildings: [], enemies: [], projectiles: [], effects: [], survivors: [], queue: [], rescued: 0, beacon: false, kills: 0, nextId: 100, events: [], rewardClaimed: false };
}
function canPay(s, cost) { return Object.entries(cost).every(([key, value]) => (s.resources[key] || 0) >= value); }
function pay(s, cost) { for (const [key, value] of Object.entries(cost)) s.resources[key] -= value; }
export function craft(s, id) {
  if (!['day', 'night'].includes(s.phase)) return false; const recipe = RECIPES.find(x => x.id === id); if (!recipe) return false;
  if (recipe.max && s.tools[id] >= recipe.max || id === 'beacon' && (s.night < 10 || s.beacon) || id === 'medkit' && s.player.hp >= s.player.maxHp || id === 'meal' && s.player.hunger >= 95) return false;
  const multiplier = recipe.max ? 1 + s.tools[id] : 1; const cost = Object.fromEntries(Object.entries(recipe.cost).map(([k, v]) => [k, v * multiplier])); if (!canPay(s, cost)) return false; pay(s, cost);
  if (recipe.max) s.tools[id]++;
  else if (id === 'medkit') s.player.hp = Math.min(s.player.maxHp, s.player.hp + 55);
  else if (id === 'meal') { s.player.hunger = Math.min(100, s.player.hunger + 55); s.player.hp = Math.min(s.player.maxHp, s.player.hp + 12); }
  else s.beacon = true;
  s.events.push({ type: 'craft', name: recipe.name }); return true;
}
export function build(s, slot, type) {
  if (!['day', 'night'].includes(s.phase) || !Number.isInteger(slot) || !PLOTS[slot] || s.buildings.some(b => b.slot === slot)) return false;
  const def = BUILDINGS.find(x => x.id === type); if (!def || !canPay(s, def.cost)) return false; pay(s, def.cost);
  s.buildings.push({ id: s.nextId++, slot, type, level: 1, hp: def.hp, maxHp: def.hp, timer: .2, ...PLOTS[slot] }); s.events.push({ type: 'build' }); return true;
}
export function upgradeBuilding(s, slot) { const b = s.buildings.find(b => b.slot === slot); if (!b || b.level >= 3 || !['day', 'night'].includes(s.phase)) return false; const def = BUILDINGS.find(x => x.id === b.type), cost = Object.fromEntries(Object.entries(def.cost).map(([k, v]) => [k, Math.ceil(v * b.level * .8)])); if (!canPay(s, cost)) return false; pay(s, cost); b.level++; b.maxHp = Math.round(def.hp * (1 + (b.level - 1) * .7)); b.hp = b.maxHp; return true; }
export function repairBuilding(s, slot) { const b = s.buildings.find(b => b.slot === slot); if (!b || b.hp >= b.maxHp || !canPay(s, { wood: 4, stone: 2 }) || !['day', 'night'].includes(s.phase)) return false; pay(s, { wood: 4, stone: 2 }); b.hp = Math.min(b.maxHp, b.hp + b.maxHp * .6); return true; }
function effect(s, kind, x, z, radius, color, ttl = .4, extra = {}) { s.effects.push({ id: s.nextId++, kind, x, z, radius, color, ttl, life: ttl, ...extra }); }
export function interact(s) {
  if (!['day', 'night'].includes(s.phase) || s.player.gatherCooldown > 0) return false; const p = s.player;
  const survivor = s.survivors.find(x => !x.rescued && !x.following && dist(x, p) < 2);
  if (survivor) { survivor.following = true; s.events.push({ type: 'escort' }); p.gatherCooldown = .5; return 'escort'; }
  if (dist(p, s.fire) < 2.6) { if (s.resources.wood < 2 || s.fire.fuel >= 98 && s.fire.hp >= s.fire.maxHp) return false; s.resources.wood -= 2; s.fire.fuel = Math.min(100, s.fire.fuel + 28); s.fire.hp = Math.min(s.fire.maxHp, s.fire.hp + 12); p.gatherCooldown = .5; effect(s, 'ring', 0, 0, 2, 0xffc775); return 'fuel'; }
  const node = s.nodes.filter(n => n.amount > 0 && dist(n, p) < 2).sort((a, b) => dist(a, p) - dist(b, p))[0]; if (!node) return false;
  const amount = Math.min(node.amount, 2 + s.tools.axe); node.amount -= amount; s.resources[node.resource] += amount; node.respawn = node.amount <= 0 ? 2 : 0; p.gatherCooldown = .55 / (1 + s.tools.pack * .2); effect(s, 'gather', node.x, node.z, 1, 0xf3dd9d); s.events.push({ type: 'gather', resource: node.resource, amount }); return 'gather';
}
export function attack(s) {
  if (!['day', 'night'].includes(s.phase) || s.player.attackCooldown > 0) return false; const p = s.player; p.attackCooldown = .48;
  const range = 2.4 + s.tools.spear * .3;
  for (const e of s.enemies) { const d = dist(e, p); const facing = (e.x - p.x) * p.facingX + (e.z - p.z) * p.facingZ; if (d < range && facing > -d * .2) { e.hp -= 22 + s.tools.spear * 15; e.flash = .15; e.stun = .15; if (d > .01) { e.x += (e.x - p.x) / d * .4; e.z += (e.z - p.z) / d * .4; } } }
  effect(s, 'swing', p.x, p.z, range, 0xffe9b3, .22, { angle: Math.atan2(p.facingZ, p.facingX) }); s.events.push({ type: 'attack' }); return true;
}
export function beginNight(s) {
  if (s.phase !== 'day') return false; const def = NIGHTS[Math.min(14, s.night - 1)], extra = Math.max(0, s.night - 15);
  s.phase = 'night'; s.phaseTime = 0; s.queue = Array.from({ length: def.count + Math.min(30, extra * 2) }, (_, i) => ({ kind: def.kinds[(i + s.region) % def.kinds.length], delay: i * def.gap, angle: i * 2.399 + s.region }));
  if (def.boss || extra > 0 && s.night % 5 === 0) s.queue.push({ kind: 'boss', delay: def.count * def.gap * .7, angle: Math.PI * .75 });
  s.queue.sort((a, b) => a.delay - b.delay); s.events.push({ type: 'night', title: def.title }); return true;
}
function dawn(s) {
  if (!s.endless && s.night >= 15 && s.rescued >= 3 && s.beacon) { s.phase = 'won'; return; }
  s.phase = 'day'; s.phaseTime = 0; s.night++; s.fire.fuel = Math.min(100, s.fire.fuel + 12); s.player.hp = Math.min(s.player.maxHp, s.player.hp + 10);
  for (const b of s.buildings) { if (b.type === 'garden') s.resources.food += 5 * b.level; if (b.type === 'kiln') { s.resources.ore += 3 * b.level; s.resources.wood += 2 * b.level; } }
  for (const n of s.nodes) { if (n.amount < n.max) { if (n.respawn > 0) n.respawn--; if (n.respawn === 0) n.amount = n.max; } }
  if ([3, 6, 9, 12].includes(s.night)) { const a = s.night * 1.7 + s.region; s.survivors.push({ id: s.nextId++, x: Math.cos(a) * 12, z: Math.sin(a) * 12, following: false, rescued: false }); s.events.push({ type: 'signal' }); }
  s.resources.food += 1 + s.rescued; s.events.push({ type: 'dawn' });
}
function damagePlayer(s, amount) { if (s.player.invulnerable > 0) return; s.player.hp = Math.max(0, s.player.hp - amount); s.player.invulnerable = .7; s.events.push({ type: 'hurt' }); }
export function stepExpedition(s, input = {}, elapsed = .016) {
  if (s.paused || !['day', 'night'].includes(s.phase)) return; const dt = clamp(Number.isFinite(elapsed) ? elapsed : 0, 0, .1); s.events = []; s.time += dt; s.phaseTime += dt;
  if (s.fire.hp <= 0 || s.player.hp <= 0) { s.phase = 'lost'; return; }
  const p = s.player; p.attackCooldown = Math.max(0, p.attackCooldown - dt); p.gatherCooldown = Math.max(0, p.gatherCooldown - dt); p.invulnerable = Math.max(0, p.invulnerable - dt);
  let x = Number(input.x) || 0, z = Number(input.z) || 0, len = Math.hypot(x, z); if (len > 1) { x /= len; z /= len; } if (len > .1) { p.facingX = x; p.facingZ = z; }
  const swamp = s.region === 1 && Math.sin(p.x * .45) + Math.cos(p.z * .4) < -.75;
  const speed = 5.3 * (1 + s.tools.pack * .08) * (swamp ? .6 : 1) * (p.hunger < 15 ? .8 : 1);
  p.x = clamp(p.x + x * speed * dt, -16.5, 16.5); p.z = clamp(p.z + z * speed * dt, -16.5, 16.5);
  p.hunger = Math.max(0, p.hunger - dt * (s.phase === 'night' ? .28 : .15) * (s.region === 2 ? 1.45 : 1)); if (p.hunger <= 0) p.hp = Math.max(0, p.hp - dt * 1.4);
  const kiln = s.buildings.reduce((sum, b) => sum + (b.hp > 0 && b.type === 'kiln' ? b.level : 0), 0);
  s.fire.fuel = Math.max(0, s.fire.fuel - dt * (s.phase === 'night' ? .55 : .08) * REGIONS[s.region].drain * Math.max(.4, 1 - s.tools.lantern * .15 - kiln * .1));
  if (s.fire.fuel <= 0) s.fire.hp = Math.max(0, s.fire.hp - dt * (s.phase === 'night' ? 6 : 1));
  // 致命的饥饿/燃料损耗先结算，不能在同帧通过添柴或治疗复活。
  if (s.fire.hp <= 0 || p.hp <= 0) { s.phase = 'lost'; return; }
  if (input.interact) interact(s); if (input.attack) attack(s);
  if (s.phase === 'day' && s.phaseTime >= 42) beginNight(s);
  if (s.phase === 'night') {
    while (s.queue.length && s.queue[0].delay <= s.phaseTime && s.enemies.length < 80) { const spawn = s.queue.shift(), def = ENEMIES[spawn.kind], scale = 1 + (s.night - 1) * .06; const angle = spawn.angle + (random(s) - .5) * .35; const hp = def.hp * scale; s.enemies.push({ id: s.nextId++, kind: spawn.kind, ...def, x: Math.cos(angle) * 17, z: Math.sin(angle) * 17, hp, maxHp: hp, timer: .4, flash: 0, stun: 0 }); }
  }
  for (const e of s.enemies) {
    if (e.hp <= 0) continue; e.timer -= dt; e.flash = Math.max(0, (e.flash || 0) - dt); e.stun = Math.max(0, (e.stun || 0) - dt);
    const nearby = s.buildings.filter(b => b.hp > 0 && dist(b, e) < (e.kind === 'brute' ? 6 : 3.6)).sort((a, b) => dist(a, e) - dist(b, e));
    let target = nearby[0] || s.fire; if (e.kind === 'raider' || e.kind === 'shade' || e.kind === 'wolf' && dist(e, p) < 4) target = p;
    const d = dist(e, target) || .01, vx = (target.x - e.x) / d, vz = (target.z - e.z) / d;
    let speedE = e.speed * (e.stun > 0 ? 0 : s.tools.lantern && dist(e, p) < 4 ? 1 - s.tools.lantern * .15 : 1);
    const reach = e.kind === 'spitter' ? 6 : e.radius + .75;
    if (d > reach) { e.x += vx * speedE * dt; e.z += vz * speedE * dt; }
    else if (e.timer <= 0) { if (e.kind === 'spitter') s.projectiles.push({ id: s.nextId++, x: e.x, z: e.z, vx: vx * 6, vz: vz * 6, ttl: 3, damage: e.damage, targetId: target === p ? 'player' : target.id || 'fire', color: 0xbc85c9 }); else if (target === p) damagePlayer(s, e.damage); else target.hp = Math.max(0, target.hp - e.damage); e.timer = e.kind === 'boss' ? 1.8 : 1.3; effect(s, 'claw', e.x, e.z, 1, 0xea928a); }
    if (e.kind === 'boss' && s.time % 6 < dt) { effect(s, 'ring', e.x, e.z, 4, 0xc585bf, .7); for (const b of s.buildings) if (dist(e, b) < 4) b.hp = Math.max(0, b.hp - 12); if (dist(e, p) < 4) damagePlayer(s, 16); }
  }
  if (s.fire.hp <= 0 || p.hp <= 0) { s.phase = 'lost'; return; }
  for (const b of s.buildings) {
    if (b.hp <= 0) continue;
    b.timer -= dt;
    if (b.type === 'turret' && b.timer <= 0) { const target = s.enemies.filter(e => e.hp > 0 && dist(e, b) < 7 + b.level).sort((a, c) => dist(a, b) - dist(c, b))[0]; if (target) { target.hp -= (18 + (b.level - 1) * 12) * (1 + s.rescued * .08); target.flash = .15; b.angle = Math.atan2(target.x - b.x, target.z - b.z); effect(s, 'line', b.x, b.z, .1, 0xffd899, .2, { toX: target.x, toZ: target.z }); b.timer = 1.15 - b.level * .1; } }
    if (b.type === 'collector') s.fire.hp = Math.min(s.fire.maxHp, s.fire.hp + dt * b.level * (s.region === 1 ? 1.1 : .7));
    if (b.type === 'infirmary' && Math.hypot(p.x, p.z) < 6) p.hp = Math.min(p.maxHp, p.hp + dt * .9 * b.level);
  }
  s.buildings = s.buildings.filter(b => b.hp > 0);
  for (const shot of s.projectiles) { shot.x += shot.vx * dt; shot.z += shot.vz * dt; shot.ttl -= dt; const target = shot.targetId === 'player' ? p : shot.targetId === 'fire' ? s.fire : s.buildings.find(b => b.id === shot.targetId); if (target && dist(shot, target) < 1) { if (target === p) damagePlayer(s, shot.damage); else target.hp = Math.max(0, target.hp - shot.damage); shot.ttl = 0; } }
  s.projectiles = s.projectiles.filter(shot => shot.ttl > 0);
  for (const e of s.enemies) if (e.hp <= 0) { s.kills++; s.resources.ore += e.kind === 'brute' || e.kind === 'boss' ? 2 : 0; s.resources.crystal += e.kind === 'boss' ? 2 : 0; if (s.kills % 5 === 0) s.resources.food++; effect(s, 'burst', e.x, e.z, e.radius, 0xd8bd89); }
  s.enemies = s.enemies.filter(e => e.hp > 0);
  for (const survivor of s.survivors) if (survivor.following && !survivor.rescued) { const d = dist(survivor, p); if (d > 1) { survivor.x += (p.x - survivor.x) / d * Math.min(d - 1, 4.7 * dt); survivor.z += (p.z - survivor.z) / d * Math.min(d - 1, 4.7 * dt); } if (Math.hypot(survivor.x, survivor.z) < 3) { survivor.rescued = true; s.rescued++; s.resources.wood += 8; s.resources.food += 5; effect(s, 'ring', 0, 0, 4, 0xfbe2a1, 1); s.events.push({ type: 'rescued' }); } }
  for (const e of s.effects) e.ttl -= dt; s.effects = s.effects.filter(e => e.ttl > 0);
  if (s.player.hp <= 0 || s.fire.hp <= 0) s.phase = 'lost';
  else if (s.phase === 'night' && s.phaseTime >= 32 && !s.queue.length && !s.enemies.length) dawn(s);
  else if (s.phase === 'day' && !s.endless && s.night > 15 && s.rescued >= 3 && s.beacon) s.phase = 'won';
}
export function settleExpedition(s, value) { const save = sanitizeSave(value); if (s.rewardClaimed || !['won', 'lost'].includes(s.phase)) return save; s.rewardClaimed = true; const nights = s.phase === 'won' ? Math.max(15, s.night) : Math.max(0, s.night - 1); save.best[s.region] = Math.max(save.best[s.region], nights); save.knowledge += nights * 4 + s.rescued * 5 + (s.phase === 'won' ? 40 : 0); save.rescues += s.rescued; if (s.phase === 'won') save.victories++; return sanitizeSave(save); }
export function buyMastery(value) { const save = sanitizeSave(value), cost = 25 + save.mastery * 20; if (save.mastery >= 8 || save.knowledge < cost) return null; save.knowledge -= cost; save.mastery++; return save; }

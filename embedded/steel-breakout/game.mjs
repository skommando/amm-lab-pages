import { THREE, createGame, box, sphere, cylinder, label, clearGroup } from '../arcade-runtime/runtime.mjs';
import { CHAPTERS, LEVELS, WEAPONS, createSteel, stepSteel, normalizeSave, recordResult } from './core.mjs';

const game = createGame({ id: 'steel-breakout', title: '钢铁突围', subtitle: 'STEEL BREAKOUT / 3D RUN & GUN', accent: '#efbf7c', background: 0x162b38, help: 'A/D 或左右方向键移动；Z / K / ↑ 跳跃；空格 / J 持续射击；W 抬枪向上；E 投掷榴弹；Q 切换已拾取武器。触屏用方向盘与动作键。沿途获得武器和维修；切断能源关需打掉红色能源柱，章末击败首领后前往最右方撤离门。顶部可暂停、重开选关、开声音或全屏。' });
game.controls([{ code: 'KeyZ', label: '跳跃' }, { code: 'Space', label: '射击' }, { code: 'KeyE', label: '榴弹' }, { code: 'KeyQ', label: '换枪' }, { code: 'KeyW', label: '上瞄' }]);
let state, progress = normalizeSave(game.load({})), selectedLevel = 0, selectedWeapon = 0, ended = false, actors = new Map(), platformMeshes = [], lightObjects = [], playerMesh, exitMesh;
let groups = {}, soundTick = 0;
const metallic = { metalness: .7, roughness: .35 };
const group = parent => { const g = new THREE.Group(); parent.add(g); return g; };
function rod(parent, a, b, radius, color) {
  const av = new THREE.Vector3(...a), bv = new THREE.Vector3(...b), delta = bv.clone().sub(av);
  const mesh = cylinder(parent, ...(av.clone().add(bv).multiplyScalar(.5).toArray()), radius, radius, delta.length(), color, metallic); mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), delta.normalize()); return mesh;
}
function ring(parent, x, y, z, radius, tube, color, rotation = [0, 0, 0]) { const m = new THREE.Mesh(new THREE.TorusGeometry(radius, tube, 8, 32), new THREE.MeshStandardMaterial({ color, metalness: .7, roughness: .3, emissive: color, emissiveIntensity: .15 })); m.position.set(x, y, z); m.rotation.set(...rotation); parent.add(m); return m; }
function soldier(parent, color, enemyType = '') {
  const g = group(parent), legs = [];
  const body = sphere(g, 0, 1.05, 0, .48, color, metallic); body.scale.set(.68, .9, .72);
  box(g, .05, 1.03, .32, .42, .4, .12, 0x243b48, metallic); box(g, .08, 1.09, .4, .25, .08, .06, 0x9beaf2, { emissive: 0x7ce5ed });
  const helmet = sphere(g, .03, 1.58, 0, .29, 0xc5d6d8, metallic); helmet.scale.y = .9;
  box(g, .2, 1.6, .12, .28, .14, .32, enemyType ? 0xff816d : 0x71dcf0, { emissive: enemyType ? 0xd95342 : 0x43bfdc });
  box(g, -.31, 1.13, -.06, .23, .52, .5, 0x354955, metallic);
  for (const z of [-.2, .2]) { const leg = group(g); leg.position.set(-.06, .72, z); rod(leg, [0, 0, 0], [.08, -.42, 0], .12, color); sphere(leg, .08, -.4, 0, .14, 0x354955); box(leg, .16, -.6, 0, .38, .22, .27, 0x283842, metallic); legs.push(leg); }
  sphere(g, .03, 1.19, .4, .18, color); rod(g, [.05, 1.16, .4], [.48, .92, .4], .11, color);
  box(g, .59, .92, .4, .75, .2, .2, 0x314350, metallic); cylinder(g, 1.02, .92, .4, .08, .08, enemyType === 'sniper' ? .7 : .35, 0x172a36, { ...metallic, rotation: [0, 0, -Math.PI / 2] });
  if (enemyType === 'shield') { box(g, .65, .77, .04, .18, 1.45, .95, 0x8998a5, metallic); box(g, .77, 1, .05, .04, .09, .8, 0xffc278, { emissive: 0xff955c }); }
  if (enemyType === 'hopper') for (const z of [-.4, .4]) rod(g, [-.25, .8, z], [-.7, .1, z], .08, 0xd8b17e);
  g.userData.legs = legs; return g;
}
function drone(parent, scale = 1) {
  const g = group(parent); sphere(g, 0, .7, 0, .4, 0x8ba8ae, metallic); box(g, .28, .7, .05, .16, .18, .44, 0xff8278, { emissive: 0xff5544 });
  for (const z of [-.65, .65]) { rod(g, [0, .7, 0], [0, .8, z], .08, 0x485d67); ring(g, 0, .82, z, .38, .055, 0x9fc3cd, [Math.PI / 2, 0, 0]); box(g, 0, .83, z, .7, .025, .08, 0x354b59); }
  cylinder(g, .2, .3, 0, .09, .09, .6, 0x526d78, { rotation: [0, 0, -Math.PI / 2] }); g.scale.setScalar(scale); return g;
}
function turret(parent) {
  const g = group(parent); cylinder(g, 0, .3, 0, .62, .8, .6, 0x546c74, metallic); sphere(g, 0, .84, 0, .58, 0x99a7ab, metallic).scale.y = .65; box(g, .1, .88, .47, .3, .16, .1, 0xff866e, { emissive: 0xff684c }); rod(g, [.2, .9, 0], [1.2, .9, 0], .13, 0x2e4752); return g;
}
function bossModel(parent, kind) {
  const g = group(parent), armor = [0x9a9387, 0xa97f5e, 0x8ba9b9, 0x7d789b, 0x6fafa1, 0x9b778e][kind];
  if (kind === 3 || kind === 5) {
    sphere(g, 0, 1.4, 0, 1, armor, metallic).scale.set(kind === 5 ? 3.3 : 2.2, .7, 1.1);
    for (const z of [-1.4, 1.4]) { box(g, -.5, 1.1, z, 3.3, .25, 1.4, armor, metallic); cylinder(g, 1.1, 1, z, .3, .35, 1.5, 0x384754, { ...metallic, rotation: [0, 0, Math.PI / 2] }); sphere(g, -1.7, 1.2, z, .3, 0x87d8f7, { emissive: 0x61c7ff }); }
    for (let i = 0; i < (kind === 5 ? 4 : 2); i++) { const t = turret(g); t.scale.setScalar(.6); t.position.set(i * .9 - 1.5, 1.75, .2); }
  } else if (kind === 4) {
    cylinder(g, 0, 1.5, 0, 1.1, 1.1, 3, armor, metallic); sphere(g, 0, 1.6, .9, .8, 0x7deccd, { emissive: 0x56e2b2, emissiveIntensity: .6 });
    for (let i = 0; i < 3; i++) ring(g, 0, 1.6, 0, 1.5 + i * .2, .11, armor, [Math.PI / 2, i * .5, i * .8]);
    for (const x of [-2, 2]) { rod(g, [x, 0, 0], [x, 2.5, 0], .25, armor); sphere(g, x, 2.6, 0, .35, 0xb6ffbb, { emissive: 0x66ddaa }); }
  } else {
    sphere(g, 0, 1.7, 0, 1.1, armor, metallic).scale.set(1.65, .9, 1.1); box(g, .3, 1.75, 1, 1.4, .3, .2, 0xff947d, { emissive: 0xff6248 });
    for (let i = 0; i < (kind === 2 ? 3 : 2); i++) for (const z of [-1, 1]) { const x = -1.2 + i * (kind === 2 ? 1.2 : 2.4); rod(g, [x, 1.5, z * .65], [x + .4, .8, z * 1.65], .2, armor); sphere(g, x + .4, .8, z * 1.65, .25, 0x465b66); rod(g, [x + .4, .8, z * 1.65], [x + .1, .15, z * 2], .13, 0x98a9ac); box(g, x + .1, .12, z * 2, .7, .22, .6, 0x344753); }
    if (kind === 1) { cylinder(g, 2, 1.1, 0, 0, .9, 2.2, 0xd4b39b, { rotation: [0, 0, -Math.PI / 2], metalness: .9 }); for (let i = 0; i < 5; i++) ring(g, 1.2 + i * .3, 1.1, 0, .85 - i * .13, .07, 0x65504b, [0, Math.PI / 2, 0]); }
    else for (const z of [-.8, .8]) rod(g, [.8, 1.9, z], [2.4, 1.9, z], kind === 2 ? .14 : .24, 0x3b515f);
  }
  return g;
}
function buildScene() {
  clearGroup(game.world); actors.clear(); platformMeshes = []; lightObjects = []; groups = { terrain: group(game.world), actors: group(game.world), effects: group(game.world) };
  const ch = CHAPTERS[state.level.chapter]; game.scene.background.setHex(ch.back); game.scene.fog.color.setHex(ch.back);
  for (const p of state.level.platforms) {
    const platform = group(groups.terrain); platform.position.set(p.x, p.y, 0);
    box(platform, p.w / 2, -.45, 0, p.w, .9, 3.8, ch.ground, metallic); box(platform, p.w / 2, -.04, .02, p.w, .08, 3.9, 0x9aadb0, metallic);
    for (let x = .3; x < p.w; x += 2) { box(platform, x, -.35, 1.95, .8, .12, .07, ch.glow, { emissive: ch.glow }); if (p.y) rod(platform, [x, -.8, -.4], [x + .6, -2.3, -.4], .1, 0x354f5c); }
    platformMeshes.push([p, platform]);
  }
  for (let x = -8; x < state.level.length + 10; x += 9) {
    const height = 5 + Math.sin(x * 1.7) * 2, z = -7 - (Math.round(x) % 3);
    box(groups.terrain, x, height / 2 - .5, z, 6.8, height, 4, ch.ground, { roughness: .85 });
    for (let j = 1; j < height; j += 1.2) for (const ox of [-2, 0, 2]) box(groups.terrain, x + ox, j, z + 2.02, .6, .23, .06, ch.glow, { emissive: ch.glow, emissiveIntensity: .4 });
    cylinder(groups.terrain, x + 2.8, height + 1, z, .3, .5, 3, 0x4a626e, metallic);
    if (state.level.chapter === 0 || state.level.chapter === 5) { rod(groups.terrain, [x - 3, 0, -4], [x - 3, 10, -4], .17, 0x68757b); rod(groups.terrain, [x - 3, 9.5, -4], [x + 4, 9.5, -4], .18, 0x788287); rod(groups.terrain, [x + 3, 9.5, -4], [x + 3, 4.5, -4], .035, 0x243b45); }
    if (state.level.chapter === 2) for (let i = 0; i < 3; i++) cylinder(groups.terrain, x + i, 1 + i * .4, -4, 0, .5, 3 + i, 0x9ecee3, { segments: 5, metalness: .3, roughness: .25 });
    if (state.level.chapter === 4) { cylinder(groups.terrain, x, 2.7, -3.5, .65, .65, 5, 0x466f6d, metallic); ring(groups.terrain, x, 3.4, -3.5, .74, .14, 0x86edc4, [Math.PI / 2, 0, 0]); }
  }
  for (const h of state.level.hazards) { const mesh = box(groups.terrain, h.x + h.w / 2, .025, .1, h.w, .06, 3, h.type === 'ice' ? 0xaadbed : 0x72442a, { emissive: h.type === 'electric' ? 0x61ffc2 : 0xff703b, emissiveIntensity: .4 }); lightObjects.push([h, mesh]); }
  exitMesh = group(groups.terrain); exitMesh.position.set(state.level.length - 1, 0, -1);
  for (const x of [-1.1, 1.1]) box(exitMesh, x, 1.7, 0, .35, 3.4, .55, 0x74918f, metallic);
  box(exitMesh, 0, 3.4, 0, 2.6, .45, .6, 0x74918f, metallic); label(exitMesh, '撤离 →', 0, 4.2, 0, { color: '#a3ffd5', size: .7 });
  playerMesh = soldier(groups.actors, 0x71b6bd); label(groups.terrain, '向右突围  →', 4, 4.8, 0, { color: '#e7d6b3', size: .8 });
  sync();
}
function syncObjects(prefix, values, make, update) {
  const wanted = new Set(values.map(v => `${prefix}${v.id}`));
  for (const [key, mesh] of actors) if (key.startsWith(prefix) && !wanted.has(key)) { clearGroup(mesh); mesh.removeFromParent(); actors.delete(key); }
  for (const v of values) { const key = `${prefix}${v.id}`; let mesh = actors.get(key); if (!mesh) { mesh = make(v); actors.set(key, mesh); } update(mesh, v); }
}
function sync() {
  const p = state.player;
  playerMesh.position.set(p.x, p.y, .45); playerMesh.scale.x = p.facing; playerMesh.visible = !(p.invuln > 0 && Math.floor(state.time * 14) % 2);
  playerMesh.userData.legs.forEach((leg, i) => { leg.rotation.z = Math.sin(state.time * 13 + i * Math.PI) * (game.input.axis('x') ? .45 : .04); });
  for (const [p, m] of platformMeshes) m.position.y = p.y + (p.moving ? Math.sin(state.time * 1.2 + p.x) * .5 : 0);
  for (const [h, m] of lightObjects) m.material.emissiveIntensity = h.type === 'ice' ? .25 : Math.sin(state.time * 1.7 + h.phase) > .15 ? 1.8 : .12;
  syncObjects('e', state.enemies, e => { const m = e.type === 'boss' ? bossModel(groups.actors, e.boss) : e.type === 'drone' ? drone(groups.actors) : e.type === 'turret' ? turret(groups.actors) : soldier(groups.actors, e.type === 'shield' ? 0xb09c79 : 0xbb8880, e.type); const bar = box(m, 0, e.type === 'boss' ? 3.7 : 2.2, 0, e.type === 'boss' ? 3 : .9, .08, .08, 0xff847d, { emissive: 0xff6554 }); m.userData.bar = bar; return m; }, (m, e) => { m.position.set(e.x, e.y, 0); m.scale.x = p.x < e.x ? -1 : 1; m.userData.bar.scale.x = Math.max(.01, e.hp / e.maxHp); if (m.userData.legs) m.userData.legs.forEach((l, i) => l.rotation.z = Math.sin(state.time * 7 + i * 3.14) * .15); });
  syncObjects('t', state.targets, () => { const m = group(groups.actors); cylinder(m, 0, .9, 0, .42, .55, 1.8, 0x3e6869, metallic); sphere(m, 0, 1.1, .25, .35, 0xff836b, { emissive: 0xff563e }); label(m, '能源', 0, 2.3, 0, { size: .45, color: '#ff9b87' }); return m; }, (m, v) => m.position.set(v.x, v.y, 0));
  syncObjects('u', state.pickups, v => { const m = group(groups.actors); box(m, 0, .5, 0, .8, .55, .55, 0x50666f, metallic); ring(m, 0, .5, 0, .65, .055, WEAPONS[v.weapon].color); label(m, WEAPONS[v.weapon].name, 0, 1.6, 0, { size: .42 }); return m; }, (m, v) => { m.position.set(v.x, v.y + Math.sin(state.time * 2 + v.x) * .12, .2); m.rotation.y = state.time * .5; });
  syncObjects('b', state.bullets, v => { const m = group(groups.effects); const shot = sphere(m, 0, 0, 0, v.owner === 'enemy' ? v.r : .13, v.color || 0xffffff, { emissive: v.color || 0xffffff, emissiveIntensity: 1.3, segments: 8 }); if (v.pierce > 1) shot.scale.x = 2.8; return m; }, (m, v) => { m.position.set(v.x, v.y, .5); m.rotation.z = Math.atan2(v.vy, v.vx); });
  syncObjects('q', state.particles, v => { const m = group(groups.effects); sphere(m, 0, 0, 0, .075, v.color || 0xffbd75, { emissive: v.color || 0xffbd75, segments: 6 }); return m; }, (m, v) => { m.position.set(v.x, v.y, .5); m.scale.setScalar(Math.max(.1, v.life * 2)); });
  const aspect = game.camera.aspect, distance = aspect < .85 ? 27 : 19;
  const focus = aspect < .85 ? Math.max(4, Math.min(state.level.length - 4, p.x + 1.5)) : Math.max(9, Math.min(state.level.length - 9, p.x + 3));
  game.camera.position.set(focus + (aspect < .85 ? 0 : 1.5), 6.1, distance); game.camera.lookAt(focus, 2.3, 0);
  game.sun.position.set(focus - 12, 22, 16); game.sun.target.position.set(focus, 0, 0); game.sun.target.updateMatrixWorld();
}
function menu() {
  game.ui.overlay({ title: '穿过钢铁，抵达黎明', text: '6 章 · 18 关 · 8 种武器。每关可自由挑战，通关记录保存在此浏览器。', body: `<div class="field"><label for="steel-level">行动简报</label><select id="steel-level">${LEVELS.map(l => `<option value="${l.id}" ${l.id === selectedLevel ? 'selected' : ''}>${l.chapter + 1}-${l.stage + 1} ${CHAPTERS[l.chapter].name} · ${l.boss !== null ? CHAPTERS[l.chapter].boss : l.name}${progress.best[l.id] ? ' ✓' : ''}</option>`).join('')}</select></div><div class="field"><label for="steel-weapon">起始装备</label><select id="steel-weapon">${WEAPONS.map((w, i) => `<option value="${i}" ${i === selectedWeapon ? 'selected' : ''}>${w.name} — ${w.description}</option>`).join('')}</select></div><div class="mission-brief">A/D 移动 · Z 跳跃 · 空格射击 · E 榴弹 · Q 换枪<br>越过间歇地面火焰，在升高平台上取得射界。能源柱与首领全部摧毁后抵达最右端撤离门。</div><div class="arsenal-note">已记录 ${Object.keys(progress.best).length} / 18 关 · 当前关卡最高 ${progress.best[selectedLevel] || 0} 分</div>`, buttons: [{ label: '开始突围', primary: true, onClick: () => { selectedLevel = Number(document.querySelector('#steel-level').value); selectedWeapon = Number(document.querySelector('#steel-weapon').value); start(); } }, ...(state && !ended ? [{ label: '继续当前行动', onClick: () => game.ui.hideOverlay() }] : [])] });
}
function start() { state = createSteel(selectedLevel, selectedWeapon); ended = false; soundTick = 0; buildScene(); game.ui.hideOverlay(); game.ui.hint('A/D 移动 · Z/↑ 跳跃 · 空格射击 · W 向上瞄准 · E 榴弹 · Q 换枪'); }
function result() { ended = true; progress = recordResult(progress, state); game.save(progress); const won = state.status === 'won'; game.ui.overlay({ title: won ? '行动完成' : '行动中断', text: won ? `撤离成功。${CHAPTERS[state.level.chapter].name}的这一段防线已打开。` : '装甲已耗尽。利用平台与火力间隙，或换一种装备再试。', body: `<div class="choice-grid"><div class="choice"><strong>${state.score}</strong><span>本次得分</span></div><div class="choice"><strong>${Math.floor(state.time)} 秒</strong><span>行动用时</span></div><div class="choice"><strong>${Math.ceil(state.player.hp)}</strong><span>剩余装甲</span></div></div>`, buttons: [...(won && selectedLevel < 17 ? [{ label: '下一关', primary: true, onClick: () => { selectedLevel++; start(); } }] : []), { label: '重开本关', primary: !won, onClick: start }, { label: '选择行动', onClick: menu }] }); }
game.onMenu(menu); state = createSteel(0); buildScene(); menu();
game.run(dt => {
  const i = game.input, before = state.score, shooting = i.held('Space') || i.held('KeyJ');
  stepSteel(state, { move: i.axis('x'), jump: i.pressed('KeyZ') || i.pressed('KeyK') || i.pressed('ArrowUp'), shoot: shooting, aimUp: i.held('KeyW'), grenade: i.pressed('KeyE'), switch: i.pressed('KeyQ') }, dt);
  sync(); soundTick -= dt; if (shooting && soundTick <= 0) { game.sound(160 + state.player.weapon * 30, .055, 'sawtooth', .016); soundTick = WEAPONS[state.player.weapon].rate; } if (state.score > before) game.sound(90, .12, 'triangle', .035);
  game.ui.stats([{ label: '装甲', value: `${Math.ceil(state.player.hp)} / 100` }, { label: '行动', value: `${state.level.chapter + 1}-${state.level.stage + 1}` }, { label: '武器', value: WEAPONS[state.player.weapon].name }, { label: '榴弹', value: state.player.grenades }, { label: '得分', value: state.score }]);
  if (state.notice) { game.ui.toast(state.notice); state.notice = ''; } if (!ended && state.status !== 'playing') result();
});

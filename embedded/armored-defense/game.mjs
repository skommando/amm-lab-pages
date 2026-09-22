import { THREE, createGame, box, sphere, cylinder, label, clearGroup } from '../arcade-runtime/runtime.mjs';
import { TANKS, ENEMY_TYPES, REGIONS, MAPS, createDefense, stepDefense, normalizeSave, recordResult } from './core.mjs';
const game = createGame({ id: 'armored-defense', title: '装甲守线', subtitle: 'ARMORED DEFENSE / TACTICAL 3D', accent: '#a4d6b5', background: 0x17282b, help: 'WASD / 方向盘驾驶，炮塔默认随行驶方向；鼠标按住战场可瞄准并开炮，空格开炮；Q/E 可独立旋转炮塔；F 使用车型技能。移动触控使用左右转炮、开炮、技能。保护底部蓝色基地，砖墙可击碎，金属墙与水面阻挡通行。打完所有波次获胜；生存模式会持续增兵。每五次击毁掉落修理补给。' });
game.controls([{ code: 'KeyQ', label: '炮塔↶' }, { code: 'KeyE', label: '炮塔↷' }, { code: 'Space', label: '开炮' }, { code: 'KeyF', label: '技能' }]);
let state, save = normalizeSave(game.load({})), selectedMap = 0, selectedTank = 0, selectedMode = 'campaign', ended = false, groups = {}, meshes = new Map(), playerMesh, baseCore, baseRing, lastAim = null, soundClock = 0;
const mat = { metalness: .75, roughness: .33 };
const group = parent => { const g = new THREE.Group(); parent.add(g); return g; };
function torus(parent, x, y, z, r, tube, color, rotation = [0, 0, 0]) { const m = new THREE.Mesh(new THREE.TorusGeometry(r, tube, 8, 24), new THREE.MeshStandardMaterial({ color, metalness: .65, roughness: .35 })); m.position.set(x, y, z); m.rotation.set(...rotation); parent.add(m); return m; }
function hull(parent, color, heavy = false) {
  const g = group(parent), tracks = [];
  for (const side of [-1, 1]) {
    box(g, side * .8, .43, 0, .47, .65, 2.35, 0x243b39, mat);
    for (let j = -2; j <= 2; j++) { const wheel = cylinder(g, side * 1.06, .42, j * .42, .25, .25, .055, 0x70837a, { ...mat, rotation: [0, 0, Math.PI / 2] }); tracks.push(wheel); cylinder(g, side * 1.1, .42, j * .42, .09, .09, .065, 0x334b47, { ...mat, rotation: [0, 0, Math.PI / 2] }); }
    for (let j = -5; j <= 5; j++) box(g, side * .81, .8, j * .21, .48, .08, .1, 0x809081, mat);
    box(g, side * .84, .92, 0, .56, .13, 2.5, color, mat);
  }
  box(g, 0, .72, 0, 1.25, .65, 2.25, color, mat); box(g, 0, 1.02, -.1, 1.45, .16, 1.8, color, mat);
  box(g, 0, .78, -1.14, 1.25, .38, .16, 0x68877b, { ...mat, rotation: [-.3, 0, 0] });
  for (const x of [-.5, .5]) { sphere(g, x, .93, -1.12, .12, 0xf6e5b0, { emissive: 0xffd88b, emissiveIntensity: .6 }); cylinder(g, x, 1.04, .78, .11, .11, .28, 0x2c4341, mat); }
  const turret = group(g); turret.position.y = 1.15;
  cylinder(turret, 0, 0, .1, .48, .6, .35, color, { ...mat, segments: 8 }); sphere(turret, 0, .13, .08, .48, color, mat).scale.set(1.25, .6, 1.1);
  cylinder(turret, 0, .4, .12, .22, .22, .06, 0x90aa9b, mat); box(turret, .23, .38, -.22, .18, .12, .16, 0xa7e4df, { emissive: 0x4d9f96 });
  cylinder(turret, 0, .13, -.88, heavy ? .15 : .1, heavy ? .17 : .13, heavy ? 1.75 : 1.3, 0x3b5350, { ...mat, rotation: [Math.PI / 2, 0, 0] }); box(turret, 0, .13, heavy ? -1.79 : -1.55, .25, .25, .28, color, mat);
  cylinder(turret, -.34, .68, .45, .025, .025, .9, 0xc6d5c8, mat); sphere(turret, -.34, 1.15, .45, .055, color, { emissive: color });
  g.userData.turret = turret; g.userData.tracks = tracks; return g;
}
function tankModel(parent, id, enemy = false) {
  const t = enemy ? ENEMY_TYPES[id] : TANKS[id], g = hull(parent, t.color, id === 1 || id === 2 || id === 7), turret = g.userData.turret;
  if (!enemy && id === 2) { cylinder(turret, 0, .13, -1.4, .065, .065, 2.4, 0x738aa7, { ...mat, rotation: [Math.PI / 2, 0, 0] }); box(turret, .44, .12, -.55, .13, .2, .8, 0x8cabf3, { emissive: 0x6c9af5 }); }
  if ((!enemy && id === 3) || (enemy && id === 7)) for (const x of [-.32, .32]) cylinder(turret, x, .16, -1, .085, .1, 1.7, t.color, { ...mat, rotation: [Math.PI / 2, 0, 0] });
  if ((!enemy && id === 4) || (enemy && id === 6)) { box(g, 0, 1.16, .7, .8, .23, .4, 0xe6eac9); box(g, 0, 1.29, .7, .4, .015, .14, 0x77a36b); box(g, 0, 1.3, .7, .14, .02, .32, 0x77a36b); }
  if (enemy && id === 3) { box(g, 0, .52, -1.35, 2.1, .64, .25, 0xcaa386, { ...mat, rotation: [-.25, 0, 0] }); for (let x = -.8; x <= .8; x += .4) cylinder(g, x, .6, -1.62, 0, .13, .5, 0x8b6451, { rotation: [Math.PI / 2, 0, 0] }); }
  if (enemy && id === 4) box(g, 0, 1.15, -.82, 1.85, .85, .2, 0xaab4be, mat);
  if (enemy && id === 2) { turret.rotation.x = -.22; cylinder(g, 0, 1.9, .6, .12, .13, 1.1, 0x4a5553, { rotation: [.5, 0, 0] }); }
  if (enemy && id === 5) for (const x of [-.75, .75]) cylinder(g, x, 1.28, .5, .18, .18, .6, 0xf5a362, mat);
  if (id === 1 || id === 4 || id === 7) g.scale.setScalar(enemy && id === 7 ? 1.2 : 1.06);
  const bar = box(g, 0, 2.5, 0, 1.2, .06, .11, enemy ? 0xf5957f : 0xadebd6, { emissive: enemy ? 0xf5957f : 0xadebd6 }); g.userData.bar = bar; return g;
}
function wallModel(w) {
  const g = group(groups.terrain); g.position.set(w.x, 0, w.y);
  if (w.kind === 'steel') { box(g, 0, .78, 0, w.w, 1.55, w.h, 0x6d817c, mat); box(g, 0, 1.59, 0, w.w + .1, .1, w.h + .1, 0xa5b4aa, mat); for (const x of [-w.w * .35, w.w * .35]) for (const z of [-w.h / 2 - .02, w.h / 2 + .02]) sphere(g, x, .8, z, .09, 0xc6d0b9, mat); }
  else { const cols = Math.ceil(w.w / .58); for (let row = 0; row < 3; row++) for (let j = 0; j < cols; j++) { const width = w.w / cols; box(g, -w.w / 2 + width * (j + .5), .22 + row * .42, 0, width - .05, .37, w.h, row % 2 ? 0x9a8570 : 0xad9376, { roughness: .9 }); } }
  return g;
}
function build() {
  clearGroup(game.world); meshes.clear(); groups = { terrain: group(game.world), actors: group(game.world), effects: group(game.world) };
  const region = REGIONS[state.map.region]; game.scene.background.setHex(region.sky); game.scene.fog.color.setHex(region.sky);
  box(groups.terrain, 0, -.5, 0, 25.6, 1, 29.8, 0x304b47, mat); box(groups.terrain, 0, .015, 0, 24, .07, 28, region.floor, { roughness: 1 });
  for (const x of [-12.5, 12.5]) box(groups.terrain, x, .2, 0, .5, .6, 29.8, 0xa1af9c, mat);
  for (const z of [-14.6, 14.6]) box(groups.terrain, 0, .2, z, 25.6, .6, .5, 0xa1af9c, mat);
  for (let x = -10; x <= 10; x += 2) for (let z = -12; z <= 12; z += 4) box(groups.terrain, x, .065, z, .035, .015, 1.8, 0x99ab92, { opacity: .18 });
  for (const w of state.water) { box(groups.terrain, w.x, .08, w.y, w.w + .3, .12, w.h + .3, 0x345c6a); box(groups.terrain, w.x, .15, w.y, w.w, .09, w.h, state.map.region === 4 ? 0xdd855c : 0x75b5bf, { metalness: .65, roughness: .12, emissive: state.map.region === 4 ? 0x9d4825 : 0x164048 }); for (let i = 0; i < 3; i++) box(groups.terrain, w.x, .21, w.y - w.h * .3 + i * w.h * .3, w.w * .8, .012, .04, 0xbbdadd); }
  for (let i = 0; i < 16; i++) {
    const x = i % 2 ? -13.7 : 13.7, z = -12 + Math.floor(i / 2) * 3.5;
    if (state.map.region === 2 || state.map.region === 4) { box(groups.terrain, x, 1.2, z, 1.2, 2.4 + i % 3, 2.2, 0x596c69, mat); cylinder(groups.terrain, x, 3.4, z, .15, .2, 1.5, 0x7e8e84); }
    else { cylinder(groups.terrain, x, .65, z, .12, .22, 1.3, 0x736455); for (let j = 0; j < 3; j++) cylinder(groups.terrain, x, 1.1 + j * .45, z, 0, .8 - j * .13, 1.2, state.map.region === 3 ? 0xb0c7c2 : 0x638975, { segments: 7 }); }
  }
  const base = group(groups.terrain); base.position.set(0, 0, 12); cylinder(base, 0, .3, 0, 1.45, 1.7, .6, 0x577870, { ...mat, segments: 8 }); box(base, 0, .9, 0, 1.8, .9, 1.6, 0x91b7a6, mat); cylinder(base, 0, 1.6, 0, .48, .65, .8, 0x436e6b, mat); baseCore = sphere(base, 0, 2.1, 0, .36, 0x9ef0dc, { emissive: 0x5bd5b9, emissiveIntensity: .9 }); baseRing = torus(base, 0, 2.1, 0, .7, .06, 0xade7d5, [Math.PI / 2, .2, 0]); label(base, '守卫核心', 0, 3.1, 0, { color: '#b7efda', size: .55 });
  for (const x of [-9, 0, 9]) { label(groups.terrain, '敌军 ↓', x, .9, -13.9, { color: '#edaf8d', size: .5 }); }
  playerMesh = tankModel(groups.actors, state.tankId); sync();
}
function syncItems(prefix, values, make, update) {
  const wanted = new Set(values.map(v => prefix + v.id));
  for (const [key, mesh] of meshes) if (key.startsWith(prefix) && !wanted.has(key)) { clearGroup(mesh); mesh.removeFromParent(); meshes.delete(key); }
  for (const value of values) { const key = prefix + value.id; let mesh = meshes.get(key); if (!mesh) { mesh = make(value); meshes.set(key, mesh); } update(mesh, value); }
}
function sync() {
  const p = state.player; playerMesh.position.set(p.x, 0, p.y); playerMesh.rotation.y = -p.angle; playerMesh.userData.turret.rotation.y = p.angle - p.aim; playerMesh.userData.bar.scale.x = Math.max(.01, p.hp / TANKS[state.tankId].hp); playerMesh.visible = !(p.invuln > 0 && Math.floor(state.time * 18) % 2);
  baseCore.material.emissiveIntensity = .5 + Math.sin(state.time * 3) * .2; baseRing.rotation.z = state.time;
  syncItems('w', state.walls, wallModel, (m, w) => { if (w.kind === 'brick') m.scale.y = .6 + Math.max(0, w.hp) / (w.y > 9 ? 110 : 80) * .4; });
  syncItems('e', state.enemies, e => tankModel(groups.actors, e.type, true), (m, e) => { m.position.set(e.x, 0, e.y); m.rotation.y = -e.angle; m.userData.turret.rotation.y = e.angle - e.aim; m.userData.bar.scale.x = Math.max(.01, e.hp / e.maxHp); m.userData.tracks.forEach(w => w.rotation.x = state.time * 3); });
  syncItems('b', state.bullets, b => { const m = group(groups.effects); const ball = sphere(m, 0, 0, 0, b.mortar ? .22 : .12, b.color || 0xffdd9b, { emissive: b.color || 0xffdd9b, emissiveIntensity: 1.2, segments: 8 }); ball.scale.z = 2.4; return m; }, (m, b) => { m.position.set(b.x, b.mortar ? 1.7 + Math.sin(b.life * 2) * .7 : 1.25, b.y); m.rotation.y = Math.atan2(b.vx, b.vy); });
  syncItems('p', state.particles, p => { const m = group(groups.effects); sphere(m, 0, 0, 0, .13, p.color, { emissive: p.color, segments: 6 }); return m; }, (m, p) => { m.position.set(p.x, .5 + (1 - p.life) * 2, p.y); m.scale.setScalar(Math.max(.1, p.life)); });
  syncItems('s', state.supplies, () => { const m = group(groups.actors); box(m, 0, .4, 0, .65, .6, .65, 0xe4e9bd); box(m, 0, .71, 0, .45, .02, .14, 0x71ab6f); box(m, 0, .73, 0, .14, .02, .45, 0x71ab6f); torus(m, 0, .4, 0, .7, .03, 0xccf5a2, [Math.PI / 2, 0, 0]); return m; }, (m, p) => { m.position.set(p.x, Math.sin(state.time * 2) * .12 + .1, p.y); m.rotation.y = state.time; });
  const a = game.camera.aspect, scale = Math.max(1, .84 / a); game.camera.position.set(0, 32 * scale, 23 * scale); game.camera.lookAt(0, 0, 0);
}
const ray = new THREE.Raycaster(), plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -1.2), aimPoint = new THREE.Vector3();
function getAim() { if (!game.input.pointer.down) return undefined; ray.setFromCamera(game.input.pointer, game.camera); const hit = ray.ray.intersectPlane(plane, aimPoint); if (!hit) return undefined; lastAim = Math.atan2(aimPoint.x - state.player.x, state.player.y - aimPoint.z); return lastAim; }
function menu() {
  game.ui.overlay({ title: '守住这一条防线', text: '40 张战场，6 种车型，8 类敌军。自由选关；每张地图有独立巷道、水域和增援组合。', body: `<div class="defense-grid"><div class="field"><label for="def-map">战场</label><select id="def-map">${MAPS.map(m => `<option value="${m.id}" ${m.id === selectedMap ? 'selected' : ''}>${String(m.id + 1).padStart(2, '0')} · ${REGIONS[m.region].name} / ${m.name}${save.best[m.id] ? ' ✓' : ''}</option>`).join('')}</select></div><div class="field"><label for="def-mode">任务模式</label><select id="def-mode"><option value="campaign" ${selectedMode === 'campaign' ? 'selected' : ''}>战役守卫 · 清完所有波次</option><option value="survival" ${selectedMode === 'survival' ? 'selected' : ''}>生存防线 · 持续增援</option></select></div></div><div class="field"><label for="def-tank">出战车型</label><select id="def-tank">${TANKS.map((t, i) => `<option value="${i}" ${i === selectedTank ? 'selected' : ''}>${t.name} · ${t.role} · 装甲 ${t.hp}</option>`).join('')}</select><small>${TANKS.map(t => `${t.name}：${t.skill}`).join('；')}</small></div><p class="brief">WASD 驾驶，空格开炮，Q/E 转炮塔，F 技能。鼠标按住战场可瞄准射击。<br>砖墙可破坏；钢墙与水域不可通行。基地毁坏或车体归零即失败。</p><p class="muted">战场通过 ${Object.keys(save.best).length} / 40 · 生存纪录 ${save.survival} 波</p>`, buttons: [{ label: '部署坦克', primary: true, onClick: () => { selectedMap = Number(document.querySelector('#def-map').value); selectedTank = Number(document.querySelector('#def-tank').value); selectedMode = document.querySelector('#def-mode').value; start(); } }, ...(state && !ended ? [{ label: '继续守卫', onClick: () => game.ui.hideOverlay() }] : [])] });
}
function start() { state = createDefense(selectedMap, selectedTank, selectedMode); ended = false; lastAim = null; soundClock = 0; build(); game.ui.hideOverlay(); game.ui.hint('WASD 驾驶 · 空格开炮 · Q/E 炮塔 · F 技能 · 按住鼠标瞄准射击'); }
function finish() { ended = true; save = recordResult(save, state); game.save(save); const won = state.status === 'won'; game.ui.overlay({ title: won ? '防线依然屹立' : state.base.hp <= 0 ? '核心失守' : '车体失去动力', text: won ? '敌军增援已全部击退，下一片区域正在等待你。' : '调配火力与维修时机，利用掩体再次守住基地。', body: `<div class="choice-grid"><div class="choice"><strong>${state.kills}</strong><span>击毁敌军</span></div><div class="choice"><strong>${state.score}</strong><span>战斗得分</span></div><div class="choice"><strong>${Math.ceil(state.base.hp)}</strong><span>基地耐久</span></div><div class="choice"><strong>${state.wave}</strong><span>抵达波次</span></div></div>`, buttons: [...(won && selectedMap < 39 ? [{ label: '下一战场', primary: true, onClick: () => { selectedMap++; start(); } }] : []), { label: '重新部署', primary: !won, onClick: start }, { label: '选择战场', onClick: menu }] }); }
game.onMenu(menu); state = createDefense(); build(); menu();
game.run(dt => {
  const input = game.input, shoot = input.held('Space') || input.pointer.down, oldKills = state.kills;
  stepDefense(state, { x: input.axis('x'), y: input.axis('y'), aim: getAim(), turn: (input.held('KeyE') ? 1 : 0) - (input.held('KeyQ') ? 1 : 0), shoot, skill: input.pressed('KeyF') }, dt); sync();
  soundClock -= dt; if (shoot && soundClock <= 0) { game.sound(75, .16, 'sawtooth', .027); soundClock = TANKS[state.tankId].rate; } if (state.kills > oldKills) game.sound(55, .22, 'triangle', .04);
  game.ui.stats([{ label: '车体', value: `${Math.ceil(state.player.hp)} / ${TANKS[state.tankId].hp}` }, { label: '基地', value: `${Math.ceil(state.base.hp)} / 160` }, { label: '波次', value: `${state.wave}${state.mode === 'campaign' ? ' / ' + state.map.waves.length : ''}` }, { label: '技能', value: state.player.skillCooldown > 0 ? `${Math.ceil(state.player.skillCooldown)} 秒` : '就绪' }, { label: '击毁', value: state.kills }]);
  if (state.notice) { game.ui.toast(state.notice); state.notice = ''; } if (!ended && state.status !== 'playing') finish();
});

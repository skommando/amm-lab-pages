import { THREE, createGame, box, sphere, cylinder, label, clearGroup } from '../arcade-runtime/runtime.mjs';
import { WORLDS, LEVELS, CHARACTERS, ENEMY_TYPES, createBubble, stepBubble, normalizeSave, recordResult } from './core.mjs';
const game = createGame({ id: 'bubble-expedition', title: '泡泡远征队', subtitle: 'BUBBLE EXPEDITION / TINY WORLDS', accent: '#d0e99d', background: 0x183c38, help: 'A/D 或左右方向键移动，Z / K / ↑ 跳跃；空格 / J 吹泡捕获敌人；E / X 碰泡，触发身边2.7米范围内泡泡并连锁附近被捕敌人。被捕泡泡会向上飘，超时敌人逃脱并狂暴。踩空泡可借力再跳；桃色台是弹簧，蓝色冰台有惯性，月桂世界平台会升降。清除全部敌人才胜利；关底首领先用多发泡泡削弱护甲再捕获。' });
game.controls([{ code: 'KeyZ', label: '跳跃' }, { code: 'Space', label: '吹泡' }, { code: 'KeyE', label: '碰泡' }]);
let state, save = normalizeSave(game.load({})), selectedLevel = 0, selectedCharacter = 0, ended = false, groups = {}, meshes = new Map(), platformModels = [], hazards = [], playerMesh, soundClock = 0;
const clay = { roughness: .68, metalness: .03 };
const group = parent => { const g = new THREE.Group(); parent.add(g); return g; };
function ring(parent, x, y, z, r, tube, color, rotation = [0, 0, 0]) { const m = new THREE.Mesh(new THREE.TorusGeometry(r, tube, 8, 32), new THREE.MeshStandardMaterial({ color, roughness: .38, metalness: .1 })); m.position.set(x, y, z); m.rotation.set(...rotation); parent.add(m); return m; }
function branch(parent, a, b, r, color) { const av = new THREE.Vector3(...a), bv = new THREE.Vector3(...b), v = bv.clone().sub(av); const m = cylinder(parent, ...(av.clone().add(bv).multiplyScalar(.5).toArray()), r * .8, r, v.length(), color, clay); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), v.normalize()); return m; }
function eyes(parent, y, z, scale = 1) { for (const x of [-.19, .19]) { sphere(parent, x * scale, y, z, .13 * scale, 0xfffcde, clay).scale.z = .6; sphere(parent, x * scale + .025, y - .005, z + .072 * scale, .064 * scale, 0x24434a, { roughness: .25 }); sphere(parent, x * scale + .043, y + .024, z + .105 * scale, .02 * scale, 0xffffff); } }
function creature(parent, character) {
  const g = group(parent), color = CHARACTERS[character].color;
  sphere(g, 0, .7, 0, .58, color, clay).scale.set(.8, 1.02, .7); sphere(g, .05, .67, .33, .35, 0xf1edc8, clay).scale.set(.82, 1.1, .34);
  sphere(g, 0, 1.25, .02, .48, color, clay).scale.set(1, .9, .86); eyes(g, 1.32, .4);
  sphere(g, .22, 1.08, .42, .18, color, clay); ring(g, .26, 1.1, .54, .09, .024, 0x557d6d); sphere(g, -.3, 1.18, .34, .09, 0xecada1).scale.z = .25;
  for (const x of [-.3, .3]) { sphere(g, x, .12, .12, .24, color, clay).scale.set(1, .5, 1.3); sphere(g, x * 1.5, .72, .16, .18, color, clay).scale.y = 1.3; }
  for (const x of [-.24, .24]) { const ear = sphere(g, x, 1.76, -.04, .22, color, clay); ear.scale.set(.48, character === 1 ? 1.65 : 1.1, .65); ear.rotation.z = -x * 1.4; sphere(g, x, 1.77, .1, .11, 0xe7d9bc).scale.set(.45, 1.5, .25); }
  for (let i = 0; i < 4; i++) sphere(g, -.33 - i * .15, .45 - i * .06, -.15 - i * .06, .2 - i * .035, color, clay);
  if (character === 2) { ring(g, 0, .95, 0, .4, .05, 0xe8cf95, [Math.PI / 2, 0, 0]); sphere(g, .3, .95, .34, .12, 0xe8cf95); }
  g.userData.feet = [g.children[7], g.children[8]]; return g;
}
function enemyModel(parent, type) {
  const g = group(parent), info = ENEMY_TYPES.find(e => e.id === type), color = info.color;
  sphere(g, 0, .65, 0, .46, color, clay).scale.set(type === 'shell' ? 1.15 : .9, type === 'spitter' ? 1.2 : .95, .85);
  if (type === 'walker') { cylinder(g, 0, 1.06, 0, 0, .45, .45, 0x947454, { segments: 7, roughness: .8 }); for (const x of [-.15, .15]) { const leaf = sphere(g, x, 1.38, 0, .2, 0xa9c77f, clay); leaf.scale.set(.45, 1.3, .3); leaf.rotation.z = x * 3; } }
  if (type === 'hopper') for (const x of [-.22, .22]) { const ear = sphere(g, x, 1.28, 0, .2, color, clay); ear.scale.set(.48, 1.7, .7); ear.rotation.z = -x; }
  if (type === 'flyer') for (const side of [-1, 1]) { const wing = group(g); wing.position.set(side * .35, .7, -.08); for (let j = 0; j < 3; j++) { const feather = sphere(wing, side * (.23 + j * .18), .1 - j * .1, 0, .27, 0xc7f0d7, clay); feather.scale.set(1.2, .28, .5); feather.rotation.z = side * (.3 - j * .2); } g.userData[`wing${side}`] = wing; }
  if (type === 'shell') { sphere(g, 0, .78, -.13, .48, 0xb26a73, clay).scale.set(1.2, .9, 1); for (let j = -1; j <= 1; j++) ring(g, j * .19, .79, -.06, .4, .035, 0xe6ad9d, [0, Math.PI / 2, 0]); }
  if (type === 'spitter') { cylinder(g, 0, 1.07, 0, .29, .19, .25, 0x799867, clay); ring(g, .3, .84, .2, .18, .09, color, [0, .5, 0]); cylinder(g, 0, 1.32, 0, 0, .32, .2, 0xd4d797, { segments: 8 }); }
  eyes(g, .77, .4, .85); for (const x of [-.23, .23]) sphere(g, x, .13, .1, .18, 0x77634f, clay).scale.set(1, .55, 1.25);
  return g;
}
function bossModel(parent, world) {
  const g = group(parent), color = [0x8da575, 0x85bdc8, 0xc09d88, 0xacb5df, 0xb2a4d0][world];
  if (world === 0) {
    cylinder(g, 0, 1.1, 0, .65, .95, 2.2, 0x907355, { roughness: .88, segments: 10 });
    for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3; branch(g, [Math.cos(a) * .5, .3, Math.sin(a) * .5], [Math.cos(a) * 1.2, .1, Math.sin(a)], .19, 0x866746); }
    for (const side of [-1, 1]) { branch(g, [side * .5, 1.6, 0], [side * 1.7, 2.3, 0], .23, 0x907355); sphere(g, side * 1.4, 2.5, 0, .75, color, clay); }
    sphere(g, 0, 2.8, 0, 1.1, color, clay).scale.set(1.35, .7, .9); eyes(g, 1.5, .73, 1.7);
  } else if (world === 1) {
    sphere(g, 0, 1.2, 0, 1.1, color, clay).scale.set(1.8, .9, .95); sphere(g, -.3, .9, .79, .7, 0xe3edda, clay).scale.set(1.6, .5, .2);
    for (const x of [-1.4, 1.4]) { const fin = sphere(g, x, .75, -.1, .65, color, clay); fin.scale.set(1.2, .22, .9); fin.rotation.z = x * .2; }
    cylinder(g, 0, 2.15, 0, 0, .25, .8, 0xddeac7, { segments: 7 }); eyes(g, 1.4, .94, 1.9);
  } else if (world === 2) {
    cylinder(g, 0, 1.4, 0, 1.1, 1.1, .85, color, { rotation: [Math.PI / 2, 0, 0], segments: 16 }); ring(g, 0, 1.4, .49, 1, .16, 0xe1bd84);
    for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6; const tooth = box(g, Math.sin(a) * 1.17, 1.4 + Math.cos(a) * 1.17, 0, .32, .35, .7, 0x9d8067, clay); tooth.rotation.z = -a; }
    branch(g, [0, 1.4, .57], [.4, 1.8, .57], .07, 0x67556b); branch(g, [0, 1.4, .58], [-.6, 1.5, .58], .06, 0x67556b); eyes(g, 1.32, .61, 1.5);
    for (const x of [-.65, .65]) { sphere(g, x, .15, .05, .35, color, clay).scale.y = .4; branch(g, [x, .2, 0], [x, .7, 0], .15, 0x947757); }
  } else if (world === 3) {
    sphere(g, 0, 1.9, 0, 1.1, color, { roughness: .2, metalness: .15 }).scale.set(1.4, .8, 1.1); ring(g, 0, 1.45, 0, 1.15, .15, 0xd9e1f1, [Math.PI / 2, 0, 0]);
    for (let i = 0; i < 7; i++) { const x = Math.sin(i * 2.4) * .8, z = Math.cos(i * 2.4) * .6; branch(g, [x, 1.4, z], [x + .25, .65, z], .11, 0xc2bee8); branch(g, [x + .25, .65, z], [x + .05, .1, z], .075, 0xc2bee8); }
    for (const x of [-.6, 0, .6]) cylinder(g, x, 2.95, 0, 0, .19, .6 + (x === 0 ? .3 : 0), 0xdce3fb, { segments: 5 }); eyes(g, 2.05, 1.02, 1.7);
  } else {
    sphere(g, 0, 1.1, 0, 1, color, clay).scale.set(1, 1.25, .85); sphere(g, .3, 2.15, 0, .65, color, clay); sphere(g, .45, 1.95, .48, .4, 0xe3d5b7, clay).scale.set(1.2, .6, .8);
    for (const side of [-1, 1]) { for (let j = 0; j < 3; j++) branch(g, [side * .6, 1.65, -.2], [side * (1.5 + j * .25), 2.3 - j * .6, -.4], .12, 0x8c7eb0); sphere(g, side * 1.2, 1.6, -.4, .8, 0xc9b7cd, clay).scale.set(1, .8, .18); cylinder(g, .3 + side * .4, 2.8, 0, 0, .16, .7, 0xe7dcac, { segments: 6 }); }
    for (let i = 0; i < 5; i++) sphere(g, -.55 - i * .26, .7 - i * .08, -.1, .34 - i * .04, color, clay); eyes(g, 2.24, .57, 1.3);
  }
  const bar = box(g, 0, 3.5, 0, 2.6, .085, .09, 0xf3d1a2, { emissive: 0xbb9955 }); g.userData.bar = bar; return g;
}
function platformModel(p) {
  const g = group(groups.terrain); g.position.set(p.x, p.y, 0);
  const shape = new THREE.Shape(); const w = p.w, d = 2.8, r = .2;
  shape.moveTo(r, -d / 2); shape.lineTo(w - r, -d / 2); shape.quadraticCurveTo(w, -d / 2, w, -d / 2 + r); shape.lineTo(w, d / 2 - r); shape.quadraticCurveTo(w, d / 2, w - r, d / 2); shape.lineTo(r, d / 2); shape.quadraticCurveTo(0, d / 2, 0, d / 2 - r); shape.lineTo(0, -d / 2 + r); shape.quadraticCurveTo(0, -d / 2, r, -d / 2);
  const mesh = new THREE.Mesh(new THREE.ExtrudeGeometry(shape, { depth: .48, bevelEnabled: true, bevelSegments: 2, bevelSize: .08, bevelThickness: .08, steps: 1 }), new THREE.MeshStandardMaterial({ color: p.spring ? 0xe6b29d : p.ice ? 0xa8ccda : WORLDS[state.level.world].floor, roughness: p.ice ? .12 : .65, metalness: p.ice ? .22 : .02 })); mesh.rotation.x = Math.PI / 2; mesh.receiveShadow = true; mesh.castShadow = true; g.add(mesh);
  for (let i = .5; i < w; i += 1.1) { sphere(g, i, -.45, 1.12, .11, 0xdce4bb, clay).scale.set(1, .7, .4); if (p.spring) ring(g, i, -.2, 0, .23, .035, 0xdce0a3, [Math.PI / 2, 0, 0]); }
  if (p.moving) for (const x of [.4, w - .4]) branch(g, [x, -.6, -1], [x, -2, -1], .05, 0xe5d6a7);
  platformModels.push([p, g]); return g;
}
function build() {
  clearGroup(game.world); meshes.clear(); platformModels = []; hazards = []; groups = { terrain: group(game.world), actors: group(game.world), effects: group(game.world) };
  const world = WORLDS[state.level.world]; game.scene.background.setHex(world.sky); game.scene.fog.color.setHex(world.sky);
  game.sun.color.setHex(0xffebd2); game.sun.intensity = 2.1;
  for (const p of state.level.platforms) platformModel(p);
  box(groups.terrain, 0, -1.1, 0, 22.5, 1.1, 4.2, 0x547760, clay);
  for (const side of [-1, 1]) {
    cylinder(groups.terrain, side * 12, 5.3, -4, .55, .8, 11, state.level.world === 0 ? 0x796851 : world.floor, { segments: 9, roughness: .8 });
    for (let j = 0; j < 5; j++) {
      if (state.level.world === 0) { branch(groups.terrain, [side * 12, j * 2 + 2, -4], [side * (9.5 + j % 2), j * 2 + 3, -5], .2, 0x7c7451); sphere(groups.terrain, side * 11, j * 2 + 3, -5, 2.1, j % 2 ? 0x749875 : 0x87a879, clay).scale.y = .55; }
      if (state.level.world === 1) { ring(groups.terrain, side * 12, j * 2 + 1, -4, .85, .16, 0xa3d1c7, [Math.PI / 2, 0, 0]); sphere(groups.terrain, side * 11, j * 2 + 1, -5, .45, 0xc1e9df, { opacity: .3, roughness: .2 }); }
      if (state.level.world === 2) { sphere(groups.terrain, side * 11.5, j * 2 + 1, -5, 1.2, 0xd0aeb6, clay).scale.set(1.3, .48, 1.2); cylinder(groups.terrain, side * 12, j * 2 + 1.6, -4, .55, .55, .35, 0xe7c0a2, { segments: 10 }); }
      if (state.level.world === 3) cylinder(groups.terrain, side * (11 + j % 2), j * 2 + 1, -5, 0, 1, 3.5, 0x93b9cb, { segments: 5, metalness: .35, roughness: .15 });
      if (state.level.world === 4) { ring(groups.terrain, side * 12, j * 2 + 1.2, -4, 1.05, .16, 0xb8aa8c); for (let k = 0; k < 6; k++) { const a = k * Math.PI / 3; box(groups.terrain, side * 12 + Math.cos(a), j * 2 + 1.2 + Math.sin(a), -4, .25, .3, .3, 0xcbb792, clay).rotation.z = a; } }
    }
  }
  for (let i = 0; i < 20; i++) { const x = -10 + i * 1.1; sphere(groups.terrain, x, -.2, -2.2, .32 + i % 3 * .12, i % 2 ? 0x9aac79 : 0xc9b68b, clay); if (i % 4 === 0) { branch(groups.terrain, [x, 0, -1.8], [x, .6, -1.8], .025, 0x779364); for (let j = 0; j < 5; j++) sphere(groups.terrain, x + Math.sin(j * 1.256) * .18, .7 + Math.cos(j * 1.256) * .18, -1.8, .11, world.accent, clay); } }
  for (const h of state.level.hazards) { const m = group(groups.terrain); m.position.set(h.x + h.w / 2, 0, 0); for (let j = 0; j < 4; j++) cylinder(m, (j - 1.5) * .3, .25, .3, 0, .15, .5, 0xcbbde4, { segments: 5 }); hazards.push([h, m]); }
  playerMesh = creature(groups.actors, state.character); sync();
}
function syncItems(prefix, values, make, update) {
  const wanted = new Set(values.map(v => prefix + v.id)); for (const [key, m] of meshes) if (key.startsWith(prefix) && !wanted.has(key)) { clearGroup(m); m.removeFromParent(); meshes.delete(key); }
  for (const v of values) { const key = prefix + v.id; let m = meshes.get(key); if (!m) { m = make(v); meshes.set(key, m); } update(m, v); }
}
function sync() {
  const p = state.player; playerMesh.position.set(p.x, p.y, .4); playerMesh.scale.x = p.facing; playerMesh.rotation.z = p.grounded ? Math.sin(state.time * 11) * Math.min(.05, Math.abs(p.vx) * .01) : -.06 * p.facing; playerMesh.visible = !(p.invuln > 0 && Math.floor(state.time * 12) % 2);
  for (const [platform, mesh] of platformModels) mesh.position.y = platform.y + (platform.moving ? Math.sin(state.time * .8 + platform.x) * .55 : 0);
  for (const [h, m] of hazards) m.scale.y = Math.sin(state.time * 1.8 + h.phase) > .4 ? 1 : .1;
  syncItems('e', state.enemies, e => e.boss ? bossModel(groups.actors, state.level.world) : enemyModel(groups.actors, e.type), (m, e) => { m.position.set(e.x, e.y, e.captured ? .25 : 0); m.rotation.z = e.captured ? Math.sin(state.time * 2) * .12 : 0; const scale = e.captured ? e.boss ? .4 : .75 : 1; m.scale.set(scale * (e.vx < 0 ? -1 : 1), scale, scale); if (e.boss) m.userData.bar.scale.x = Math.max(.05, e.hp / e.maxHp); if (e.type === 'flyer') for (const side of [-1, 1]) m.userData[`wing${side}`].rotation.z = Math.sin(state.time * 12) * side * .4; });
  syncItems('b', state.bubbles, b => {
    const m = group(groups.effects); const material = new THREE.MeshPhysicalMaterial({ color: 0xc8f9e6, metalness: .04, roughness: .08, transparent: true, opacity: .25, clearcoat: 1, clearcoatRoughness: .02, depthWrite: false, side: THREE.DoubleSide }); const mesh = new THREE.Mesh(new THREE.SphereGeometry(.66, 24, 16), material); m.add(mesh); ring(m, 0, 0, .02, .63, .014, 0xaedbca); sphere(m, -.25, .3, .5, .13, 0xf5ffe4, { opacity: .72, roughness: .1 }).scale.set(.6, 1.15, .2); sphere(m, .28, -.25, .47, .08, 0xcceafe, { opacity: .8 }).scale.z = .25; return m;
  }, (m, b) => { m.position.set(b.x, b.y, .5); const scale = b.enemy !== undefined ? 1.15 : .86; m.scale.setScalar(scale * (b.life < 2 ? 1 + Math.sin(state.time * 15) * .05 : 1)); });
  syncItems('s', state.seeds, () => { const m = group(groups.effects); sphere(m, 0, 0, 0, .17, 0xcf936f, clay).scale.y = 1.35; return m; }, (m, v) => { m.position.set(v.x, v.y, .4); m.rotation.z = state.time * 5; });
  syncItems('f', state.fruit, () => { const m = group(groups.actors); sphere(m, 0, 0, 0, .25, 0xf2bf79, clay); cylinder(m, 0, .26, 0, .025, .025, .2, 0x77915d); sphere(m, .13, .29, 0, .13, 0x9abd78, clay).scale.set(1, .4, .7); return m; }, (m, v) => { m.position.set(v.x, v.y, .45); m.rotation.y = state.time; });
  syncItems('q', state.particles, p => { const m = group(groups.effects); sphere(m, 0, 0, 0, .085, p.color, { emissive: p.color, emissiveIntensity: .2, segments: 6 }); return m; }, (m, p) => { m.position.set(p.x, p.y, .6); m.scale.setScalar(p.life * 1.5); });
  const narrow = game.camera.aspect < .85, focusX = narrow ? Math.max(-5.1, Math.min(5.1, p.x)) : 0;
  game.camera.position.set(focusX + (narrow ? 0 : .6), 7.8, narrow ? 30 : 24); game.camera.lookAt(focusX, 5.2, 0);
}
function menu() {
  game.ui.overlay({ title: '带上泡泡，去远征', text: '5 个微缩世界 · 50 个平台关卡。吹泡捕获，碰泡连锁，把守护者也变成一颗轻盈的泡泡。', body: `<div class="field"><label for="bubble-level">远征地点</label><select id="bubble-level">${LEVELS.map(l => `<option value="${l.id}" ${l.id === selectedLevel ? 'selected' : ''}>${l.world + 1}-${String(l.stage + 1).padStart(2, '0')} ${WORLDS[l.world].name} · ${l.boss || l.name}${save.best[l.id] ? ' ✓' : ''}</option>`).join('')}</select></div><div class="field"><label for="bubble-character">队员</label><select id="bubble-character">${CHARACTERS.map((c, i) => `<option value="${i}" ${i === selectedCharacter ? 'selected' : ''}>${c.name} — ${c.description}</option>`).join('')}</select></div><p class="bubble-guide">A/D 移动 · Z/↑ 跳跃 · 空格吹泡 · E/X 碰泡<br>吹泡只会捕获，靠近后碰泡才消灭敌人。相邻捕获泡泡会连锁，每一连的得分更高。被捕敌人会在数秒后逃脱，要及时追上泡泡。<br>桃色台自动弹跳，蓝色台会滑行，钟楼台会升降。</p><div class="bestiary">${ENEMY_TYPES.map(e => `<span>${e.name} · ${e.description}</span>`).join('')}</div><p class="muted">清场 ${Object.keys(save.best).length} / 50 · 最佳 ${save.combo} 连泡</p>`, buttons: [{ label: '开始远征', primary: true, onClick: () => { selectedLevel = Number(document.querySelector('#bubble-level').value); selectedCharacter = Number(document.querySelector('#bubble-character').value); start(); } }, ...(state && !ended ? [{ label: '继续本关', onClick: () => game.ui.hideOverlay() }] : [])] });
}
function start() { state = createBubble(selectedLevel, selectedCharacter); ended = false; soundClock = 0; build(); game.ui.hideOverlay(); game.ui.hint('A/D 移动 · Z/↑ 跳跃 · 空格吹泡捕获 · E/X 碰泡连锁 · 及时追上浮起的敌人'); }
function finish() { ended = true; save = recordResult(save, state); game.save(save); const won = state.status === 'won'; game.ui.overlay({ title: won ? '清场成功！' : '远征暂时停下', text: won ? `${WORLDS[state.level.world].name}又恢复了宁静。下一段旅途还在等待。` : '让泡泡替你挡住追兵，跳上平台后接近被捕的敌人。', body: `<div class="choice-grid"><div class="choice"><strong>${state.score}</strong><span>本次得分</span></div><div class="choice"><strong>${state.bestCombo}</strong><span>最佳连泡</span></div><div class="choice"><strong>${Math.floor(state.time)} 秒</strong><span>远征用时</span></div><div class="choice"><strong>${state.player.hp}</strong><span>剩余生命</span></div></div>`, buttons: [...(won && selectedLevel < 49 ? [{ label: '下一站', primary: true, onClick: () => { selectedLevel++; start(); } }] : []), { label: '再玩本关', primary: !won, onClick: start }, { label: '选择世界', onClick: menu }] }); }
game.onMenu(menu); state = createBubble(); build(); menu();
game.run(dt => {
  const i = game.input, blow = i.held('Space') || i.held('KeyJ'), oldScore = state.score;
  stepBubble(state, { move: i.axis('x'), jump: i.pressed('KeyZ') || i.pressed('KeyK') || i.pressed('ArrowUp'), blow, pop: i.held('KeyE') || i.held('KeyX') }, dt); sync();
  soundClock -= dt; if (blow && soundClock <= 0) { game.sound(550, .1, 'sine', .023); soundClock = CHARACTERS[state.character].rate; } if (oldScore < state.score) game.sound(750 + Math.min(5, state.combo) * 90, .12, 'sine', .035);
  const bossEnemy = state.enemies.find(e => e.boss);
  game.ui.stats([{ label: '生命', value: '♥'.repeat(state.player.hp) || '0' }, { label: '远征', value: `${state.level.world + 1}-${state.level.stage + 1}` }, { label: '敌人', value: state.enemies.length }, { label: bossEnemy ? '护甲' : '连泡', value: bossEnemy ? bossEnemy.hp : state.bestCombo }, { label: '得分', value: state.score }, { label: '时间', value: `${Math.floor(state.time)} 秒${state.time > 180 ? ' · 狂暴' : ''}` }]);
  if (state.notice) { game.ui.toast(state.notice); state.notice = ''; } if (!ended && state.status !== 'playing') finish();
});

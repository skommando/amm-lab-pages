import {THREE,createGame} from '../arcade-runtime/runtime.mjs';
import {AIRCRAFT,BRANCHES,CHAPTERS,ENEMIES,MISSILES,ULTIMATES,PICKUPS,UPGRADES,WORKSHOP,BIOMES,SECTORS,MODES,DIFFICULTIES,VERSION} from './content.mjs';
import {createFlight,stepFlight,normalizeSave,recordResult,applyUpgrade,buyUpgrade,flightGrade,spawnEnemy,spawnBoss,applyPickup} from './core.mjs';
import {StarVisuals} from './visuals.mjs';
import {thumbnail} from './models.mjs';
const $=(s,root=document)=>root.querySelector(s);
const $$=(s,root=document)=>[...root.querySelectorAll(s)];
const hex=n=>'#'+n.toString(16).padStart(6,'0');
const pad=n=>String(n).padStart(2,'0');
const fmt=n=>Math.floor(n).toLocaleString('en-US');
const seconds=n=>`${Math.floor(n/60)}:${pad(Math.floor(n%60))}`;
const icon=(name)=>{
 const paths={wing:'M2 15 11 2 14 9 22 13 14 13 12 21 10 13Z',target:'M12 2v4m0 12v4M2 12h4m12 0h4M18 12a6 6 0 1 1-12 0 6 6 0 0 1 12 0Z',rocket:'M14 3 21 2 20 9 11 18 6 13Z M9 10 4 10 2 15 6 15 M13 15 13 21 18 19 18 14 M5 18 2 22',bolt:'M13 2 4 14h7l-1 8 10-13h-7Z',shield:'M12 2 3 6v7c1 5 9 9 9 9s8-4 9-9V6Z',sun:'M12 2v3m0 14v3M2 12h3m14 0h3M5 5l2 2m10 10 2 2M5 19l2-2M17 7l2-2M17 12a5 5 0 1 1-10 0 5 5 0 0 1 10 0Z',chevron:'M8 4 16 12 8 20',cross:'M5 5 19 19M19 5 5 19',gear:'M8 3h8l1 4 4 2v6l-4 2-1 4H8l-1-4-4-2V9l4-2ZM15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z',book:'M3 3h7l2 2 2-2h7v16h-7l-2 2-2-2H3ZM12 5v16',reload:'M20 8a8 8 0 1 0 0 8M20 3v5h-5'};
 return `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${paths[name]||paths.target}"/></svg>`;
};
const game=createGame({id:'star-wing',title:'星际雷翼',subtitle:'STELLAR EXPEDITION / 星海远征',accent:'#f1cf9c',background:0x211329,
 help:'WASD / 方向键移动；空格或 J 射击，C 切换自动主炮；Q / K 发射飞弹，R 手动装填；E 过载清屏；X 释放满能量终极武器；V / L 相位闪跃；Shift / F 精密慢移；P / Esc 暂停。触屏可拖动飞行或使用方向盘，并点击独立武器按钮。飞弹备弹有限，空仓自动装填。护盾脱战回充，核心亮点为受击判定。'});
document.title = '星际雷翼 · Star Wing';
game.controls([{code:'Space',label:'主炮'},{code:'KeyQ',label:'飞弹'},{code:'KeyE',label:'过载'},{code:'KeyX',label:'终极'},{code:'KeyV',label:'闪跃'},{code:'KeyF',label:'慢移'},{code:'KeyR',label:'装填'}]);
let save=normalizeSave(game.load({})),settings={...save.settings},selectedChapter=settings.chapter,selectedCraft=settings.craft,selectedBranch=settings.branch,selectedMissile=settings.missile,selectedUltimate=settings.ultimate,selectedMode='campaign',sector=Math.floor(selectedChapter/8),activeTab='route',codexTab='enemy';
let state=createFlight(selectedChapter,selectedCraft,selectedMode,selectedBranch,{...settings,missile:selectedMissile,ultimate:selectedUltimate,workshop:save.workshop}),ended=false,launched=false,choiceShowing=false,hudClock=0,soundClock=0,musicClock=0,musicStep=0,toastClock=0;
const view=new StarVisuals(game,settings);view.start(state);
const overlay=$('.game-overlay'),panel=$('.game-panel'),body=$('.panel-body');
$('.game-tools [data-tool="menu"]').textContent='机库';
const hud=document.createElement('div');hud.className='stellar-hud';hud.innerHTML=`
 <section class="flight-identity"><span class="micro">EXPEDITION <b id="hud-route-id">01</b> / 48</span><h2 id="hud-route">苍穹航道</h2><span id="hud-biome">鎏金日冕</span></section>
 <section class="vitals hud-glass"><div class="vital-head"><span>${icon('shield')}装甲完整度</span><b id="hud-hp"></b></div><div class="meter armor"><i id="hp-bar"></i></div><div class="vital-head secondary"><span>偏转护盾</span><b id="hud-shield"></b></div><div class="meter shield"><i id="shield-bar"></i></div><div class="ship-state"><span id="hud-craft"></span><span id="hud-power"></span></div></section>
 <section class="score-panel"><span class="micro">FLIGHT SCORE</span><strong id="hud-score">000000</strong><div><span id="hud-combo">× 1.00</span><span id="hud-kills">0 击毁</span></div><small id="hud-graze">擦弹 0 · 模块 0</small></section>
 <section class="route-progress"><div><span id="hud-phase">跃迁接敌</span><span id="hud-time">0:00 / 2:30</span></div><div class="journey-track"><i id="route-bar"></i><em></em><em></em><em></em></div><small id="hud-wave"></small></section>
 <section class="boss-hud" hidden><div><span class="boss-label">HOSTILE FLAGSHIP</span><strong id="boss-name"></strong><b id="boss-percent"></b></div><div class="boss-track"><i id="boss-bar"></i></div><small id="boss-parts"></small></section>
 <section class="weapon-rack">
  <button class="weapon-slot auto-slot" data-hud="auto"><div class="weapon-icon">${icon('target')}</div><span>主武器 <kbd>C</kbd></span><strong id="hud-primary"></strong><small id="hud-auto">自动开火 ON</small></button>
  <button class="weapon-slot missile-slot" data-press="KeyQ"><div class="weapon-icon">${icon('rocket')}</div><span>飞弹弹仓 <kbd>Q</kbd></span><strong id="hud-missiles"></strong><small id="hud-reserve"></small><div class="slot-meter"><i id="reload-bar"></i></div></button>
  <button class="weapon-slot bomb-slot" data-press="KeyE"><div class="weapon-icon">${icon('shield')}</div><span>清屏过载 <kbd>E</kbd></span><strong id="hud-bombs"></strong><small>清弹 / 短暂无敌</small></button>
  <button class="weapon-slot ultimate-slot" data-press="KeyX"><div class="weapon-icon">${icon('sun')}</div><span>终极武器 <kbd>X</kbd></span><strong id="hud-energy"></strong><small id="hud-ultimate-name"></small><div class="slot-meter"><i id="energy-bar"></i></div></button>
  <button class="weapon-slot dash-slot" data-press="KeyV"><div class="weapon-icon">${icon('bolt')}</div><span>相位闪跃 <kbd>V</kbd></span><strong id="hud-dash"></strong><small>瞬移加速 / 短暂无敌</small></button>
 </section>
 <section class="mobile-ammo"><span id="mobile-missiles"></span><span id="mobile-bombs"></span><span id="mobile-energy"></span></section>
 <div class="combat-flash"></div><div class="boss-alert" hidden><span>WARNING</span><strong>巨型跃迁信号</strong></div>
`;
document.body.append(hud);document.body.classList.add('in-menu');
let pointer=null;
const canvas=game.renderer.domElement;
canvas.addEventListener('pointerdown',e=>{if(game.paused)return;const point=view.pointToWorld(e.clientX,e.clientY);pointer={id:e.pointerId,start:point,x:state.player.x,y:state.player.y,targetX:state.player.x,targetY:state.player.y};});
canvas.addEventListener('pointermove',e=>{if(!pointer||e.pointerId!==pointer.id||game.paused)return;const point=view.pointToWorld(e.clientX,e.clientY);pointer.targetX=pointer.x+point.x-pointer.start.x;pointer.targetY=pointer.y+point.y-pointer.start.y;});
for(const event of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(event,()=>{pointer=null;});
window.addEventListener('blur',()=>{pointer=null;});
function bindHold(button,code){button.addEventListener('pointerdown',e=>{if(game.paused)return;e.preventDefault();button.setPointerCapture(e.pointerId);game.input.press(code);button.classList.add('pressed');});for(const event of ['pointerup','pointercancel','lostpointercapture'])button.addEventListener(event,()=>{game.input.release(code);button.classList.remove('pressed');});}
$$('[data-press]',hud).forEach(button=>bindHold(button,button.dataset.press));
$('[data-hud="auto"]',hud).addEventListener('click',()=>toggleAuto());
function saveSettings(){save.settings={...settings,craft:selectedCraft,branch:selectedBranch,chapter:selectedChapter,missile:selectedMissile,ultimate:selectedUltimate};game.save(save);}
function toggleAuto(){settings.autoFire=!settings.autoFire;saveSettings();game.ui.toast(settings.autoFire?'自动主炮已开启':'自动主炮已关闭 · 长按空格 / J / 触控主炮射击');updateHud();}
function modalClass(name=''){overlay.className='game-overlay '+name;document.body.classList.toggle('in-menu',name==='hangar');}
function showMenu(tab=activeTab){
 activeTab=tab;choiceShowing=false;pointer=null;modalClass('hangar');
 game.ui.overlay({title:'星际雷翼',body:menuMarkup(),buttons:[]});
 $('.panel-eyebrow').textContent='AMM LAB · STAR WING';
 bindMenu();
}
function menuMarkup(){
 const craft=AIRCRAFT[selectedCraft],chapter=CHAPTERS[selectedChapter],biome=BIOMES[chapter.biome],nav=[['route','行动航图'],['hangar','战机机库'],['arsenal','武器配置'],['codex','战术图鉴'],['workshop','远征工坊'],['settings','系统设置']];
 return `<div class="hangar-shell" style="--craft:${hex(craft.color)};--biome:${hex(biome.accent)}">
  <div class="hangar-masthead"><div class="mast-logo">${icon('wing')}<div><strong>STAR WING</strong><span>星际雷翼 <em>／ 星海远征</em></span></div></div><div class="mast-badges"><span class="online-dot"></span> OFFLINE READY <i></i> <span>STELLAR EDITION</span><b>02.0</b></div></div>
  <nav class="hangar-tabs" aria-label="机库栏目">${nav.map(([id,title])=>`<button data-tab="${id}" class="${activeTab===id?'active':''}" aria-pressed="${activeTab===id}">${title}</button>`).join('')}<span class="credit-balance">${icon('sun')} ${fmt(save.credits)} <small>晶片</small></span></nav>
  <div class="hangar-layout">
   <aside class="craft-preview"><div class="preview-heading"><span class="micro">YOUR WING. YOUR WAY.</span><span class="unit-label">SW—${pad(craft.id+1)}</span></div><h3>${craft.name}<span>${craft.role}</span></h3>
    <div class="craft-viewport"><div class="orbital-grid"></div><div class="preview-axis axis-a"></div><div class="preview-axis axis-b"></div><img src="${thumbnail('player',selectedCraft)}" alt="${craft.name}三维机体预览"><span class="preview-coordinate">${pad(craft.id+1)} / 16<br>VECTOR / READY</span><span class="preview-role">${craft.trait}</span></div>
    <p class="craft-perk">${icon('bolt')}${craft.perk}</p>
    <div class="craft-attributes">${statBar('装甲',craft.hp,200)}${statBar('护盾',craft.shield,100)}${statBar('速度',craft.speed,13)}${statBar('火力',Math.round(craft.damage/craft.rate),150)}</div>
    <div class="loadout-summary"><span>当前武装</span><strong>${BRANCHES[selectedBranch].name}</strong><small>${MISSILES[selectedMissile].name} ／ ${ULTIMATES[selectedUltimate].name}</small></div>
    <div class="preview-footer"><span class="status-light"></span> 所有机体与航路开放选用 <span>无需解锁</span></div>
   </aside>
   <main class="hangar-content" id="hangar-content">${activeTab==='route'?routeMarkup():activeTab==='hangar'?craftMarkup():activeTab==='arsenal'?arsenalMarkup():activeTab==='codex'?codexMarkup():activeTab==='workshop'?workshopMarkup():settingsMarkup()}</main>
  </div>
  <footer class="launch-bar"><div class="launch-route"><span class="micro">NEXT DESTINATION</span><strong>${pad(chapter.id+1)} <em>／</em> ${chapter.name}</strong><small>${biome.name} · ${MODES.find(m=>m.id===selectedMode).name} · ${DIFFICULTIES.find(d=>d.id===settings.difficulty).name}</small></div><div class="launch-actions">${launched&&!ended?'<button class="secondary-btn" data-action="resume">继续当前飞行</button>':''}<button class="launch-button" data-action="launch">${icon('wing')}<span>${launched&&!ended?'重新出击':'准备起飞'}</span>${icon('chevron')}</button></div></footer>
 </div>`;
}
function statBar(label,value,max){return `<div><span>${label}</span><i><b style="width:${Math.min(100,value/max*100)}%"></b></i><strong>${value}</strong></div>`;}
function sectionTitle(english,title,count=''){return `<div class="content-heading"><div><span class="micro">${english}</span><h3>${title}</h3></div><span>${count}</span></div>`;}
function routeMarkup(){
 const list=CHAPTERS.filter(c=>c.sector===sector);
 return `${sectionTitle('CHOOSE YOUR EXPEDITION','航向无垠星海','48 条航路 / 6 大星区')}
 <div class="mode-grid">${MODES.map(m=>`<button data-mode="${m.id}" class="mode-card ${m.id===selectedMode?'selected':''}" title="${m.description}"><small>${m.tag}</small><strong>${m.name}</strong><span>${m.description.split(' / ')[0]}</span></button>`).join('')}</div>
 <div class="sector-tabs">${SECTORS.map((s,i)=>`<button data-sector="${i}" class="${i===sector?'active':''}"><span>${pad(i+1)}</span>${s}</button>`).join('')}</div>
 <div class="chapter-grid">${list.map(c=>{const b=BIOMES[c.biome];return `<button class="chapter-card ${selectedChapter===c.id?'selected':''}" data-chapter="${c.id}" style="--space0:${b.colors[0]};--space1:${b.colors[1]};--space2:${b.colors[2]};--space3:${b.colors[3]}"><span class="chapter-planet"></span><span class="chapter-number">${pad(c.id+1)}</span><span class="chapter-status">${save.grades[c.id]?'RANK '+save.grades[c.id]:save.best[c.id]?'已通关':selectedChapter===c.id?'已选航路':'可出击'}</span><strong>${c.name}</strong><small>${b.name}<i></i>${seconds(c.duration)} + 首领</small></button>`;}).join('')}</div>
 <div class="route-intel"><div>${icon('target')}<span><b>${CHAPTERS[selectedChapter].boss}</b><small>${CHAPTERS[selectedChapter].objective}</small></span></div><label>飞行难度<select id="flight-difficulty">${DIFFICULTIES.map(d=>`<option value="${d.id}" ${settings.difficulty===d.id?'selected':''}>${d.name}</option>`).join('')}</select></label></div>
 <p class="content-note">${CHAPTERS[selectedChapter].formations.length} 组编队 · 4 段航程 · 2 次战场改装选择。航路固定流程已扩为原版四倍；首领战另计。</p>`;
}
function craftMarkup(){return `${sectionTitle('FLEET COLLECTION','选择你的羽翼','16 / 16 可用')}<p class="content-note top-note">不只是涂装：机翼、机身、引擎布局和作战属性均有区别。点击机体查看大图与专属能力。</p><div class="aircraft-grid">${AIRCRAFT.map(a=>`<button data-craft="${a.id}" class="aircraft-card ${selectedCraft===a.id?'selected':''}" style="--unit:${hex(a.color)}"><small>SW—${pad(a.id+1)}</small><img src="${thumbnail('player',a.id)}" alt="${a.name}" loading="lazy"><strong>${a.name}<span>${a.trait}</span></strong><p>${a.role}</p></button>`).join('')}</div>`;}
function arsenalMarkup(){return `${sectionTitle('CONFIGURE YOUR FIREPOWER','三层独立火力','主炮 / 飞弹 / 终极')}
 <div class="loadout-label"><span>01</span><strong>主武器路线</strong><small>拾取 P 升级至 LV.5</small></div><div class="weapon-grid">${BRANCHES.map(b=>`<button class="equip-card ${selectedBranch===b.id?'selected':''}" data-branch="${b.id}" style="--equip:${hex(b.color)}"><span class="equip-icon">${icon(b.id===5?'bolt':'target')}</span><span><small>${b.tag}</small><strong>${b.name}</strong><p>${b.description}</p></span></button>`).join('')}</div>
 <div class="loadout-label"><span>02</span><strong>有限弹药副武器</strong><small>Q 发射 / R 装填 / 空仓自动装填</small></div><div class="missile-grid">${MISSILES.map(m=>`<button class="small-equip ${selectedMissile===m.id?'selected':''}" data-missile="${m.id}" style="--equip:${hex(m.color)}">${icon('rocket')}<small>${m.tag}</small><strong>${m.name}</strong><p>${m.description}</p></button>`).join('')}</div>
 <div class="loadout-label"><span>03</span><strong>终极武器协议</strong><small>X / 100% 能量启动</small></div><div class="ultimate-grid">${ULTIMATES.map(u=>`<button class="small-equip ${selectedUltimate===u.id?'selected':''}" data-ultimate="${u.id}" style="--equip:${hex(u.color)}">${icon('sun')}<small>${u.tag}</small><strong>${u.name}</strong><p>${u.description}</p></button>`).join('')}</div>`;}
function codexMarkup(){
 const top=`${sectionTitle('TACTICAL ARCHIVE','认识你的战场','知己知彼')}<div class="archive-tabs">${[['enemy','敌军舰谱'],['boss','巨型旗舰'],['pickup','战场补给'],['biome','星域图录'],['controls','操作手册']].map(([id,name])=>`<button data-codex="${id}" class="${codexTab===id?'selected':''}">${name}</button>`).join('')}</div>`;
 if(codexTab==='controls')return top+helpMarkup();
 if(codexTab==='pickup')return top+`<div class="pickup-grid">${PICKUPS.map(p=>`<div class="pickup-entry" style="--pickup:${hex(p.color)}"><b>${p.glyph}</b><div><strong>${p.name}</strong><p>${p.description}</p></div></div>`).join('')}</div>`;
 if(codexTab==='biome')return top+`<div class="biome-grid">${BIOMES.map(b=>`<article style="--space0:${b.colors[0]};--space1:${b.colors[1]};--space2:${b.colors[2]};--space3:${b.colors[3]}"><div class="biome-swirl"></div><strong>${b.name}</strong><p>${b.description}</p></article>`).join('')}</div>`;
 if(codexTab==='boss')return top+`<p class="content-note top-note">12 类大型舰体结构组成 48 组章节旗舰配置。首领有三阶段攻击、可摧毁武器部件和带提前预警的光束。</p><div class="enemy-grid">${Array.from({length:12},(_,i)=>`<article class="enemy-card boss-card"><img loading="lazy" src="${thumbnail('boss',i,CHAPTERS[i].biome)}" alt="${CHAPTERS[i].boss}"><span>旗舰家族 ${pad(i+1)}</span><strong>${CHAPTERS[i].boss}</strong><small>三阶段 / 独立武器部件</small></article>`).join('')}</div>`;
 return top+`<div class="enemy-grid">${ENEMIES.map(e=>`<article class="enemy-card"><img loading="lazy" src="${thumbnail('enemy',e.id)}" alt="${e.name}"><span>${e.tier} / T${pad(e.id+1)}</span><strong>${e.name}</strong><small>${({aim:'瞄准射击',fan:'扇形弹幕',sniper:'预警狙击',ring:'环形弹幕',mine:'持续布雷',double:'双联火控',carrier:'部署无人机',laser:'预警舰炮',missile:'追踪飞弹',split:'击毁后分裂'})[e.fire]} · 基础耐久 ${e.hp}</small></article>`).join('')}</div>`;
}
function workshopMarkup(){return `${sectionTitle('EXPEDITION WORKSHOP','为下一次远航准备',fmt(save.credits)+' 晶片')}<p class="content-note top-note">战斗击毁、补给晶片与任务结算可获得晶片。改装在下一次起飞生效，当前飞行不会被改动。所有机体始终开放使用。</p><div class="workshop-grid">${WORKSHOP.map(w=>{const level=save.workshop[w.id]||0,cost=w.base*(level+1);return `<article class="workshop-card">${icon(w.id==='armor'||w.id==='shield'?'shield':w.id==='energy'?'sun':'gear')}<span>LEVEL ${level} / ${w.max}</span><h4>${w.name}</h4><p>${w.description}</p><div class="level-pips">${Array.from({length:w.max},(_,i)=>`<i class="${i<level?'filled':''}"></i>`).join('')}</div><button data-buy="${w.id}" ${level>=w.max||save.credits<cost?'disabled':''}>${level>=w.max?'已满级':`升级 · ${cost} 晶片`}</button></article>`;}).join('')}</div><div class="career-stats"><div><strong>${Object.keys(save.best).length} / 48</strong><span>通关航路</span></div><div><strong>${fmt(save.totalKills)}</strong><span>累计击毁</span></div><div><strong>${save.bosses.length} / 48</strong><span>首领挑战记录</span></div><div><strong>${fmt(save.bestEndless)}</strong><span>无尽最高分</span></div></div>`;}
function settingsMarkup(){return `${sectionTitle('SYSTEM CONFIGURATION','按照你的设备调整','本地自动保存')}
 <div class="setting-block"><h4>画质级别</h4><div class="quality-options">${[['eco','流畅','关闭泛光 / 原生 1× 渲染'],['balanced','精致','完整泛光 / 最高 1.5× 渲染'],['ultra','超清','完整泛光 / 最高 2× 渲染']].map(([id,name,description])=>`<button data-quality="${id}" class="${settings.quality===id?'selected':''}"><strong>${name}</strong><small>${description}</small></button>`).join('')}</div><p>三档使用相同玩法与机体模型。高分屏或移动设备帧率不足时，可切换“流畅”。</p></div>
 <div class="setting-row"><div><strong>自动主炮</strong><p>默认自动射击；仍可使用空格 / J 或触控主炮。战斗中按 C 切换。</p></div><label class="switch"><input id="setting-auto" type="checkbox" ${settings.autoFire?'checked':''}><span></span></label></div>
 <div class="setting-row"><div><strong>减少动态效果</strong><p>关闭镜头震动与屏幕闪光，减缓背景变化。</p></div><label class="switch"><input id="setting-motion" type="checkbox" ${settings.reducedMotion?'checked':''}><span></span></label></div>
 <div class="setting-row"><div><strong>声音与全屏</strong><p>合成武器音效与轻量环境音序，无需外部音频文件。声音默认关闭。</p></div><div class="setting-buttons"><button data-action="sound">切换声音</button><button data-action="fullscreen">全屏</button></div></div>
 <div class="setting-row"><div><strong>飞行记录备份</strong><p>目录版和单文件可能处于不同浏览器存储空间；可手动导出/导入记录。</p></div><div class="setting-buttons"><button data-action="export">导出记录</button><label class="import-label">导入记录<input id="import-save" type="file" accept="application/json,.json" hidden></label></div></div>
 <p class="settings-footnote">${VERSION} · THREE r${THREE.REVISION} · 全部资源离线可用<br>运行库保持原始文件不变。文件版和目录版由相同源码构建。</p>`;}
function helpMarkup(){return `<div class="manual"><h4>驾驶与武器</h4><div class="key-grid">${[['W A S D / ↑ ↓ ← →','移动战机'],['空格 / J','发射主炮'],['C','切换自动主炮'],['Q / K','发射有限弹药飞弹'],['R','手动装填 / 空仓自动装填'],['E','消耗过载，清弹并短暂无敌'],['X','满 100% 能量释放终极武器'],['V / L','相位闪跃 / 短暂无敌'],['Shift / F','精密慢移，显示判定圈'],['P / Esc','暂停 / 继续']].map(([k,v])=>`<div><kbd>${k}</kbd><span>${v}</span></div>`).join('')}</div><h4>触屏操作</h4><p>在战场空白处按住并拖动，飞机按相对位移移动，不会瞬间跳到手指下。左下方向盘仍保留；右下提供主炮、飞弹、过载、终极、闪跃、慢移、装填独立按钮。默认自动主炮可减少多指负担。</p><h4>生存与节奏</h4><p>机体中央亮点是受击核心，机翼掠过弹幕不会直接受伤。撞上敌机或战舰仍会受伤。护盾脱战后自动恢复，装甲需补给或再生模块。敌方舰炮会先标出危险航线，再实际开火；注意带宽度的警告条。</p><p>飞弹显示“弹仓 / 容量”和“备弹”。弹仓打空后，需要等待数秒从有限备弹中转移弹药；没有备弹时不会凭空装满。M 补给可增加备弹。击毁、擦弹、E 能量补给为终极充能，清屏过载与终极能量互相独立。</p><p>战役含四段加长航程、两次三选一模块、精英舰和补给事件。首领 65% / 30% 耐久切换阶段；摧毁发光武器部件会削弱火力。所有星域、机体和武器都可直接选择，永久工坊升级只作额外成长。</p></div>`;}
function bindMenu(){
 body.onclick=e=>{
  const b=e.target.closest('button');if(!b||b.disabled)return;
  const content=$('#hangar-content'),scroll=content?.scrollTop||0;
  if(b.dataset.tab){showMenu(b.dataset.tab);return;}
  if(b.dataset.sector!==undefined){sector=Number(b.dataset.sector);showMenu();return;}
  if(b.dataset.chapter!==undefined){selectedChapter=Number(b.dataset.chapter);view.buildBackground(CHAPTERS[selectedChapter]);saveSettings();showMenu();return;}
  if(b.dataset.craft!==undefined){selectedCraft=Number(b.dataset.craft);saveSettings();showMenu();}
  else if(b.dataset.mode){selectedMode=b.dataset.mode;showMenu();}
  else if(b.dataset.branch!==undefined){selectedBranch=Number(b.dataset.branch);saveSettings();showMenu();}
  else if(b.dataset.missile!==undefined){selectedMissile=Number(b.dataset.missile);saveSettings();showMenu();}
  else if(b.dataset.ultimate!==undefined){selectedUltimate=Number(b.dataset.ultimate);saveSettings();showMenu();}
  else if(b.dataset.codex){codexTab=b.dataset.codex;showMenu();return;}
  else if(b.dataset.buy){save=buyUpgrade(save,b.dataset.buy);game.save(save);showMenu();}
  else if(b.dataset.quality){settings.quality=b.dataset.quality;view.setSettings(settings);saveSettings();showMenu();}
  else if(b.dataset.action){
   const a=b.dataset.action;if(a==='launch'){start();return;}if(a==='resume'){resume();return;}if(a==='sound')$('.game-tools [data-tool="sound"]').click();if(a==='fullscreen')$('.game-tools [data-tool="fullscreen"]').click();if(a==='export')exportSave();
  }
  if($('#hangar-content'))$('#hangar-content').scrollTop=scroll;
 };
 $('#flight-difficulty')?.addEventListener('change',e=>{settings.difficulty=e.target.value;saveSettings();showMenu();});
 $('#setting-auto')?.addEventListener('change',e=>{settings.autoFire=e.target.checked;saveSettings();});
 $('#setting-motion')?.addEventListener('change',e=>{settings.reducedMotion=e.target.checked;view.setSettings(settings);document.body.classList.toggle('reduced-motion',settings.reducedMotion);saveSettings();});
 $('#import-save')?.addEventListener('change',async e=>{const file=e.target.files?.[0];if(!file)return;try{if(file.size>1024*1024)throw new Error('记录文件过大');const raw=JSON.parse(await file.text());if(!raw||typeof raw!=='object'||(!('version' in raw)&&!('best' in raw)))throw new Error('不是有效的飞行记录');save=normalizeSave(raw);settings={...save.settings};selectedChapter=settings.chapter;selectedCraft=settings.craft;selectedBranch=settings.branch;selectedMissile=settings.missile;selectedUltimate=settings.ultimate;sector=Math.floor(selectedChapter/8);view.setSettings(settings);game.save(save);showMenu();game.ui.toast('飞行记录已导入');}catch(error){game.ui.toast('导入失败：'+error.message);}});
}
function exportSave(){saveSettings();const blob=new Blob([JSON.stringify(save,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='Star_Wing_Save.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
function start(){
 saveSettings();state=createFlight(selectedChapter,selectedCraft,selectedMode,selectedBranch,{difficulty:settings.difficulty,missile:selectedMissile,ultimate:selectedUltimate,workshop:save.workshop});
 ended=false;launched=true;choiceShowing=false;pointer=null;view.start(state);body.onclick=null;modalClass();game.ui.hideOverlay();document.body.classList.remove('in-menu');hud.classList.remove('is-ended');soundClock=0;musicClock=0;
 game.ui.hint('WASD 移动　Q 飞弹　R 装填　E 过载　X 终极　V 闪跃　Shift 慢移');updateHud();
 game.ui.toast(`${CHAPTERS[selectedChapter].name} · ${settings.autoFire?'自动主炮已就绪':'空格 / J 开火'}`);
}
function restoreFlightSelection(){
 selectedChapter=state.startChapter??state.chapter.id;selectedCraft=state.aircraft;selectedMode=state.mode;selectedBranch=state.branch;
 selectedMissile=state.player.missileType;selectedUltimate=state.player.ultimateType;settings.difficulty=state.difficulty.id;sector=Math.floor(selectedChapter/8);
}
function resume(){restoreFlightSelection();body.onclick=null;modalClass();document.body.classList.remove('in-menu');view.sync(state);if(state.upgradePending){showUpgrade();return;}game.ui.hideOverlay();}
function showUpgrade(){
 if(!state.upgradePending)return;choiceShowing=true;pointer=null;modalClass('upgrade-modal');body.onclick=null;
 const choices=state.upgradePending.map(id=>UPGRADES.find(u=>u.id===id));
 game.ui.overlay({title:'接入新的战斗模块',text:'航路已暂停。选择一项强化，当前出击持续生效。',body:`<div class="upgrade-heading"><span>FIELD MODIFICATION</span><b>第 ${Object.values(state.upgrades).reduce((a,b)=>a+b,0)+1} 次改装</b></div><div class="upgrade-grid">${choices.map((u,i)=>`<button class="upgrade-card" data-upgrade="${u.id}" style="--module:${hex(u.color)}"><span class="upgrade-number">0${i+1}</span>${icon(u.id==='shield'||u.id==='armor'?'shield':u.id==='missile'?'rocket':'bolt')}<h3>${u.name}</h3><p>${u.description}</p><small>选择并接入 ${icon('chevron')}</small></button>`).join('')}</div>`,buttons:[]});
  $$('[data-upgrade]').forEach(b=>b.onclick=()=>chooseUpgrade(b.dataset.upgrade));
}
function chooseUpgrade(id){if(applyUpgrade(state,id)){choiceShowing=false;modalClass();game.ui.hideOverlay();updateHud();}}
window.addEventListener('keydown',e=>{if(choiceShowing&&/^Digit[123]$/.test(e.code)){const id=state.upgradePending?.[Number(e.code.slice(5))-1];if(id)chooseUpgrade(id);}});
function finish(){
 if(ended)return;restoreFlightSelection();ended=true;choiceShowing=false;pointer=null;save=recordResult(save,state);game.save(save);modalClass('result-modal');body.onclick=null;const won=state.status==='won',grade=flightGrade(state),earn=Math.floor(state.loot)+(won?100:0);
 game.ui.overlay({title:won?'星海为你让路':'这不是旅途的终点',text:won?`${state.chapter.boss} 已被击退，航道重新开放。`:'机体信号中断。试试调整武装，留一枚过载应对密集弹幕。',body:`<div class="result-hero"><div class="result-rank ${won?'':'defeat'}"><span>${won?'FLIGHT RANK':'SIGNAL LOST'}</span><strong>${won?grade:'—'}</strong></div><div><span class="micro">${won?'MISSION COMPLETE':'EXPEDITION REPORT'}</span><h3>${state.chapter.name}</h3><p>${AIRCRAFT[state.aircraft].name} · ${BRANCHES[state.branch].name}</p><b>+ ${earn} 晶片已结算</b></div></div><div class="result-stats">${[['飞行得分',fmt(state.score)],['击毁目标',state.kills],['飞行时间',seconds(state.time)],['最高连击',state.maxCombo],['擦弹次数',state.graze],['摧毁部件',state.partsDestroyed]].map(([label,value])=>`<div><strong>${value}</strong><span>${label}</span></div>`).join('')}</div><p class="content-note">${won?'可以直接进入下一航路，或返回机库改装。':'已获得的战斗晶片仍会保留，可用于工坊升级。'}</p>`,buttons:[...(won&&state.mode==='campaign'&&state.chapter.id<CHAPTERS.length-1?[{label:'下一航路 →',primary:true,onClick:()=>{selectedChapter=state.chapter.id+1;sector=Math.floor(selectedChapter/8);start();}}]:[]),{label:'再次出击',primary:!won,onClick:start},{label:'返回机库',onClick:()=>showMenu('route')}]});
}
function updateHud(){
 const p=state.player,c=AIRCRAFT[state.aircraft],boss=state.enemies.find(e=>e.boss);const text=(id,value)=>{const el=document.getElementById(id);if(el&&el.textContent!==String(value))el.textContent=String(value);};
 text('hud-route-id',pad(state.chapter.id+1));text('hud-route',state.chapter.name);text('hud-biome',BIOMES[state.chapter.biome].name);text('hud-hp',`${Math.ceil(p.hp)} / ${p.maxHp}`);text('hud-shield',`${Math.ceil(p.shield)} / ${p.maxShield}`);$('#hp-bar').style.width=(p.hp/p.maxHp*100)+'%';$('#shield-bar').style.width=(p.shield/p.maxShield*100)+'%';
 text('hud-craft',c.name+' / '+c.trait);text('hud-power','主炮 LV.'+p.power);text('hud-score',String(Math.floor(state.score)).padStart(6,'0'));text('hud-combo',`× ${(1+Math.min(4,Math.floor(state.combo/12))*.25).toFixed(2)}  / ${state.combo} 连击`);text('hud-kills',`${state.kills} 击毁`);text('hud-graze',`擦弹 ${state.graze} · 模块 ${Object.values(state.upgrades).reduce((a,b)=>a+b,0)}`);
 text('hud-phase',state.mode==='gauntlet'?`首领连战 ${state.round+1} / 4`:state.mode==='boss'?'首领决战':boss?'旗舰决战':['跃迁接敌','编队拦截','舰队突破','旗舰封锁'][state.stage]);text('hud-time',`${seconds(state.time)}${state.mode==='campaign'?' / '+seconds(state.chapter.duration):''}`);$('#route-bar').style.width=Math.min(100,state.levelTime/state.chapter.duration*100)+'%';text('hud-wave',`编队 ${state.wave} / ${state.chapter.formations.length}${state.mode==='endless'?' · 第 '+(state.round+1)+' 次远征':''}`);
 $('.boss-hud').hidden=!boss;if(boss){text('boss-name',state.chapter.boss);text('boss-percent',Math.ceil(boss.hp/boss.maxHp*100)+'%');$('#boss-bar').style.width=Math.max(0,boss.hp/boss.maxHp*100)+'%';text('boss-parts',`阶段 ${(boss.form||0)+1} / 3　武器部件 ${boss.parts.map(v=>v.hp>0?'◆':'◇').join(' ')}　${boss.parts.some(v=>v.hp<=0)?'敌舰火力已削弱':'击破两翼武器以削弱火力'}`);}
 text('hud-primary',BRANCHES[state.branch].name);text('hud-auto',settings.autoFire?'自动开火 ON':'手动 / 空格开火');$('.auto-slot').classList.toggle('active',settings.autoFire);
 text('hud-missiles',`${p.missiles} / ${p.magazine}`);text('hud-reserve',p.reload>0?`装填 ${p.reload.toFixed(1)}s · 备弹 ${p.reserve}`:`备弹 ${p.reserve} · R 装填`);$('#reload-bar').style.width=(p.reload>0?100*(1-p.reload/(p.reloadDuration*p.reloadBonus)):100)+'%';$('.missile-slot').classList.toggle('reloading',p.reload>0);
 text('hud-bombs',`${p.bombs} 枚`);text('hud-energy',`${Math.floor(p.energy)}%`);text('hud-ultimate-name',ULTIMATES[p.ultimateType].name);$('#energy-bar').style.width=p.energy+'%';$('.ultimate-slot').classList.toggle('ready',p.energy>=100);text('hud-dash',p.dashCooldown>0?p.dashCooldown.toFixed(1)+'s':'READY');
 text('mobile-missiles',`飞弹 ${p.missiles}/${p.magazine}${p.reload>0?' · 装填 '+p.reload.toFixed(1)+'s':' · 备弹 '+p.reserve}`);text('mobile-bombs',`过载 ${p.bombs}`);text('mobile-energy',`终极 ${Math.floor(p.energy)}%`);
 $('.combat-flash').style.opacity=settings.reducedMotion?0:Math.min(.17,state.flash*.35);$('.boss-alert').hidden=!(state.bossWarning>1.35);
 const labels={KeyQ:`飞弹 ${p.missiles}`,KeyE:`过载 ${p.bombs}`,KeyX:`终极 ${Math.floor(p.energy)}%`,KeyV:p.dashCooldown>0?`闪跃 ${Math.ceil(p.dashCooldown)}`:'闪跃',KeyR:p.reload>0?'装填中':'装填'};
 for(const [code,label] of Object.entries(labels)){const button=$(`.game-actions [data-code="${code}"]`);if(button)button.textContent=label;}
 $('.game-actions [data-code="KeyX"]').classList.toggle('ready',p.energy>=100);
 game.ui.stats([{label:'装甲',value:Math.ceil(p.hp)},{label:'护盾',value:Math.ceil(p.shield)},{label:'飞弹',value:p.missiles},{label:'备弹',value:p.reserve},{label:'得分',value:state.score}]);
}
function playAudio(dt){
 soundClock-=dt;musicClock-=dt;
 for(const event of state.events){
  if(event.name==='shot'&&soundClock<=0){game.sound(state.branch===6?160:370+state.branch*35,.035,state.branch===6?'sawtooth':'triangle',.012);soundClock=Math.max(.075,AIRCRAFT[state.aircraft].rate);}
  if(event.name==='missile')game.sound(145,.15,'sawtooth',.024);
  if(event.name==='kill'||event.name==='explosion')game.sound(event.value===2?52:78,event.value===2?.22:.09,'sawtooth',.018);
  if(event.name==='pickup')game.sound(840,.1,'sine',.026);
  if(event.name==='hit')game.sound(95,.15,'square',.019);
  if(event.name==='bomb'||event.name==='ultimate'){game.sound(42,.42,'sawtooth',.045);game.sound(220,.35,'triangle',.025);}
  if(event.name==='warning')game.sound(195,.30,'square',.022);
  if(event.name==='loaded')game.sound(640,.07,'sine',.021);
 }
 if(musicClock<=0){const sequence=[130.81,196,261.63,196,146.83,220,293.66,220,164.81,246.94,329.63,246.94,123.47,185,246.94,185];game.sound(sequence[musicStep++%sequence.length],.33,'sine',.009);musicClock=.42;}
}
game.onMenu(()=>showMenu());
game.run(dt=>{
 if(!launched)return;
 const i=game.input;if(i.pressed('KeyC'))toggleAuto();
 const focus=i.held('ShiftLeft')||i.held('ShiftRight')||i.held('KeyF');
 const input={x:i.axis('x'),y:i.axis('y'),shoot:settings.autoFire||i.held('Space')||i.held('KeyJ'),focus,missile:i.held('KeyQ')||i.held('KeyK')||i.pressed('KeyQ')||i.pressed('KeyK'),reload:i.pressed('KeyR'),skill:i.pressed('KeyE'),ultimate:i.pressed('KeyX'),dash:i.pressed('KeyV')||i.pressed('KeyL')};
 if(pointer){input.targetX=pointer.targetX;input.targetY=pointer.targetY;}
 stepFlight(state,input,dt);view.sync(state,focus);playAudio(dt);hudClock-=dt;toastClock-=dt;
 if(hudClock<=0){updateHud();hudClock=.075;}
 if(state.notice&&toastClock<=0){game.ui.toast(state.notice);state.notice='';toastClock=1.0;}
 if(state.upgradePending&&!choiceShowing){showUpgrade();return;}
 if(!ended&&state.status!=='playing')finish();
});
// Hide game-specific combat chrome while any runtime overlay is visible, including pause/help.
const observer=new MutationObserver(()=>{document.body.classList.toggle('overlay-open',!overlay.hidden);if(!overlay.hidden)pointer=null;});observer.observe(overlay,{attributes:true,attributeFilter:['hidden']});
window.addEventListener('pagehide',e=>{if(!e.persisted){observer.disconnect();view.dispose();}});

updateHud();showMenu();document.body.classList.toggle('reduced-motion',settings.reducedMotion);$('#boot')?.remove();

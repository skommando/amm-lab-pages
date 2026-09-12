/** Pure deterministic combat simulation. Coordinates: x = lateral, y = forward/back. */
import {AIRCRAFT,BRANCHES,CHAPTERS,ENEMIES,MISSILES,ULTIMATES,PICKUPS,UPGRADES,WORKSHOP,DIFFICULTIES,VERSION} from './content.mjs';
export {AIRCRAFT,BRANCHES,CHAPTERS,ENEMIES,MISSILES,ULTIMATES,PICKUPS,UPGRADES,WORKSHOP,DIFFICULTIES,VERSION};
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const finite=(n,fallback=0)=>Number.isFinite(n)?n:fallback;
const integer=(n,a,b)=>clamp(Math.floor(finite(n,a)),a,b);
const LIMITS={bullets:1150,enemies:48,particles:1450,pickups:64,effects:64,hazards:18};
function random(s){let t=s.rngState+=0x6d2b79f5;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296;}
function id(s){return s.nextId++;}
function emit(s,name,value=1){s.events.push({name,value});}
function notice(s,text){s.notice=text;}
function gainEnergy(s,amount){s.player.energy=clamp(s.player.energy+amount*s.player.energyGain,0,100);}
export function createFlight(chapterId=0,aircraft=0,mode='campaign',branch=0,options={}){
 const chapter=CHAPTERS[integer(chapterId,0,47)],craft=AIRCRAFT[integer(aircraft,0,15)];
 options=options&&typeof options==='object'?options:{};
 const workshop=normalizeSave({workshop:options.workshop}).workshop;
 const difficulty=DIFFICULTIES.find(d=>d.id===options.difficulty)||DIFFICULTIES[1];
 const maxHp=Math.round(craft.hp*(1+(workshop.armor||0)*.08)),maxShield=craft.shield+(workshop.shield||0)*10;
 const p={x:0,y:8,hp:maxHp,maxHp,shield:maxShield,maxShield,cooldown:0,invuln:1.8,power:1,wingmen:craft.id===3?2:craft.id===9?3:0,bombs:craft.bombs,bombCooldown:0,
  missiles:craft.magazine,magazine:craft.magazine,reserve:craft.reserve+(workshop.reserve||0)*4,reload:0,reloadDuration:craft.reload*(1-(workshop.reload||0)*.05),missileCooldown:0,missileType:integer(options.missile,0,3),
  energy:30,ultimateType:integer(options.ultimate,0,2),ultimateTimer:0,dashCooldown:0,dashTimer:0,lastDx:0,lastDy:-1,
  damageBonus:1+(workshop.damage||0)*.05,rateBonus:1,missileBonus:craft.id===5?1.3:1,reloadBonus:1,speedBonus:1,wingBonus:craft.id===9?1.3:1,
  energyGain:(craft.id===11?1.4:1)+(workshop.energy||0)*.08,crit:craft.id===4?.1:craft.id===13?.2:.04,pierceBonus:craft.id===13?1:0,
  magnetRadius:1.55,regen:craft.id===15?.5:0,protection:0,rapid:0,magnet:0,overdrive:0,pierce:0,barrier:0,shieldDelay:0,salvage:0};
 const s={version:VERSION,chapter,aircraft:craft.id,branch:integer(branch,0,7),mode:['campaign','boss','gauntlet','endless'].includes(mode)?mode:'campaign',difficulty,player:p,
  enemies:[],bullets:[],pickups:[],particles:[],effects:[],hazards:[],arcs:[],events:[],time:0,levelTime:0,score:0,kills:0,graze:0,combo:0,comboTimer:0,maxCombo:0,loot:0,damageTaken:0,partsDestroyed:0,
  wave:0,nextWave:1.5,bossSpawned:false,status:'playing',nextId:1,notice:'',rngState:chapter.seed,round:0,pendingEncounter:0,startChapter:chapter.id,completedBossIds:[],
  stage:0,stageFlags:[],upgradePending:null,upgrades:{},slow:0,shake:0,flash:0,scroll:0,screenTint:0,chapterChanged:0,bossWarning:0};
 if(s.mode==='boss'||s.mode==='gauntlet'){p.power=3;p.wingmen=Math.max(p.wingmen,2);p.energy=65;spawnBoss(s);}
 return s;
}
function addEffect(s,kind,x,y,color,size=3,life=.7){if(s.effects.length>=LIMITS.effects)s.effects.shift();s.effects.push({id:id(s),kind,x,y,color,size,life,maxLife:life});}
function spark(s,x,y,color,n=10,size=.12){
 const count=Math.min(n,LIMITS.particles-s.particles.length);
 for(let i=0;i<count;i++){const a=random(s)*Math.PI*2,v=1+random(s)*5,life=.3+random(s)*.7;s.particles.push({id:id(s),x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,life,maxLife:life,color,size:size*(.5+random(s)),z:random(s)*.8});}
}
function shot(s,owner,x,y,vx,vy,damage,extra={}){
 if(s.bullets.length>=LIMITS.bullets)return null;
 const b={id:id(s),owner,x,y,px:x,py:y,vx,vy,damage,life:owner==='enemy'?7:2.6,age:0,r:.16,hit:[],pierce:1,color:owner==='enemy'?0xff9666:BRANCHES[s.branch].color,...extra};s.bullets.push(b);return b;
}
function pickup(s,type,x,y){if(s.pickups.length>=LIMITS.pickups)return;s.pickups.push({id:id(s),type,x,y,age:0});}
function blast(s,x,y,damage,radius,color,emp=false){
 addEffect(s,emp?'emp':'burst',x,y,color,radius,.65);spark(s,x,y,color,22,.16);
 for(const e of s.enemies)if(e.hp>0&&Math.hypot(e.x-x,e.y-y)<radius+Math.min(e.rx||.7,e.ry||.9)){
  damageEnemy(s,e,damage,e.x,e.y,'blast');if(emp)e.stun=Math.max(e.stun||0,3.2);
 }
 if(emp){s.bullets=s.bullets.filter(b=>b.owner==='player'||Math.hypot(b.x-x,b.y-y)>radius);}
}
function damageEnemy(s,e,damage,x,y,source='main'){
 if(e.hp<=0)return;
 let amount=damage;if(s.aircraft===14&&(e.boss||ENEMIES[e.type]?.tier==='大型'))amount*=1.18;
 if(e.type===7&&!e.boss&&e.hp>e.maxHp*.65&&source==='main')amount*=.8;
 e.hp-=amount;e.hitFlash=.075;
 if(e.parts){
  for(const part of e.parts){if(part.hp<=0)continue;
   const d=Math.hypot(x-e.x-part.dx,y-e.y-part.dy);
   if(d<part.r+(source==='blast'?2:0)){
    part.hp-=amount*(source==='blast'?.45:1);
    if(part.hp<=0){part.hp=0;s.partsDestroyed++;s.score+=300;gainEnergy(s,6);pickup(s,s.partsDestroyed%2?'energy':'ammo',e.x+part.dx,e.y+part.dy);addEffect(s,'burst',e.x+part.dx,e.y+part.dy,0xffcf8a,2.3,.7);spark(s,e.x+part.dx,e.y+part.dy,0xffc27f,24);notice(s,'武器部件击毁 · 敌舰火力削弱');emit(s,'part');}
    break;
   }
  }
 }
}
function hurtPlayer(s,damage,collision=false){
 const p=s.player;if(p.invuln>0||p.barrier>0||p.hp<=0)return;
 damage*=s.difficulty.damage;if(collision&&s.aircraft===10)damage*=.5;
 const absorbed=Math.min(p.shield,damage);p.shield-=absorbed;const actual=damage-absorbed;p.hp=Math.max(0,p.hp-actual);s.damageTaken+=actual;
 p.invuln=.72+p.protection;p.shieldDelay=s.aircraft===6?3.8:6;p.combo=0;s.combo=0;s.comboTimer=0;s.shake=Math.max(s.shake,.22);s.flash=.12;
 spark(s,p.x,p.y,absorbed?0x9ddfff:0xff987f,16);addEffect(s,'shield',p.x,p.y,absorbed?0x98e4ff:0xffa88c,1.8,.35);emit(s,'hit');
}
export function spawnEnemy(s,type,x,y,extra={}){
 if(s.enemies.length>=LIMITS.enemies)return null;
 type=integer(type,0,ENEMIES.length-1);const def=ENEMIES[type];
 const hp=Math.round((def.hp+s.chapter.id*2.0)*(1+s.round*.1)*s.difficulty.enemy*(extra.elite?1.6:1));
 const e={id:id(s),type,x,y,originX:x,hp,maxHp:hp,rx:def.rx,ry:def.ry,cooldown:1.3+random(s),phase:random(s)*6.28,age:0,formation:'sweep',stun:0,hitFlash:0,...extra};s.enemies.push(e);return e;
}
function spawnFormation(s,f){
 for(let i=0;i<f.count;i++){
  let x=(i-(f.count-1)/2)*(f.count>5?2.1:2.7)+f.offset*.45,y=-15-i*.75;
  if(f.type==='vee'||f.type==='diamond')y=-14-Math.abs(i-(f.count-1)/2)*1.25;
  if(f.type==='column'||f.type==='convoy'){x=f.offset*1.7;y=-14-i*2.0;}
  if(f.type==='pincer'||f.type==='flank'){x=i%2?8:-8;y=-13-Math.floor(i/2)*1.6;}
  if(ENEMIES[f.enemy].tier==='大型'){x=f.count===1?f.offset:((i-.5)*8);y=-15-i*3;}
  spawnEnemy(s,f.enemy,clamp(x,-8.8,8.8),y,{formation:f.type,phase:i*.7,elite:f.act===3&&i===0&&s.chapter.id>7});
 }
}
export function spawnBoss(s){
 const c=s.chapter,hp=Math.round((2500+c.id*38)*(1+s.round*.14)*s.difficulty.enemy);
 s.bossSpawned=true;s.bossWarning=3;s.pendingEncounter=0;
 const parts=Array.from({length:c.bossFamily%3===1?4:2},(_,i)=>({id:i,dx:(i%2?1:-1)*(i<2?2.55:1.7),dy:i<2?.3:-1.4,r:.66,hp:240+c.id*6,maxHp:240+c.id*6}));
 s.enemies.push({id:id(s),boss:true,type:18,x:0,y:-13.4,originX:0,hp,maxHp:hp,rx:2.3,ry:1.6,cooldown:2.4,phase:0,pattern:c.id,family:c.bossFamily,chapterId:c.id,age:0,parts,stun:0,hitFlash:0,form:0});
 notice(s,`巨型跃迁信号 · ${c.boss}`);emit(s,'warning');
}
function aimShot(s,e,angle,speed,damage,extra={}){return shot(s,'enemy',e.x,e.y+.65,Math.cos(angle)*speed,Math.sin(angle)*speed,damage,extra);}
function telegraph(s,x,y,x2,y2,width=.65,delay=1.1,duration=.7,color=0xff788d){
 if(s.hazards.length>=LIMITS.hazards)return;
 s.hazards.push({id:id(s),x,y,x2,y2,width,delay,life:delay+duration,activeFor:duration,color,age:0,damage:23});
}
function enemyFire(s,e){
 const p=s.player,def=ENEMIES[e.type],a=Math.atan2(p.y-e.y,p.x-e.x),speed=(4.5+(s.chapter.id%8)*.08)*Math.min(1.35,1+s.round*.06),n=def.count;
 if(def.fire==='sniper'){telegraph(s,e.x,e.y,p.x,p.y+6,.42,1.2,.32,0xffd68b);}
 else if(def.fire==='laser'){for(const side of [-1,1])telegraph(s,e.x+side*(e.rx*.55),e.y,e.x+side*(e.rx*.55),15,.48,1.25,.65,0xff94d1);}
 else if(def.fire==='ring'){for(let j=0;j<n;j++){const q=e.age*.35+j*Math.PI*2/n;aimShot(s,e,q,speed*.78,11,{color:0xffb1d2,r:.17});}}
 else if(def.fire==='double'){for(const side of [-1,1])for(let j=0;j<2;j++){const q=a+(j-.5)*.17;shot(s,'enemy',e.x+side*.75,e.y+1,Math.cos(q)*speed,Math.sin(q)*speed,13,{r:.19,color:0xffb47e});}}
 else if(def.fire==='mine'){for(let j=0;j<3;j++)shot(s,'enemy',e.x+(j-1)*1.1,e.y,Math.sin(j+e.age)*.3,1.3,18,{r:.35,mine:true,life:12,color:0xffa2d5});}
 else if(def.fire==='carrier'){
  if(s.enemies.length<28)for(const side of [-1,1])spawnEnemy(s,4,clamp(e.x+side*2,-8.8,8.8),e.y+.3,{formation:'orbit'});
  for(let j=0;j<3;j++)aimShot(s,e,a+(j-1)*.2,speed,12,{color:0xffc385});
 }else if(def.fire==='missile'){
  for(let j=0;j<3;j++)aimShot(s,e,a+(j-1)*.22,3.8,18,{r:.24,enemyHoming:true,color:0xff936a,life:8});
 }else{
  for(let j=0;j<n;j++)aimShot(s,e,a+(j-(n-1)/2)*.19,speed,def.tier==='大型'?15:10+Math.floor(e.type/5),{r:def.tier==='大型'?.22:.17,color:e.type%3?0xffac75:0xff8aa5});
 }
 e.cooldown=def.rate/Math.min(1.3,1+s.round*.06);
}
function bossFire(s,e){
 const p=s.player,form=e.hp<e.maxHp*.3?2:e.hp<e.maxHp*.65?1:0;
 if(form!==e.form){e.form=form;notice(s,`敌舰进入第 ${form+1} 阶段 · 注意预警航线`);addEffect(s,'emp',e.x,e.y,0xf1adff,6,1);s.bullets=s.bullets.filter(b=>b.owner==='player');e.cooldown=1.35;return;}
 const broken=e.parts.filter(v=>v.hp<=0).length;
 const pattern=(e.family+Math.floor(e.age/8)+form)%8,n=12+form*4+(e.family%3)*2-broken*2,speed=3.8+form*.55+(e.family%4)*.16;
 const aim=Math.atan2(p.y-e.y,p.x-e.x);
 if(pattern===0){for(let j=0;j<n;j++){const a=j*Math.PI*2/n+e.age*.2;aimShot(s,e,a,speed,13,{color:0xffb4db,r:.19});}}
 if(pattern===1){for(let j=-3;j<=3;j++){const a=aim+j*.13;aimShot(s,e,a,speed*1.25,15,{color:0xffbe7e,r:.2});}}
 if(pattern===2){const gap=Math.round(Math.sin(e.age*.45)*3);for(let j=-4;j<=4;j++){if(Math.abs(j-gap)<1)continue;shot(s,'enemy',j*2.1,-10,0,speed*1.14,14,{color:0xd4aeff,r:.25});}}
 if(pattern===3){for(let arm=0;arm<3;arm++)for(let j=0;j<3;j++){const a=e.age*.52+arm*2.094+j*.12;aimShot(s,e,a,speed+j*.18,13,{color:0xaaffde,r:.18});}}
 if(pattern===4){const targets=[-5.5,0,5.5];const skip=Math.floor(e.age)%3;for(let j=0;j<3;j++)if(j!==skip)telegraph(s,targets[j],-9,targets[j],14,.9,1.35,1.0,0xff9ccd);e.cooldown=2.8;return;}
 if(pattern===5){for(let side of [-1,1])for(let j=0;j<5;j++){const a=aim+side*.3+(j-2)*.16;shot(s,'enemy',e.x+side*2,e.y+.6,Math.cos(a)*speed,Math.sin(a)*speed,13,{color:side<0?0xffd28f:0xff9cbf,r:.18});}}
 if(pattern===6){if(s.enemies.length<16){spawnEnemy(s,[0,4,8,14][e.family%4],-7,-11,{formation:'pincer'});spawnEnemy(s,[0,4,8,14][e.family%4],7,-11,{formation:'pincer'});}for(let j=0;j<5;j++)aimShot(s,e,aim+(j-2)*.19,speed,12,{r:.18,color:0xffbb88});e.cooldown=2.1;return;}
 if(pattern===7){for(let j=0;j<n;j++){const a=j*Math.PI*2/n+Math.sin(e.age)*.45;aimShot(s,e,a,speed*(1+.18*Math.sin(j*3)),13,{r:.18,color:0xf5bcff});}}
 e.cooldown=(form===2?.76:form===1?.93:1.18)*(1+broken*.16);
}
function firePrimary(s,input){
 const p=s.player,c=AIRCRAFT[s.aircraft],b=BRANCHES[s.branch];
 p.cooldown=c.rate*b.rate*p.rateBonus*(p.rapid>0?.65:1);
 const power=p.power,crit=random(s)<p.crit,damage=c.damage*b.damage*p.damageBonus*(p.overdrive>0?1.45:1)*(s.aircraft===8&&input.focus?1.35:1)*(crit?1.75:1),pierce=p.pierceBonus+(p.pierce>0?2:0);
 const extra={color:b.color,crit};
 if(s.branch===0){const n=1+2*Math.min(3,power-1);for(let j=0;j<n;j++){const a=(j-(n-1)/2)*.105;shot(s,'player',p.x,p.y-1,Math.sin(a)*30,-Math.cos(a)*30,damage*(1+(power-1)*.1),{...extra,pierce:1+pierce});}}
 if(s.branch===1){for(let j=0;j<(power>=4?2:1);j++)shot(s,'player',p.x+(power>=4?(j-.5)*.5:0),p.y-1,0,-55,damage*(1+power*.1),{...extra,beam:true,r:.2,life:1.0,pierce:7+pierce});}
 if(s.branch===2){const n=1+Math.floor(power/2);for(let j=0;j<n;j++)shot(s,'player',p.x+(j-(n-1)/2)*.32,p.y-.9,(j-(n-1)/2)*3,-25,damage,{...extra,homing:true,targetSlot:j,pierce:1+pierce,life:3.3});}
 if(s.branch===3){for(const side of [-1,1])shot(s,'player',p.x+side*.65,p.y-.9,side*.7,-23,damage*(1+(power-1)*.13),{...extra,plasma:true,explosive:.9+power*.13,r:.29,pierce:1});}
 if(s.branch===4){for(const side of [-1,1])shot(s,'player',p.x+side*.48,p.y-.85,(random(s)-.5)*1.4,-38,damage*(1+(power-1)*.17),{...extra,tracer:true,r:.1,pierce:1+pierce,life:1.4});}
 if(s.branch===5){
  let targets=s.enemies.filter(e=>e.hp>0&&e.y<p.y&&e.y>-13&&Math.hypot(e.x-p.x,e.y-p.y)<19).sort((a,b)=>Math.hypot(a.x-p.x,a.y-p.y)-Math.hypot(b.x-p.x,b.y-p.y)).slice(0,2+Math.floor(power/2));
  let x=p.x,y=p.y-.7;for(let j=0;j<targets.length;j++){const e=targets[j];s.arcs.push({id:id(s),x,y,x2:e.x,y2:e.y,life:.19,maxLife:.19,color:b.color});damageEnemy(s,e,damage*(j===0?1:.6),e.x,e.y);spark(s,e.x,e.y,b.color,4);x=e.x;y=e.y;}
  if(!targets.length)shot(s,'player',p.x,p.y-.9,0,-32,damage,{...extra,beam:true,pierce:2+pierce});
 }
 if(s.branch===6)shot(s,'player',p.x,p.y-1.1,0,-70,damage*(1+(power-1)*.17),{...extra,rail:true,beam:true,r:.24,pierce:12+pierce,life:.8});
 if(s.branch===7){for(const side of [-1,1])shot(s,'player',p.x+side*.55,p.y-1,side*3,-19,damage*(1+(power-1)*.12),{...extra,disc:true,side,r:.32,pierce:4+pierce,life:2.3});}
 for(let j=0;j<p.wingmen;j++){const side=j%2?1:-1,offset=(1+Math.floor(j/2))*.95+1;shot(s,'player',p.x+side*offset,p.y+.3+(j>=2?.6:0),0,-30,c.damage*.5*p.damageBonus*p.wingBonus,{color:0xadffd9,pierce:1,r:.11,homing:power>=4,life:2.3,wing:true});}
 emit(s,'shot');
}
function reload(s){const p=s.player;if(p.reload>0||p.missiles>=p.magazine||p.reserve<=0)return false;p.reload=p.reloadDuration*p.reloadBonus;emit(s,'reload');return true;}
function fireMissile(s){
 const p=s.player;if(p.reload>0||p.missileCooldown>0)return;
 if(p.missiles<=0){reload(s);return;}
 p.missiles--;p.missileCooldown=s.aircraft===7?.19:.32;
 const m=MISSILES[p.missileType],side=p.missiles%2?1:-1,bonus=s.aircraft===14&&p.missileType===2?1.5:1;
 shot(s,'player',p.x+side*.8,p.y-.4,side*2.8,-m.speed,m.damage*p.missileBonus*bonus,{missile:true,homing:true,missileType:m.id,speed:m.speed,turn:m.turn,explosive:m.radius*(s.aircraft===5?1.2:1),color:m.color,r:.24,life:5.5,pierce:1});
 emit(s,'missile');if(p.missiles===0)reload(s);
}
function useBomb(s){
 const p=s.player;if(p.bombs<=0||p.bombCooldown>0)return;
 p.bombs--;p.bombCooldown=1.8;p.invuln=Math.max(p.invuln,s.aircraft===0?2.6:2);s.bullets=s.bullets.filter(b=>b.owner==='player');s.hazards=[];
 for(const e of s.enemies)damageEnemy(s,e,(s.aircraft===2?400:280),e.x,e.y,'blast');
 spark(s,p.x,p.y,0xa8ddff,55);addEffect(s,'nova',p.x,p.y,0xb3dcff,24,1.0);s.shake=.3;s.flash=.25;notice(s,'护盾过载 · 敌弹已清除');emit(s,'bomb');
}
function useUltimate(s){
 const p=s.player;if(p.energy<100||p.ultimateTimer>0)return;
 p.energy=0;s.bullets=s.bullets.filter(b=>b.owner==='player');s.hazards=[];
 if(p.ultimateType===0){p.invuln=3.5;for(const e of s.enemies)damageEnemy(s,e,1050*(s.aircraft===2?1.35:1),e.x,e.y,'blast');addEffect(s,'nova',p.x,p.y,0xffd49a,36,1.7);spark(s,p.x,p.y,0xffdeaf,100,.22);p.ultimateTimer=1.2;s.flash=.4;s.shake=.65;}
 if(p.ultimateType===1){p.ultimateTimer=4.5;p.invuln=4.5;addEffect(s,'emp',p.x,p.y,0xd6b8ff,8,1);s.shake=.18;}
 if(p.ultimateType===2){p.ultimateTimer=8;p.invuln=2.5;s.slow=8;p.shield=p.maxShield;p.magnet=12;p.overdrive=8;addEffect(s,'chrono',p.x,p.y,0xa5ffe0,18,2);}
 notice(s,`终极协议 · ${ULTIMATES[p.ultimateType].name}`);emit(s,'ultimate');
}
export function applyPickup(s,type){
 const p=s.player;if(!PICKUPS.some(v=>v.id===type))return false;
 switch(type){
 case 'power':p.power=Math.min(5,p.power+1);break;
 case 'wing':p.wingmen=Math.min(4,p.wingmen+1);break;
 case 'repair':p.hp=Math.min(p.maxHp,p.hp+(s.aircraft===3?42:30));break;
 case 'shield':p.shield=Math.min(p.maxShield,p.shield+40);break;
 case 'ammo':p.reserve=Math.min(160,p.reserve+Math.ceil(p.magazine*1.5));break;
 case 'bomb':p.bombs=Math.min(6,p.bombs+1);break;
 case 'energy':gainEnergy(s,22);break;
 case 'rapid':p.rapid=12;break;
 case 'magnet':p.magnet=18;break;
 case 'overdrive':p.overdrive=10;break;
 case 'credit':s.score+=400;s.loot+=15;break;
 case 'freeze':s.slow=6;break;
 case 'pierce':p.pierce=16;break;
 case 'barrier':p.barrier=3;p.invuln=Math.max(p.invuln,3);p.shield=Math.min(p.maxShield,p.shield+20);break;
 }
 s.score+=60;notice(s,`${PICKUPS.find(v=>v.id===type).name} · ${PICKUPS.find(v=>v.id===type).description}`);addEffect(s,'collect',p.x,p.y,PICKUPS.find(v=>v.id===type).color,1.8,.5);emit(s,'pickup');return true;
}
function makeUpgradeChoices(s){
 const pool=UPGRADES.filter(v=>(s.upgrades[v.id]||0)<3);const selected=[];
 // Endless flights can eventually exhaust the upgrade pool. Never open an empty modal.
 if(!pool.length){s.upgradePending=null;applyPickup(s,'ammo');applyPickup(s,'repair');notice(s,'模块均已满级 · 改装机会转换为弹药与维修补给');return;}
 while(selected.length<3&&pool.length){const index=Math.floor(random(s)*pool.length);selected.push(pool.splice(index,1)[0].id);}
 s.upgradePending=selected;
}
export function applyUpgrade(s,type){
 if(!UPGRADES.some(v=>v.id===type)||!s.upgradePending?.includes(type))return false;
 const p=s.player;
 switch(type){
 case 'damage':p.damageBonus+=.18;break;
 case 'rate':p.rateBonus=Math.max(.45,p.rateBonus*.88);break;
 case 'missile':p.missileBonus+=.28;break;
 case 'reload':p.reloadBonus=Math.max(.4,p.reloadBonus*.8);break;
 case 'shield':p.maxShield+=25;p.shield=p.maxShield;break;
 case 'armor':p.maxHp+=25;p.hp=Math.min(p.maxHp,p.hp+35);break;
 case 'speed':p.speedBonus+=.1;break;
 case 'wing':p.wingmen=Math.min(4,p.wingmen+1);p.wingBonus+=.12;break;
 case 'bomb':p.bombs=Math.min(6,p.bombs+1);break;
 case 'energy':p.energyGain+=.3;break;
 case 'magnet':p.magnetRadius+=1.4;break;
 case 'pierce':p.pierceBonus++;break;
 case 'crit':p.crit=Math.min(.7,p.crit+.12);break;
 case 'reserve':p.magazine+=2;p.reserve=Math.min(160,p.reserve+12);break;
 case 'regen':p.regen+=.7;break;
 case 'salvage':p.salvage++;s.loot+=25;break;
 case 'barrier':p.shield=p.maxShield;p.protection+=.2;break;
 case 'overclock':gainEnergy(s,35);p.damageBonus+=.08;break;
 }
 s.upgrades[type]=(s.upgrades[type]||0)+1;s.upgradePending=null;p.invuln=Math.max(p.invuln,1.5);notice(s,`模块已接入 · ${UPGRADES.find(v=>v.id===type).name}`);return true;
}
function segmentDistance(x,y,x1,y1,x2,y2){const dx=x2-x1,dy=y2-y1,l=dx*dx+dy*dy,t=l?clamp(((x-x1)*dx+(y-y1)*dy)/l,0,1):0;return Math.hypot(x-x1-t*dx,y-y1-t*dy);}
function hitEllipse(b,e){
 const rx=(e.rx||.7)+(b.r||.1),ry=(e.ry||.9)+(b.r||.1);
 if(segmentDistance(0,0,(b.px-e.x)/rx,(b.py-e.y)/ry,(b.x-e.x)/rx,(b.y-e.y)/ry)<1)return true;
 return !!e.parts?.some(v=>v.hp>0&&segmentDistance(e.x+v.dx,e.y+v.dy,b.px,b.py,b.x,b.y)<v.r+b.r);
}
function missileImpact(s,b){
 blast(s,b.x,b.y,b.damage,b.explosive,b.color,b.missileType===3);s.shake=Math.max(s.shake,.09);emit(s,'explosion');
 if(b.missileType===1){for(let i=0;i<6;i++){const a=i*Math.PI/3;shot(s,'player',b.x,b.y,Math.cos(a)*12,Math.sin(a)*12,35*s.player.missileBonus,{color:0xffc3e8,homing:true,r:.15,life:1.3,pierce:1,cluster:true});}}
}
function resolveDeaths(s){
 const dead=s.enemies.filter(e=>e.hp<=0&&!e.resolved);
 for(const e of dead){
  e.resolved=true;s.kills++;s.combo++;s.maxCombo=Math.max(s.maxCombo,s.combo);s.comboTimer=4;const mult=1+Math.min(4,Math.floor(s.combo/12))*.25;
  s.score+=Math.round((e.boss?6500+s.chapter.id*200:ENEMIES[e.type].score)*mult*s.difficulty.score);s.loot+=e.boss?80:ENEMIES[e.type].tier==='大型'?7:1;gainEnergy(s,e.boss?12:ENEMIES[e.type].tier==='大型'?5:1.4);
  const large=e.boss||ENEMIES[e.type].tier==='大型';spark(s,e.x,e.y,large?0xffd3a0:0xffb889,large?60:14,large?.24:.14);addEffect(s,'burst',e.x,e.y,0xffbf86,large?5:1.8,large?1.1:.55);emit(s,'kill',large?2:1);s.shake=Math.max(s.shake,large?.2:.025);
  if(!e.boss){
   if(e.type===14&&s.enemies.length<35)for(const side of [-1,1])spawnEnemy(s,0,clamp(e.x+side*.75,-9,9),e.y,{formation:'flank',hp:25,maxHp:25});
   if(s.kills%Math.max(2,4-s.player.salvage)===0||large){
    let type;
    if(s.kills<12&&s.player.power<3)type='power';
    else if(s.player.reserve<8&&s.kills%2===0)type='ammo';
    else if(s.player.hp<s.player.maxHp*.55&&random(s)<.4)type='repair';
    else type=PICKUPS[(Math.floor(random(s)*PICKUPS.length)+s.kills)%PICKUPS.length].id;
    pickup(s,type,e.x,clamp(e.y,-12,12));
   }
   if(large)pickup(s,'energy',e.x+1.1,e.y-.5);
  }else{
   s.completedBossIds.push(e.chapterId);s.bullets=s.bullets.filter(b=>b.owner==='player');s.hazards=[];
   if(s.mode==='gauntlet'&&s.round<3){s.round++;s.pendingEncounter=3;notice(s,`第 ${s.round} 艘旗舰已摧毁 · 战间补给抵达`);}
   else if(s.mode==='endless'){s.round++;s.pendingEncounter=3;notice(s,'航道净空 · 跃迁到下一星域');}
   else{s.status='won';}
  }
 }
 s.enemies=s.enemies.filter(e=>e.hp>0&&e.y<16);
}
function nextEncounter(s){
 const p=s.player;s.chapter=CHAPTERS[(s.startChapter+s.round)%48];s.chapterChanged++;s.enemies=[];s.bullets=[];s.hazards=[];s.pickups=[];s.bossSpawned=false;s.wave=0;s.levelTime=0;s.stage=0;s.stageFlags=[];s.nextWave=1.5;
 p.hp=Math.min(p.maxHp,p.hp+p.maxHp*.35);p.shield=p.maxShield;p.reserve=Math.min(160,p.reserve+p.magazine*2);p.bombs=Math.min(6,p.bombs+1);p.invuln=3;gainEnergy(s,25);
 if(s.mode==='gauntlet')spawnBoss(s);else notice(s,`第 ${s.round+1} 次跃迁 · ${s.chapter.name}`);
}
export function stepFlight(s,input={},dt=1/60){
 if(!s||s.status!=='playing'||s.upgradePending)return;
 dt=clamp(finite(dt),0,.04);if(dt<=0)return;
 input=input&&typeof input==='object'?input:{};
 const p=s.player,c=AIRCRAFT[s.aircraft];s.events=[];s.time+=dt;s.levelTime+=dt;s.scroll+=dt*(p.dashTimer>0?9:3);s.comboTimer=Math.max(0,s.comboTimer-dt);if(!s.comboTimer)s.combo=0;
 for(const key of ['cooldown','invuln','bombCooldown','missileCooldown','ultimateTimer','dashCooldown','dashTimer','rapid','magnet','overdrive','pierce','barrier','shieldDelay'])p[key]=Math.max(0,p[key]-dt);
 s.slow=Math.max(0,s.slow-dt);s.shake=Math.max(0,s.shake-dt*1.4);s.flash=Math.max(0,s.flash-dt*1.6);s.bossWarning=Math.max(0,s.bossWarning-dt);
 if(p.reload>0){p.reload=Math.max(0,p.reload-dt);if(p.reload===0){const transfer=Math.min(p.magazine-p.missiles,p.reserve);p.missiles+=transfer;p.reserve-=transfer;emit(s,'loaded');}}
 if(p.missiles===0&&p.reload<=0)reload(s);if(input.reload)reload(s);
 if(p.shieldDelay===0)p.shield=Math.min(p.maxShield,p.shield+dt*(s.aircraft===6?5.5:2.8));if(p.regen>0)p.hp=Math.min(p.maxHp,p.hp+p.regen*dt);
 let x=clamp(finite(input.x),-1,1),y=clamp(finite(input.y),-1,1);
 if(Number.isFinite(input.targetX)&&Number.isFinite(input.targetY)){const dx=clamp(input.targetX,-9,9)-p.x,dy=clamp(input.targetY,-8.5,11)-p.y,d=Math.hypot(dx,dy);if(d>.06){x=dx/Math.max(1,d);y=dy/Math.max(1,d);}else{x=0;y=0;}}
 const length=Math.max(1,Math.hypot(x,y));if(Math.hypot(x,y)>.1){p.lastDx=x/length;p.lastDy=y/length;}
 if(input.dash&&p.dashCooldown<=0){p.dashTimer=.22;p.invuln=Math.max(p.invuln,.42);p.dashCooldown=(s.aircraft===4?2.5:s.aircraft===12?2.8:4)/p.speedBonus;addEffect(s,'dash',p.x,p.y,c.color,2,.4);emit(s,'dash');}
 const speed=c.speed*p.speedBonus*(input.focus?.47:1);
 if(p.dashTimer>0){p.x+=p.lastDx*c.speed*2.6*dt;p.y+=p.lastDy*c.speed*2.6*dt;}else{p.x+=x/length*speed*dt;p.y+=y/length*speed*dt;}
 p.x=clamp(p.x,-9,9);p.y=clamp(p.y,-8.5,11);p.bank=x;
 if(input.shoot&&p.cooldown<=0)firePrimary(s,input);
 if(input.missile)fireMissile(s);if(input.skill)useBomb(s);if(input.ultimate)useUltimate(s);
 if(p.ultimateType===1&&p.ultimateTimer>0){
  for(const e of s.enemies)if(e.y<p.y&&Math.abs(e.x-p.x)<2+e.rx)damageEnemy(s,e,640*dt*p.damageBonus,e.x,e.y,'beam');
  s.bullets=s.bullets.filter(b=>b.owner==='player'||b.y>p.y||Math.abs(b.x-p.x)>2.4);
 }
 if(s.pendingEncounter>0){s.pendingEncounter-=dt;if(s.pendingEncounter<=0)nextEncounter(s);}
 if((s.mode==='campaign'||s.mode==='endless')&&!s.bossSpawned&&s.pendingEncounter<=0){
  s.nextWave-=dt;
  if(s.wave<s.chapter.formations.length&&s.levelTime>=s.chapter.formations[s.wave].at){const f=s.chapter.formations[s.wave++];spawnFormation(s,f);s.nextWave=f.delay;}
  const stage=Math.min(3,Math.floor(s.levelTime/s.chapter.duration*4));
  if(stage!==s.stage){s.stage=stage;notice(s,`${['跃迁接敌','编队拦截','舰队突破','旗舰封锁'][stage]} · 航路 ${Math.round(s.levelTime/s.chapter.duration*100)}%`);}
  for(const [flag,at] of [[0,.33],[1,.66]])if(s.levelTime>=s.chapter.duration*at&&!s.stageFlags.includes(flag)){s.stageFlags.push(flag);makeUpgradeChoices(s);break;}
  if(s.levelTime>=s.chapter.duration*.5&&!s.stageFlags.includes(2)){s.stageFlags.push(2);spawnEnemy(s,[10,11,17,16][s.chapter.id%4],0,-15,{elite:true,formation:'column'});notice(s,'精英舰队抵达 · 优先摧毁大型目标');}
  if(s.levelTime>=s.chapter.duration*.78&&!s.stageFlags.includes(3)){s.stageFlags.push(3);pickup(s,'ammo',-4,-9);pickup(s,'repair',0,-9);pickup(s,'energy',4,-9);notice(s,'前线补给投送 · 准备旗舰战');}
  if(s.levelTime>=s.chapter.duration){spawnBoss(s);s.enemies=s.enemies.filter(e=>e.boss||e.y>-7);s.bullets=s.bullets.filter(b=>b.owner==='player');p.invuln=Math.max(p.invuln,1.5);}
 }
 const slow=s.slow>0?.38:1;
 for(const e of s.enemies){
  if(e.hp<=0)continue;e.age+=dt*slow;e.phase+=dt*slow;e.stun=Math.max(0,(e.stun||0)-dt);e.hitFlash=Math.max(0,(e.hitFlash||0)-dt);
  if(e.stun>0)continue;e.cooldown-=dt*slow;
  if(e.boss){
   e.y+=(-6.6-e.y)*dt*1.1*slow;e.x=Math.sin(e.age*.35)*(3.4+(e.family%3)*.25);
   if(e.cooldown<=0&&e.y>-10)bossFire(s,e);
  }else{
   const def=ENEMIES[e.type];e.y+=def.speed*dt*slow*(e.elite?.82:1);
   if(e.formation==='sweep'||e.formation==='stagger')e.x=clamp(e.originX+Math.sin(e.age*.7+e.phase*.15)*2.4,-9.2,9.2);
   if(e.formation==='spiral'||e.formation==='orbit')e.x=clamp(e.originX+Math.sin(e.age*1.1+e.phase)*2.1,-9.2,9.2);
   if(e.formation==='pincer'||e.formation==='flank')e.x=e.originX*Math.cos(Math.min(1.35,e.age*.15));
   if(e.formation==='cross')e.x=clamp(e.originX+Math.sin(e.age*.3)*4*(e.originX<0?1:-1),-9.2,9.2);
   if(e.type===15)e.cloak=Math.sin(e.age*1.8)>.5;
   if(e.y>-11.5&&e.y<p.y+.3&&e.cooldown<=0)enemyFire(s,e);
  }
  if(segmentDistance(0,0,(p.x-e.x)/(e.rx+.12),(p.y-e.y)/(e.ry+.12),(p.x-e.x)/(e.rx+.12),(p.y-e.y)/(e.ry+.12))<1)hurtPlayer(s,e.boss?35:25,true);
 }
 // Process only bullets present at the start: impact-created cluster shots advance next tick.
 const bulletsNow=[...s.bullets];
 for(const b of bulletsNow){
  if(b.life<=0)continue;b.px=b.x;b.py=b.y;b.age+=dt;b.life-=dt;
  if(b.homing){
   const targets=s.enemies.filter(e=>e.hp>0&&e.y>-16).sort((a,b2)=>Math.hypot(a.x-b.x,a.y-b.y)-Math.hypot(b2.x-b.x,b2.y-b.y));
   const target=targets.length?targets[(b.targetSlot||0)%Math.min(3,targets.length)]:null;
   if(target){const a=Math.atan2(target.y-b.y,target.x-b.x),v=b.speed||(b.cluster?19:28),turn=Math.min(1,dt*(b.turn||4.4));b.vx+=(Math.cos(a)*v-b.vx)*turn;b.vy+=(Math.sin(a)*v-b.vy)*turn;}
  }
  if(b.enemyHoming&&b.age<2.2){const a=Math.atan2(p.y-b.y,p.x-b.x);b.vx+=(Math.cos(a)*5.1-b.vx)*dt*.8;b.vy+=(Math.sin(a)*5.1-b.vy)*dt*.8;}
  if(b.disc){b.vx=b.side*(3+Math.sin(b.age*3)*3);b.vy=-19+b.age*12;}
  b.x+=b.vx*dt*(b.owner==='enemy'?slow:1);b.y+=b.vy*dt*(b.owner==='enemy'?slow:1);
  if(b.owner==='player'){
   for(const e of s.enemies){
    if(e.hp<=0||b.hit.includes(e.id)||!hitEllipse(b,e))continue;
    b.hit.push(e.id);
    if(b.missile){missileImpact(s,b);b.life=0;break;}
    if(b.plasma){blast(s,b.x,b.y,b.damage,b.explosive,b.color);b.life=0;break;}
    // Closest point along swept flight determines which exposed weapon module is struck.
    const dx=b.x-b.px,dy=b.y-b.py,l=dx*dx+dy*dy,t=l?clamp(((e.x-b.px)*dx+(e.y-b.py)*dy)/l,0,1):0;
    damageEnemy(s,e,b.damage,b.px+dx*t,b.py+dy*t);spark(s,b.x,b.y,b.color,2,.09);
    if(b.hit.length>=b.pierce){b.life=0;break;}
   }
   if(b.missile&&b.life<=0&&!b.hit.length&&b.y>-15&&b.y<14)missileImpact(s,b);
  }else{
   const distance=segmentDistance(p.x,p.y,b.px,b.py,b.x,b.y),core=s.aircraft===1||s.aircraft===12?.19:.25;
   if(distance<core+(b.r||.18)){hurtPlayer(s,b.damage);b.life=0;}
   else if(distance<core+.6+(b.r||.18)&&!b.grazed&&p.invuln<=0){b.grazed=true;s.graze++;s.score+=8;gainEnergy(s,.5);}
  }
 }
 s.bullets=s.bullets.filter(b=>b.life>0&&Math.abs(b.x)<16&&b.y>-20&&b.y<17);
 for(const h of s.hazards){h.age+=dt*slow;h.life-=dt*slow;h.delay-=dt*slow;if(h.delay<=0&&h.life>0&&segmentDistance(p.x,p.y,h.x,h.y,h.x2,h.y2)<h.width*.5+.23)hurtPlayer(s,h.damage);}
 s.hazards=s.hazards.filter(h=>h.life>0);
 resolveDeaths(s);
 for(const v of s.pickups){
  v.age+=dt;v.y+=1.65*dt;const d=Math.hypot(v.x-p.x,v.y-p.y),magnet=p.magnet>0||d<p.magnetRadius+1.4;
  if(magnet&&d>.02){const speed=p.magnet>0?11:6;v.x+=(p.x-v.x)/d*speed*dt;v.y+=(p.y-v.y)/d*speed*dt;}
  if(p.hp>0&&Math.hypot(v.x-p.x,v.y-p.y)<p.magnetRadius){v.taken=true;applyPickup(s,v.type);}
 }
 s.pickups=s.pickups.filter(v=>!v.taken&&v.y<16&&v.age<22);
 for(const q of s.particles){q.x+=q.vx*dt;q.y+=q.vy*dt;q.vx*=Math.exp(-dt*2);q.vy*=Math.exp(-dt*2);q.life-=dt;}
 s.particles=s.particles.filter(q=>q.life>0);
 for(const e of s.effects)e.life-=dt;s.effects=s.effects.filter(e=>e.life>0);
 for(const a of s.arcs)a.life-=dt;s.arcs=s.arcs.filter(a=>a.life>0);
 if(p.hp<=0)s.status='lost';
}
export function normalizeSave(value){
 const v=value&&typeof value==='object'?value:{},best={},grades={},workshop={};
 for(const [k,n] of Object.entries(v.best&&typeof v.best==='object'?v.best:{}))if(/^\d+$/.test(k)&&+k<48&&Number.isFinite(n)&&n>=0)best[k]=Math.min(99999999,Math.floor(n));
 for(const [k,n] of Object.entries(v.grades&&typeof v.grades==='object'?v.grades:{}))if(/^\d+$/.test(k)&&+k<48&&['S','A','B','C'].includes(n))grades[k]=n;
 for(const def of WORKSHOP)workshop[def.id]=integer(v.workshop?.[def.id],0,def.max);
 const settings=v.settings&&typeof v.settings==='object'?v.settings:{};
 return {version:2,unlocked:integer(v.unlocked,1,48),best,bosses:[...new Set(Array.isArray(v.bosses)?v.bosses.filter(n=>Number.isInteger(n)&&n>=0&&n<48):[])],
  credits:integer(v.credits,0,99999999),grades,workshop,totalKills:integer(v.totalKills,0,99999999),totalFlights:integer(v.totalFlights,0,99999999),bestEndless:integer(v.bestEndless,0,99999999),
  settings:{craft:integer(settings.craft,0,15),branch:integer(settings.branch,0,7),chapter:integer(settings.chapter,0,47),missile:integer(settings.missile,0,3),ultimate:integer(settings.ultimate,0,2),
   difficulty:['story','normal','ace'].includes(settings.difficulty)?settings.difficulty:'normal',quality:['eco','balanced','ultra'].includes(settings.quality)?settings.quality:'balanced',autoFire:settings.autoFire!==false,reducedMotion:settings.reducedMotion===true}};
}
export function flightGrade(s){if(s.status!=='won')return 'C';const ratio=s.damageTaken/Math.max(1,s.player.maxHp);return ratio<.15?'S':ratio<.6?'A':ratio<1.25?'B':'C';}
export function recordResult(save,s){
 const v=normalizeSave(save);v.credits=Math.min(99999999,v.credits+Math.max(0,Math.floor(s.loot||0))+(s.status==='won'?100:0));v.totalKills+=s.kills||0;v.totalFlights++;
 if(s.mode==='endless')v.bestEndless=Math.max(v.bestEndless,s.score||0);
 if(s.status==='won'){
  if(s.mode==='boss'||s.mode==='gauntlet')v.bosses=[...new Set([...v.bosses,...(s.completedBossIds?.length?s.completedBossIds:[s.chapter.id])])];
  else{v.unlocked=Math.min(48,Math.max(v.unlocked,s.chapter.id+2));v.best[s.chapter.id]=Math.max(v.best[s.chapter.id]||0,s.score);const grade=flightGrade(s);if(!v.grades[s.chapter.id]||'SABC'.indexOf(grade)<'SABC'.indexOf(v.grades[s.chapter.id]))v.grades[s.chapter.id]=grade;}
 }
 return v;
}
export function buyUpgrade(save,type){
 const v=normalizeSave(save),def=WORKSHOP.find(w=>w.id===type);if(!def)return v;
 const level=v.workshop[type],cost=def.base*(level+1);if(level>=def.max||v.credits<cost)return v;
 v.credits-=cost;v.workshop[type]++;return v;
}

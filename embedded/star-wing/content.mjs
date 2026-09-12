/* 星际雷翼 · 星海远征版 — data only; no DOM or shared-runtime dependencies. */
export const VERSION = '2.0.0-stellar';
export const AIRCRAFT = [
  ['曙光','均衡截击机',100,8.5,.19,19,0x82e9ff,0xe9f5ff,45,6,24,3.2,3,'均衡','过载保护更持久 · 综合火控'],
  ['雨燕','高速轻战机',75,11.5,.13,14,0xffc868,0xeee4d1,32,5,25,2.7,4,'轻量','极小判定核心 · 四枚过载'],
  ['磐石','重装轰击机',155,6.6,.28,31,0xc794ff,0xd7d9e8,65,8,32,4.0,3,'重炮','爆破伤害 +35% · 重装弹仓'],
  ['织星','僚机母舰',90,7.8,.22,15,0x8fffd0,0xdce9df,50,6,24,3.4,3,'母舰','自带双僚机 · 修复补给增效'],
  ['夜隼','隐袭战斗机',85,10.2,.17,18,0xc4a1ff,0x66738a,40,6,24,3.0,3,'幽影','闪跃冷却缩短 · 暴击 +10%'],
  ['赤霄','爆破强袭机',125,7.6,.23,25,0xff7c67,0xd7b5a1,45,8,32,3.6,3,'爆破','飞弹伤害 +30% · 爆炸半径扩大'],
  ['流萤','离子护航机',95,9.0,.16,16,0x9affec,0xeff7ed,85,6,24,3.2,3,'护盾','离子护盾 · 脱战后更快回充'],
  ['女武神','双体导弹机',110,8.2,.21,21,0xff96c8,0xece3ed,50,10,40,3.3,3,'弹幕','十发弹仓 · 飞弹发射间隔缩短'],
  ['游隼','精密狙击机',88,9.4,.29,34,0xa7ddff,0xdce8ef,40,5,25,3.0,3,'狙击','精密慢移时主炮伤害 +35%'],
  ['蜂后','无人机航母',105,7.2,.25,17,0xffe488,0xd3ccab,55,6,30,3.8,3,'编队','自带三架僚机 · 僚机火力增强'],
  ['玄武','装甲堡垒',190,6.0,.31,34,0x8eeec0,0xa7bfba,90,8,32,4.3,2,'堡垒','超厚装甲护盾 · 撞击减伤'],
  ['星弦','能量试验机',80,9.3,.15,16,0xe9a3ff,0xe3d9f4,55,6,24,3.0,3,'谐振','终极能量获取 +40%'],
  ['彗星','竞速突击机',70,12.3,.12,13,0xffab71,0xffecdb,35,5,25,2.5,4,'竞速','极速 · 闪跃加速 · 快速装填'],
  ['蚀月','棱镜战斗机',92,9.2,.20,22,0xb79aff,0xc3c8e5,55,6,30,3.2,3,'棱镜','暴击 +20% · 贯穿强化'],
  ['利维坦','重型鱼雷艇',165,6.4,.27,30,0x80caff,0xaabacb,70,10,40,4.1,3,'攻坚','鱼雷伤害 +50% · 大型目标增伤'],
  ['炽天使','远征旗舰机',115,8.4,.18,21,0xffe6a3,0xf3eee0,65,8,32,3.1,3,'远征','缓慢修复装甲 · 稳定能量回收'],
].map((a,id)=>({id,name:a[0],role:a[1],hp:a[2],speed:a[3],rate:a[4],damage:a[5],color:a[6],hull:a[7],shield:a[8],magazine:a[9],reserve:a[10],reload:a[11],bombs:a[12],trait:a[13],perk:a[14],model:id}));
export const BRANCHES = [
 {id:0,name:'扇面脉冲',tag:'SPREAD',description:'宽幅脉冲弹幕，强化后同时发射七束，适合拦截大编队。',color:0x7cecff,rate:1,damage:1},
 {id:1,name:'聚焦光矛',tag:'LANCE',description:'高能贯穿光矛，击穿纵向编队与首领部件。',color:0xc5a4ff,rate:1.55,damage:2.9},
 {id:2,name:'寻迹蜂群',tag:'SWARM',description:'自动追踪敌机，强化后多枚弹体分别索敌。',color:0xffc777,rate:1.15,damage:1.2},
 {id:3,name:'双星等离子',tag:'PLASMA',description:'双联等离子球，命中产生范围爆炸。',color:0xff8caf,rate:1.55,damage:1.75},
 {id:4,name:'暴风机炮',tag:'VULCAN',description:'超高射速双联机炮，小幅散布，持续压制单体目标。',color:0xffeb9c,rate:.52,damage:.79},
 {id:5,name:'链式电弧',tag:'ARC',description:'自动锁定前方敌军并连锁跳跃；空域无目标时发射探测脉冲。',color:0x9fffee,rate:1.9,damage:3.5},
 {id:6,name:'磁轨重炮',tag:'RAIL',description:'低射速、高穿深重弹，具有部件打击能力。',color:0xafd6ff,rate:2.2,damage:5.7},
 {id:7,name:'回旋光刃',tag:'DISCS',description:'穿透旋转光盘，向前飞出后回旋收割侧翼。',color:0xe4a4ff,rate:1.5,damage:1.8},
];
export const MISSILES = [
 {id:0,name:'隼式追踪弹',tag:'HUNTER',description:'快速追踪，稳定打击单体；小范围爆炸。',damage:145,radius:1.8,speed:16,turn:3.7,color:0xffd591},
 {id:1,name:'蜂巢集束弹',tag:'CLUSTER',description:'命中后分裂六枚子弹，清理大面积小型战机。',damage:90,radius:2.5,speed:14,turn:2.7,color:0xffa7dc},
 {id:2,name:'裂舰重鱼雷',tag:'TORPEDO',description:'低速重型追踪鱼雷，巨额爆破伤害，适合战舰与首领。',damage:310,radius:2.9,speed:10,turn:1.5,color:0xffad70},
 {id:3,name:'静默 EMP 弹',tag:'EMP',description:'电磁爆炸，清除局部弹幕并使敌机短暂瘫痪。',damage:90,radius:4.2,speed:15,turn:3.2,color:0xa9fff0},
];
export const ULTIMATES = [
 {id:0,name:'超新星爆发',tag:'SUPERNOVA',description:'瞬间清屏、全场重创，获得 3.5 秒无敌。',color:0xffd391},
 {id:1,name:'天穹歼星炮',tag:'STAR LANCE',description:'持续 4.5 秒巨型光柱，清除光柱内敌弹并灼烧目标。',color:0xd2bcff},
 {id:2,name:'时空庇护',tag:'CHRONO',description:'8 秒敌军减速和供能强化；恢复护盾、吸引补给。',color:0x9ffff0},
];
export const BIOMES = [
 {id:0,name:'鎏金日冕',kind:'solar',colors:['#120f26','#71422e','#ffc579','#fff0bd'],accent:0xffca80,light:0xffdcac,rim:0xff9caf,planet:0xbc835c,seed:17,description:'金色尘埃汇入恒星日冕，暖光照亮残骸与环带。'},
 {id:1,name:'玫瑰星潮',kind:'rose',colors:['#20132d','#873e70','#ff9fcf','#ffe2bd'],accent:0xffa3d1,light:0xffd6e4,rim:0xadacff,planet:0xb487c7,seed:44,description:'粉色发射星云、珍珠行星与跨越星海的轨道环。'},
 {id:2,name:'赤焰熔炉',kind:'forge',colors:['#221126','#9b3e35','#ff9c67','#ffd3a7'],accent:0xff926f,light:0xffc597,rim:0xf976bd,planet:0xad6257,seed:96,description:'红巨星、熔融行星与灼亮的工业轨道船坞。'},
 {id:3,name:'翡翠极光',kind:'garden',colors:['#062e32','#28765b','#91eaaa','#e7ffc7'],accent:0x91edc4,light:0xdeffbd,rim:0x86d8ff,planet:0x7cac88,seed:103,description:'绿色极光穿过浮游晶体，古老环形遗构缓慢旋转。'},
 {id:4,name:'紫晶花园',kind:'crystal',colors:['#191332','#55428c','#cd9aff','#f8c1f1'],accent:0xc59eff,light:0xefd9ff,rim:0x90e6ff,planet:0x9983c5,seed:23,description:'紫晶碎屑与蓝紫云带组成发光的深空花园。'},
 {id:5,name:'蔚蓝潮汐',kind:'ocean',colors:['#0c283d','#246784','#8ae5ef','#d7f9f2'],accent:0x8ce8f5,light:0xccecff,rim:0xa6ffdc,planet:0x4b9fbc,seed:135,description:'海洋行星、卷云与银白卫星在蓝色星雾中掠过。'},
 {id:6,name:'虹彩裂隙',kind:'rift',colors:['#211731','#76577d','#e7a8d8','#ffe4a6'],accent:0xf2b5f1,light:0xffd0e6,rim:0xa0ffe7,planet:0xb4a2cf,seed:68,description:'折光传送门与虹彩气体划开星海，光环层层展开。'},
 {id:7,name:'青铜环城',kind:'station',colors:['#102d33','#526d55','#bcd68d','#ffe9b7'],accent:0xd4de9d,light:0xffecc2,rim:0x80efcc,planet:0x899f8c,seed:89,description:'巨型环城与运输轨道，城市灯带在暮光侧闪烁。'},
 {id:8,name:'霜白冰环',kind:'ice',colors:['#15233b','#426a9c','#b2e8ff','#f3dbff'],accent:0xc0eaff,light:0xe3edff,rim:0xd5b0ff,planet:0xa6cbdc,seed:72,description:'冰晶、明亮的寒冷星尘和多层破碎行星环。'},
 {id:9,name:'琥珀沙海',kind:'desert',colors:['#2a1f2a','#8a6351','#efbe79','#ffeeae'],accent:0xf3cb87,light:0xffe0a6,rim:0xff9bd0,planet:0xc09a6f,seed:144,description:'橙黄色尘带覆盖荒漠行星与巨大采矿平台。'},
 {id:10,name:'雷暴云巅',kind:'storm',colors:['#142235','#3d547b','#91b8f2','#e5b7ff'],accent:0xa4c6ff,light:0xc9ddff,rim:0xe5b1ff,planet:0x859cbc,seed:31,description:'高空电离云层、蓝色风暴和频闪的远方雷光。'},
 {id:11,name:'苍白王座',kind:'eclipse',colors:['#15182c','#544162','#b994dd','#f4d5ca'],accent:0xdcbaff,light:0xf2dfff,rim:0xffacb6,planet:0x7a7b94,seed:212,description:'日食边缘仍映出绛紫星云，王座要塞隐藏在光环内。'},
];
export const SECTORS = ['边缘航路','恒星熔炉','繁花星海','翡翠遗域','霜环废墟','棱镜终域'];
const names = [
 '苍穹航道','晶尘海','雷云边境','环城轨道','红巨星峡谷','冰环墓地','镜面星门','永夜旗舰',
 '日冕前哨','黄金潮汐','熔岩长廊','采矿地平线','燃星船坞','赤砂运输线','双日交界','恒星之心',
 '玫瑰序曲','粉雾迷航','紫罗兰海','珊瑚星环','珍珠港湾','暮樱航迹','繁花棱镜','绯红花冠',
 '极光前线','青玉天幕','碧海穿梭','藤蔓遗迹','祖母绿断层','浮岛边界','环城复苏','苍翠方舟',
 '银霜航路','冰川卫星','蓝潮深井','冻结船坞','雷光雪域','琥珀残骸','暴风守夜','寒星灯塔',
 '折光序列','虹桥跃迁','失落王庭','暮日长河','镜界裂隙','超新星前夜','群星会战','终焉曙光',
];
const bosses = [
 '双翼收割者','晶甲女王','雷云巨鳐','轨道仲裁者','赤焰巨鲸','冰棱守望者','折光方舟','无光王冠',
 '日冕猎隼','镀金执政官','熔核吞噬者','沙海采掘舰','熔炉督军','赤砂铁骑','双子耀斑','恒星铸造者',
 '玫瑰剑姬','迷雾歌者','紫晶君主','珊瑚重锤','珍珠堡垒','暮樱猎手','千面织梦者','绯红皇后',
 '极光守卫','青玉刀锋','深蓝鲸歌','遗迹执行者','祖母绿之眼','群岛守护者','环城指挥官','苍翠造物主',
 '银霜收割者','冰川重骑','深井潜航者','冻结母港','雷光龙卷','残骸拼接者','暴风审判官','寒星守望者',
 '棱镜天使','虹桥监护者','王庭巨像','暮日焚星者','镜界双生子','超新星龙骨','万舰统帅','黎明之翼',
];
const biomeSequence = [0,4,10,7,2,8,6,11, 0,9,2,9,2,0,0,2, 1,1,4,1,5,1,6,1, 3,3,5,3,3,7,7,3, 8,8,5,8,10,9,10,8, 6,6,11,0,6,2,4,0];
const formationTypes = ['vee','sweep','column','spiral','pincer','wall','diamond','orbit','flank','stagger','cross','convoy'];
export const ENEMIES = [
 ['尖翼侦察机','轻型',42,2.6,.60,.78,3.0,1,'aim',0],
 ['装甲拦截机','轻型',78,2.1,.77,.9,2.7,2,'fan',1],
 ['巡航突击机','中型',115,1.8,.9,1.1,2.6,3,'fan',2],
 ['重型轰炸机','中型',180,1.35,1.35,1.0,2.8,5,'fan',3],
 ['环形无人机','轻型',52,2.3,.62,.65,2.6,8,'ring',4],
 ['裂空狙击机','中型',125,1.6,.65,1.1,3.8,1,'sniper',5],
 ['布雷艇','中型',160,1.25,1.0,1.0,3.2,3,'mine',6],
 ['神盾护卫机','中型',210,1.35,1.25,1.1,3.2,3,'fan',7],
 ['高速突进机','轻型',62,3.5,.58,.9,3.2,2,'aim',8],
 ['双体炮艇','中型',250,1.05,1.5,1.25,2.8,4,'double',9],
 ['无人机母舰','大型',520,.8,1.85,1.8,4.4,3,'carrier',10],
 ['远征巡洋舰','大型',650,.7,1.75,2.15,2.8,7,'fan',11],
 ['宽翼护卫舰','大型',420,.85,2.0,1.3,3.6,2,'laser',12],
 ['战地支援舰','中型',240,1.05,1.3,1.1,3.4,5,'ring',13],
 ['分裂蜂群机','轻型',85,2.2,.85,.78,3.1,3,'split',14],
 ['幽影战斗机','轻型',100,2.4,.75,.9,2.6,3,'fan',15],
 ['攻城导弹舰','大型',540,.8,1.6,1.8,3.2,4,'missile',16],
 ['帝国驱逐舰','大型',860,.6,2.3,1.65,3.1,2,'laser',17],
].map((e,id)=>({id,name:e[0],tier:e[1],hp:e[2],speed:e[3],rx:e[4],ry:e[5],rate:e[6],count:e[7],fire:e[8],model:e[9],score:100+id*32,color:[0xcbb7ad,0xb7a8be,0xa6bbc7,0xcac4a9,0xc7b4d5,0xb5c6d1][id%6]}));
export const CHAPTERS = names.map((name,id)=>{
 const base=id%8, n=6+Math.floor(base/3), legacy=1.5+Array.from({length:n},(_,w)=>5.5+((w+base)%3)*.5).reduce((a,b)=>a+b,0), duration=legacy*4;
 const waveCount=n*4, spacing=(duration-1.5)/waveCount;
 const formations=Array.from({length:waveCount},(_,w)=>{
  const act=Math.min(3,Math.floor(w/waveCount*4));
  let enemy=(w*3+id+Math.floor(w/4))%Math.min(18,6+Math.floor(id/3)+act*3);
  if(w%7===5)enemy=[9,10,11,12,16,17][(id+act)%6];
  const large=ENEMIES[enemy].tier==='大型';
  return {type:formationTypes[(w+id*3)%formationTypes.length],count:large?(id>15&&w%2===0?2:1):4+(w+id)%4,enemy,delay:spacing,at:1.5+w*spacing,offset:((id*3+w*2)%7)-3,act};
 });
 return {id,name,boss:bosses[id],sector:Math.floor(id/8),biome:biomeSequence[id],sky:parseInt(BIOMES[biomeSequence[id]].colors[0].slice(1),16),accent:BIOMES[biomeSequence[id]].accent,legacyDuration:legacy,duration,formations,bossFamily:id%12,seed:1931+id*7919,objective:['清除编队并摧毁旗舰','突破护卫网，切断舰队补给','穿越危险星域，压制大型舰船','摧毁首领武器部件，打开航道'][id%4]};
});
export const PICKUPS = [
 ['power','主炮强化','P',0xffd687,'主炮等级 +1，最高五级'],['wing','僚机支援','W',0xaaffcb,'追加一架僚机，最多四架'],
 ['repair','装甲修复','+',0x9cffa7,'恢复装甲'],['shield','护盾电池','S',0x8ddeff,'恢复护盾'],
 ['ammo','飞弹补给','M',0xffce91,'增加有限备弹，不重置当前装填'],['bomb','过载电容','B',0xd4b0ff,'增加一枚清屏过载，最多六枚'],
 ['energy','终极能量','E',0xffed9e,'增加 22% 终极武器能量'],['rapid','急速射击','R',0xffa89a,'12 秒射速提升'],
 ['magnet','引力回收','G',0x9cffe3,'18 秒全域补给吸引'],['overdrive','火力超载','D',0xff9dcc,'10 秒伤害提升'],
 ['credit','远征晶片','C',0xffe4a1,'得分和工坊晶片奖励'],['freeze','时滞力场','T',0xb3ccff,'敌军与弹幕减速 6 秒'],
 ['pierce','穿甲模组','I',0xd8bcff,'16 秒贯穿 +2'],['barrier','相位屏障','H',0xd0ffee,'短暂无敌并小幅恢复护盾'],
].map((p,id)=>({index:id,id:p[0],name:p[1],glyph:p[2],color:p[3],description:p[4]}));
export const UPGRADES = [
 ['damage','高能弹芯','主炮伤害 +18%',0xffc98b],['rate','超导扳机','射击间隔 -12%',0x9debff],['missile','裂舰战斗部','飞弹伤害 +28%',0xffa6a0],
 ['reload','智能装填','飞弹装填时间 -20%',0xc5c2ff],['shield','偏转护盾','护盾上限 +25，并回满',0x94e1ff],['armor','纳米装甲','装甲上限 +25，并修复 35',0xacf0ae],
 ['speed','矢量引擎','飞行速度 +10% / 闪跃更频繁',0xffdfa2],['wing','伴飞协议','追加僚机 / 僚机火力 +12%',0xabffc9],['bomb','紧急电容','获得一枚清屏过载',0xdbadff],
 ['energy','星核采集器','终极能量获取 +30%',0xffe78c],['magnet','引力拾取器','永久增大拾取半径',0x9effe7],['pierce','磁约束导轨','主武器额外贯穿一名敌人',0xccb8ff],
 ['crit','弱点解析','暴击概率 +12%',0xffb4d3],['reserve','补给扩容','弹仓 +2，备弹 +12',0xffdbaa],['regen','再生系统','每秒恢复少量装甲',0xa9efbf],
 ['salvage','战场打捞','掉落更密集，立刻获得晶片',0xffe5a7],['barrier','应急相位','恢复护盾，受伤后保护更久',0xb1eaf6],['overclock','能源超频','终极能量 +35%，主炮伤害 +8%',0xf5b2ff],
].map((u,id)=>({index:id,id:u[0],name:u[1],description:u[2],color:u[3]}));
export const WORKSHOP = [
 {id:'armor',name:'机体装甲',description:'每级装甲上限 +8%',base:180,max:5},
 {id:'shield',name:'护盾发生器',description:'每级护盾上限 +10',base:160,max:5},
 {id:'damage',name:'主炮校准',description:'每级主炮伤害 +5%',base:220,max:5},
 {id:'reserve',name:'弹药舱扩展',description:'每级出发备弹 +4',base:140,max:5},
 {id:'energy',name:'能量回收',description:'每级能量获取 +8%',base:180,max:5},
 {id:'reload',name:'供弹机构',description:'每级装填时间 -5%',base:200,max:5},
];
export const MODES = [{id:'campaign',name:'航路战役',tag:'CAMPAIGN',description:'完整四阶段航路 / 局内改装 / 最终首领'},{id:'boss',name:'首领挑战',tag:'DUEL',description:'直接面对本章旗舰 / 强化起飞'},{id:'gauntlet',name:'首领四连战',tag:'BOSS RUSH',description:'连续四艘旗舰 / 战间修复和补给'},{id:'endless',name:'无尽远征',tag:'ENDLESS',description:'循环前进 / 星域更替 / 压力逐步提升'}];
export const DIFFICULTIES = [{id:'story',name:'观光飞行',enemy:.75,damage:.55,score:.7},{id:'normal',name:'标准战斗',enemy:1,damage:1,score:1},{id:'ace',name:'王牌试炼',enemy:1.35,damage:1.3,score:1.5}];

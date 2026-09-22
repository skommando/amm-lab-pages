const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const integer=(n,a,b,d=a)=>Number.isFinite(n)?clamp(Math.floor(n),a,b):d;
export const REGIONS=[
  {name:'雨夜天台',tag:'ROOFTOP',color:0x66f3e0,sky:0x111d36,description:'越过天台裂隙与空调矮栏'},
  {name:'磁悬车站',tag:'TRANSIT',color:0xffc27b,sky:0x20253c,description:'在列车、低门与检修通道间穿行'},
  {name:'熔光铸厂',tag:'FOUNDRY',color:0xff7882,sky:0x29172e,description:'跳过热管，滑过旋转扫描架'},
  {name:'云端花园',tag:'SKYGARDEN',color:0xbbacf9,sky:0x243944,description:'浮桥、风门与移动巡游机关'}
];
export const AVATARS=[{name:'青鸟信使',color:0x63eed6,cost:0},{name:'日落邮差',color:0xffaf68,cost:100},{name:'樱花巡游',color:0xff83b4,cost:250},{name:'星河漫步',color:0xbba0ff,cost:500}];
const titles=['初次投递','屋脊节拍','低空通行','线路切换','连跳信号','追光终点'];
function course(id,offset=0,lengthOverride=0){
  const region=Math.floor(id/6)%4,variant=id%6,length=lengthOverride||210+variant*35+region*20;
  const obstacles=[],coins=[]; const spacing=17-(variant>2?2:0); let k=0;
  for(let d=24;d<length-12;d+=spacing){
    const lane=((k*2+id)%3)-1; let type=['hurdle','block','arch','gap'][(k+variant+region)%4];
    if(region===1&&k%4===2)type='train'; if(region===2&&k%4===1)type='scanner'; if(region===3&&k%4===0)type='sweeper';
    if(variant===0&&k<3)type=['hurdle','block','arch'][k];
    obstacles.push({distance:offset+d,lane,type,phase:k*.9});
    if(variant>=3&&k%3===0)obstacles.push({distance:offset+d,lane:lane===1?-1:lane+1,type:'block',phase:0});
    if(variant===5&&k%5===2){obstacles.push({distance:offset+d,lane:lane===-1?1:-1,type,phase:0});}
    const safe=lane===1?-1:lane+1;
    for(let j=0;j<3;j++)coins.push({distance:offset+d-7+j*2.5,lane:safe,height:j===1&&k%3===0?1.6:.8});
    k++;
  }
  return {id,region,name:titles[variant],length,speed:11+region*.7+variant*.45,obstacles,coins,coinGoal:8+variant*3};
}
export const CHALLENGES=Array.from({length:24},(_,id)=>course(id));
export function createRun({challenge=0,endless=false,avatar=0}={}){
  const c=typeof challenge==='number'?CHALLENGES[integer(challenge,0,23)]:challenge;
  return {challenge:c,endless,avatar:integer(avatar,0,3),region:c.region||0,status:'running',distance:0,lane:0,x:0,y:0,vy:0,slide:0,health:3,coins:0,score:0,time:0,invincible:0,chase:11,events:[],obstacles:(c.obstacles||[]).map((o,i)=>({...o,id:i,hit:false,passed:false})),tokens:(c.coins||[]).map((o,i)=>({...o,id:i,collected:false})),nextObstacleId:(c.obstacles||[]).length,nextTokenId:(c.coins||[]).length,generatedUntil:c.length,segment:1,stars:0};
}
export function stepRun(s,dt,input={}){
  if(s.status!=='running')return; dt=clamp(dt,0,.05); s.events=[]; s.time+=dt;
  if(input.left)s.lane=clamp(s.lane-1,-1,1); if(input.right)s.lane=clamp(s.lane+1,-1,1);
  if(input.jump&&s.y<=.001&&s.slide<=0){s.vy=8.7;s.events.push('jump');}
  if(input.slide&&s.y<=.25){s.slide=.78;s.events.push('slide');}
  s.slide=Math.max(0,s.slide-dt); s.x+=(s.lane*2.2-s.x)*Math.min(1,dt*14);
  s.vy-=20*dt;s.y+=s.vy*dt;if(s.y<0){s.y=0;s.vy=0;}
  s.invincible=Math.max(0,s.invincible-dt);s.chase=Math.min(12,s.chase+dt*.12);
  const prev=s.distance,speed=s.challenge.speed+(s.endless?Math.min(7,s.distance/450):0); s.distance+=speed*dt;
  for(const o of s.obstacles){
    if(o.hit||o.passed||o.distance<prev-4)continue;
    const front=o.type==='train'||o.type==='gap'?1.65:1.1,back=o.type==='train'?3.65:o.type==='gap'?1.65:1.1;
    if(o.distance<s.distance-back){o.passed=true;continue;}
    if(o.distance>s.distance+front||o.distance<prev-back)continue;
    const x=o.type==='sweeper'?Math.sin(s.time*1.5+o.phase)*2.2:o.lane*2.2;
    if(Math.abs(s.x-x)> .83)continue;
    const avoid=(o.type==='hurdle'&&s.y>1.0)||(o.type==='gap'&&s.y>.65)||((o.type==='arch'||o.type==='scanner')&&s.slide>0);
    if(avoid||s.invincible>0)continue;
    o.hit=true;s.health--;s.chase-=3.2;s.invincible=1.25;s.events.push('hit');
    if(s.health<=0){s.status='lost';s.events.push('lost');break;}
  }
  for(const c of s.tokens){if(!c.collected&&Math.abs(c.distance-s.distance)<1.05&&Math.abs(s.x-c.lane*2.2)<.85&&Math.abs(s.y+.9-(c.height||.8))<1.3){c.collected=true;s.coins++;s.events.push('coin');}}
  s.score=Math.floor(s.distance)+s.coins*10;
  if(!s.endless&&s.distance>=s.challenge.length&&s.status==='running'){s.status='won';s.stars=1+(s.health===3?1:0)+(s.coins>=(s.challenge.coinGoal||0)?1:0);s.events.push('won');}
  if(s.endless&&s.generatedUntil-s.distance<100){
    const c=course((s.segment+ s.region*6)%24,s.generatedUntil,240);
    s.obstacles.push(...c.obstacles.map(o=>({...o,id:s.nextObstacleId++,hit:false,passed:false})));s.tokens.push(...c.coins.map(o=>({...o,id:s.nextTokenId++,collected:false})));s.generatedUntil+=240;s.segment++;
  }
  if(s.endless&&s.obstacles.length>200){s.obstacles=s.obstacles.filter(o=>o.distance>s.distance-20);s.tokens=s.tokens.filter(c=>c.distance>s.distance-20);}
}
export function validateSave(v){v=v&&typeof v==='object'?v:{};const owned=[0,...(Array.isArray(v.owned)?v.owned.filter(n=>Number.isInteger(n)&&n>0&&n<4):[])].filter((n,i,a)=>a.indexOf(n)===i);return {version:1,coins:integer(v.coins,0,999999),unlocked:integer(v.unlocked,1,24,1),avatar:owned.includes(v.avatar)?v.avatar:0,owned,stars:Array.from({length:24},(_,i)=>integer(v.stars?.[i],0,3)),best:integer(v.best,0,9999999)};}

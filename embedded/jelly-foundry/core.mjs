const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const int=(n,a,b,d=a)=>Number.isFinite(n)?clamp(Math.floor(n),a,b):d;
export const TIERS=[
  ['薄荷豆',.28,0x85e7bd],['柠檬团',.36,0xf9db6d],['莓莓冻',.45,0xf799bc],['蓝莓啵',.55,0x899dee],['蜜橙球',.65,0xffb272],['蜜瓜泡',.76,0x9bdc94],['葡萄云',.87,0xc3a1ed],['桃子星',.98,0xf3a5a0],['海盐月',1.09,0x8fd9e5],['焦糖日',1.2,0xd99c62],['绵绵王',1.31,0xefc6e9],['极光冠',1.43,0xd7e9ed]
].map(([name,radius,color],id)=>({id,name,radius,color,score:2**(id+2)}));
export const MODES=[{id:'classic',name:'悠闲工坊',description:'自由合成，挑战十二级极光冠。越线持续两秒即结束。'},{id:'timed',name:'90 秒快线',description:'有限时间内取得 500 分，震动机器寻找连锁。'},{id:'missions',name:'订单实验室',description:'30 份合成订单，逐步认识隔板、活塞与高级果冻。'}];
const missionNames=['双子相遇','三色试产','果冻小队','甜度测量','连锁试验','薄荷堆栈','宽口订单','澄清配方','果香接力','圆满批次'];
export const MISSIONS=Array.from({length:30},(_,id)=>{const group=Math.floor(id/10),n=id%10;return {id,name:missionNames[n],container:group,goal:n%3===0?'level':n%3===1?'merges':'score',target:n%3===0?Math.min(11,2+group*3+Math.floor(n/3)):n%3===1?3+group*2+Math.floor(n/3):40+group*100+n*12,drops:18+group*4+n*2,starter:group?Math.min(8,group*3+Math.floor(n/4)):0};});
export function createFoundry({mode='classic',mission=0}={}){
  if(!MODES.some(m=>m.id===mode))mode='classic';const task=MISSIONS[int(mission,0,29)];
  const s={mode,mission:task,status:'running',balls:[],nextId:1,score:0,merges:0,maxLevel:0,width:mode==='missions'&&task.container===1?3.5:3.8,height:8.2,floor:.3,time:mode==='timed'?90:0,elapsed:0,cooldown:0,shake:0,shakeTimer:0,overflow:0,aim:0,next:0,after:1,drops:0,seed:task.id+173,events:[],pegs:[],swaps:3};
  if(mode==='missions'&&task.container===1)s.pegs=[{x:0,y:1.55,radius:.45},{x:-2,y:2.8,radius:.22},{x:2,y:2.8,radius:.22}];
  if(mode==='missions'&&task.goal==='level')spawnBall(s,0,2.1+TIERS[task.target-1].radius,task.target-1);
  else if(mode==='missions'&&task.starter){spawnBall(s,-1.5,1+TIERS[task.starter].radius,task.starter);spawnBall(s,1.5,1+TIERS[task.starter].radius,task.starter);}
  s.next=mode==='missions'&&task.goal==='level'?task.target-1:nextLevel(s);s.after=nextLevel(s);return s;
}
function nextLevel(s){s.seed=(s.seed*1664525+1013904223)>>>0;const max=s.mode==='missions'?Math.min(4,1+Math.floor(s.mission.id/8)):3;return Math.floor(s.seed/4294967296*(max+1));}
export function spawnBall(s,x,y,level){level=int(level,0,11);const radius=TIERS[level].radius;const b={id:s.nextId++,x:clamp(x,-s.width+radius,s.width-radius),y,level,radius,vx:0,vy:0,age:0,mergeLock:0};s.balls.push(b);s.maxLevel=Math.max(s.maxLevel,level);return b;}
export function dropBall(s,x){if(s.status!=='running'||s.cooldown>0||(s.mode==='missions'&&s.drops>=s.mission.drops))return false;spawnBall(s,clamp(x,-s.width+.3,s.width-.3),s.height-.3,s.next);s.next=s.after;s.after=nextLevel(s);s.cooldown=.45;s.drops++;s.events.push('drop');return true;}
export function shakeFoundry(s){if(s.status!=='running'||s.shake>0)return false;s.shake=12;s.shakeTimer=1.0;s.balls.forEach((b,i)=>{b.vx+=(i%2?1:-1)*2;b.vy+=2.1;});return true;}
export function swapNext(s){if(s.status!=='running'||s.swaps<=0)return false;[s.next,s.after]=[s.after,s.next];s.swaps--;return true;}
function contact(a,b){const dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy),sum=a.radius+b.radius;if(d>=sum)return false;const nx=d>.00001?dx/d:1,ny=d>.00001?dy/d:0,ma=a.radius*a.radius,mb=b.radius*b.radius,invA=1/ma,invB=1/mb,overlap=sum-d;
  a.x-=nx*overlap*invA/(invA+invB);a.y-=ny*overlap*invA/(invA+invB);b.x+=nx*overlap*invB/(invA+invB);b.y+=ny*overlap*invB/(invA+invB);
  const speed=(b.vx-a.vx)*nx+(b.vy-a.vy)*ny;if(speed<0){const impulse=-(1.18)*speed/(invA+invB);a.vx-=impulse*nx*invA;a.vy-=impulse*ny*invA;b.vx+=impulse*nx*invB;b.vy+=impulse*ny*invB;}return true;
}
export function missionProgress(s){const t=s.mission;return t.goal==='level'?s.maxLevel:t.goal==='merges'?s.merges:s.score;}
export function stepFoundry(s,dt){
  if(s.status!=='running')return;dt=clamp(dt,0,.05);s.events=[];s.elapsed+=dt;s.cooldown=Math.max(0,s.cooldown-dt);s.shake=Math.max(0,s.shake-dt);s.shakeTimer=Math.max(0,s.shakeTimer-dt);
  if(s.mode==='timed')s.time=Math.max(0,s.time-dt);
  s.floor=s.mode==='missions'&&s.mission.container===2?.3+(1+Math.sin(s.elapsed*.65))*.32:.3;
  for(let step=0;step<4;step++){
    const h=dt/4;
    for(const b of s.balls){b.age+=h;b.mergeLock=Math.max(0,b.mergeLock-h);b.vy-=11.5*h;if(s.shakeTimer>0)b.vx+=Math.sin(s.elapsed*24)*14*h;b.x+=b.vx*h;b.y+=b.vy*h;b.vx*=Math.exp(-.7*h);
      if(b.x-b.radius<-s.width){b.x=-s.width+b.radius;b.vx=Math.abs(b.vx)*.28;}if(b.x+b.radius>s.width){b.x=s.width-b.radius;b.vx=-Math.abs(b.vx)*.28;}
      if(b.y-b.radius<s.floor){b.y=s.floor+b.radius;b.vy=Math.abs(b.vy)<.7?0:Math.abs(b.vy)*.2;b.vx*=.96;}
      for(const p of s.pegs){const dx=b.x-p.x,dy=b.y-p.y,d=Math.hypot(dx,dy),sum=b.radius+p.radius;if(d<sum){const nx=d?dx/d:1,ny=d?dy/d:0;b.x=p.x+nx*sum;b.y=p.y+ny*sum;const v=b.vx*nx+b.vy*ny;if(v<0){b.vx-=v*nx*1.2;b.vy-=v*ny*1.2;}}}
    }
    let merged=false;
    for(let i=0;i<s.balls.length;i++){if(merged)break;for(let j=i+1;j<s.balls.length;j++){const a=s.balls[i],b=s.balls[j];if(Math.hypot(a.x-b.x,a.y-b.y)>a.radius+b.radius+.005)continue;
      if(a.level===b.level&&a.level<11&&a.mergeLock===0&&b.mergeLock===0){const level=a.level+1,x=(a.x+b.x)/2,y=(a.y+b.y)/2,vx=(a.vx+b.vx)/2,vy=(a.vy+b.vy)/2;s.balls.splice(j,1);s.balls.splice(i,1);const n=spawnBall(s,x,y,level);n.vx=vx;n.vy=vy;n.mergeLock=.12;n.age=1;s.score+=TIERS[level].score;s.merges++;s.events.push({type:'merge',x,y,level});merged=true;break;}else contact(a,b);
    }}
  }
  const above=s.balls.some(b=>b.age>1.1&&b.y+b.radius>s.height&&Math.abs(b.vy)<1.7);s.overflow=above?s.overflow+dt:Math.max(0,s.overflow-dt*2);
  if(s.overflow>=2)s.status='lost';
  if(s.mode==='missions'&&missionProgress(s)>=s.mission.target)s.status='won';
  else if(s.mode==='missions'&&s.drops>=s.mission.drops&&s.balls.every(b=>b.age>2&&Math.abs(b.vy)<.5))s.status='lost';
  if(s.mode==='timed'&&s.time<=0)s.status=s.score>=500?'won':'lost';
}
export function validateSave(v){v=v&&typeof v==='object'?v:{};return {version:1,unlocked:int(v.unlocked,1,30,1),medals:Array.from({length:30},(_,i)=>int(v.medals?.[i],0,3)),best:int(v.best,0,99999999),timedBest:int(v.timedBest,0,99999999),maxLevel:int(v.maxLevel,0,11)};}

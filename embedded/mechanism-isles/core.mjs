const int=(n,a,b,d=a)=>Number.isFinite(n)?Math.max(a,Math.min(b,Math.floor(n))):d;
export const ISLANDS=[{name:'苔庭起点',color:0x9dc79b,mechanic:'木箱与压板'},{name:'琥珀光庭',color:0xe2bd76,mechanic:'反射镜与光门'},{name:'潮汐石湾',color:0x7bc8ce,mechanic:'水闸与浮桥'},{name:'齿轮遗迹',color:0xc3a887,mechanic:'双压板与折射光路'},{name:'雨林星井',color:0x96b9b6,mechanic:'光路与潮位协作'},{name:'云上观测台',color:0xb2a4d7,mechanic:'全部机关的合奏'}];
const dirs=[[0,-1],[1,0],[0,1],[-1,0]];
const xy=(x,y)=>({x,y});const same=(a,b)=>a.x===b.x&&a.y===b.y;
function transform(p,turn){let{x,y}=p;for(let i=0;i<turn;i++)[x,y]=[8-y,x];return {...p,x,y};}
function makeLevel(id){const island=Math.floor(id/8),v=id%8,turn=v%4;const tiles=Array.from({length:9},()=>Array(9).fill('#'));
  for(let y=1;y<=7;y++)for(let x=1;x<=7;x++)if(x!==4)tiles[y][x]='.';tiles[4][4]='g';
  const crates=[],plates=[],mirrors=[],valves=[],collectibles=[xy(1,1),xy(7,7)],hasCrate=[0,3,5].includes(island),hasLight=[1,3,4,5].includes(island),hasWater=[2,4,5].includes(island);
  if(hasCrate){const rows=v>=4?[2,3]:[2];for(const [i,row]of rows.entries()){crates.push(xy(v%2?2:2,row));plates.push(xy(3,row));}if(v%2===1){crates[0]=xy(2,1);plates[0]=xy(3,1);collectibles[0]=xy(1,3);}}
  let emitter=null,receiver=null;const beamRow=v>=4?7:6;
  if(hasLight){emitter={x:0,y:beamRow,direction:1};mirrors.push({x:3,y:beamRow,rotation:0});if(v>=4){mirrors.push({x:3,y:beamRow-1,rotation:v%2});receiver=xy(4,beamRow-1);}else receiver=xy(3,beamRow-2);}
  let water=1,waterType='w';if(hasWater){waterType=v%2?'b':'w';water=waterType==='w'?1:0;for(let y=1;y<=7;y++)tiles[y][6]=waterType;valves.push(xy(5,v>=4?5:3));}
  const goal=xy(7,[1,2,6,7,2,1,7,6][v]);const start=xy(1,4);
  // 切掉不同角落形成真实岸线；各机关所在路径均保留。
  if(v===2||v===6)tiles[3][7]='#';if(v===3||v===7)tiles[5][1]='#';
  const out=Array.from({length:9},()=>Array(9).fill('#'));for(let y=0;y<9;y++)for(let x=0;x<9;x++){const p=transform(xy(x,y),turn);out[p.y][p.x]=tiles[y][x];}
  const tr=p=>transform(p,turn);if(emitter){emitter=tr(emitter);emitter.direction=(emitter.direction+turn)%4;receiver=tr(receiver);}
  return {id,island,name:['初见机关','转角来信','缺岸绕行','远端回路','双重协作','倒置光庭','潮岸长途','归航试炼'][v],size:9,tiles:out,player:tr(start),goal:tr(goal),crates:crates.map(tr),plates:plates.map(tr),mirrors:mirrors.map(m=>({...tr(m),rotation:m.rotation^(turn%2)})),valves:valves.map(tr),emitter,receiver,water,collectibles:collectibles.map(tr),requires:{crate:hasCrate,light:hasLight},hint:hasWater?(waterType==='w'?'转动水阀排空水道，露出石路。':'转动水阀升起水位，浮桥才能接通。'):hasLight?'靠近镜座，转动镜面，让光到达水晶接收器。':'站在木箱后面，推到带圆环的压板上。'};
}
export const LEVELS=Array.from({length:48},(_,id)=>makeLevel(id));
export function createPuzzle(level=0){const l=typeof level==='number'?LEVELS[int(level,0,47)]:level;return {level:l,player:{...l.player},crates:l.crates.map(p=>({...p})),mirrors:l.mirrors.map(p=>({...p})),water:l.water,collected:0,moves:0,status:'running',history:[],events:[]};}
export function traceLight(s){const l=s.level;if(!l.emitter)return {lit:false,segments:[]};let{x,y,direction:d}=l.emitter;const segments=[],seen=new Set();for(let count=0;count<80;count++){const [dx,dy]=dirs[d],nx=x+dx,ny=y+dy;segments.push({from:xy(x,y),to:xy(nx,ny)});x=nx;y=ny;if(x<0||y<0||x>=9||y>=9)break;if(l.receiver&&same(l.receiver,xy(x,y)))return {lit:true,segments};if(s.crates.some(c=>same(c,xy(x,y))))break;const m=s.mirrors.find(m=>m.x===x&&m.y===y);if(m)d=m.rotation===1?[1,0,3,2][d]:[3,2,1,0][d];else if(l.tiles[y][x]==='#')break;const key=`${x},${y},${d}`;if(seen.has(key))break;seen.add(key);}return {lit:false,segments};}
export function gateOpen(s){return (!s.level.requires.crate||s.level.plates.every(p=>s.crates.some(c=>same(c,p))))&&(!s.level.requires.light||traceLight(s).lit);}
export function isDeadlocked(s){const wall=(x,y)=>!s.level.tiles[y]?.[x]||s.level.tiles[y][x]==='#';return s.crates.some(c=>!s.level.plates.some(p=>same(p,c))&&(wall(c.x-1,c.y)||wall(c.x+1,c.y))&&(wall(c.x,c.y-1)||wall(c.x,c.y+1)));}
function traversable(s,p){const t=s.level.tiles[p.y]?.[p.x];if(!t||t==='#')return false;if(t==='g'&&!gateOpen(s))return false;if(t==='w'&&s.water===1)return false;if(t==='b'&&s.water===0)return false;return true;}
function snapshot(s){return {player:{...s.player},crates:s.crates.map(p=>({...p})),mirrors:s.mirrors.map(p=>({...p})),water:s.water,collected:s.collected,moves:s.moves,status:s.status};}
function apply(s,action,history){if(s.status!=='running')return false;const old=history?snapshot(s):null;let done=false;
  if(Number.isInteger(action)&&action>=0&&action<4){const [dx,dy]=dirs[action],p=xy(s.player.x+dx,s.player.y+dy);if(!traversable(s,p))return false;const crate=s.crates.find(c=>same(c,p));if(crate){const beyond=xy(p.x+dx,p.y+dy);if(!traversable(s,beyond)||s.crates.some(c=>same(c,beyond))||s.mirrors.some(m=>same(m,beyond)))return false;Object.assign(crate,beyond);}if(s.mirrors.some(m=>same(m,p)))return false;s.player=p;done=true;
  }else if(action==='interact'){
    const near=p=>Math.abs(p.x-s.player.x)+Math.abs(p.y-s.player.y)<=1;const m=s.mirrors.find(near);if(m){m.rotation=1-m.rotation;done=true;}else if(s.level.valves.some(near)){s.water=1-s.water;done=true;}
  }
  if(!done)return false;if(history){s.history.push(old);if(s.history.length>200)s.history.shift();}s.moves++;s.level.collectibles.forEach((p,i)=>{if(same(p,s.player))s.collected|=1<<i;});if(same(s.player,s.level.goal))s.status='won';else if(isDeadlocked(s))s.status='lost';return true;
}
export function actPuzzle(s,action){return apply(s,action,true);}
export function undoPuzzle(s){const old=s.history.pop();if(!old)return false;Object.assign(s,old);s.status='running';return true;}
const key=s=>`${s.player.x+s.player.y*9}|${s.crates.map(c=>c.x+c.y*9).sort((a,b)=>a-b).join(',')}|${s.mirrors.map(m=>m.rotation).join('')}|${s.water}`;
export function solveLevel(level,maxNodes=100000,current=null){const start=current?{...snapshot(current),level:current.level,history:[]}:createPuzzle(level);start.status='running';const nodes=[{s:start,parent:-1,action:null}],seen=new Set([key(start)]);let head=0;
  while(head<nodes.length&&nodes.length<maxNodes){const node=nodes[head];if(node.s.status==='won'){const path=[];let at=head;while(nodes[at].parent!==-1){path.push(nodes[at].action);at=nodes[at].parent;}return path.reverse();}
    for(const action of [0,1,2,3,'interact']){const next={...snapshot(node.s),level:node.s.level,history:[]};if(!apply(next,action,false))continue;const k=key(next);if(seen.has(k))continue;seen.add(k);nodes.push({s:next,parent:head,action});}head++;
  }return null;
}
export function validateSave(v){v=v&&typeof v==='object'?v:{};return {version:1,unlocked:int(v.unlocked,1,48,1),stars:Array.from({length:48},(_,i)=>int(v.stars?.[i],0,3)),bestMoves:Array.from({length:48},(_,i)=>int(v.bestMoves?.[i],0,9999))};}

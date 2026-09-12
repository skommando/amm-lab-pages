export const clamp=(value,min,max)=>Math.min(max,Math.max(min,value));
export function seededRandom(seed=1){let state=Number(seed)>>>0;return ()=>{state+=0x6d2b79f5;let t=state;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296;};}
export function createInputState(){
  const down=new Set(),edges=new Set();
  return {press(code){if(!down.has(code))edges.add(code);down.add(code);},release(code){down.delete(code);},held:code=>down.has(code),pressed:code=>edges.has(code),
    axis(axis){return axis==='x'?Number(down.has('KeyD')||down.has('ArrowRight'))-Number(down.has('KeyA')||down.has('ArrowLeft')):Number(down.has('KeyS')||down.has('ArrowDown'))-Number(down.has('KeyW')||down.has('ArrowUp'));},
    endFrame(){edges.clear();},clear(){down.clear();edges.clear();}};
}
export function normalizeProgress(raw,total){
  const source=raw&&typeof raw==='object'?raw:{};
  const unlocked=Number.isFinite(source.unlocked)?clamp(Math.floor(source.unlocked),1,total):1;
  const scores={};for(const [key,value] of Object.entries(source.scores&&typeof source.scores==='object'?source.scores:{})){
    const level=Number(key);if(Number.isInteger(level)&&level>=0&&level<total&&Number.isFinite(value)&&value>=0)scores[level]=Math.floor(value);
  }return {unlocked,scores};
}
export function completeLevel(raw,level,score,total){const progress=normalizeProgress(raw,total);if(!Number.isInteger(level)||level<0||level>=total)return progress;progress.unlocked=Math.min(total,Math.max(progress.unlocked,level+2));progress.scores[level]=Math.max(progress.scores[level]||0,Number.isFinite(score)?Math.max(0,Math.floor(score)):0);return progress;}
export function circleOverlap(a,b){return (a.x-b.x)**2+(a.z-b.z)**2<=(a.r+b.r)**2;}
export function aabbOverlap(a,b){return Math.abs(a.x-b.x)<=(a.w+b.w)/2&&Math.abs(a.y-b.y)<=(a.h+b.h)/2&&Math.abs(a.z-b.z)<=(a.d+b.d)/2;}

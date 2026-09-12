/* Procedural hard-surface fleet. Static geometry is merged by material per model. */
import {THREE} from '../arcade-runtime/runtime.mjs';
import {AIRCRAFT,ENEMIES,BIOMES} from './content.mjs';
const modelCache=new Map();
const previewCache=new Map();
let previewRenderer=null;
const metal=(color,roughness=.38,metalness=.68)=>new THREE.MeshStandardMaterial({color,roughness,metalness});
const glowMat=color=>new THREE.MeshBasicMaterial({color:new THREE.Color(color).multiplyScalar(1.6),toneMapped:false});
function add(parent,geometry,material,x=0,y=0,z=0,rot=null){const m=new THREE.Mesh(geometry,material);m.position.set(x,y,z);if(rot)m.rotation.set(...rot);parent.add(m);return m;}
function box(g,x,y,z,w,h,d,m,rot=null){return add(g,new THREE.BoxGeometry(w,h,d),m,x,y,z,rot);}
function ball(g,x,y,z,r,m,sx=1,sy=1,sz=1){const a=add(g,new THREE.SphereGeometry(r,24,16),m,x,y,z);a.scale.set(sx,sy,sz);return a;}
function tube(g,x,y,z,r,l,m,rotate=Math.PI/2,r2=r){return add(g,new THREE.CylinderGeometry(r2,r,l,18,1),m,x,y,z,[rotate,0,0]);}
function ring(g,x,y,z,r,width,m,rot=[Math.PI/2,0,0]){return add(g,new THREE.TorusGeometry(r,width,10,64),m,x,y,z,rot);}
function plate(g,points,height,m,y=0,bevel=.055){
 const shape=new THREE.Shape();points.forEach(([x,z],i)=>i?shape.lineTo(x,-z):shape.moveTo(x,-z));shape.closePath();
 return add(g,new THREE.ExtrudeGeometry(shape,{depth:height,bevelEnabled:bevel>0,bevelSize:bevel,bevelThickness:bevel*.6,bevelSegments:2,steps:1,curveSegments:16}),m,0,y,0,[-Math.PI/2,0,0]);
}
function mirrored(points,side=1){return points.map(([x,z])=>[x*side,z]);}
function makeMaterials(color,hull){return {hull:metal(hull,.34,.6),edge:metal(0x303e51,.45,.74),dark:metal(0x17222e,.6,.36),panel:metal(new THREE.Color(hull).multiplyScalar(.73),.42,.7),light:metal(new THREE.Color(hull).lerp(new THREE.Color(0xffffff),.35),.3,.62),accent:metal(color,.31,.7),glass:new THREE.MeshPhysicalMaterial({color:0x243e54,emissive:color,emissiveIntensity:.14,metalness:.58,roughness:.14,clearcoat:1,clearcoatRoughness:.05}),glow:glowMat(color),white:glowMat(0xdfffff),hot:glowMat(0xffbe84)};}
function engine(g,x,y,z,size,m,enemy=false){
 tube(g,x,y,z,size,.85*size*4,m.edge);tube(g,x,y,z+.4*size*4,size*.86,.12,m.dark);tube(g,x,y,z+.47*size*4,size*.63,.04,m.glow);
 for(let i=0;i<5;i++)ring(g,x,y,z-.3+i*.13,size*1.04,.018,m.panel,[0,0,0]);
 const flame=new THREE.Group();flame.name='engine';flame.userData.dynamic=true;flame.position.set(x,y,z+.59*size*4);
 const f=ball(flame,0,0,size*.9,size*.8,m.glow,.64,.48,2.6);f.name='plume';const core=ball(flame,0,0,0,size*.6,m.white,.5,.38,1.5);core.name='plume-core';g.add(flame);
}
function gun(g,x,y,z,size,m,forward=-1){
 box(g,x,y,z,.25*size,.2*size,.48*size,m.edge);
 tube(g,x,y+.02,z+forward*.4*size,.055*size,.78*size,m.panel);
 tube(g,x,y+.02,z+forward*.78*size,.074*size,.06*size,m.dark);
 box(g,x,y+.115*size,z,.045*size,.015,.2*size,m.glow);
}
function panelDetail(g,x,y,z,w,d,m,angle=0){
 box(g,x,y,z,w,.035,d,m.panel,[0,angle,0]);
 box(g,x,y+.024,z,w*.78,.012,d*.83,m.light,[0,angle,0]);
 box(g,x,y+.034,z+d*.27,w*.68,.01,.024,m.dark,[0,angle,0]);
 for(const side of [-1,1])box(g,x+side*w*.32,y+.043,z-d*.24,.028,.012,.028,m.edge);
}
function mergeStatic(root){
 root.updateMatrixWorld(true);const materialGroups=new Map(),remove=[];
 root.traverse(mesh=>{
  if(!mesh.isMesh)return;let p=mesh,dynamic=false;while(p&&p!==root){if(p.userData.dynamic){dynamic=true;break;}p=p.parent;}if(dynamic)return;
  const key=mesh.material.uuid;let batch=materialGroups.get(key);if(!batch){batch={material:mesh.material,geometries:[]};materialGroups.set(key,batch);}
  let geo=mesh.geometry.index?mesh.geometry.toNonIndexed():mesh.geometry.clone();geo.applyMatrix4(mesh.matrixWorld);batch.geometries.push(geo);remove.push(mesh);
 });
 for(const mesh of remove){mesh.parent.remove(mesh);mesh.geometry.dispose();}
 for(const {material,geometries} of materialGroups.values()){
  const geometry=new THREE.BufferGeometry();let total=0;for(const g of geometries)total+=g.attributes.position.count;
  for(const [name,size] of [['position',3],['normal',3],['uv',2]]){const a=new Float32Array(total*size);let offset=0;for(const g of geometries){const v=g.attributes[name];if(v)a.set(v.array,offset);offset+=g.attributes.position.count*size;}geometry.setAttribute(name,new THREE.BufferAttribute(a,size));}
  const mesh=new THREE.Mesh(geometry,material);mesh.name='merged-hull';root.add(mesh);geometries.forEach(g=>g.dispose());
 }
 return root;
}
function fighterTemplate(index){
 const craft=AIRCRAFT[index],g=new THREE.Group(),m=makeMaterials(craft.color,craft.hull);
 // Nose, wing sweep, span, tail are independently authored for all sixteen aircraft.
 const specs=[
  [2.05,1.65,.62,1.35],[2.35,1.28,1.0,1.30],[1.8,1.92,-.40,1.52],[1.85,2.10,.22,1.45],
  [2.35,1.80,.95,1.10],[2.00,1.82,-.38,1.4],[1.92,1.65,.15,1.45],[2.08,1.82,.62,1.68],
  [2.65,1.36,.95,1.45],[1.85,2.24,-.12,1.65],[1.62,2.00,-.35,1.85],[2.18,1.96,.4,1.42],
  [2.6,1.22,1.0,1.30],[2.20,1.95,.55,1.40],[2.08,1.76,-.35,2.1],[2.25,2.25,.36,1.72]
 ];
 const [nose,span,sweep,tail]=specs[index];
 if(index===7){
  for(const side of [-1,1]){plate(g,[[side*.42,-nose],[side*.7,-nose-.1],[side*1.02,-.6],[side*1.04,tail],[side*.46,tail]],.25,m.hull,.03);ball(g,side*.73,.34,-.82,.29,m.glass,.72,.65,1.85);box(g,side*.72,.38,.12,.28,.10,.8,m.panel);}
  plate(g,[[-1.3,-.25],[-.7,-.7],[.7,-.7],[1.3,-.25],[1.3,.35],[-1.3,.35]],.12,m.panel,.12);
 }else if(index===4){
  plate(g,[[0,-nose],[-.46,-.95],[-span,.75],[-1.1,tail],[-.38,1.12],[0,1.48],[.38,1.12],[1.1,tail],[span,.75],[.46,-.95]],.19,m.hull,.03);
  plate(g,[[0,-nose+.14],[-.2,-.72],[0,1.22],[.2,-.72]],.13,m.panel,.25);
  ball(g,0,.37,-.65,.34,m.glass,.7,.48,1.65);
 }else{
  plate(g,[[0,-nose],[-.28,-nose+.55],[-.43,-.7],[-.49,.6],[-.35,tail],[.35,tail],[.49,.6],[.43,-.7],[.28,-nose+.55]],.28,m.hull,.04);
  plate(g,[[0,-nose+.13],[-.15,-.75],[-.28,.2],[0,.62],[.28,.2],[.15,-.75]],.14,m.light,.3);
  ball(g,0,.54,-.60,.36,m.glass,.74,.54,1.75);
  // Canopy frame ribs and a dark separation line give the silhouette mechanical depth.
  box(g,0,.704,-.2,.47,.025,.045,m.edge);box(g,0,.65,-1.04,.04,.024,.22,m.panel);
 }
 for(const side of [-1,1]){
  if(index!==4){
   let outline=[[.3,-.75],[span,-.38+sweep],[span+.04,.34+sweep],[.84,.70],[.40,1.2]];
   if(index===2||index===10||index===14)outline=[[.35,-1.0],[span,-1.05],[span+.06,.85],[.95,1.22],[.38,.85]];
   if(index===3||index===9)outline=[[.4,-.6],[1.25,-1.0],[span,-.45],[span,.66],[1.15,1.18],[.65,.6]];
   if(index===11)outline=[[.36,-.58],[span,-.9],[span-.12,-.35],[.9,.8],[.45,.4]];
   plate(g,mirrored(outline,side),.095,m.hull,.06);
   plate(g,mirrored([[.62,-.39],[span-.12,.04+sweep],[span-.17,.17+sweep],[.78,.04]],side),.018,m.accent,.175,.015);
   panelDetail(g,side*(span*.65),.21,.42+sweep*.35,.38,.35,m,side*.22);
   gun(g,side*(span-.17),.15,-.18+sweep,.8,m);
   // Rear stabilizers, fin, panel recess and a small navigation lamp.
   plate(g,mirrored([[.3,.83],[span*.69,tail-.10],[span*.66,tail+.17],[.35,tail-.01]],side),.075,m.panel,.16);
   box(g,side*.47,.36,tail-.15,.035,.43,.53,m.hull,[0,0,side*.13]);
   ball(g,side*span,.21,.46+sweep,.048,m.glow);
  }
  const engX=index===7?.74:index===2||index===10?.94:index===9?1.45:index===14?1.10:.64;
  engine(g,side*engX,.03,tail-.32,index===1||index===12?.18:.23,m);
  if([2,9,10,14,15].includes(index))engine(g,side*(engX+.48),.015,tail-.5,.145,m);
  gun(g,side*.5,.25,-.75,index===8?1.5:1,m);
  for(let j=0;j<3;j++)box(g,side*.46,.39,.25+j*.12,.15,.026,.035,m.edge);
 }
 if([3,6,9,11].includes(index)){
  ring(g,0,.33,.77,index===11?.65:.48,.07,m.accent);ring(g,0,.345,.77,index===11?.55:.37,.021,m.glow);
  ball(g,0,.31,.77,.3,m.dark,1,.2,1);ball(g,0,.36,.77,.14,m.glow,1,.5,1);
 }
 if(index===8||index===14){tube(g,0,.2,-1.4,.13,2.2,m.edge);tube(g,0,.2,-2.35,.16,.17,m.accent);tube(g,0,.2,-2.45,.085,.05,m.dark);}
 if(index===10){for(const side of [-1,1])for(let j=0;j<3;j++)panelDetail(g,side*1.22,.28,-.6+j*.52,.67,.42,m);}
 if(index===13){for(const side of [-1,1]){plate(g,mirrored([[.34,.1],[1.8,-1.1],[1.96,-.74],[.85,.55]],side),.10,m.panel,.33);box(g,side*1.55,.48,-.69,.09,.025,.45,m.glow,[0,side*.55,0]);}}
 if(index===15){for(const side of [-1,1])for(let j=0;j<3;j++){const z=-.2+j*.55,w=2.12-j*.18;plate(g,mirrored([[.38,z-.3],[w,z+.25],[w-.25,z+.58],[.58,z+.1]],side),.07,j===1?m.accent:m.hull,.13+j*.05);box(g,side*(w-.23),.33+j*.05,z+.28,.08,.018,.24,m.glow);}}
 // Fuselage identification marks are geometric: crisp at all resolutions, no texture downloads.
 for(let j=0;j<3;j++)box(g,.03,.48,.28+j*.17,.22,.012,.055,m.accent);
 mergeStatic(g);
 const hit=ball(g,0,.79,-.04,.09,m.white,1,.6,1);hit.name='hit-core';hit.userData.dynamic=true;
 const focus=ring(g,0,.72,-.04,.245,.016,m.glow);focus.name='focus-ring';focus.userData.dynamic=true;
 return g;
}
function enemyTemplate(index){
 const def=ENEMIES[index],g=new THREE.Group(),m=makeMaterials([0xff9577,0xf39cce,0xffcf87,0xd4a1ff][index%4],def.color);
 const small=index<4||[5,7,8,14,15].includes(index);
 if(small){
  const mapped=[1,0,4,2,6,8,3,10,12,7,9,14,15,3,11,13,2,10][index];
  const base=fighterTemplate(mapped);
  // Source mesh colors are replaced consistently, retaining glass and luminous mechanical parts.
  const remap=new Map();base.traverse(o=>{if(o.isMesh){if(!remap.has(o.material.uuid)){const old=o.material;let mat;if(old.isMeshBasicMaterial)mat=m.glow;else if(old.isMeshPhysicalMaterial)mat=m.glass;else{mat=old.clone();const c=old.color;mat.color.copy(new THREE.Color(def.color).multiplyScalar(Math.max(.28,Math.min(1.15,(c.r+c.g+c.b)/2))));}remap.set(old.uuid,mat);}o.material=remap.get(o.material.uuid);}});
  base.getObjectByName('hit-core').visible=false;base.getObjectByName('focus-ring').visible=false;base.scale.setScalar(index===3?.77:index===7?.69:.54);base.rotation.y=Math.PI;g.add(base);
  if(index===7){const shield=ring(g,0,.42,0,1.25,.035,m.glow);shield.name='guardian-shield';shield.userData.dynamic=true;}
 }else if(index===4){
  ball(g,0,.1,0,.58,m.panel,1,.55,1);ring(g,0,.15,0,.76,.10,m.hull);ring(g,0,.24,0,.62,.02,m.glow);ball(g,0,.46,0,.22,m.glow);
  for(let j=0;j<4;j++){const a=j*Math.PI/2;box(g,Math.cos(a)*.8,.10,Math.sin(a)*.8,.36,.17,.36,m.edge);}
  mergeStatic(g);
 }else if(index===6||index===13){
  const r=index===13?1.05:.82;plate(g,[[0,-1.2],[-r,-.4],[-r,.55],[0,1.25],[r,.55],[r,-.4]],.32,m.hull);ring(g,0,.38,0,.56,.13,m.panel);ball(g,0,.54,0,.32,m.glow,1,.6,1);
  for(const side of [-1,1]){gun(g,side*r,.22,.6,1.1,m,1);engine(g,side*.55,.0,0,.16,m);}
  mergeStatic(g);
 }else{
  const width=def.rx*.85,length=def.ry*1.2;
  plate(g,[[-width*.32,-length],[-width*.8,-length*.65],[-width,-.3],[-width*.82,length*.7],[-width*.42,length],[width*.42,length],[width*.82,length*.7],[width,-.3],[width*.8,-length*.65],[width*.32,-length]],.38,m.hull);
  plate(g,[[-.4,-length*.7],[-.58,.3],[-.3,length*.78],[.3,length*.78],[.58,.3],[.4,-length*.7]],.28,m.panel,.37);
  ball(g,0,.9,-.15,.42,m.glass,1,.5,1.4);box(g,0,.98,-.15,.7,.045,.075,m.glow);
  for(const side of [-1,1]){
   plate(g,mirrored([[width*.6,-length*.7],[width*1.16,-length*.9],[width*1.2,length*.4],[width*.78,length*.83]],side),.23,m.panel,.07);
   for(let j=0;j<3;j++){panelDetail(g,side*width*.7,.51,-length*.55+j*length*.53,.5,.46,m);gun(g,side*width*.78,.6,-length*.3+j*length*.47,.95,m,1);}
   engine(g,side*width*.63,.08,-length*.62,.28,m);for(let j=0;j<5;j++)box(g,side*width,.34,-length*.4+j*.29,.035,.06,.08,m.glow);
  }
  if(index===10){box(g,0,.65,.6,1.05,.1,1.12,m.dark);for(let j=0;j<4;j++)box(g,0,.72,.20+j*.23,.85,.018,.045,m.glow);}
  if(index===12||index===17){for(const side of [-1,1]){plate(g,mirrored([[.3,-.3],[width*1.2,-.65],[width*1.36,.7],[.8,.84]],side),.21,m.hull,.13);gun(g,side*width*.95,.57,.72,1.8,m,1);}}
  if(index===16){for(const side of [-1,1])for(let j=0;j<4;j++)box(g,side*.9,.75,-.5+j*.4,.42,.2,.24,j%2?m.edge:m.accent);}
  mergeStatic(g);
 }
 return g;
}
function turretPart(root,partIndex,x,z,m){
 const g=new THREE.Group();
 tube(g,0,.35,0,.48,.22,m.edge,0);plate(g,[[-.4,-.35],[-.48,.30],[-.23,.54],[.23,.54],[.48,.3],[.4,-.35]],.3,m.hull,.4);
 for(const side of [-1,1])gun(g,side*.2,.65,.5,1.5,m,1);
 ball(g,0,.88,-.05,.15,m.glow,1,.5,1);mergeStatic(g);g.name='part-'+partIndex;g.userData.dynamic=true;g.position.set(x,0,z);root.add(g);
}
function bossTemplate(family,biome){
 const b=BIOMES[biome],g=new THREE.Group(),m=makeMaterials(b.accent,[0xb5bcc7,0xc4b8cc,0xabbfbe,0xc4b8a2][family%4]);
 const broad=[0,2,7,11].includes(family),long=[3,4,8,9].includes(family);
 if(broad){
  const shape=family===2?[[-.5,-2.0],[-3.8,-1.5],[-4.4,.2],[-3.2,1.2],[-1.2,1.6],[0,2.6],[1.2,1.6],[3.2,1.2],[4.4,.2],[3.8,-1.5],[.5,-2]]:[[-.65,-2.0],[-3.8,-2.2],[-4.35,-.8],[-2.1,.8],[-1,1.3],[0,2.1],[1,1.3],[2.1,.8],[4.35,-.8],[3.8,-2.2],[.65,-2]];
  plate(g,shape,.38,m.hull,.02);
  for(const side of [-1,1]){plate(g,mirrored([[.65,-1.55],[3.75,-1.85],[3.55,-.95],[1.2,.1]],side),.13,m.panel,.47);for(let j=0;j<4;j++)panelDetail(g,side*(1.3+j*.58),.65,-1.0+j*.14,.45,.7,m,side*.3);}
 }else if(long){
  plate(g,[[-.6,-3.0],[-1.65,-2.25],[-1.7,1.1],[-.85,2.4],[0,3.1],[.85,2.4],[1.7,1.1],[1.65,-2.25],[.6,-3]],.7,m.hull,.05);
  for(const side of [-1,1])plate(g,mirrored([[1.0,-2.25],[2.6,-1.75],[3.0,.1],[2.45,1.65],[1.2,2.0]],side),.38,m.panel,.12);
  if(family===4)for(let j=0;j<5;j++)plate(g,[[-1.35,-1.8+j*.65],[-1.5,-1.4+j*.65],[1.5,-1.4+j*.65],[1.35,-1.8+j*.65]],.15,m.panel,.80);
  if(family===9){box(g,0,.80,.2,1.55,.1,3.4,m.dark);for(let j=0;j<9;j++)box(g,0,.88,-1.3+j*.34,1.27,.035,.04,m.glow);}
 }else{
  const r=family===5?2.8:2.4;
  tube(g,0,.2,0,r,.45,m.panel,0);ring(g,0,.56,0,r,.21,m.hull);ring(g,0,.62,0,r-.32,.035,m.glow);
  for(let j=0;j<8;j++){const a=j*Math.PI/4;box(g,Math.cos(a)*(r+.17),.34,Math.sin(a)*(r+.17),.8,.38,.7,m.hull,[0,-a,0]);panelDetail(g,Math.cos(a)*r,.6,Math.sin(a)*r,.45,.43,m,-a);}
 }
 // Command spine, armored bridge and glowing core.
 plate(g,[[-.45,-1.8],[-.78,-.7],[-.65,.85],[0,1.45],[.65,.85],[.78,-.7],[.45,-1.8]],.48,m.panel,.5);
 ball(g,0,1.18,-.65,.66,m.glass,1,.55,1.0);box(g,0,1.53,-.55,.78,.05,.12,m.glow);
 ring(g,0,1.10,.62,.72,.12,m.edge);ball(g,0,1.17,.62,.52,m.glow,1,.5,1);ball(g,0,1.42,.62,.2,m.white,1,.35,1);
 for(const side of [-1,1]){
  for(let j=0;j<3;j++){box(g,side*1.08,.95,-1.15+j*.4,.14,.11,.16,m.accent);gun(g,side*(1.55+j*.5),.67,-1.25+j*.6,1.0,m,1);}
  // Engines face aft for enemy warships.
  const eng=new THREE.Group();engine(eng,0,0,0,.4,m);eng.position.set(side*1.8,.15,-1.9);eng.rotation.y=Math.PI;g.add(eng);
  if(family===0||family===8)gun(g,side*3,.35,.7,2.5,m,1);
  if(family===1||family===6||family===11){for(let j=0;j<3;j++){plate(g,mirrored([[.8,-1.2+j*.9],[3.7+j*.12,-2+j*.9],[4.25,-1.5+j*.9],[2.5,-.1+j*.55],[1,.2+j*.5]],side),.18,j===1?m.accent:m.hull,.20+j*.15);box(g,side*(3.4+j*.16),.5+j*.15,-1.5+j*.85,.1,.08,.5,m.glow);}}
  if(family===7){for(let j=0;j<4;j++){const x=side*(.8+j*.78);plate(g,[[x-.3,-1.2],[x-.27,1.2-j*.34],[x,2.3-j*.3],[x+.27,1.2-j*.34],[x+.3,-1.2]],.27,m.hull,.27);}}
  if(family===10){for(let j=0;j<3;j++){box(g,side*2.6,.58,-1.7+j*1.5,.9,.65,.96,m.hull);panelDetail(g,side*2.6,.93,-1.7+j*1.5,.7,.8,m);}}
 }
 if(family===6){ring(g,0,.96,0,1.75,.11,m.accent);ring(g,0,1.02,0,1.55,.025,m.glow);}
 mergeStatic(g);
 turretPart(g,0,-2.55,.3,m);turretPart(g,1,2.55,.3,m);
 if(family%3===1){turretPart(g,2,-1.7,-1.4,m);turretPart(g,3,1.7,-1.4,m);}
 return g;
}
function template(type,index,biome=0){const key=`${type}-${index}-${type==='boss'?biome:''}`;if(!modelCache.has(key))modelCache.set(key,type==='player'?fighterTemplate(index):type==='enemy'?enemyTemplate(index):bossTemplate(index,biome));return modelCache.get(key);}
export function createModel(type,index,biome=0){
 const g=template(type,index,biome).clone(true);g.userData.type=type;g.userData.engineNodes=[];g.userData.partNodes=[];
 g.traverse(o=>{if(o.name==='engine')g.userData.engineNodes.push(o);if(o.name.startsWith('part-'))g.userData.partNodes.push(o);});
 g.userData.hit=g.getObjectByName('hit-core');g.userData.focus=g.getObjectByName('focus-ring');return g;
}
export function animateModel(g,time,power=1,parts=null){
 g.userData.engineNodes?.forEach((engine,i)=>{engine.scale.z=.9+Math.sin(time*23+i*4)*.12+power*.18;});
 if(parts)g.userData.partNodes?.forEach(node=>{const part=parts[Number(node.name.slice(5))];node.visible=!!part&&part.hp>0;});
 const guard=g.getObjectByName('guardian-shield');if(guard){guard.rotation.z=time*.5;guard.scale.setScalar(1+Math.sin(time*3)*.04);}
}
export function thumbnail(type,index,biome=0){
 const key=`${type}-${index}-${biome}`;if(previewCache.has(key))return previewCache.get(key);
 try{
  if(!previewRenderer){previewRenderer=new THREE.WebGLRenderer({alpha:true,antialias:true,preserveDrawingBuffer:true,powerPreference:'low-power'});previewRenderer.setSize(640,430);previewRenderer.setPixelRatio(1);previewRenderer.setClearColor(0x000000,0);previewRenderer.outputColorSpace=THREE.SRGBColorSpace;previewRenderer.toneMapping=THREE.ACESFilmicToneMapping;previewRenderer.toneMappingExposure=1.35;}
  const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(32,640/430,.1,100);
  scene.add(new THREE.HemisphereLight(0xe3f1ff,0x738091,2));const sun=new THREE.DirectionalLight(0xffe3bf,3.2);sun.position.set(-4,8,5);scene.add(sun);const rim=new THREE.DirectionalLight(0x99c9ff,2.8);rim.position.set(5,3,-5);scene.add(rim);
  const model=createModel(type,index,biome);model.rotation.y=type==='player'?.34:Math.PI+.2;scene.add(model);
  const bounds=new THREE.Box3().setFromObject(model),size=bounds.getSize(new THREE.Vector3()),distance=Math.max(size.x,size.z)*1.70;
  camera.position.set(distance*.52,distance*.86,distance*.81);camera.lookAt(0,.1,0);previewRenderer.render(scene,camera);
  const uri=previewRenderer.domElement.toDataURL('image/png');previewCache.set(key,uri);return uri;
 }catch(error){console.warn('模型预览不可用',error);return '';}
}
export function releasePreviewRenderer(){if(previewRenderer){previewRenderer.dispose();previewRenderer.forceContextLoss();previewRenderer=null;}}
export function disposeModels(){
 const geometries=new Set(),materials=new Set();for(const model of modelCache.values())model.traverse(o=>{if(o.geometry)geometries.add(o.geometry);if(o.material)materials.add(o.material);});
 geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());modelCache.clear();previewCache.clear();releasePreviewRenderer();
}

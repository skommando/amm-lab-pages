import {THREE} from '../arcade-runtime/runtime.mjs';
import {BIOMES,AIRCRAFT,ENEMIES,BRANCHES,PICKUPS} from './content.mjs';
import {createModel,animateModel,disposeModels} from './models.mjs';
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const temp=new THREE.Object3D(),colorTemp=new THREE.Color();
function seeded(seed){let x=seed>>>0;return ()=>{x+=0x6d2b79f5;let t=x;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296;};}
const noiseGLSL=`
float hash21(vec2 p){p=fract(p*vec2(123.34,345.45));p+=dot(p,p+34.345);return fract(p.x*p.y);}
float noise2(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash21(i),hash21(i+vec2(1,0)),f.x),mix(hash21(i+vec2(0,1)),hash21(i+vec2(1)),f.x),f.y);}
float fbm(vec2 p){float v=0.,a=.5;mat2 r=mat2(.80,.60,-.60,.80);for(int i=0;i<5;i++){v+=a*noise2(p);p=r*p*2.03+11.1;a*=.5;}return v;}
`;
const fullVertex=`varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.9999,1.);}`;
const nebulaFragment=`
uniform float uTime,uAspect,uSeed,uKind,uStage;uniform vec3 c0,c1,c2,c3;varying vec2 vUv;
${noiseGLSL}
void main(){
 vec2 p=(vUv-.5)*vec2(uAspect,1.)*3.1;p.y+=uTime*.012;p+=uSeed*.013;
 vec2 warp=vec2(fbm(p*.74+7.3),fbm(p*.8-9.8));
 float n=fbm(p*1.22+warp*3.8);float fine=fbm(p*3.8+warp*3.0);
 float cloud=pow(smoothstep(.18,.86,n),1.25);float fil=pow(max(0.,1.-abs(fine-.53)*4.1),3.);
 float ribbon=exp(-pow((vUv.y-.5)*2.0+sin(vUv.x*5.0+uSeed)*.28+(warp.x-.5)*1.6,2.)*2.5);
 vec3 col=c0*.85+mix(c1,c2,smoothstep(.36,.75,n))*(.045+cloud*.64)*ribbon;
 col+=c3*pow(cloud,3.5)*fil*.36;col+=c1*fine*.09;
 if(uKind>5.5&&uKind<6.5){vec2 q=(vUv-vec2(.57,.47))*vec2(uAspect,1.);float r=length(q);col+=mix(c2,c3,.5)*exp(-abs(r-.28)*54.)*.33;}
 // Stable subpixel stars, with gentle color twinkle; no random texture downloads.
 vec2 sp=(vUv-.5)*vec2(uAspect,1.)*370.;vec2 cell=floor(sp);vec2 f=fract(sp)-.5;float h=hash21(cell+uSeed);
 float star=exp(-dot(f,f)*180.)*step(.988,h);float tw=.75+.25*sin(uTime*.6+h*310.);
 col+=mix(vec3(.75,.88,1.),c3,.2)*star*tw*1.9;
 float shade=mix(.74,1.,smoothstep(.0,.6,abs(vUv.x-.5)));col*=shade*(1.+uStage*.035);
 gl_FragColor=vec4(col,1.);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
}`;
const planetVertex=`varying vec2 vUv;varying vec3 vN,vWorld;void main(){vUv=uv;vec4 w=modelMatrix*vec4(position,1.);vWorld=w.xyz;vN=normalize(mat3(modelMatrix)*normal);gl_Position=projectionMatrix*viewMatrix*w;}`;
const planetFragment=`
uniform vec3 base,sky,sun;uniform float uKind,uSeed,uTime;varying vec2 vUv;varying vec3 vN,vWorld;
${noiseGLSL}
void main(){
 vec3 N=normalize(vN),V=normalize(cameraPosition-vWorld);vec2 uv=vUv*vec2(13.,7.);uv.x+=uTime*.002+uSeed;
 float land=fbm(uv*1.5+fbm(uv*2.3)*1.7);float detail=fbm(uv*6.);float cloud=fbm(uv*2.2+vec2(uTime*.004,12.));
 vec3 albedo=mix(base*.31,base*1.6,smoothstep(.32,.7,land));
 if(uKind<.5||uKind>8.5&&uKind<9.5){float stripes=.5+.27*sin(vUv.y*76.+fbm(uv)*5.)+.13*sin(vUv.y*181.+land*9.);albedo=mix(base*.55,base*1.32,stripes)*(.82+detail*.30);}
 if(uKind>4.5&&uKind<5.5||uKind>2.5&&uKind<3.5){albedo=mix(vec3(.025,.14,.25),base*1.22,smoothstep(.44,.51,land));}
 if(uKind>7.5&&uKind<8.5){albedo=mix(base*.55,vec3(.87,.95,1.),smoothstep(.36,.61,land));}
 if(uKind>1.5&&uKind<2.5){float cracks=pow(1.-abs(land-.5)*2.,36.);albedo+=vec3(1.,.18,.01)*cracks*.7;}
 float clouds=smoothstep(.57,.78,cloud)*((uKind<.5||uKind>8.5&&uKind<9.5)?.12:.64);albedo=mix(albedo,vec3(.86,.9,.94),clouds);
 float day=dot(N,normalize(sun)),light=.055+max(0.,day)*.94;
 vec3 col=albedo*light;float cells=hash21(floor(vUv*vec2(950.,475.))+uSeed);float cities=step(.984,cells)*smoothstep(.4,.63,land)*(1.-smoothstep(-.20,.18,day));
 col+=vec3(1.,.57,.21)*cities*.8;
 float rim=pow(1.-max(0.,dot(N,V)),3.5);col+=sky*rim*(.10+max(0.,day)*.7);
 gl_FragColor=vec4(col,1.);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
}`;
function disposeTree(root){const gs=new Set(),ms=new Set();root.traverse(o=>{if(o.geometry)gs.add(o.geometry);if(o.material){for(const m of Array.isArray(o.material)?o.material:[o.material])ms.add(m);}});gs.forEach(g=>g.dispose());ms.forEach(m=>{Object.values(m).forEach(v=>{if(v?.isTexture&&v.userData.owned)v.dispose();});m.dispose();});root.clear();}
function softTexture(){const c=document.createElement('canvas');c.width=c.height=128;const g=c.getContext('2d'),grad=g.createRadialGradient(64,64,0,64,64,64);grad.addColorStop(0,'rgba(255,255,255,1)');grad.addColorStop(.12,'rgba(255,255,255,.9)');grad.addColorStop(.32,'rgba(255,255,255,.25)');grad.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=grad;g.fillRect(0,0,128,128);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;}
function flatMesh(g,geometry,mat,x,y,z){const m=new THREE.Mesh(geometry,mat);m.position.set(x,y,z);g.add(m);return m;}
function primitiveBox(g,x,y,z,w,h,d,material){return flatMesh(g,new THREE.BoxGeometry(w,h,d),material,x,y,z);}
class StellarPost{
 constructor(renderer){
  this.renderer=renderer;this.original=renderer.render.bind(renderer);this.size=new THREE.Vector2();this.enabled=true;this.exposure=1.15;this.reduced=false;
  this.scene=new THREE.Scene();this.camera=new THREE.OrthographicCamera(-1,1,1,-1,0,1);this.quad=new THREE.Mesh(new THREE.PlaneGeometry(2,2),new THREE.MeshBasicMaterial());this.quad.frustumCulled=false;this.scene.add(this.quad);
  const vs=`varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}`;
  this.blur=new THREE.ShaderMaterial({depthTest:false,depthWrite:false,toneMapped:false,uniforms:{tex:{value:null},direction:{value:new THREE.Vector2()},threshold:{value:0}},vertexShader:vs,fragmentShader:`varying vec2 vUv;uniform sampler2D tex;uniform vec2 direction;uniform float threshold;vec3 get(vec2 uv){vec3 c=texture2D(tex,uv).rgb;float b=max(c.r,max(c.g,c.b));return c*max(0.,b-threshold)/max(.0001,b);}void main(){vec3 c=get(vUv)*.227027;c+=get(vUv+direction*1.384615)*.316216;c+=get(vUv-direction*1.384615)*.316216;c+=get(vUv+direction*3.230769)*.070270;c+=get(vUv-direction*3.230769)*.070270;gl_FragColor=vec4(c,1.);}`});
  this.composite=new THREE.ShaderMaterial({depthTest:false,depthWrite:false,toneMapped:false,uniforms:{image:{value:null},bloom:{value:null},exposure:{value:1.15},vignette:{value:.16}},vertexShader:vs,fragmentShader:`varying vec2 vUv;uniform sampler2D image,bloom;uniform float exposure,vignette;vec3 aces(vec3 x){return clamp((x*(2.51*x+.03))/(x*(2.43*x+.59)+.14),0.,1.);}void main(){vec3 c=texture2D(image,vUv).rgb+texture2D(bloom,vUv).rgb*.34;c=aces(c*exposure);vec2 p=vUv-.5;c*=1.-dot(p,p)*vignette;c=pow(max(c,vec3(0.)),vec3(1./2.2));gl_FragColor=vec4(c,1.);}`});
  this.width=0;this.height=0;
 }
 resize(){this.renderer.getDrawingBufferSize(this.size);const w=this.size.x,h=this.size.y;if(w===this.width&&h===this.height)return;this.width=w;this.height=h;for(const t of [this.target,this.a,this.b])t?.dispose();
  const type=this.renderer.capabilities.isWebGL2&&this.renderer.extensions.has('EXT_color_buffer_float')?THREE.HalfFloatType:THREE.UnsignedByteType;
  this.target=new THREE.WebGLRenderTarget(w,h,{type,depthBuffer:true});this.a=new THREE.WebGLRenderTarget(Math.max(1,w>>2),Math.max(1,h>>2),{type,depthBuffer:false});this.b=this.a.clone();
 }
 render(scene,camera){
  if(!this.enabled){this.original(scene,camera);this.calls=this.renderer.info.render.calls;return;}
  this.resize();const r=this.renderer,oldTone=r.toneMapping;const target=r.getRenderTarget();r.toneMapping=THREE.NoToneMapping;r.setRenderTarget(this.target);this.original(scene,camera);this.calls=r.info.render.calls;
  this.quad.material=this.blur;this.blur.uniforms.tex.value=this.target.texture;this.blur.uniforms.threshold.value=.9;this.blur.uniforms.direction.value.set(1.5/this.a.width,0);r.setRenderTarget(this.a);this.original(this.scene,this.camera);
  this.blur.uniforms.tex.value=this.a.texture;this.blur.uniforms.threshold.value=0;this.blur.uniforms.direction.value.set(0,1.8/this.a.height);r.setRenderTarget(this.b);this.original(this.scene,this.camera);
  this.quad.material=this.composite;this.composite.uniforms.image.value=this.target.texture;this.composite.uniforms.bloom.value=this.b.texture;this.composite.uniforms.exposure.value=this.exposure;r.setRenderTarget(target);this.original(this.scene,this.camera);r.toneMapping=oldTone;
 }
 dispose(){[this.target,this.a,this.b].forEach(t=>t?.dispose());this.quad.geometry.dispose();this.blur.dispose();this.composite.dispose();}
}
export class StarVisuals{
 constructor(game,settings={}){
  this.game=game;this.scene=game.scene;this.renderer=game.renderer;this.camera=game.camera;this.settings=settings;this.lastTime=performance.now();this.clock=0;this.actorMap=new Map();this.pickupMap=new Map();this.effectMap=new Map();this.hazardMap=new Map();this.trails=[];this.currentChapter=-1;this.hero=null;this.state=null;this.focus=false;
  this.scene.fog=null;game.sun.castShadow=false;this.renderer.shadowMap.enabled=false;game.sun.position.set(-10,18,8);game.sun.intensity=3.0;
  this.rim=new THREE.DirectionalLight(0xf9b2ff,1.9);this.rim.position.set(12,5,-16);this.scene.add(this.rim);this.flashLight=new THREE.PointLight(0xffc48c,0,22,1.6);this.scene.add(this.flashLight);
  this.bg=new THREE.Group();this.actors=new THREE.Group();this.effects=new THREE.Group();game.world.add(this.bg,this.actors,this.effects);
  this.soft=softTexture();
  this.skyUniforms={uTime:{value:0},uAspect:{value:1},uSeed:{value:1},uKind:{value:0},uStage:{value:0},c0:{value:new THREE.Color()},c1:{value:new THREE.Color()},c2:{value:new THREE.Color()},c3:{value:new THREE.Color()}};
  this.sky=new THREE.Mesh(new THREE.PlaneGeometry(2,2),new THREE.ShaderMaterial({uniforms:this.skyUniforms,vertexShader:fullVertex,fragmentShader:nebulaFragment,depthWrite:false,depthTest:false}));this.sky.frustumCulled=false;this.sky.renderOrder=-1000;this.scene.add(this.sky);
  this.setupProjectiles();this.setupParticles();this.setupArcs();
  this.post=new StellarPost(this.renderer);
  // Cloud fields are cached in a quality-scaled offscreen buffer. Ships and HUD stay sharp.
  this.nebulaScene=new THREE.Scene();this.nebulaCamera=new THREE.OrthographicCamera(-1,1,1,-1,0,1);
  this.nebulaQuad=new THREE.Mesh(new THREE.PlaneGeometry(2,2),this.sky.material);this.nebulaQuad.frustumCulled=false;this.nebulaScene.add(this.nebulaQuad);
  this.sky.material=new THREE.ShaderMaterial({depthTest:false,depthWrite:false,uniforms:{skyMap:{value:null}},vertexShader:fullVertex,fragmentShader:'uniform sampler2D skyMap;varying vec2 vUv;void main(){gl_FragColor=texture2D(skyMap,vUv);\n#include <tonemapping_fragment>\n#include <colorspace_fragment>\n}'});this.nebulaNext=0;
  // Instance-local rendering hook: the shared runtime and its other consumers are not changed.
  this.renderer.render=(scene,camera)=>{const now=performance.now(),dt=Math.min(.05,(now-this.lastTime)/1000);this.lastTime=now;this.clock+=dt;this.tick(dt);this.updateNebula(now);this.post.render(scene,camera);};
  this.setQuality(settings.quality||'balanced');
 }
 setQuality(quality){this.quality=quality;this.post.enabled=quality!=='eco';const coarse=matchMedia('(pointer:coarse)').matches,dpr=devicePixelRatio||1;this.renderer.setPixelRatio(Math.min(dpr,quality==='ultra'?2:quality==='eco'?1:coarse?1.15:1.5));this.renderer.setSize(innerWidth,innerHeight);this.settings.quality=quality;this.nebulaNext=0;}
 updateNebula(now){
  const aspect=this.camera.aspect,max=this.quality==='ultra'?1280:this.quality==='eco'?480:800;
  const width=Math.round(aspect>=1?max:max*aspect),height=Math.round(aspect>=1?max/aspect:max);
  if(!this.nebulaTarget||this.nebulaTarget.width!==width||this.nebulaTarget.height!==height){this.nebulaTarget?.dispose();this.nebulaTarget=new THREE.WebGLRenderTarget(Math.max(1,width),Math.max(1,height),{depthBuffer:false});this.sky.material.uniforms.skyMap.value=this.nebulaTarget.texture;this.nebulaNext=0;}
  if(now<this.nebulaNext&&this.nebulaChapter===this.currentChapter)return;
  const r=this.renderer,target=r.getRenderTarget(),tone=r.toneMapping;r.toneMapping=THREE.NoToneMapping;r.setRenderTarget(this.nebulaTarget);this.post.original(this.nebulaScene,this.nebulaCamera);r.setRenderTarget(target);r.toneMapping=tone;this.nebulaNext=now+(this.quality==='ultra'?45:85);this.nebulaChapter=this.currentChapter;
 }
 setSettings(settings){this.settings=settings;this.setQuality(settings.quality);}
 setupProjectiles(){
  const geometry=new THREE.SphereGeometry(1,10,6),mat=new THREE.MeshBasicMaterial({color:0xffffff,toneMapped:false});
  this.bulletMesh=new THREE.InstancedMesh(geometry,mat,1300);this.bulletMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);this.bulletMesh.frustumCulled=false;this.bulletMesh.count=0;this.effects.add(this.bulletMesh);
  this.bulletCore=new THREE.InstancedMesh(new THREE.SphereGeometry(1,8,5),new THREE.MeshBasicMaterial({color:0xfff6dd,toneMapped:false}),900);this.bulletCore.instanceMatrix.setUsage(THREE.DynamicDrawUsage);this.bulletCore.frustumCulled=false;this.bulletCore.count=0;this.effects.add(this.bulletCore);
  this.missileMesh=new THREE.InstancedMesh(new THREE.ConeGeometry(1,2,12).rotateX(Math.PI/2),new THREE.MeshStandardMaterial({color:0xece6d5,metalness:.65,roughness:.28,emissive:0xffbb77,emissiveIntensity:.18}),160);this.missileMesh.frustumCulled=false;this.missileMesh.count=0;this.effects.add(this.missileMesh);
  this.ultimateBeam=new THREE.Mesh(new THREE.PlaneGeometry(1,1).rotateX(-Math.PI/2),new THREE.ShaderMaterial({transparent:true,depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending,toneMapped:false,uniforms:{uTime:{value:0}},vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,fragmentShader:`varying vec2 vUv;uniform float uTime;void main(){float x=abs(vUv.x-.5)*2.;float core=pow(1.-x,4.);float rays=pow(1.-x,1.6)*(.6+.18*sin(vUv.y*130.-uTime*35.));vec3 c=mix(vec3(.55,.25,1.),vec3(1.,.97,1.),core)*2.4;gl_FragColor=vec4(c,(core+rays)*.9);}`}));this.ultimateBeam.visible=false;this.effects.add(this.ultimateBeam);
 }
 setupParticles(){
  this.particleMax=2800;this.positions=new Float32Array(this.particleMax*3);this.particleColors=new Float32Array(this.particleMax*3);this.sizes=new Float32Array(this.particleMax);this.alphas=new Float32Array(this.particleMax);
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(this.positions,3).setUsage(THREE.DynamicDrawUsage));g.setAttribute('color',new THREE.BufferAttribute(this.particleColors,3).setUsage(THREE.DynamicDrawUsage));g.setAttribute('aSize',new THREE.BufferAttribute(this.sizes,1).setUsage(THREE.DynamicDrawUsage));g.setAttribute('aAlpha',new THREE.BufferAttribute(this.alphas,1).setUsage(THREE.DynamicDrawUsage));g.setDrawRange(0,0);
  this.particles=new THREE.Points(g,new THREE.ShaderMaterial({transparent:true,depthWrite:false,vertexColors:true,blending:THREE.AdditiveBlending,toneMapped:false,uniforms:{uRatio:{value:1}},vertexShader:`attribute float aSize,aAlpha;uniform float uRatio;varying vec3 vColor;varying float vAlpha;void main(){vColor=color;vAlpha=aAlpha;vec4 mv=modelViewMatrix*vec4(position,1.);gl_PointSize=clamp(aSize*420.*uRatio/max(1.,-mv.z),1.,70.);gl_Position=projectionMatrix*mv;}`,fragmentShader:`varying vec3 vColor;varying float vAlpha;void main(){float d=length(gl_PointCoord-.5)*2.;if(d>1.)discard;float a=pow(1.-d,2.2);gl_FragColor=vec4(vColor*1.7,a*vAlpha);}`}));this.particles.frustumCulled=false;this.effects.add(this.particles);
 }
 setupArcs(){
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(new Float32Array(600*3),3).setUsage(THREE.DynamicDrawUsage));g.setDrawRange(0,0);
  this.arcLines=new THREE.LineSegments(g,new THREE.LineBasicMaterial({color:new THREE.Color(0xabffed).multiplyScalar(2.5),transparent:true,opacity:.95,blending:THREE.AdditiveBlending,toneMapped:false,depthWrite:false}));this.arcLines.frustumCulled=false;this.effects.add(this.arcLines);
 }
 buildBackground(chapter){
  disposeTree(this.bg);this.planetMaterials=[];this.rotators=[];this.currentChapter=chapter.id;const biome=BIOMES[chapter.biome],rng=seeded(chapter.seed+400);
  this.skyUniforms.uSeed.value=biome.seed+chapter.id*.37;this.skyUniforms.uKind.value=biome.id;for(let i=0;i<4;i++)this.skyUniforms['c'+i].value.set(biome.colors[i]);
  this.game.sun.color.set(biome.light);this.rim.color.set(biome.rim);this.scene.background=new THREE.Color(biome.colors[0]);this.post.exposure=biome.id===8?1.02:1.12;
  this.scene.children.filter(c=>c.isHemisphereLight).forEach(l=>{l.color.set(biome.light);l.groundColor.set(0x29303f);l.intensity=1.85;});
  const starCount=this.quality==='eco'?350:800,positions=new Float32Array(starCount*3),colors=new Float32Array(starCount*3);
  for(let i=0;i<starCount;i++){positions[i*3]=(rng()-.5)*110;positions[i*3+1]=-10-rng()*40;positions[i*3+2]=(rng()-.5)*100;const color=new THREE.Color([0xebf5ff,biome.accent,0xffedcb,0xc0ddff][i%4]).multiplyScalar(.6+rng());color.toArray(colors,i*3);}
  const sg=new THREE.BufferGeometry();sg.setAttribute('position',new THREE.BufferAttribute(positions,3));sg.setAttribute('color',new THREE.BufferAttribute(colors,3));this.stars=new THREE.Points(sg,new THREE.PointsMaterial({size:.10,vertexColors:true,transparent:true,opacity:.95,depthWrite:false,sizeAttenuation:true,toneMapped:false}));this.bg.add(this.stars);
  const left=chapter.id%3!==1,px=left?-13.2:14.2,pz=-18-(chapter.id%3)*3.3,radius=7.5+(chapter.id%4)*.5;
  this.addPlanet(px,-11.5,pz,radius,biome,chapter.seed);
  this.addPlanet(left?18.5:-19,-20,-9,2.4,BIOMES[(biome.id+3)%12],chapter.seed+17,false);
  if([0,1,2,6,8,9,11].includes(biome.id)){
   const ring=new THREE.Mesh(new THREE.RingGeometry(radius*1.23,radius*1.94,160,1),new THREE.ShaderMaterial({transparent:true,side:THREE.DoubleSide,depthWrite:false,uniforms:{tint:{value:new THREE.Color(biome.accent)},inner:{value:radius*1.23},outer:{value:radius*1.94}},vertexShader:`varying vec2 vPos;void main(){vPos=position.xy;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,fragmentShader:`uniform vec3 tint;uniform float inner,outer;varying vec2 vPos;void main(){float r=length(vPos),t=(r-inner)/(outer-inner);float bands=.35+.11*sin(r*4.1)+.04*sin(r*13.7);float edges=smoothstep(0.,.035,t)*(1.-smoothstep(.92,1.,t));float gap=1.-.83*exp(-pow((t-.64)*48.,2.));gl_FragColor=vec4(tint*.64,bands*edges*gap);#include <tonemapping_fragment>\n#include <colorspace_fragment>}`.replace(';#include',';\n#include')}));ring.position.set(px,-11.5,pz);ring.rotation.set(.10,.18,chapter.id%2?.28:-.38);this.bg.add(ring);this.rotators.push({obj:ring,speed:.012,axis:'z'});
  }
  // Warm luminous primary star and several restrained anamorphic flare layers.
  const sun=new THREE.Sprite(new THREE.SpriteMaterial({map:this.soft,color:biome.accent,transparent:true,opacity:.58,blending:THREE.AdditiveBlending,depthWrite:false,toneMapped:false}));sun.position.set(left?21:-24,-8,-29);sun.scale.set(28,28,1);this.bg.add(sun);
  const flare=new THREE.Sprite(new THREE.SpriteMaterial({map:this.soft,color:biome.light,transparent:true,opacity:.32,blending:THREE.AdditiveBlending,depthWrite:false,toneMapped:false}));flare.position.copy(sun.position);flare.scale.set(55,2.0,1);this.bg.add(flare);
  this.buildDebris(biome,rng);
  this.buildStructures(biome,chapter.id,left);
 }
 addPlanet(x,y,z,r,biome,seed,atmosphere=true){
  const material=new THREE.ShaderMaterial({uniforms:{base:{value:new THREE.Color(biome.planet)},sky:{value:new THREE.Color(biome.accent)},sun:{value:new THREE.Vector3(-.8,.55,.8)},uKind:{value:biome.id},uSeed:{value:seed*.0001},uTime:{value:0}},vertexShader:planetVertex,fragmentShader:planetFragment});
  const planet=new THREE.Mesh(new THREE.SphereGeometry(r,atmosphere?96:48,atmosphere?64:32),material);planet.position.set(x,y,z);planet.rotation.z=.23;this.bg.add(planet);this.planetMaterials.push(material);this.rotators.push({obj:planet,speed:.006,axis:'y'});
  if(atmosphere){const atmos=new THREE.Mesh(new THREE.SphereGeometry(r*1.045,64,48),new THREE.ShaderMaterial({transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,uniforms:{c:{value:new THREE.Color(biome.accent)}},vertexShader:planetVertex,fragmentShader:`uniform vec3 c;varying vec3 vN,vWorld;void main(){float f=pow(1.-max(0.,dot(normalize(vN),normalize(cameraPosition-vWorld))),3.);gl_FragColor=vec4(c*.8,f*.4);}`}));atmos.position.copy(planet.position);this.bg.add(atmos);}
 }
 buildDebris(biome,rng){
  const crystalline=[3,4,6,8].includes(biome.id),count=this.quality==='eco'?38:90;
  const geometry=crystalline?new THREE.OctahedronGeometry(1,0):new THREE.IcosahedronGeometry(1,3);
  if(!crystalline){const a=geometry.getAttribute('position'),v=new THREE.Vector3();for(let i=0;i<a.count;i++){v.fromBufferAttribute(a,i);const k=.91+.09*Math.sin(v.x*7.4+Math.sin(v.z*5.2))+ .06*Math.sin(v.y*10.3-v.z*4.7);v.multiplyScalar(k);a.setXYZ(i,v.x,v.y,v.z);}geometry.computeVertexNormals();}
  const material=new THREE.MeshStandardMaterial({color:biome.id===8?0xadc9e0:crystalline?biome.planet:0x566271,metalness:crystalline?.48:.35,roughness:crystalline?.26:.84,flatShading:false,emissive:crystalline?biome.accent:0x000000,emissiveIntensity:crystalline?.10:0});
  this.debris=new THREE.InstancedMesh(geometry,material,count);this.debris.frustumCulled=false;this.debrisData=[];
  for(let i=0;i<count;i++){const side=i%2?1:-1;this.debrisData.push({x:side*(11+rng()*19),y:-2.6-rng()*14,z:-48+rng()*96,scale:.13+rng()*.90,spin:rng()*6.28,speed:.5+rng()*1.9});}
  this.bg.add(this.debris);
 }
 buildStructures(biome,chapterId,left){
  const group=new THREE.Group(),metal=new THREE.MeshStandardMaterial({color:biome.id===7?0x8c9e99:0x7f8a9d,roughness:.48,metalness:.7}),dark=new THREE.MeshStandardMaterial({color:0x243546,roughness:.65,metalness:.6}),lit=new THREE.MeshBasicMaterial({color:new THREE.Color(biome.accent).multiplyScalar(1.6),toneMapped:false});
  const station=[3,6,7,9,11].includes(biome.id),radius=station?6.4:4.1;
  const ring=new THREE.Mesh(new THREE.TorusGeometry(radius,.18,10,128),metal);ring.rotation.x=Math.PI/2;group.add(ring);
  const lightRing=new THREE.Mesh(new THREE.TorusGeometry(radius-.2,.036,6,128),lit);lightRing.rotation.x=Math.PI/2;lightRing.position.y=.2;group.add(lightRing);
  const count=station?28:12,modules=new THREE.InstancedMesh(new THREE.BoxGeometry(1,1,1),metal,count),windows=new THREE.InstancedMesh(new THREE.BoxGeometry(1,1,1),lit,count*3);
  for(let i=0;i<count;i++){const a=i*Math.PI*2/count;temp.position.set(Math.cos(a)*radius,0,Math.sin(a)*radius);temp.rotation.set(0,-a,0);temp.scale.set(station?.65:.5,station?.8:.5,station?1.0:.8);temp.updateMatrix();modules.setMatrixAt(i,temp.matrix);
   for(let j=0;j<3;j++){temp.position.set(Math.cos(a)*(radius+.06),.45+j*.07,Math.sin(a)*(radius+.06));temp.scale.set(.06,.025,.55);temp.updateMatrix();windows.setMatrixAt(i*3+j,temp.matrix);}
  }
  group.add(modules,windows);
  if(station){for(let i=0;i<4;i++){const a=i*Math.PI/2;const bridge=primitiveBox(group,Math.cos(a)*radius*.5,-.2,Math.sin(a)*radius*.5,radius,.2,.30,dark);bridge.rotation.y=-a;}flatMesh(group,new THREE.CylinderGeometry(1.2,1.5,.6,32),metal,0,0,0);flatMesh(group,new THREE.SphereGeometry(.7,24,16),lit,0,.32,0);}
  group.position.set(left?16:-16,-5,chapterId%2?1:-10);group.rotation.z=chapterId%2?.22:-.15;this.bg.add(group);this.rotators.push({obj:group,speed:station?.025:.06,axis:'y'});
 }
 start(state){
  this.state=state;for(const mesh of this.actorMap.values())this.actors.remove(mesh);this.actorMap.clear();for(const mesh of this.pickupMap.values()){this.actors.remove(mesh);mesh.material.dispose();}this.pickupMap.clear();for(const mesh of this.effectMap.values()){this.effects.remove(mesh);mesh.material.dispose();mesh.geometry.dispose();}this.effectMap.clear();for(const mesh of this.hazardMap.values()){this.effects.remove(mesh);mesh.material.dispose();mesh.geometry.dispose();}this.hazardMap.clear();this.trails=[];
  if(this.hero)this.actors.remove(this.hero);this.hero=createModel('player',state.aircraft);this.actors.add(this.hero);
  if(this.wings)this.wings.forEach(m=>this.actors.remove(m));this.wings=Array.from({length:4},()=>{const m=createModel('player',1);m.scale.setScalar(.31);this.actors.add(m);m.getObjectByName('hit-core').visible=false;m.getObjectByName('focus-ring').visible=false;return m;});
  if(!this.shield){this.shield=new THREE.Mesh(new THREE.SphereGeometry(1,32,20),new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,uniforms:{opacity:{value:.08}},vertexShader:planetVertex,fragmentShader:'uniform float opacity;varying vec3 vN,vWorld;void main(){float f=pow(1.-max(0.,dot(normalize(vN),normalize(cameraPosition-vWorld))),2.5);gl_FragColor=vec4(.40,.78,1.,f*opacity);}'} ));this.shield.scale.set(1.18,.30,1.55);this.actors.add(this.shield);}
  this.buildBackground(state.chapter);this.sync(state);this.fitCamera();
 }
 fitCamera(){
  const aspect=this.camera.aspect,scale=Math.max(1,.82/aspect);this.baseCamera=new THREE.Vector3(0,30.8*scale,17.2*scale);this.camera.position.copy(this.baseCamera);this.camera.lookAt(0,0,.3);this.camera.fov=48;this.camera.updateProjectionMatrix();
 }
 sync(state,focus=false){
  this.state=state;this.focus=focus;if(this.currentChapter!==state.chapter.id)this.buildBackground(state.chapter);
  const p=state.player;this.hero.position.set(p.x,.5,p.y);this.hero.rotation.z=-(p.bank||0)*.22;this.hero.rotation.x=(p.dashTimer>0?-.13:0);this.hero.visible=true;
  this.hero.userData.hit.visible=true;this.hero.userData.focus.visible=focus||p.invuln>0;this.hero.userData.focus.scale.setScalar(focus?1.25:1);
  this.wings.forEach((m,i)=>{const side=i%2?1:-1;m.visible=i<p.wingmen;m.position.set(p.x+side*((1+Math.floor(i/2))*.95+1),.45,p.y+.3+(i>=2?.6:0));});
  this.shield.position.set(p.x,.57,p.y);this.shield.visible=p.shield>0||p.invuln>0;this.shield.material.uniforms.opacity.value=p.invuln>0?.48:focus?.27:.12;
  const wanted=new Set();for(const e of state.enemies){wanted.add(e.id);let model=this.actorMap.get(e.id);if(!model){model=e.boss?createModel('boss',e.family,state.chapter.biome):createModel('enemy',e.type);this.actors.add(model);this.actorMap.set(e.id,model);}model.position.set(e.x,e.boss?.45:.38,e.y);model.rotation.z=Math.sin(e.age*1.5)*.045;model.scale.setScalar(e.elite?1.09:1);model.visible=true;animateModel(model,state.time,e.hitFlash>0?1.6:.5,e.parts);}
  for(const [id,model] of this.actorMap)if(!wanted.has(id)){this.actors.remove(model);this.actorMap.delete(id);}
  this.syncBullets(state);this.syncPickups(state);this.syncEffects(state);this.syncHazards(state);this.syncArcs(state);
  this.ultimateBeam.visible=p.ultimateType===1&&p.ultimateTimer>0;this.ultimateBeam.position.set(p.x,.82,(p.y-19)*.5);this.ultimateBeam.scale.set(4.7,1,p.y+19);this.ultimateBeam.material.uniforms.uTime.value=state.time;
  this.skyUniforms.uStage.value=state.stage;
 }
 syncBullets(state){
  let n=0,core=0,missiles=0;
  for(const b of state.bullets){
   if(b.missile){if(missiles<160){temp.position.set(b.x,.62,b.y);temp.rotation.set(0,Math.atan2(b.vx,b.vy),0);temp.scale.set(b.missileType===2?.25:.18,.17,b.missileType===2?.65:.47);temp.updateMatrix();this.missileMesh.setMatrixAt(missiles++,temp.matrix);}continue;}
   if(n>=1300)continue;const player=b.owner==='player',r=b.r||.18;
   temp.position.set(b.x,.6,b.y);temp.rotation.set(0,b.disc?state.time*12:Math.atan2(b.vx,b.vy),0);temp.scale.set(b.disc?.52:player?r:Math.max(.17,r),b.disc?.08:player?.09:r*.72,b.disc?.52:b.beam?b.rail?2.2:1.6:b.tracer?.64:player?.42:r);
   temp.updateMatrix();this.bulletMesh.setMatrixAt(n,temp.matrix);colorTemp.set(b.color||0xffb77a).multiplyScalar(player?1.6:1.45);this.bulletMesh.setColorAt(n++,colorTemp);
   if(!player&&core<900){temp.scale.multiplyScalar(.52);temp.position.y+=.04;temp.updateMatrix();this.bulletCore.setMatrixAt(core++,temp.matrix);}
  }
  this.bulletMesh.count=n;this.bulletCore.count=core;this.missileMesh.count=missiles;for(const mesh of [this.bulletMesh,this.bulletCore,this.missileMesh]){mesh.instanceMatrix.needsUpdate=true;if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;}
 }
 pickupTexture(type){
  const def=PICKUPS.find(p=>p.id===type),canvas=document.createElement('canvas');canvas.width=canvas.height=128;const ctx=canvas.getContext('2d');ctx.clearRect(0,0,128,128);ctx.strokeStyle='#'+def.color.toString(16).padStart(6,'0');ctx.lineWidth=5;ctx.fillStyle='rgba(10,24,40,.94)';ctx.beginPath();for(let j=0;j<6;j++){const a=j*Math.PI/3-Math.PI/2;const x=64+Math.cos(a)*52,y=64+Math.sin(a)*52;j?ctx.lineTo(x,y):ctx.moveTo(x,y);}ctx.closePath();ctx.fill();ctx.stroke();ctx.fillStyle='#f5fbff';ctx.font='bold 56px system-ui';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(def.glyph,64,66);const t=new THREE.CanvasTexture(canvas);t.colorSpace=THREE.SRGBColorSpace;return t;
 }
 syncPickups(state){
  if(!this.pickupTextures)this.pickupTextures=new Map();const wanted=new Set();
  for(const p of state.pickups){wanted.add(p.id);let mesh=this.pickupMap.get(p.id);if(!mesh){if(!this.pickupTextures.has(p.type))this.pickupTextures.set(p.type,this.pickupTexture(p.type));mesh=new THREE.Sprite(new THREE.SpriteMaterial({map:this.pickupTextures.get(p.type),depthWrite:false,toneMapped:false}));mesh.scale.set(1.18,1.18,1);this.actors.add(mesh);this.pickupMap.set(p.id,mesh);}mesh.position.set(p.x,.82+Math.sin(state.time*3+p.id)*.08,p.y);}
  for(const [id,mesh] of this.pickupMap)if(!wanted.has(id)){this.actors.remove(mesh);mesh.material.dispose();this.pickupMap.delete(id);}
 }
 syncEffects(state){
  const wanted=new Set();for(const e of state.effects){wanted.add(e.id);let mesh=this.effectMap.get(e.id);if(!mesh){mesh=new THREE.Mesh(new THREE.RingGeometry(.90,1,80),new THREE.MeshBasicMaterial({color:new THREE.Color(e.color).multiplyScalar(1.7),transparent:true,side:THREE.DoubleSide,blending:THREE.AdditiveBlending,depthWrite:false,toneMapped:false}));mesh.rotation.x=-Math.PI/2;this.effects.add(mesh);this.effectMap.set(e.id,mesh);}const age=1-e.life/e.maxLife,scale=e.size*(.08+Math.pow(age,.7)*.92);mesh.position.set(e.x,.8,e.y);mesh.scale.setScalar(scale);mesh.material.opacity=Math.pow(1-age,1.5)*(e.kind==='nova'?.8:.6);}
  for(const [id,mesh] of this.effectMap)if(!wanted.has(id)){this.effects.remove(mesh);mesh.geometry.dispose();mesh.material.dispose();this.effectMap.delete(id);}
 }
 syncHazards(state){
  const wanted=new Set();for(const h of state.hazards){wanted.add(h.id);let mesh=this.hazardMap.get(h.id);if(!mesh){mesh=new THREE.Mesh(new THREE.PlaneGeometry(1,1).rotateX(-Math.PI/2),new THREE.ShaderMaterial({transparent:true,depthWrite:false,side:THREE.DoubleSide,toneMapped:false,uniforms:{uTime:{value:0},active:{value:0},tint:{value:new THREE.Color(h.color)}},vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,fragmentShader:`varying vec2 vUv;uniform float uTime,active;uniform vec3 tint;void main(){float edge=step(.84,abs(vUv.x-.5)*2.);float stripe=step(.52,fract(vUv.y*28.+vUv.x*2.-uTime*2.));float a=active>.5?pow(1.-abs(vUv.x-.5)*2.,.4):.15*stripe+edge*.58;gl_FragColor=vec4(mix(tint,vec3(1.),active*.45)*(1.+active*1.5),a);}`}));this.effects.add(mesh);this.hazardMap.set(h.id,mesh);}
   mesh.position.set((h.x+h.x2)/2,.13,(h.y+h.y2)/2);mesh.rotation.y=Math.atan2(h.x2-h.x,h.y2-h.y);mesh.scale.set(h.width*(h.delay>0?1.65:1),1,Math.hypot(h.x2-h.x,h.y2-h.y));mesh.material.uniforms.active.value=h.delay<=0?1:0;mesh.material.uniforms.uTime.value=state.time;
  }
  for(const [id,mesh] of this.hazardMap)if(!wanted.has(id)){this.effects.remove(mesh);mesh.geometry.dispose();mesh.material.dispose();this.hazardMap.delete(id);}
 }
 syncArcs(state){
  const a=this.arcLines.geometry.attributes.position.array;let k=0;
  for(const arc of state.arcs){for(let j=0;j<8&&k<598;j++){const t=j/8,t2=(j+1)/8,dx=arc.x2-arc.x,dy=arc.y2-arc.y,l=Math.max(.1,Math.hypot(dx,dy));const jitter=Math.sin(j*16.1+state.time*41)*.32,jitter2=Math.sin((j+1)*16.1+state.time*41)*.32;
   a[k*3]=arc.x+dx*t-dy/l*(j===0?0:jitter);a[k*3+1]=.8;a[k*3+2]=arc.y+dy*t+dx/l*(j===0?0:jitter);k++;
   a[k*3]=arc.x+dx*t2-dy/l*(j===7?0:jitter2);a[k*3+1]=.8;a[k*3+2]=arc.y+dy*t2+dx/l*(j===7?0:jitter2);k++;
  }}this.arcLines.geometry.setDrawRange(0,k);this.arcLines.geometry.attributes.position.needsUpdate=true;
 }
 syncParticles(dt){
  const s=this.state;if(!s)return;const paused=this.game.paused;
  if(!paused){
   for(const b of s.bullets)if(b.missile&&this.trails.length<750)this.trails.push({x:b.x,z:b.y,y:.52,life:.6,maxLife:.6,size:b.missileType===2?.8:.56,color:b.color});
   if(this.hero&&this.trails.length<750){const p=s.player;for(const side of [-1,1])this.trails.push({x:p.x+side*.66,z:p.y+1.9,y:.48,life:.34,maxLife:.34,size:p.dashTimer>0?.82:.44,color:AIRCRAFT[s.aircraft].color});}
   for(const q of this.trails){q.life-=dt;q.z+=dt*.55;}this.trails=this.trails.filter(q=>q.life>0);
  }
  let i=0;const put=(x,y,z,c,size,alpha)=>{if(i>=this.particleMax)return;this.positions[i*3]=x;this.positions[i*3+1]=y;this.positions[i*3+2]=z;colorTemp.set(c);colorTemp.toArray(this.particleColors,i*3);this.sizes[i]=size;this.alphas[i]=alpha;i++;};
  for(const q of s.particles)put(q.x,.6+(q.z||0),q.y,q.color,q.size*3,q.life/q.maxLife);
  for(const q of this.trails)put(q.x,q.y,q.z,q.color,q.size*(1+(1-q.life/q.maxLife)*.7),q.life/q.maxLife*.75);
  this.particles.geometry.setDrawRange(0,i);for(const a of Object.values(this.particles.geometry.attributes))a.needsUpdate=true;this.particles.material.uniforms.uRatio.value=this.renderer.getPixelRatio();
 }
 tick(dt){
  if(!this.state)return;const s=this.state,paused=this.game.paused,t=this.settings.reducedMotion?this.clock*.35:this.clock;
  this.skyUniforms.uTime.value=t;this.skyUniforms.uAspect.value=this.camera.aspect;for(const m of this.planetMaterials||[])m.uniforms.uTime.value=t;for(const r of this.rotators||[])r.obj.rotation[r.axis]+=dt*r.speed;
  if(this.stars&&!paused){const a=this.stars.geometry.attributes.position.array;for(let i=2;i<a.length;i+=3){a[i]+=dt*(s.player.dashTimer>0?12:1.6);if(a[i]>50)a[i]=-50;}this.stars.geometry.attributes.position.needsUpdate=true;}
  if(this.debris){for(let i=0;i<this.debrisData.length;i++){const d=this.debrisData[i];if(!paused){d.z+=dt*d.speed;if(d.z>44)d.z=-50;}temp.position.set(d.x,d.y,d.z);temp.rotation.set(d.spin+t*.035,d.spin+t*.05,d.spin);temp.scale.set(d.scale,d.scale*(s.chapter.biome===4?2.5:1),d.scale);temp.updateMatrix();this.debris.setMatrixAt(i,temp.matrix);}this.debris.instanceMatrix.needsUpdate=true;}
  animateModel(this.hero,t,s.player.dashTimer>0?2.7:1);this.wings?.forEach(m=>animateModel(m,t,.4));
  if(this.lastAspect!==this.camera.aspect){this.lastAspect=this.camera.aspect;this.fitCamera();}
  const shake=paused||this.settings.reducedMotion?0:s.shake*.22;this.camera.position.copy(this.baseCamera);this.camera.position.x+=Math.sin(t*61)*shake;this.camera.position.z+=Math.cos(t*73)*shake*.5;this.camera.lookAt(0,0,.3);
  this.flashLight.intensity=paused?0:Math.min(8,s.flash*20);this.flashLight.position.set(s.player.x,4,s.player.y);
  this.syncParticles(dt);
 }
 pointToWorld(clientX,clientY){const rect=this.renderer.domElement.getBoundingClientRect(),ndc=new THREE.Vector2((clientX-rect.left)/rect.width*2-1,-(clientY-rect.top)/rect.height*2+1),ray=new THREE.Raycaster();ray.setFromCamera(ndc,this.camera);const v=new THREE.Vector3();ray.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0,1,0),-.5),v);return {x:v.x,y:v.z};}
 dispose(){this.renderer.render=this.post.original;this.post.dispose();disposeTree(this.bg);this.sky.geometry.dispose();this.sky.material.dispose();this.nebulaTarget?.dispose();this.nebulaQuad.geometry.dispose();this.nebulaQuad.material.dispose();this.soft.dispose();this.pickupTextures?.forEach(t=>t.dispose());disposeModels();}
}

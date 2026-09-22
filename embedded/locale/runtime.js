(function (window) {
  'use strict';
  const document = window.document;
  const storageKey = 'amm_lab_locale';
  const valid = value => value === 'zh' || value === 'en';
  let saved;
  try { saved = window.localStorage.getItem(storageKey); } catch {}
  const query = new URLSearchParams(window.location.search).get('lang');
  let language = valid(query) ? query : valid(saved) ? saved : 'zh';
  if(valid(query))try{window.localStorage.setItem(storageKey,language);}catch{}
  const messages = new Map(), originals = new WeakMap(), attributes = new WeakMap(), patterns = [];
  let replacements = null;
  const escapeRegExp = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  function t(value) {
    if (typeof value !== 'string' || language === 'zh' || !value) return value;
    if (messages.has(value)) return messages.get(value);
    for(const [pattern,render] of patterns){const match=value.match(pattern);if(match)return render(...match.slice(1));}
    const trimmed = value.trim();
    if (messages.has(trimmed)) return value.slice(0, value.indexOf(trimmed)) + messages.get(trimmed) + value.slice(value.indexOf(trimmed) + trimmed.length);
    if (!/[\u3400-\u9fff]/.test(value)) return value;
    if (!replacements) {
      const keys = [...messages.keys()].filter(key => /[\u3400-\u9fff]/.test(key) && key.length).sort((a, b) => b.length - a.length);
      replacements = keys.length ? new RegExp('(?=('+keys.map(key=>/^[\u3400-\u9fff]$/.test(key)?'(?<![\\u3400-\\u9fff])'+escapeRegExp(key)+'(?![\\u3400-\\u9fff])':escapeRegExp(key)).join('|')+'))', 'g') : /$^/g;
    }
    // A short template prefix may begin before a complete phrase. Prefer its complete Chinese phrase,
    // rather than letting a separator-bearing prefix consume the first half of a name or mode.
    const candidates=[...value.matchAll(replacements)].map(match=>({start:match.index,end:match.index+match[1].length,key:match[1],letters:(match[1].match(/[\u3400-\u9fff]/g)||[]).length}));
    candidates.sort((a,b)=>b.letters-a.letters||b.key.length-a.key.length||a.start-b.start);
    const selected=[];for(const item of candidates)if(!selected.some(other=>item.start<other.end&&other.start<item.end))selected.push(item);
    selected.sort((a,b)=>a.start-b.start);let translated='',end=0;
    for(const item of selected){translated+=value.slice(end,item.start)+messages.get(item.key);end=item.end;}
    return translated+value.slice(end);
  }
  const excluded = 'script,style,textarea,input,code,pre,[contenteditable]:not([contenteditable="false"]),[data-locale-ignore],[translate="no"]';
  function skip(node) {
    const element = node.nodeType === 1 ? node : node.parentElement;
    return !!element && (/^(SCRIPT|STYLE|TEXTAREA|INPUT|CODE|PRE)$/.test(element.tagName) || !!element.closest?.(excluded));
  }
  function translateSiteLink(element) {
    if(element.tagName!=='A'||element.hasAttribute?.('download'))return;
    const href=element.getAttribute('href');if(!href||href.startsWith('#'))return;
    try{
      const url=new URL(href,window.location.href||window.location.origin+'/');
      if(url.origin!==window.location.origin||!/^\/(?:en\/)?(?:tools|games|articles|projects)(?:\/|$)/.test(url.pathname)||/\.[a-z0-9]+$/i.test(url.pathname))return;
      const path=url.pathname.replace(/^\/en(?=\/)/,'');url.pathname=language==='en'?'/en'+path:path;
      const localized=/^https?:\/\//i.test(href)?url.href:href.startsWith('//')?'//'+url.host+url.pathname+url.search+url.hash:url.pathname+url.search+url.hash;
      if(localized!==href)element.setAttribute('href',localized);
    }catch{}
  }
  function translateTree(root) {
    if (!root || skip(root)) return;
    if (root.nodeType === 3) {
      const previous = originals.get(root);
      const source = previous && root.nodeValue === previous.rendered ? previous.source : root.nodeValue;
      const rendered = t(source);
      originals.set(root, { source, rendered });
      if (root.nodeValue !== rendered) root.nodeValue = rendered;
      return;
    }
    if (root.nodeType === 1) {
      translateSiteLink(root);
      let stored = attributes.get(root);
      if (!stored) { stored = new Map(); attributes.set(root, stored); }
      for (const name of ['title', 'aria-label', 'placeholder', 'alt', ...(root.tagName === 'META' && root.getAttribute('name') === 'description' ? ['content'] : [])]) {
        const current = root.getAttribute?.(name);
        if (current === null || current === undefined) continue;
        const previous = stored.get(name);
        const source = previous && current === previous.rendered ? previous.source : current;
        const rendered = t(source);stored.set(name, { source, rendered });
        if (current !== rendered) root.setAttribute(name, rendered);
      }
    }
    for (const child of root.childNodes || []) translateTree(child);
  }
  // Input values and generated text are data. Only placeholder/accessibility copy is translated.
  function translateInputAttributes(root) {
    const elements=[...(root?.matches?.('input,textarea')?[root]:[]),...(root?.querySelectorAll?.('input,textarea')||[])];
    elements.forEach(element => {
      for (const name of ['title', 'aria-label', 'placeholder']) {
        const current = element.getAttribute(name);if (current === null) continue;
        let stored = attributes.get(element);if (!stored) { stored = new Map();attributes.set(element, stored); }
        const previous = stored.get(name), source = previous && current === previous.rendered ? previous.source : current, rendered = t(source);
        stored.set(name, { source, rendered });if (current !== rendered) element.setAttribute(name, rendered);
      }
    });
  }
  const canvases = new Set(), textures = new Set(), webglTextures = new Set(), contextRecords = new WeakMap(), canvasRecords = new WeakMap();
  const textureSources = new WeakMap(), liveCanvases = new Set(), liveDraw = new WeakMap();
  const canvasProperties = ['fillStyle','strokeStyle','font','textAlign','textBaseline','direction','globalAlpha','globalCompositeOperation','lineWidth','lineCap','lineJoin','miterLimit','lineDashOffset','shadowBlur','shadowColor','shadowOffsetX','shadowOffsetY','filter','imageSmoothingEnabled','imageSmoothingQuality','fontKerning','fontStretch','fontVariantCaps','letterSpacing','wordSpacing'];
  let replaying = false;
  function captureCanvasState(ctx) {
    return {properties:Object.fromEntries(canvasProperties.filter(name=>name in ctx).map(name=>[name,ctx[name]])),transform:ctx.getTransform?.(),dash:ctx.getLineDash?.()};
  }
  function applyCanvasState(ctx,state) {
    for(const [name,value] of Object.entries(state.properties))ctx[name]=value;
    if(state.transform){const m=state.transform;ctx.setTransform(m.a,m.b,m.c,m.d,m.e,m.f);}
    if(state.dash)ctx.setLineDash(state.dash);
  }
  function instrumentCanvas() {
    const proto = window.CanvasRenderingContext2D?.prototype;if (!proto) return;
    const measure=proto.measureText;
    if(measure)proto.measureText=function(text){return measure.call(this,t(text));};
    const methods = ['save','restore','resetTransform','setTransform','transform','translate','rotate','scale','beginPath','closePath','moveTo','lineTo','bezierCurveTo','quadraticCurveTo','arc','arcTo','ellipse','rect','roundRect','clip','fill','stroke','fillRect','strokeRect','clearRect','drawImage','putImageData','setLineDash','fillText','strokeText'];
    function record(ctx) { let state=contextRecords.get(ctx);if(!state){state={commands:[],localized:false,initial:captureCanvasState(ctx),truncated:false};contextRecords.set(ctx,state);canvasRecords.set(ctx.canvas,state);}return state; }
    function append(state,command) {if(state.truncated)return;if(state.commands.length>=20000){state.truncated=true;state.commands=[];return;}state.commands.push(command);}
    for (const name of methods) {
      const original = proto[name];if (typeof original !== 'function') continue;
      proto[name] = function (...args) {
        if (!replaying && !liveDraw.has(this.canvas)) {
          const state=record(this);
          append(state,[name,[...args]]);
          if(!state.localized && (((name==='fillText'||name==='strokeText') && /[\u3400-\u9fff]/.test(String(args[0]))) || (name==='drawImage' && canvasRecords.get(args[0])?.localized))){state.localized=true;canvases.add(new WeakRef(this));}
        }
        if(name==='fillText'||name==='strokeText') {
          const source=args[0],translated=t(source);
          if(source!==translated && args.length<4 && measure)args[3]=Math.max(1,measure.call(this,source).width);
          args[0]=translated;
        }
        return original.apply(this,args);
      };
    }
    for (const name of canvasProperties) {
      const descriptor=Object.getOwnPropertyDescriptor(proto,name);
      if(!descriptor?.set || !descriptor.configurable)continue;
      Object.defineProperty(proto,name,{...descriptor,set(value){if(!replaying&&!liveDraw.has(this.canvas)){const state=record(this);append(state,['=',name,value]);}descriptor.set.call(this,value);}});
    }
  }
  function redrawCanvases() {
    replaying=true;
    try { for (const ref of canvases) {
      const ctx=ref.deref();if(!ctx){canvases.delete(ref);continue;}
      const state=contextRecords.get(ctx);if(!state?.localized||state.truncated||liveDraw.has(ctx.canvas))continue;
      // reset clears pixels, path, clipping, transform and save stack; replay then restores the exact final state.
      if(ctx.reset)ctx.reset();else ctx.canvas.width=ctx.canvas.width;
      applyCanvasState(ctx,state.initial);
      for(const command of state.commands){if(command[0]==='=')ctx[command[1]]=command[2];else ctx[command[0]](...command[1]);}
    }} finally {replaying=false;}
    for(const ref of liveCanvases){const canvas=ref.deref();if(!canvas){liveCanvases.delete(ref);continue;}liveDraw.get(canvas)?.();}
    for(const ref of textures){const texture=ref.deref();if(!texture){textures.delete(ref);continue;}texture.needsUpdate=true;}
    for(const ref of webglTextures){const texture=ref.deref(),entry=texture&&textureSources.get(texture),gl=entry?.gl,canvas=entry?.canvas;if(!gl||!texture||!canvas||!gl.isTexture(texture)){webglTextures.delete(ref);if(texture)textureSources.delete(texture);continue;}const previous=gl.getParameter(gl.TEXTURE_BINDING_2D),flip=gl.getParameter(gl.UNPACK_FLIP_Y_WEBGL);gl.bindTexture(gl.TEXTURE_2D,texture);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,canvas);gl.generateMipmap(gl.TEXTURE_2D);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,flip);gl.bindTexture(gl.TEXTURE_2D,previous);}
  }
  function syncChildren() {
    document?.querySelectorAll?.('iframe').forEach(frame=>{try{frame.contentWindow?.postMessage({type:'amm-locale-sync',language},window.location.origin);}catch{}});
  }
  function refresh() {
    if(document){document.documentElement.lang=language==='en'?'en':'zh-CN';translateTree(document.documentElement);translateInputAttributes(document.documentElement);}
    redrawCanvases();syncChildren();
    document?.querySelectorAll?.('[data-amm-language]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.ammLanguage===language)));
  }
  function standaloneControl() {
    if(window.parent!==window||!document?.body||document.querySelector('[data-amm-locale-switch]'))return;
    const group=document.createElement('div');group.dataset.ammLocaleSwitch='';group.dataset.localeIgnore='';group.setAttribute('role','group');group.setAttribute('aria-label','Language / 语言');
    const isTool=/\/(salary|mortgage|text-tools)\//.test(window.location.pathname||'');
    group.style.cssText='position:fixed;z-index:2147483000;bottom:max(6px,env(safe-area-inset-bottom));display:flex;gap:2px;padding:3px;border:1px solid #95b7ba66;border-radius:8px;background:#163139ed;box-shadow:0 2px 10px #0003;color:#f2fbf7;font:600 11px/1.2 system-ui,sans-serif;'+(isTool?'right:12px;':'left:50%;transform:translateX(-50%);');
    for(const [code,label,title] of [['zh','中','中文'],['en','EN','English']]){const button=document.createElement('button');button.type='button';button.dataset.ammLanguage=code;button.textContent=label;button.title=title;button.setAttribute('aria-label',title);button.setAttribute('aria-pressed',String(code===language));button.style.cssText='min-width:32px;min-height:28px;padding:4px 7px;border:0;border-radius:5px;background:transparent;color:inherit;font:inherit;cursor:pointer;';button.addEventListener('click',()=>set(code));group.append(button);}
    const style=document.createElement('style');style.textContent='[data-amm-language][aria-pressed="true"]{background:#8be0c533!important;color:#d0ffee!important}[data-amm-language]:focus-visible{outline:2px solid #c8fff0;outline-offset:1px}';document.head.append(style);document.body.append(group);
  }
  function set(next, {notify=true,persist=true}={}) {
    if(!valid(next))return;
    const changed=next!==language;language=next;
    if(persist)try{window.localStorage.setItem(storageKey,language);}catch{}
    // Standalone reloads must follow both direct choices and cross-tab storage updates.
    // Embedded pages leave navigation and history to their parent application.
    if(window.parent===window&&window.history?.replaceState)try{
      const url=new URL(window.location.href);url.searchParams.set('lang',language);
      if(url.href!==window.location.href)window.history.replaceState(window.history.state,'',url.href);
    }catch{}
    if(changed){refresh();window.dispatchEvent(new CustomEvent('amm-locale-change',{detail:{language}}));}
    if(notify&&window.parent!==window)window.parent.postMessage({type:'amm-locale-set',language},window.location.origin);
  }
  window.AMMLocale = {
    get:()=>language,set,t,translateTree,refresh,
    register(values){for(const [source,translated] of Object.entries(values)){if(typeof translated==='string')messages.set(source,translated);}replacements=null;refresh();},
    registerPatterns(values){patterns.push(...values);refresh();},
    canvasTexture(texture){const ref=new WeakRef(texture);textures.add(ref);texture.addEventListener?.('dispose',()=>textures.delete(ref));return texture;},
    webglTexture(gl,texture,canvas){if(!textureSources.has(texture))webglTextures.add(new WeakRef(texture));textureSources.set(texture,{gl,canvas});return texture;},
    bindCanvas(canvas,draw){if(!canvas)return;if(!liveDraw.has(canvas))liveCanvases.add(new WeakRef(canvas));liveDraw.set(canvas,draw);const state=canvasRecords.get(canvas);if(state)state.commands=[];},
  };
  instrumentCanvas();
  window.addEventListener('message',event=>{
    if(event.origin!==window.location.origin || !event.data || !valid(event.data.language))return;
    const fromParent=window.parent!==window&&event.source===window.parent;
    const fromChild=[...(document?.querySelectorAll?.('iframe')||[])].some(frame=>frame.contentWindow===event.source);
    if(fromParent&&event.data.type==='amm-locale-sync')set(event.data.language,{notify:false});
    if(fromChild&&event.data.type==='amm-locale-ready')event.source.postMessage({type:'amm-locale-sync',language},event.origin);
    if(fromChild&&event.data.type==='amm-locale-set')set(event.data.language);
  });
  window.addEventListener('storage',event=>{if(event.key===storageKey&&valid(event.newValue))set(event.newValue,{notify:false,persist:false});});
  if(document){
    // Observe parser-created loading UI immediately; game startup can delay DOMContentLoaded.
    const observer=new window.MutationObserver(records=>{for(const record of records){translateTree(record.target);if(record.target.nodeType===1)translateInputAttributes(record.target);}});
    observer.observe(document.documentElement,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['aria-label','title','placeholder','alt','content','href']});
    refresh();
    const start=()=>{standaloneControl();refresh();};
    if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
  }
  if(window.parent!==window)window.parent.postMessage({type:'amm-locale-ready',language},window.location.origin);
})(window);

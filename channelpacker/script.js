class ChannelPackerError extends Error{constructor(e,t,a={}){super(e),this.name="ChannelPackerError",this.code=t,this.details=a,this.timestamp=new Date().toISOString()}}class ImageLoadError extends ChannelPackerError{constructor(e,t){super(e,"IMAGE_LOAD_ERROR",t),this.name="ImageLoadError"}}class ValidationError extends ChannelPackerError{constructor(e,t){super(e,"VALIDATION_ERROR",t),this.name="ValidationError"}}class ProcessingError extends ChannelPackerError{constructor(e,t){super(e,"PROCESSING_ERROR",t),this.name="ProcessingError"}}class ChannelPacker{#a=["red","green","blue","alpha"];#b=new Map;#c=null;#d=null;#e=[];#f=52428800;#g=new Set(["image/jpeg","image/jpg","image/png","image/webp","image/gif","image/bmp"]);static{this.VERSION="2.0.0",this.DEFAULT_QUALITY=.95,this.ANIMATION_DURATION=300}constructor(){this.init()}async init(){try{this.#h(),await this.#i(),this.#j(),this.#k(),console.info(`ChannelPacker v${ChannelPacker.VERSION} initialized successfully`)}catch(e){console.error("Failed to initialize ChannelPacker:",e),this.#l("Failed to initialize the application. Please refresh the page.",e)}}#h(){let requiredFeatures={"Canvas API":()=>!!document.createElement("canvas").getContext,"File API":()=>!!window.File&&!!window.FileReader&&!!window.FileList,"Drag and Drop":()=>"draggable"in document.createElement("div"),"Async/Await"(){try{return eval("(async () => {})"),!0}catch{return!1}},"ES2024 Features"(){try{return"function"==typeof Promise.withResolvers}catch{return!1}}},unsupported=Object.entries(requiredFeatures).filter(([,e])=>!e()).map(([e])=>e);if(unsupported.length>0)throw new ValidationError("Your browser does not support required features",{unsupportedFeatures:unsupported})}async #i(){let{promise:e,resolve:t,reject:a}=Promise.withResolvers();try{for(let r of this.#a)await this.#m(r);this.#n(),this.#o(),window.addEventListener("error",this.#p.bind(this)),window.addEventListener("unhandledrejection",this.#q.bind(this)),t()}catch(i){a(i)}return e}async #m(e){let t=this.#r(e);if(!t)throw new ValidationError(`Channel fieldset not found: ${e}`);let a=t.querySelector('input[type="file"]'),r=t.querySelector("button"),i=t.querySelector('input[type="checkbox"]');if(!a||!r||!i)throw new ValidationError(`Missing required elements for channel: ${e}`);let n;a.addEventListener("change",t=>{clearTimeout(n),n=setTimeout(()=>{this.#s(t,e).catch(t=>{console.error(`Failed to handle image upload for ${e}:`,t),this.#l(`Failed to load image for ${e} channel`,t)})},100)}),r.addEventListener("click",()=>{r.disabled=!0,a.click(),setTimeout(()=>{r.disabled=!1},500)}),i.addEventListener("change",()=>{this.#b.has(e)&&this.#t(e).catch(t=>{console.error(`Failed to update preview for ${e}:`,t),i.checked=!i.checked,this.#l("Failed to apply inversion",t)})}),this.#u(t,a)}#n(){let e=document.getElementById("pack-btn"),t=document.getElementById("download-btn");e?.addEventListener("click",async()=>{try{e.disabled=!0,await this.#v()}catch(t){console.error("Pack operation failed:",t),this.#l("Failed to pack channels",t)}finally{e.disabled=!1}}),t?.addEventListener("click",()=>{this.#w().catch(e=>{console.error("Download failed:",e),this.#l("Failed to download result",e)})})}#o(){document.querySelectorAll("fieldset[data-config] select");let e=document.querySelector("fieldset[data-config]");e?.addEventListener("change",e=>{e.target.matches("select")&&(this.#j(),this.#x())}),this.#y()}#u(e,t){let a=["dragenter","dragover","dragleave","drop"];a.forEach(t=>{e.addEventListener(t,this.#z,!1)});let r=0;e.addEventListener("dragenter",()=>{r++,e.setAttribute("data-drag-over","true"),e.style.transform="scale(1.02)"}),e.addEventListener("dragleave",()=>{0==--r&&(e.removeAttribute("data-drag-over"),e.style.transform="")}),e.addEventListener("drop",async a=>{r=0,e.removeAttribute("data-drag-over"),e.style.transform="";try{let i=Array.from(a.dataTransfer.files),n=i.find(e=>this.#g.has(e.type));if(!n){let o=i.map(e=>e.type).filter(Boolean);throw new ValidationError("Please drop a valid image file",{droppedTypes:o,supportedTypes:[...this.#g]})}let s=new DataTransfer;s.items.add(n),t.files=s.files,t.dispatchEvent(new Event("change",{bubbles:!0}))}catch(l){console.error("Drop handling failed:",l),this.#l("Failed to process dropped file",l)}})}async #s(e,t){let a=e.target.files?.[0];if(!a){this.#A(t);return}this.#d=new AbortController;try{await this.#B(a);let r=this.#r(t);r.classList.add("loading");let i=await this.#C(a,t);this.#b.set(t,{image:i,file:a,metadata:{originalSize:a.size,type:a.type,lastModified:a.lastModified,dimensions:{width:i.width,height:i.height}}}),await this.#t(t),this.#D(t),this.#j(),this.#E(),console.info(`Successfully loaded image for ${t} channel:`,{name:a.name,size:this.#F(a.size),dimensions:`${i.width}\xd7${i.height}`})}catch(n){if("AbortError"===n.name){console.info(`Upload cancelled for ${t} channel`);return}console.error(`Error loading image for ${t} channel:`,n),this.#l(`Failed to load image for ${t} channel`,n),this.#A(t)}finally{let o=this.#r(t);o.classList.remove("loading"),this.#d=null}}async #B(e){if(!e)throw new ValidationError("No file provided");if(!this.#g.has(e.type))throw new ValidationError(`Unsupported file type: ${e.type||"unknown"}`,{providedType:e.type,supportedTypes:[...this.#g]});if(e.size>this.#f)throw new ValidationError(`File too large: ${this.#F(e.size)}`,{maxSize:this.#F(this.#f),actualSize:this.#F(e.size)});try{let t=await e.slice(0,12).arrayBuffer(),a=new Uint8Array(t),r={jpeg:[255,216,255],png:[137,80,78,71],gif:[71,73,70],webp:[82,73,70,70],bmp:[66,77]},i=Object.values(r).some(e=>e.every((e,t)=>a[t]===e));if(!i&&"image/svg+xml"!==e.type)throw new ValidationError("File appears to be corrupted or is not a valid image",{fileSignature:Array.from(a.slice(0,4))})}catch(n){if(n instanceof ValidationError)throw n;console.warn("Could not validate file signature:",n)}}async #C(e,t){return new Promise((a,r)=>{let i=new FileReader,n=new Image;this.#d?.signal.addEventListener("abort",()=>{i.abort(),r(new DOMException("Image loading was cancelled","AbortError"))}),i.onprogress=e=>{if(e.lengthComputable){let a=e.loaded/e.total*100;this.#G(t,a)}},i.onload=e=>{n.onload=()=>{if(0===n.width||0===n.height){r(new ImageLoadError("Invalid image dimensions"));return}let e=8192;if(n.width>e||n.height>e){r(new ImageLoadError(`Image dimensions too large: ${n.width}\xd7${n.height}`,{maxDimension:e,actual:{width:n.width,height:n.height}}));return}a(n)},n.onerror=()=>{r(new ImageLoadError("Failed to decode image"))},n.crossOrigin="anonymous",n.src=e.target.result},i.onerror=()=>{r(new ImageLoadError("Failed to read file"))},i.readAsDataURL(e)})}#G(e,t){let a=this.#r(e),r=a.querySelector(".progress-bar")??this.#H(a);r.style.width=`${t}%`,r.setAttribute("aria-valuenow",t),t>=100&&setTimeout(()=>r.remove(),500)}#H(e){let t=document.createElement("div");return t.className="progress-bar",t.setAttribute("role","progressbar"),t.setAttribute("aria-valuemin","0"),t.setAttribute("aria-valuemax","100"),t.style.cssText=`
            position: absolute;
            bottom: 0;
            left: 0;
            height: 3px;
            background: var(--accent-gradient);
            transition: width 0.3s ease;
            z-index: 10;
        `,e.appendChild(t),t}async #t(e){let t=this.#r(e),a=t.querySelector("figure"),r=t.querySelector('input[type="checkbox"]'),i=this.#b.get(e);if(i)try{let{image:n,file:o,metadata:s}=i,l="undefined"!=typeof OffscreenCanvas?new OffscreenCanvas(n.width,n.height):document.createElement("canvas");l instanceof OffscreenCanvas||(l.width=n.width,l.height=n.height);let d=l.getContext("2d");d.drawImage(n,0,0),r.checked&&await this.#I(d,l.width,l.height);let c=l instanceof OffscreenCanvas?URL.createObjectURL(await l.convertToBlob({type:"image/jpeg",quality:.8})):l.toDataURL("image/jpeg",.8),h=document.createElement("img");h.src=c,h.alt=`${e} channel preview - ${o.name}${r.checked?" (inverted)":""}`,h.loading="lazy",h.decoding="async";let g=document.createElement("figcaption"),p=this.#F(o.size);g.innerHTML=`
                <strong>${this.#J(o.name)}</strong><br>
                ${n.width} \xd7 ${n.height}px • ${p}
                ${r.checked?"<br><em>Colors inverted</em>":""}
            `,a.style.opacity="0",requestAnimationFrame(()=>{a.innerHTML="",a.appendChild(h),a.appendChild(g),a.style.opacity="1",l instanceof OffscreenCanvas&&(h.onload=()=>URL.revokeObjectURL(c))})}catch(m){throw console.error(`Failed to update preview for ${e}:`,m),new ProcessingError(`Preview generation failed for ${e}`,{channel:e,error:m})}}async #I(e,t,a){let r=e.getImageData(0,0,t,a),i=r.data,n=new Uint32Array(i.buffer),o=1e3;for(let s=0;s<n.length;s+=o){let l=Math.min(s+o,n.length);for(let d=s;d<l;d++){let c=n[d];n[d]=4278190080&c|255-(c>>16&255)<<16|255-(c>>8&255)<<8|255-(255&c)}s%(10*o)==0&&await new Promise(e=>setTimeout(e,0))}e.putImageData(r,0,0)}async #v(){if(this.#b.size<2)throw new ValidationError("At least 2 images are required for packing",{currentCount:this.#b.size,requiredCount:2});let e=this.#K(),t=this.#L(),a=document.getElementById("download-btn");try{e.hidden=!1,t.innerHTML="",a.hidden=!0;let r={current:0,total:100},i=(e,t)=>{r.current=e,this.#M(r,t)};i(10,"Preparing channels..."),await new Promise(e=>requestAnimationFrame(e)),i(20,"Calculating dimensions...");let n=await this.#N(i);i(90,"Finalizing result..."),this.#O(n),a.hidden=!1,i(100,"Complete!"),console.info("Successfully packed channels:",{channels:[...this.#b.keys()],dimensions:`${n.width}\xd7${n.height}`,timestamp:new Date().toISOString()})}catch(o){throw console.error("Error packing channels:",o),new ProcessingError("Failed to pack channels",{loadedChannels:[...this.#b.keys()],error:o})}finally{e.hidden=!0}}async #N(e){let{width:t,height:a}=this.#P();e(30,"Loading configuration...");let[r,i]=document.querySelectorAll("fieldset[data-config] select"),n=r?.value==="white"?255:0,o=i?.value==="white"?255:0;e(40,"Processing channel data...");let s=await this.#Q(t,a,n,o,e);e(70,"Combining channels...");let l="undefined"!=typeof OffscreenCanvas?OffscreenCanvas:HTMLCanvasElement,d=new l(t,a),c=d.getContext("2d"),h=c.createImageData(t,a),g=h.data,p=t*a,m=Math.floor(p/10);for(let u=0;u<g.length;u+=4){let f=u/4,$=4*f;if(g[u]=s.red[$],g[u+1]=s.green[$],g[u+2]=s.blue[$],g[u+3]=s.alpha[$],f%m==0){let w=70+f/p*20;e(w,"Packing pixels..."),f%(5*m)==0&&await new Promise(e=>requestAnimationFrame(e))}}if(c.putImageData(h,0,0),d instanceof OffscreenCanvas){let y=document.createElement("canvas");y.width=t,y.height=a;let E=y.getContext("2d"),v=await d.convertToBlob(),b=await createImageBitmap(v);return E.drawImage(b,0,0),this.#c=y,y}return this.#c=d,d}#P(){let e=Array.from(this.#b.values()).map(e=>e.image);if(0===e.length)throw new ProcessingError("No images loaded");let t=e.map(e=>e.width),a=e.map(e=>e.height),r=Math.max(...t),i=Math.max(...a),n=8192;if(r>n||i>n)throw new ProcessingError(`Result dimensions exceed maximum: ${r}\xd7${i}`,{maxDimension:n,actual:{width:r,height:i}});return{width:r,height:i}}async #Q(e,t,a,r,i){let n={},o={current:0,total:this.#a.length};for(let s of this.#a){let l=40+o.current/o.total*25;if(i(l,`Processing ${s} channel...`),this.#b.has(s)){let d=this.#r(s),c=d?.querySelector('input[type="checkbox"]'),h=c?.checked??!1,g=await this.#R(this.#b.get(s).image,e,t,h),p=g.getContext("2d"),m=p.getImageData(0,0,e,t);n[s]=m.data}else{let u="alpha"===s?r:a;n[s]=this.#S(e,t,u)}o.current++}return n}#S(e,t,a){let r=e*t*4,i=new Uint8ClampedArray(r);if(255===a)i.fill(255);else for(let n=0;n<r;n+=4)i[n]=a,i[n+1]=a,i[n+2]=a,i[n+3]=255;return i}async #R(e,t,a,r=!1){let i="undefined"!=typeof OffscreenCanvas?OffscreenCanvas:HTMLCanvasElement,n=new i(t,a),o=n.getContext("2d",{alpha:!0,desynchronized:!0,willReadFrequently:r});o.imageSmoothingEnabled=!0,o.imageSmoothingQuality="high";let s=Math.min(t/e.width,a/e.height),l=e.width*s,d=e.height*s,c=(t-l)/2,h=(a-d)/2;if(o.clearRect(0,0,t,a),o.drawImage(e,c,h,l,d),r&&await this.#I(o,t,a),n instanceof OffscreenCanvas){let g=document.createElement("canvas");g.width=t,g.height=a;let p=g.getContext("2d"),m=await n.convertToBlob(),u=await createImageBitmap(m);return p.drawImage(u,0,0),g}return n}#O(e){let t=this.#L(),a=document.createElement("div");a.className="result-container";let r=document.createElement("h3");r.textContent="✅ Packed Result";let i={loaded:[],filled:[],inverted:[]};for(let n of this.#a)if(this.#b.has(n)){i.loaded.push(n);let o=this.#r(n),s=o?.querySelector('input[type="checkbox"]');s?.checked&&i.inverted.push(n)}else i.filled.push(n);let l=e.width*e.height*4/1024/1024,d=document.createElement("div");d.className="result-info",d.innerHTML=`
            <dl>
                <dt>Dimensions:</dt>
                <dd>${e.width} \xd7 ${e.height}px</dd>
                
                <dt>Loaded channels:</dt>
                <dd>${i.loaded.join(", ")||"None"}</dd>
                
                ${i.filled.length>0?`
                    <dt>Filled channels:</dt>
                    <dd>${i.filled.join(", ")}</dd>
                `:""}
                
                ${i.inverted.length>0?`
                    <dt>Inverted channels:</dt>
                    <dd>${i.inverted.join(", ")}</dd>
                `:""}
                
                <dt>Estimated size:</dt>
                <dd>~${l.toFixed(2)} MB (uncompressed)</dd>
            </dl>
        `;let c=document.createElement("div");c.className="canvas-wrapper",c.appendChild(e),a.appendChild(r),a.appendChild(d),a.appendChild(c),t.style.opacity="0",requestAnimationFrame(()=>{t.innerHTML="",t.appendChild(a),t.style.opacity="1"})}async #w(){if(!this.#c)throw new ValidationError("No result available for download");try{let e=await this.#T(),t="image/jpeg"===e?.95:void 0,a=await new Promise((a,r)=>{this.#c.toBlob(e=>e?a(e):r(Error("Failed to create blob")),e,t)}),r=new Date().toISOString().replace(/[:.]/g,"-").slice(0,-5),i=[...this.#b.keys()].join("_"),n=e.split("/")[1],o=`packed_${i}_${r}.${n}`,s=URL.createObjectURL(a),l=document.createElement("a");l.href=s,l.download=o,l.style.display="none",document.body.appendChild(l),l.click(),document.body.removeChild(l),setTimeout(()=>URL.revokeObjectURL(s),1e3),console.info("Downloaded packed result:",{filename:o,format:e,size:this.#F(a.size),timestamp:new Date().toISOString()}),this.#U("Download started successfully!","success")}catch(d){throw console.error("Download error:",d),new ProcessingError("Failed to download result",{error:d})}}async #T(){return"image/png"}#l(e,t){t&&console.error("Error details:",{message:t.message,code:t.code,details:t.details,stack:t.stack});let a=t?.details?.userMessage||e;this.#U(a,"error"),this.#V(t)}#U(e,t="info",a=[]){document.querySelectorAll(".notification").forEach(e=>e.remove());let r=document.createElement("div");r.className=`notification notification-${t}`,r.setAttribute("role","alert"),r.setAttribute("aria-live","polite");let i=document.createElement("p");if(i.textContent=e,r.appendChild(i),a.length>0){let n=document.createElement("div");n.className="notification-actions",a.forEach(({label:e,handler:t})=>{let a=document.createElement("button");a.textContent=e,a.addEventListener("click",t),n.appendChild(a)}),r.appendChild(n)}r.style.cssText=`
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            color: white;
            font-weight: 500;
            z-index: 1000;
            max-width: 400px;
            word-wrap: break-word;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
            animation: slideIn ${ChannelPacker.ANIMATION_DURATION}ms ease;
        `;let o={error:"#f44336",warning:"#ff9800",info:"#2196f3",success:"#4caf50"};r.style.backgroundColor=o[t]??o.info,document.body.appendChild(r);let s=setTimeout(()=>{r.parentNode&&(r.style.animation=`slideOut ${ChannelPacker.ANIMATION_DURATION}ms ease`,setTimeout(()=>r.remove(),ChannelPacker.ANIMATION_DURATION))},5e3);r.addEventListener("click",e=>{"BUTTON"!==e.target.tagName&&(clearTimeout(s),r.style.animation=`slideOut ${ChannelPacker.ANIMATION_DURATION}ms ease`,setTimeout(()=>r.remove(),ChannelPacker.ANIMATION_DURATION))})}#M(e,t){let a=this.#K(),r=a?.querySelector("p");r&&(r.textContent=`${t} (${Math.round(e.current)}%)`)}#x(){try{let e={rgbFill:document.querySelector("fieldset[data-config] select")?.value,alphaFill:document.querySelectorAll("fieldset[data-config] select")[1]?.value,version:ChannelPacker.VERSION};localStorage.setItem("channelPackerPrefs",JSON.stringify(e))}catch(t){console.warn("Failed to save preferences:",t)}}#y(){try{let e=localStorage.getItem("channelPackerPrefs");if(!e)return;let t=JSON.parse(e);if(t.version===ChannelPacker.VERSION){let a=document.querySelectorAll("fieldset[data-config] select");a[0]&&t.rgbFill&&(a[0].value=t.rgbFill),a[1]&&t.alphaFill&&(a[1].value=t.alphaFill)}}catch(r){console.warn("Failed to load preferences:",r)}}#k(){if(window.PerformanceObserver)try{let e=new PerformanceObserver(e=>{for(let t of e.getEntries())t.duration>50&&console.warn("Long task detected:",{duration:t.duration,startTime:t.startTime,name:t.name})});e.observe({entryTypes:["longtask"]})}catch(t){console.warn("Performance monitoring setup failed:",t)}}#p(e){console.error("Global error:",e.error),this.#V(e.error)}#q(e){console.error("Unhandled promise rejection:",e.reason),this.#V(e.reason)}#V(e){window.DEBUG&&(console.group("Error Report"),console.error("Error:",e),console.table({Message:e?.message,Code:e?.code,Type:e?.constructor?.name,Timestamp:new Date().toISOString()}),console.groupEnd())}#r(e){return document.querySelector(`fieldset[data-channel="${e}"]`)}#K(){return document.querySelector('aside[role="status"]')}#L(){return document.querySelector("output")}#z(e){e.preventDefault(),e.stopPropagation()}#D(e){let t=this.#r(e);t?.classList.add("has-image")}#A(e){this.#b.delete(e);let t=this.#r(e),a=t?.querySelector("figure"),r=t?.querySelector('input[type="checkbox"]'),i=t?.querySelector('input[type="file"]');t?.classList.remove("has-image"),a&&(a.innerHTML=""),r&&(r.checked=!1),i&&(i.value=""),this.#j()}#E(){let e=Array.from(this.#b.values()).map(e=>e.image);if(e.length<2)return;let t=e[0],a=e.every(e=>e.width===t.width&&e.height===t.height);if(!a){let r={};e.forEach(e=>{let t=`${e.width}\xd7${e.height}`;(r[t]??=[]).push(e)});let i=Object.entries(r).map(([e,t])=>`${e}: ${t.length} image(s)`).join(", ");this.#W(`Images have different dimensions. They will be resized to match the largest dimensions. (${i})`)}}#j(){let e=document.getElementById("pack-btn"),t=document.getElementById("pack-help"),a=this.#b.size;e&&t&&(a>=2?(e.disabled=!1,t.textContent=`Ready to pack ${a} channel${a>1?"s":""}`,t.style.color="var(--success-green)",e.setAttribute("aria-label",`Pack ${a} channels into RGBA image`)):(e.disabled=!0,t.textContent=`Requires at least 2 images (${a}/2)`,t.style.color="var(--medium-gray)",e.setAttribute("aria-label","Pack channels (disabled - requires at least 2 images)")))}#W(e){this.#U(e,"warning")}#F(e){let t=["B","KB","MB","GB"],a=e,r=0;for(;a>=1024&&r<t.length-1;)a/=1024,r++;return`${a.toFixed(2)} ${t[r]}`}#J(e){let t=document.createElement("div");return t.textContent=e,t.innerHTML}}const enhancedStyles=`
    /* Enhanced animations */
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
    
    @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
    }
    
    /* Enhanced notifications */
    .notification {
        cursor: pointer;
        transition: transform 0.2s ease;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }
    
    .notification:hover {
        transform: scale(1.02);
    }
    
    .notification p {
        margin: 0;
    }
    
    .notification-actions {
        display: flex;
        gap: 0.5rem;
    }
    
    .notification-actions button {
        background: rgba(255, 255, 255, 0.2);
        border: 1px solid rgba(255, 255, 255, 0.3);
        color: white;
        padding: 0.25rem 0.75rem;
        border-radius: 4px;
        cursor: pointer;
        font-size: 0.875rem;
        transition: background 0.2s ease;
    }
    
    .notification-actions button:hover {
        background: rgba(255, 255, 255, 0.3);
    }
    
    /* Loading state for fieldsets */
    fieldset[data-channel].loading {
        pointer-events: none;
        opacity: 0.7;
    }
    
    fieldset[data-channel].loading::after {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(255, 255, 255, 0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        animation: pulse 1s infinite;
    }
    
    /* Progress bar */
    .progress-bar {
        position: absolute;
        bottom: 0;
        left: 0;
        height: 3px;
        background: var(--accent-gradient);
        transition: width 0.3s ease;
        z-index: 10;
    }
    
    /* Result container enhancements */
    .result-container {
        animation: slideIn 0.5s ease;
    }
    
    .result-info dl {
        display: grid;
        grid-template-columns: auto 1fr;
        gap: 0.5rem;
        margin: 1rem 0;
        font-size: 0.9rem;
    }
    
    .result-info dt {
        font-weight: 600;
        color: var(--dark-gray);
    }
    
    .result-info dd {
        margin: 0;
        color: var(--medium-gray);
    }
    
    .canvas-wrapper {
        position: relative;
        display: inline-block;
        margin-top: 1rem;
    }
    
    /* Smooth transitions */
    output {
        transition: opacity 0.3s ease;
    }
    
    figure {
        transition: opacity 0.3s ease;
    }
`,styleElement=document.createElement("style");styleElement.textContent=enhancedStyles,document.head.appendChild(styleElement),"loading"===document.readyState?document.addEventListener("DOMContentLoaded",()=>{window.channelPacker=new ChannelPacker}):window.channelPacker=new ChannelPacker,"undefined"!=typeof module&&module.exports&&(module.exports={ChannelPacker,ChannelPackerError,ImageLoadError,ValidationError,ProcessingError});

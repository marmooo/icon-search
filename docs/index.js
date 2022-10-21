function loadConfig(){localStorage.getItem("darkMode")==1&&(document.documentElement.dataset.theme="dark")}function toggleDarkMode(){localStorage.getItem("darkMode")==1?(localStorage.setItem("darkMode",0),delete document.documentElement.dataset.theme):(localStorage.setItem("darkMode",1),document.documentElement.dataset.theme="dark")}function initSuggest(a,b){autocomplete({input:a,fetch:function(a,c){const d=b.filter(b=>b.startsWith(a));c(d)},render:function(b){const a=document.createElement("div");return a.textContent=b,a},onSelect:function(b){a.value=b,searchIcons()},minLength:0})}function initLightTags(){const a=10*1024*1024;return fetch(`${iconDB}/light.json`).then(a=>a.json()).then(d=>{let b=2,c=1;d.forEach(([e,f])=>{const d=b+f;lightTags.set(e,[b,d,c]),a<d?(b=2,c+=1):b=d+2})})}function initHeavyTags(){return fetch(`${iconDB}/heavy.json`).then(a=>a.json()).then(a=>{a.forEach(([a,b])=>{heavyTags.set(a,b)})})}function initCollections(){return fetch(`${iconDB}/collections.json`).then(a=>a.json()).then(a=>{a.forEach(a=>{collections.set(a.name,a),delete a.name})})}function initSearchTags(){const a=document.getElementById("searchText");return fetch(`${iconDB}/tags.json`).then(a=>a.json()).then(b=>{searchTags=new Set(b),initSuggest(a,b)})}function getSelectedIconPos(a){const b=[...document.getElementById("result").firstElementChild.children];return b.indexOf(a)}function showIconDetails(b){const a=new Image(128,128);a.setAttribute("decoding","async"),a.src=b.src;const c=document.getElementById("selectedIcon");c.firstElementChild.replaceWith(a)}function showIconSetDetails(c,b){const a=collections.get(b);document.getElementById("iconTags").textContent=c,document.getElementById("name").textContent=b,document.getElementById("name").href=a.homepage,document.getElementById("license").textContent=a.license,document.getElementById("license").href=a.licenseUrl,document.getElementById("author").textContent=a.author}function initIconTemplate(b){const a=new Image(b,b);return a.className="btn p-0",a.setAttribute("alt",""),a.setAttribute("role","button"),a.setAttribute("decoding","async"),a.setAttribute("data-bs-toggle","offcanvas"),a.setAttribute("data-bs-target","#details"),a.setAttribute("aria-controls","details"),a}function getPreviewIcon(b){const a=iconTemplate.cloneNode(),[c,d,e]=b;return a.onclick=()=>{selectedIconPos=getSelectedIconPos(a),showIconSetDetails(d,e),showIconDetails(a)},a.src="data:image/svg+xml;charset=utf-8,"+encodeURIComponent(c),a}function drawChunk(b){buffer+=b;const a=buffer.lastIndexOf("	]");if(a<0)return;const c=buffer.indexOf("	["),d=buffer.slice(c+1,a+2);buffer=buffer.slice(a+3);const e=JSON.parse(`[${d}]`);drawIcons(e)}function drawIcons(b){const a=searchResults.length;if(searchResults=[...searchResults,...b],pagingFrom<=a+b.length&&a<pagingTo){const b=pagingFrom<a?a:pagingFrom,c=pagingTo<=0?searchResults.slice(b):searchResults.slice(b,pagingTo);c.forEach((d,a)=>{const c=b+a;worker.postMessage(c)})}}function redrawIcons(b,c){document.getElementById("loading").classList.remove("d-none");const d=document.getElementById("result"),f=document.createElement("div");d.replaceChild(f,d.firstElementChild);const a=document.getElementById("searchText").value;if(searchResults.length<pagingTo)if(heavyTags.has(a)){const b=heavyTags.get(a)-1;pageNumForHeavyTags<b&&(pageNumForHeavyTags+=1,fetchIcons(a))}else buffer.trimEnd()!="]"&&fetchIcons(a);const e=document.getElementById("filterText").value;if(e!="")searchResults.map((a,b)=>{if(a[1].includes(e))return[a,b]}).filter(a=>a).slice(b,c).forEach(a=>{const[c,b]=a;worker.postMessage(b)});else{const a=searchResults.slice(b,c);a.forEach((d,a)=>{const c=b+a;worker.postMessage(c)})}document.getElementById("loading").classList.add("d-none")}function disablePagination(a,b){a.href=`?q=${b}&from=${pagingFrom}&to=${pagingTo}`,a.parentNode.classList.add("disabled"),a.setAttribute("tabindex",-1),a.setAttribute("aria-disabled",!0),a.onclick=a=>{a.preventDefault()}}function enablePagination(a,b,c){const[d,e]=c();a.href=`?q=${b}&from=${d}&to=${e}`,a.parentNode.classList.remove("disabled"),a.removeAttribute("tabindex"),a.removeAttribute("aria-disabled"),a.onclick=a=>{a.preventDefault(),[pagingFrom,pagingTo]=c(),redrawIcons(pagingFrom,pagingTo),setPagination(b)}}function getPrevIndex(){return pagingFrom-pagingSize<0?[0,pagingSize]:[pagingFrom-pagingSize,pagingTo-pagingSize]}function getNextIndex(){return searchResults.length<pagingTo?[0,pagingSize]:[pagingFrom+pagingSize,pagingTo+pagingSize]}function setPagination(a){const d=`?q=${a}&from=${pagingFrom}&to=${pagingTo}`;history.replaceState(null,null,d);const c=document.getElementById("prevIcons"),b=document.getElementById("nextIcons");pagingFrom-pagingSize<0?disablePagination(c,a):enablePagination(c,a,getPrevIndex),heavyTags.has(a)?pageNumForHeavyTags<pagesForHeavyTags.length-1?enablePagination(b,a,getNextIndex):searchResults.length<pagingTo?disablePagination(b,a):enablePagination(b,a,getNextIndex):searchResults.length<pagingTo?disablePagination(b,a):enablePagination(b,a,getNextIndex)}function initFilterTags(){filterTags=new Set,searchResults.forEach(a=>{const b=a[1].split(",");b.forEach(a=>{filterTags.add(a)})});const a=document.getElementById("filterText");initSuggest(a,[...filterTags])}function iconReader(c,b,a){return c.read().then(({done:e,value:d})=>{if(e){if(b.close(),!heavyTags.has(a))return;buffer.trimEnd()=="]"&&searchResults.length<pagingTo&&(pageNumForHeavyTags+=1,fetchIcons(a));return}const f=new TextDecoder("utf-8").decode(d);drawChunk(f),b.enqueue(d),iconReader(c,b,a)}).finally(()=>{document.getElementById("loading").classList.add("d-none"),document.getElementById("pagination").classList.remove("d-none"),setPagination(a),initFilterTags()})}let buffer="";function fetchIcons(a){if(lightTags.has(a)){const[b,c,d]=lightTags.get(a);return fetch(`${iconDB}/json/@rare.${d}.json`,{headers:{"content-type":"multipart/byteranges",range:`bytes=${b}-${c}`}}).then(a=>a.text()).then(a=>drawChunk(a)).finally(()=>{document.getElementById("loading").classList.add("d-none"),document.getElementById("pagination").classList.remove("d-none"),setPagination(a),initFilterTags()})}if(heavyTags.has(a)){const b=pagesForHeavyTags[pageNumForHeavyTags];return fetch(`${iconDB}/json/${a}.${b}.json`).then(b=>{const c=b.body.getReader();new ReadableStream({start(b){iconReader(c,b,a)}})})}return fetch(`${iconDB}/json/${a}.json`).then(b=>{const c=b.body.getReader();new ReadableStream({start(b){iconReader(c,b,a)}})})}function clearSearchCache(a){if(heavyTags.has(a)){const b=heavyTags.get(a);pagesForHeavyTags=Array(b).fill().map((b,a)=>a+1),shuffle(pagesForHeavyTags)}document.getElementById("filterText").value="",pageNumForHeavyTags=0,pagingFrom=0,pagingTo=pagingSize,searchResults=[],buffer="",prevSearchText=a}function searchIcons(){const b=document.getElementById("searchText"),a=b.value;if(prevSearchText==a)return;if(clearSearchCache(a),b.blur(),b.focus(),document.getElementById("loading").classList.remove("d-none"),document.getElementById("pagination").classList.add("d-none"),!searchTags.has(a)){document.getElementById("noTags").classList.remove("invisible");return}document.getElementById("noTags").classList.add("invisible");const c=document.getElementById("result"),d=document.createElement("div");c.replaceChild(d,c.firstElementChild),fetchIcons(a)}function filterIcons(a){const b=document.getElementById("searchText").value;pagingFrom=0,pagingTo=pagingSize;const c=`?q=${b}&from=0&to=${pagingSize}`;history.replaceState(null,null,c),searchResults.map((b,c)=>{if(b[1].includes(a))return[b,c]}).filter(a=>a).slice(0,pagingSize).forEach(a=>{const[c,b]=a;worker.postMessage(b)})}function filterResults(){const b=document.getElementById("result"),c=document.createElement("div");b.replaceChild(c,b.firstElementChild);const a=document.getElementById("filterText");a.blur(),a.focus(),filterIcons(a.value)}function sleep(a){return new Promise(b=>setTimeout(b,a))}function getOriginalSVG(){const a=pagingFrom+selectedIconPos;return searchResults[a][0]}async function copyToClipboard(){const a=document.getElementById("clipboard"),b=getOriginalSVG();await navigator.clipboard.writeText(b),a.textContent="✅ copied!",await sleep(2e3),a.textContent="Copy to clipboard"}function downloadSVG(){const b="icon.svg",c=getOriginalSVG(),a=document.createElement("a");a.href="data:text/plain;charset=utf-8,"+encodeURIComponent(c),a.download=b,a.style.display="none",document.body.appendChild(a),a.click(),document.body.removeChild(a)}function shuffle(a){for(let b=a.length;1<b;b--){const c=Math.floor(Math.random()*b);[a[c],a[b-1]]=[a[b-1],a[c]]}return a}loadConfig();const iconDB="https://icon-db.pages.dev",domParser=new DOMParser,worker=new Worker("worker.js");worker.addEventListener("message",a=>{const b=a.data,c=searchResults[b],d=getPreviewIcon(c);document.getElementById("result").firstElementChild.appendChild(d)});const searchParams=new Proxy(new URLSearchParams(location.search),{get:(a,b)=>a.get(b)}),collections=new Map,heavyTags=new Map,lightTags=new Map;let searchTags=new Set,filterTags=new Set,searchResults=[],pagesForHeavyTags=[],pageNumForHeavyTags=0,pagingFrom=0,pagingTo=300,pagingSize=300,previewSize=32,prevSearchText="",selectedIconPos;const iconTemplate=initIconTemplate(previewSize);searchParams.from&&(pagingFrom=parseInt(searchParams.from)),searchParams.to&&(pagingTo=parseInt(searchParams.to)),new bootstrap.Offcanvas(document.getElementById("details")),Promise.all([initSearchTags(),initCollections(),initHeavyTags(),initLightTags()]).then(()=>{const a=searchParams.q;a&&(document.getElementById("searchText").value=a,searchIcons())}),document.getElementById("toggleDarkMode").onclick=toggleDarkMode,document.getElementById("search").onclick=searchIcons,document.getElementById("searchText").onkeydown=a=>{a.key=="Enter"&&searchIcons()},document.getElementById("filter").onclick=filterResults,document.getElementById("filterText").onkeydown=a=>{a.key=="Enter"&&filterResults()},document.getElementById("download").onclick=downloadSVG,document.getElementById("clipboard").onclick=copyToClipboard,document.getElementById("pagingSize").onchange=a=>{pagingSize=parseInt(a.target.value),pagingFrom==0&&(pagingTo=pagingSize)},document.getElementById("previewSize").onchange=a=>{previewSize=a.target.value.split("x")[0],iconTemplate.setAttribute("width",previewSize),iconTemplate.setAttribute("height",previewSize);const b=document.getElementById("result");[...b.firstElementChild.children].forEach(a=>{a.setAttribute("width",previewSize),a.setAttribute("height",previewSize)})}
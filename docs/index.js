function loadConfig(){localStorage.getItem("darkMode")==1&&(document.documentElement.dataset.theme="dark")}function toggleDarkMode(){localStorage.getItem("darkMode")==1?(localStorage.setItem("darkMode",0),delete document.documentElement.dataset.theme):(localStorage.setItem("darkMode",1),document.documentElement.dataset.theme="dark")}function initSuggest(b,c){let a="";b.forEach(b=>{a+=`<option>${b}</option>`});const d=domParser.parseFromString(a,"text/html");c.replaceChildren(...d.body.childNodes)}function initHeavyTags(){return fetch("/icon-db/heavy.json").then(a=>a.json()).then(a=>{a.forEach(a=>{heavyTags.add(a)})})}function initCollections(){return fetch("/icon-db/collections.json").then(a=>a.json()).then(a=>{a.forEach(a=>{collections.set(a.name,a),delete a.name})})}function initSearchTags(){const a=document.getElementById("searchTags");return fetch("/icon-db/tags.json").then(a=>a.json()).then(b=>{searchTags=new Set(b),initSuggest(b,a)})}function getSelectedIconPos(a){const b=[...document.getElementById("result").firstElementChild.children];return b.indexOf(a)}function showIconDetails(b,c){const d=c[1],e=c[2];selectedIconPos=getSelectedIconPos(b),showIconSetDetails(d,e);const a=b.cloneNode(!0);a.removeAttribute("role"),a.removeAttribute("data-bs-toggle"),a.removeAttribute("data-bs-target"),a.removeAttribute("aria-controls"),a.setAttribute("width",128),a.setAttribute("height",128),a.onclick=null;const f=document.getElementById("selectedIcon");f.firstElementChild.replaceWith(a)}function showIconSetDetails(c,b){const a=collections.get(b);document.getElementById("iconTags").textContent=c,document.getElementById("name").textContent=b,document.getElementById("name").href=a.homepage,document.getElementById("license").textContent=a.license,document.getElementById("license").href=a.licenseUrl,document.getElementById("author").textContent=a.author}function getPreviewIcon(b,c){const d=domParser.parseFromString(b,"image/svg+xml"),a=d.documentElement;return a.onclick=()=>{showIconDetails(a,c)},a}function drawChunk(b){buffer+=b;const a=buffer.lastIndexOf("	]");if(a<0)return;const c=buffer.indexOf("	["),d=buffer.slice(c+1,a+2);buffer=buffer.slice(a+3);const e=JSON.parse(`[${d}]`);drawIcons(e)}function drawIcons(b){const a=searchResults.length;if(searchResults=[...searchResults,...b],pagingFrom<=a+b.length&&a<pagingTo){const b=pagingFrom<a?a:pagingFrom,c=pagingTo<=0?searchResults.slice(b):searchResults.slice(b,pagingTo);c.forEach((a,c)=>{const d=b+c;worker.postMessage([a[0],d,previewSize])})}}function redrawIcons(a,b){document.getElementById("loading").classList.remove("d-none");const c=document.getElementById("result"),e=document.createElement("div");if(c.replaceChild(e,c.firstElementChild),buffer.trimEnd()!="]"&&searchResults.length<pagingTo){byteFrom+=byteRange,byteTo+=byteRange;const a=document.getElementById("searchText").value;fetchIcons(a,byteFrom,byteTo)}const d=document.getElementById("filterText").value;if(d!="")searchResults.map((a,b)=>{if(a[1].includes(d))return[a,b]}).filter(a=>a).slice(a,b).forEach(a=>{const[b,c]=a;worker.postMessage([b[0],c,previewSize])});else{const c=searchResults.slice(a,b);c.forEach((b,c)=>{const d=a+c;worker.postMessage([b[0],d,previewSize])})}document.getElementById("loading").classList.add("d-none")}function disablePagination(a,b){a.href=`?q=${b}&from=${pagingFrom}&to=${pagingTo}`,a.parentNode.classList.add("disabled"),a.setAttribute("tabindex",-1),a.setAttribute("aria-disabled",!0),a.onclick=a=>{a.preventDefault()}}function enablePagination(a,b,c){const[d,e]=c();a.href=`?q=${b}&from=${d}&to=${e}`,a.parentNode.classList.remove("disabled"),a.removeAttribute("tabindex"),a.removeAttribute("aria-disabled"),a.onclick=a=>{a.preventDefault(),[pagingFrom,pagingTo]=c(),redrawIcons(pagingFrom,pagingTo),setPagination(b)}}function getPrevIndex(){return pagingFrom-pagingSize<0?[0,pagingSize]:[pagingFrom-pagingSize,pagingTo-pagingSize]}function getNextIndex(){return searchResults.length<pagingTo?[0,pagingSize]:[pagingFrom+pagingSize,pagingTo+pagingSize]}function setPagination(a){const d=`?q=${a}&from=${pagingFrom}&to=${pagingTo}`;history.replaceState(null,null,d);const b=document.getElementById("prevIcons"),c=document.getElementById("nextIcons");pagingFrom-pagingSize<0?disablePagination(b,a):enablePagination(b,a,getPrevIndex),searchResults.length<pagingTo?disablePagination(c,a):enablePagination(c,a,getNextIndex)}function initFilterTags(){filterTags=new Set,searchResults.forEach(a=>{const b=a[1].split(",");b.forEach(a=>{filterTags.add(a)})});const a=document.getElementById("filterTags");a.replaceChildren(),initSuggest(filterTags,a)}function iconReader(c,a,b){return c.read().then(({done:e,value:d})=>{if(e){a.close(),buffer.trimEnd()!="]"&&searchResults.length<pagingTo&&(byteFrom+=byteRange,byteTo+=byteRange,fetchIcons(b,byteFrom,byteTo));return}const f=new TextDecoder("utf-8").decode(d);drawChunk(f),a.enqueue(d),iconReader(c,a,b)}).finally(()=>{document.getElementById("loading").classList.add("d-none"),document.getElementById("pagination").classList.remove("d-none"),setPagination(b),initFilterTags()})}let buffer="";function fetchIcons(a,c,d){const b=document.getElementById("result"),e=document.createElement("div");return b.replaceChild(e,b.firstElementChild),heavyTags.has(a)?fetch(`/icon-db/json/${a}.json`,{headers:{"content-type":"multipart/byteranges",range:`bytes=${c}-${d}`}}).then(b=>{const c=b.body.getReader();new ReadableStream({start(b){iconReader(c,b,a)}})}):fetch(`/icon-db/json/${a}.json`).then(b=>{const c=b.body.getReader();new ReadableStream({start(b){iconReader(c,b,a)}})})}function searchIcons(){const a=document.getElementById("searchText");a.blur(),a.focus();const b=a.value;if(document.getElementById("loading").classList.remove("d-none"),document.getElementById("pagination").classList.add("d-none"),!searchTags.has(b)){document.getElementById("noTags").classList.remove("invisible");return}document.getElementById("noTags").classList.add("invisible"),fetchIcons(b,byteFrom,byteTo)}function filterIcons(a){const b=document.getElementById("searchText").value;pagingFrom=0,pagingTo=pagingSize;const c=`?q=${b}&from=0&to=${pagingSize}`;history.replaceState(null,null,c),searchResults.map((b,c)=>{if(b[1].includes(a))return[b,c]}).filter(a=>a).slice(0,pagingSize).forEach(a=>{const[b,c]=a;worker.postMessage([b[0],c,previewSize])})}function filterResults(){const b=document.getElementById("result"),c=document.createElement("div");b.replaceChild(c,b.firstElementChild);const a=document.getElementById("filterText");a.blur(),a.focus(),filterIcons(a.value)}function sleep(a){return new Promise(b=>setTimeout(b,a))}function getOriginalSVG(){const a=pagingFrom+selectedIconPos;return searchResults[a][0]}async function copyToClipboard(){const a=document.getElementById("clipboard"),b=getOriginalSVG();await navigator.clipboard.writeText(b),a.textContent="✅ copied!",await sleep(2e3),a.textContent="Copy to clipboard"}function downloadSVG(){const b="icon.svg",c=getOriginalSVG(),a=document.createElement("a");a.href="data:text/plain;charset=utf-8,"+encodeURIComponent(c),a.download=b,a.style.display="none",document.body.appendChild(a),a.click(),document.body.removeChild(a)}loadConfig();const domParser=new DOMParser,worker=new Worker("worker.js");worker.addEventListener("message",a=>{const[b,c]=a.data,d=searchResults[c],e=getPreviewIcon(b,d);document.getElementById("result").firstElementChild.appendChild(e)});const searchParams=new Proxy(new URLSearchParams(location.search),{get:(a,b)=>a.get(b)}),collections=new Map,heavyTags=new Set;let searchTags=new Set,filterTags=new Set,searchResults=[],pagingFrom=0,pagingTo=300,pagingSize=300,byteFrom=0,byteTo=1048575;const byteRange=1048575;let previewSize=32,prevSearchText="",selectedIconPos;searchParams.from&&(pagingFrom=parseInt(searchParams.from)),searchParams.to&&(pagingTo=parseInt(searchParams.to)),new bootstrap.Offcanvas(document.getElementById("details")),Promise.all([initSearchTags(),initCollections(),initHeavyTags()]).then(()=>{searchParams.q&&(prevSearchText=searchParams.q,document.getElementById("searchText").value=searchParams.q,searchIcons())}),document.getElementById("toggleDarkMode").onclick=toggleDarkMode,document.getElementById("search").onclick=searchIcons,document.getElementById("searchText").onkeydown=a=>{if(a.key=="Enter"){if(prevSearchText==a.target.value)return;document.getElementById("filterText").value="",pagingFrom=0,pagingTo=pagingSize,searchResults=[],buffer="",byteFrom=0,byteTo=byteRange,searchIcons()}},document.getElementById("filter").onclick=filterResults,document.getElementById("filterText").onkeydown=a=>{a.key=="Enter"&&filterResults()},document.getElementById("download").onclick=downloadSVG,document.getElementById("clipboard").onclick=copyToClipboard,document.getElementById("pagingSize").onchange=a=>{pagingSize=parseInt(a.target.value),pagingFrom==0&&(pagingTo=pagingSize)},document.getElementById("previewSize").onchange=a=>{previewSize=a.target.value.split("x")[0];const b=document.getElementById("result");[...b.firstElementChild.children].forEach(a=>{a.setAttribute("width",previewSize),a.setAttribute("height",previewSize)})}
function loadConfig(){localStorage.getItem("darkMode")==1&&(document.documentElement.dataset.theme="dark")}function toggleDarkMode(){localStorage.getItem("darkMode")==1?(localStorage.setItem("darkMode",0),delete document.documentElement.dataset.theme):(localStorage.setItem("darkMode",1),document.documentElement.dataset.theme="dark")}function initSuggest(b,c){let a="";b.forEach(b=>{a+=`<option>${b}</option>`});const d=domParser.parseFromString(a,"text/html");c.replaceChildren(...d.body.childNodes)}function initCollections(){return fetch("/icon-db/collections.json").then(a=>a.json()).then(a=>{a.forEach(a=>{collections.set(a.name,a),delete a.name})})}function initSearchTags(){const a=document.getElementById("searchTags");return fetch("/icon-db/tags.json").then(a=>a.json()).then(b=>{searchTags=new Set(b),initSuggest(b,a)})}function getSelectedIconPos(a){const b=[...document.getElementById("result").firstElementChild.children];return console.log(b.indexOf(a)),b.indexOf(a)}function showIconDetails(b,c){const d=c[1],e=c[2];selectedIconPos=getSelectedIconPos(b),showIconSetDetails(d,e);const a=b.cloneNode(!0);a.removeAttribute("role"),a.removeAttribute("data-bs-toggle"),a.removeAttribute("data-bs-target"),a.removeAttribute("aria-controls"),a.setAttribute("width",128),a.setAttribute("height",128),a.onclick=null;const f=document.getElementById("selectedIcon");f.firstElementChild.replaceWith(a)}function showIconSetDetails(c,b){const a=collections.get(b);document.getElementById("iconTags").textContent=c,document.getElementById("name").textContent=b,document.getElementById("name").href=a.homepage,document.getElementById("license").textContent=a.license,document.getElementById("license").href=a.licenseUrl,document.getElementById("author").textContent=a.author}function getPreviewIcon(b){const c=domParser.parseFromString(b[0],"image/svg+xml"),a=c.documentElement;return a.setAttribute("width",previewSize),a.setAttribute("height",previewSize),a.setAttribute("role","button"),a.setAttribute("data-bs-toggle","offcanvas"),a.setAttribute("data-bs-target","#details"),a.setAttribute("aria-controls","details"),a.onclick=()=>{showIconDetails(a,b)},a}function drawChunk(b,c){buffer+=b;const a=buffer.lastIndexOf("	]");if(a<0)return;const d=buffer.slice(renderStartPos,a+2);renderStartPos=0,buffer=buffer.slice(a+3);const e=JSON.parse(`[${d}]`);drawIcons(e,c)}function drawIcons(b,c){const a=searchResults.length;if(searchResults=[...searchResults,...b],pagingFrom<=a+b.length&&a<pagingTo){const b=pagingFrom<a?a:pagingFrom,d=pagingTo<=0?searchResults.slice(b):searchResults.slice(b,pagingTo);d.forEach(b=>{const a=getPreviewIcon(b);c.appendChild(a),uniqIds(a)})}}function redrawIcons(c,d){document.getElementById("loading").classList.remove("d-none");const a=document.getElementById("result"),b=document.createElement("div");a.replaceChild(b,a.firstElementChild);const e=searchResults.slice(c,d);e.forEach(c=>{const a=getPreviewIcon(c);b.appendChild(a),uniqIds(a)}),document.getElementById("loading").classList.add("d-none")}function disablePagination(a,b){a.href=`?q=${b}&from=${pagingFrom}&to=${pagingTo}`,a.parentNode.classList.add("disabled"),a.setAttribute("tabindex",-1),a.setAttribute("aria-disabled",!0),a.onclick=a=>{a.preventDefault()}}function enablePagination(a,b,c){const[d,e]=c();a.href=`?q=${b}&from=${d}&to=${e}`,a.parentNode.classList.remove("disabled"),a.removeAttribute("tabindex"),a.removeAttribute("aria-disabled"),a.onclick=a=>{a.preventDefault(),[pagingFrom,pagingTo]=c(),redrawIcons(pagingFrom,pagingTo),setPagination(b)}}function getPrevIndex(){return pagingFrom-pagingNum<0?[0,pagingNum]:[pagingFrom-pagingNum,pagingTo-pagingNum]}function getNextIndex(){return searchResults.length<pagingTo?[0,pagingNum]:[pagingFrom+pagingNum,pagingTo+pagingNum]}function setPagination(a){const d=`?q=${a}&from=${pagingFrom}&to=${pagingTo}`;history.replaceState(null,null,d);const b=document.getElementById("prevIcons"),c=document.getElementById("nextIcons");pagingFrom-pagingNum<0?disablePagination(b,a):enablePagination(b,a,getPrevIndex),searchResults.length<pagingTo?disablePagination(c,a):enablePagination(c,a,getNextIndex)}function initFilterTags(){filterTags=new Set,searchResults.forEach(a=>{const b=a[1].split(",");b.forEach(a=>{filterTags.add(a)})});const a=document.getElementById("filterTags");a.replaceChildren(),initSuggest(filterTags,a)}function iconReader(b,a,c,d){return b.read().then(({done:f,value:e})=>{if(f){a.close(),renderStartPos=1,buffer="",document.getElementById("loading").classList.add("d-none"),document.getElementById("pagination").classList.remove("d-none"),setPagination(c),initFilterTags();return}const g=new TextDecoder("utf-8").decode(e);drawChunk(g,d),a.enqueue(e),iconReader(b,a,c,d)})}let renderStartPos=1,buffer="";function fetchIcons(a){const b=document.getElementById("result"),c=document.createElement("div");return b.replaceChild(c,b.firstElementChild),fetch(`/icon-db/json/${a}.json`).then(b=>{const d=b.body.getReader();new ReadableStream({start(b){iconReader(d,b,a,c)}})})}function uniqIds(a){a.querySelectorAll("[id]").forEach(c=>{const d=c.id,b=Math.random().toString(16).slice(2),e=new RegExp(`url\\(#${d}\\);?`,"g");c.id=b,[...a.getElementsByTagName("*")].forEach(a=>{[...a.attributes].forEach(f=>{const c=f.name,d=f.value;if(c=="xlink:href"&&d.startsWith("#"))a.setAttribute(c,`#${b}`);else{const f=d.replace(e,`url(#${b});`);d!=f&&a.setAttribute(c,f)}})})})}function searchIcons(){const a=document.getElementById("searchText");a.blur(),a.focus();const b=a.value;if(document.getElementById("loading").classList.remove("d-none"),document.getElementById("pagination").classList.add("d-none"),!searchTags.has(b)){document.getElementById("noTags").classList.remove("invisible");return}document.getElementById("noTags").classList.add("invisible"),fetchIcons(b)}function filterIcons(b,a){searchResults.forEach((d,c)=>{d[1].includes(b)?a[c].classList.remove("d-none"):a[c].classList.add("d-none")})}function filterResults(){const b=document.getElementById("result"),c=[...b.firstElementChild.children],a=document.getElementById("filterText");a.blur(),a.focus(),filterIcons(a.value,c)}function sleep(a){return new Promise(b=>setTimeout(b,a))}function getOriginalSVG(b){const a=pagingFrom+selectedIconPos;return searchResults[a][0]}async function copyToClipboard(){const a=document.getElementById("clipboard"),b=getOriginalSVG();await navigator.clipboard.writeText(b),a.textContent="✅ copied!",await sleep(2e3),a.textContent="Copy to clipboard"}function downloadSVG(){const b="icon.svg",c=getOriginalSVG(),a=document.createElement("a");a.href="data:text/plain;charset=utf-8,"+encodeURIComponent(c),a.download=b,a.style.display="none",document.body.appendChild(a),a.click(),document.body.removeChild(a)}loadConfig();const domParser=new DOMParser,searchParams=new Proxy(new URLSearchParams(location.search),{get:(a,b)=>a.get(b)}),collections=new Map;let searchTags=new Set,filterTags=new Set,searchResults=[],pagingFrom=0,pagingTo=300,pagingNum=300,previewSize=32,prevSearchText="",selectedIconPos;searchParams.from&&(pagingFrom=parseInt(searchParams.from)),searchParams.to&&(pagingTo=parseInt(searchParams.to)),new bootstrap.Offcanvas(document.getElementById("details")),Promise.all([initSearchTags(),initCollections()]).then(()=>{searchParams.q&&(prevSearchText=searchParams.q,document.getElementById("searchText").value=searchParams.q,searchIcons())}),document.getElementById("toggleDarkMode").onclick=toggleDarkMode,document.getElementById("search").onclick=searchIcons,document.getElementById("searchText").onkeydown=a=>{if(a.key=="Enter"){if(prevSearchText==a.target.value)return;pagingFrom=0,pagingTo=pagingNum,searchResults=[],searchIcons()}},document.getElementById("filter").onclick=filterResults,document.getElementById("filterText").onkeydown=a=>{a.key=="Enter"&&filterResults()},document.getElementById("download").onclick=downloadSVG,document.getElementById("clipboard").onclick=copyToClipboard,document.getElementById("pagingNum").onchange=a=>{pagingNum=parseInt(a.target.value),pagingFrom==0&&(pagingTo=pagingNum)},document.getElementById("previewSize").onchange=a=>{previewSize=a.target.value.split("x")[0];const b=document.getElementById("result");[...b.firstElementChild.children].forEach(a=>{a.setAttribute("width",previewSize),a.setAttribute("height",previewSize)})}
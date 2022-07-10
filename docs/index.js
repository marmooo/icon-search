function loadConfig(){localStorage.getItem("darkMode")==1&&(document.documentElement.dataset.theme="dark")}function toggleDarkMode(){localStorage.getItem("darkMode")==1?(localStorage.setItem("darkMode",0),delete document.documentElement.dataset.theme):(localStorage.setItem("darkMode",1),document.documentElement.dataset.theme="dark")}function initSuggest(b,c){let a="";b.forEach(b=>{a+=`<option>${b}</option>`}),c.insertAdjacentHTML("beforeend",a)}function initCollections(){return fetch("/icon-db/collections.json").then(a=>a.json()).then(a=>{a.forEach(a=>{collections.set(a.name,a),delete a.name})})}function initSearchTags(){const a=document.getElementById("searchTags");return fetch("/icon-db/tags.json").then(a=>a.json()).then(b=>{searchTags=new Set(b),initSuggest(b,a)})}function showIconDetails(c,b){const d=b[1],e=b[2];showIconSetDetails(d,e);const a=c.cloneNode(!0);a.removeAttribute("role"),a.removeAttribute("data-bs-toggle"),a.removeAttribute("data-bs-target"),a.removeAttribute("aria-controls"),a.setAttribute("width",128),a.setAttribute("height",128),a.onclick=null;const f=document.getElementById("selectedIcon");f.firstElementChild.replaceWith(a)}function showIconSetDetails(c,b){const a=collections.get(b);document.getElementById("iconTags").textContent=c,document.getElementById("name").textContent=b,document.getElementById("name").href=a.homepage,document.getElementById("license").textContent=a.license,document.getElementById("license").href=a.licenseUrl,document.getElementById("author").textContent=a.author}function getPreviewIcon(b,c){const d=c.parseFromString(b[0],"image/svg+xml"),a=d.documentElement;return a.setAttribute("width",previewSize),a.setAttribute("height",previewSize),a.setAttribute("role","button"),a.setAttribute("data-bs-toggle","offcanvas"),a.setAttribute("data-bs-target","#details"),a.setAttribute("aria-controls","details"),a.onclick=()=>{showIconDetails(a,b)},a}function draw(b,c,d){buffer+=b;const a=buffer.lastIndexOf("	]");if(a<0)return;const e=buffer.slice(renderStartPos,a+2);renderStartPos=0,buffer=buffer.slice(a+3);const f=JSON.parse(`[${e}]`);drawIcons(f,c,d)}function drawIcons(b,c,d){const a=searchResults.length;if(searchResults=[...searchResults,...b],pagingFrom<=a+b.length&&a<pagingTo){const b=pagingFrom<a?a:pagingFrom,e=pagingTo<=0?searchResults.slice(b):searchResults.slice(b,pagingTo);e.forEach(b=>{const a=getPreviewIcon(b,d);c.appendChild(a),uniqIds(a)})}}function redrawIcons(c,d){const a=document.getElementById("result"),b=document.createElement("div");a.replaceChild(b,a.firstChild);const e=new DOMParser,f=searchResults.slice(c,d);f.forEach(c=>{const a=getPreviewIcon(c,e);b.appendChild(a),uniqIds(a)})}function disablePagination(a,b){pagingFrom=0,pagingTo=pagingNum,a.href=`?q=${b}&from=${pagingFrom}&to=${pagingTo}`,a.parentNode.classList.add("disabled"),a.setAttribute("tabindex",-1),a.setAttribute("aria-disabled",!0),a.onclick=a=>{a.preventDefault()}}function getPrevIndex(){return pagingFrom-pagingNum<0?[0,pagingNum]:[pagingFrom-pagingNum,pagingTo-pagingNum]}function getNextIndex(){return searchResults.length<pagingTo?[0,pagingFrom-pagingNum]:[pagingFrom+pagingNum,pagingTo+pagingNum]}function setPagination(a){const d=`?q=${a}&from=${pagingFrom}&to=${pagingTo}`;history.replaceState(null,null,d);const b=document.getElementById("prevIcons"),c=document.getElementById("nextIcons"),[e,f]=getPrevIndex();pagingFrom-pagingNum<0?disablePagination(b,a):(b.href=`?q=${a}&from=${e}&to=${f}`,b.parentNode.classList.remove("disabled"),b.removeAttribute("tabindex"),b.removeAttribute("aria-disabled"),b.onclick=b=>{b.preventDefault(),[pagingFrom,pagingTo]=getPrevIndex(),redrawIcons(pagingFrom,pagingTo),setPagination(a)});const[g,h]=getNextIndex();searchResults.length<pagingTo?disablePagination(c,a):(c.href=`?q=${a}&from=${g}&to=${h}`,c.parentNode.classList.remove("disabled"),c.removeAttribute("tabindex"),c.removeAttribute("aria-disabled"),c.onclick=b=>{b.preventDefault(),[pagingFrom,pagingTo]=getNextIndex(),redrawIcons(pagingFrom,pagingTo),setPagination(a)})}function initFilterTags(){filterTags=new Set,searchResults.forEach(a=>{const b=a[1].split(",");b.forEach(a=>{filterTags.add(a)})});const a=document.getElementById("filterTags");a.replaceChildren(),initSuggest(filterTags,a)}function iconReader(b,a,c,d,e){return b.read().then(({done:g,value:f})=>{if(g){a.close(),renderStartPos=1,buffer="",document.getElementById("pagination").classList.remove("d-none"),setPagination(c),initFilterTags();return}const h=new TextDecoder("utf-8").decode(f);draw(h,d,e),a.enqueue(f),iconReader(b,a,c,d,e)})}let renderStartPos=1,buffer="";function fetchIcons(a){const b=document.getElementById("result"),c=document.createElement("div");b.replaceChild(c,b.firstChild);const d=new DOMParser;return fetch(`/icon-db/json/${a}.json`).then(b=>{const e=b.body.getReader();new ReadableStream({start(b){iconReader(e,b,a,c,d)}})})}function uniqIds(a){a.querySelectorAll("[id]").forEach(c=>{const d=c.id,b=Math.random().toString(16).slice(2),e=new RegExp(`url\\(#${d}\\);?`,"g");c.id=b,[...a.getElementsByTagName("*")].forEach(a=>{[...a.attributes].forEach(f=>{const c=f.name,d=f.value;if(c=="xlink:href"&&d.startsWith("#"))a.setAttribute(c,`#${b}`);else{const f=d.replace(e,`url(#${b});`);d!=f&&a.setAttribute(c,f)}})})})}function searchIcons(){const a=document.getElementById("searchText");a.blur(),a.focus();const b=a.value;if(document.getElementById("pagination").classList.add("d-none"),!searchTags.has(b)){document.getElementById("noTags").classList.remove("invisible");return}document.getElementById("noTags").classList.add("invisible"),fetchIcons(b)}function filterIcons(b,a){searchResults.forEach((d,c)=>{d[1].includes(b)?a[c].classList.remove("d-none"):a[c].classList.add("d-none")})}function filterResults(){const b=[...document.getElementById("result").firstChild.children],a=document.getElementById("filterText");a.blur(),a.focus(),filterIcons(a.value,b)}function sleep(a){return new Promise(b=>setTimeout(b,a))}async function copyToClipboard(){const a=document.getElementById("clipboard"),b=document.getElementById("selectedIcon").innerHTML.trim();await navigator.clipboard.writeText(b),a.textContent="✅ copied!",await sleep(2e3),a.textContent="Copy to clipboard"}function downloadSVG(){const b="icon.svg",c=document.getElementById("selectedIcon").innerHTML.trim(),a=document.createElement("a");a.setAttribute("href","data:text/plain;charset=utf-8,"+encodeURIComponent(c)),a.setAttribute("download",b),a.style.display="none",document.body.appendChild(a),a.click(),document.body.removeChild(a)}loadConfig();const searchParams=new Proxy(new URLSearchParams(location.search),{get:(a,b)=>a.get(b)}),collections=new Map;let searchTags=new Set,filterTags=new Set,searchResults=[],pagingFrom=0,pagingTo=300,pagingNum=300,previewSize=32,prevSearchText="";searchParams.from&&(pagingFrom=parseInt(searchParams.from)),searchParams.to&&(pagingTo=parseInt(searchParams.to)),new bootstrap.Offcanvas(document.getElementById("details")),Promise.all([initSearchTags(),initCollections()]).then(()=>{searchParams.q&&(prevSearchText=searchParams.q,document.getElementById("searchText").value=searchParams.q,searchIcons())}),document.getElementById("toggleDarkMode").onclick=toggleDarkMode,document.getElementById("search").onclick=searchIcons,document.getElementById("searchText").onkeydown=a=>{if(a.key=="Enter"){if(prevSearchText==a.target.value)return;searchResults=[],searchIcons()}},document.getElementById("filter").onclick=filterResults,document.getElementById("filterText").onkeydown=a=>{a.key=="Enter"&&filterResults()},document.getElementById("download").onclick=downloadSVG,document.getElementById("clipboard").onclick=copyToClipboard,document.getElementById("pagingNum").onchange=a=>{pagingNum=parseInt(a.target.value),pagingFrom==0&&(pagingTo=pagingNum)},document.getElementById("previewSize").onchange=a=>{previewSize=a.target.value.split("x")[0];const b=document.getElementById("result");[...b.firstChild.children].forEach(a=>{a.setAttribute("width",previewSize),a.setAttribute("height",previewSize)})}
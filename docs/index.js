function loadConfig(){localStorage.getItem("darkMode")==1&&(document.documentElement.dataset.theme="dark")}function toggleDarkMode(){localStorage.getItem("darkMode")==1?(localStorage.setItem("darkMode",0),delete document.documentElement.dataset.theme):(localStorage.setItem("darkMode",1),document.documentElement.dataset.theme="dark")}function initSuggest(a,b){a.forEach(a=>{searchTags.add(a);const c=document.createElement("option");c.textContent=a,b.appendChild(c)})}function initCollections(){fetch("/icon-db/collections.json").then(a=>a.json()).then(a=>{a.forEach(a=>{collections.set(a.name,a),delete a.name})})}function initTags(){const a=document.getElementById("searchTags");fetch("/icon-db/tags.json").then(a=>a.json()).then(b=>initSuggest(b,a))}function showIconDetails(c,b){const d=b[1],e=b[2];showIconSetDetails(d,e);const a=c.cloneNode(!0);a.removeAttribute("role"),a.removeAttribute("data-bs-toggle"),a.removeAttribute("data-bs-target"),a.removeAttribute("aria-controls"),a.setAttribute("width",128),a.setAttribute("height",128),a.onclick=null;const f=document.getElementById("selectedIcon");f.firstElementChild.replaceWith(a)}function showIconSetDetails(c,b){const a=collections.get(b);document.getElementById("iconTags").textContent=c,document.getElementById("name").textContent=b,document.getElementById("name").href=a.homepage,document.getElementById("license").textContent=a.license,document.getElementById("license").href=a.licenseUrl,document.getElementById("author").textContent=a.author}function getPreviewIcon(b,c,d){const e=d.parseFromString(b[0],"image/svg+xml");b[0]=null;const a=e.documentElement;return a.setAttribute("width",c),a.setAttribute("height",c),a.setAttribute("role","button"),a.setAttribute("data-bs-toggle","offcanvas"),a.setAttribute("data-bs-target","#details"),a.setAttribute("aria-controls","details"),a.onclick=()=>{showIconDetails(a,b)},a}function draw(b,c,d,e){buffer+=b;const a=buffer.lastIndexOf("	]");if(a<0)return;const f=buffer.slice(renderStartPos,a+2);renderStartPos=0,buffer=buffer.slice(a+3);const g=JSON.parse(`[${f}]`);drawIcons(g,c,d,e)}function drawIcons(a,b,c,d){searchResults=[...searchResults,...a],a.forEach(e=>{const a=getPreviewIcon(e,c,d);b.appendChild(a),uniqIds(a)})}let renderStartPos=1,buffer="";function fetchIcons(a){if(searchTags.has(a)===!1){document.getElementById("noTags").classList.remove("invisible");return}document.getElementById("noTags").classList.add("invisible");const d=document.getElementById("previewSize").value.split("x")[0],b=document.getElementById("result"),c=document.createElement("div");b.replaceChild(c,b.firstChild);const e=new DOMParser;return fetch(`/icon-db/json/${a}.json`).then(a=>{const b=a.body.getReader(),f=new ReadableStream({start(a){function f(){b.read().then(({done:g,value:b})=>{if(g){a.close(),renderStartPos=1,buffer="";return}const h=new TextDecoder("utf-8").decode(b);draw(h,c,d,e),a.enqueue(b),f()})}f()}});return new Response(f,{headers:{"Content-Type":"application/json"}})})}function uniqIds(a){a.querySelectorAll("[id]").forEach(c=>{const d=c.id,b=Math.random().toString(16).slice(2),e=new RegExp(`url\\(#${d}\\);?`,"g");c.id=b,[...a.getElementsByTagName("*")].forEach(a=>{[...a.attributes].forEach(f=>{const c=f.name,d=f.value;if(c=="xlink:href"&&d.startsWith("#"))a.setAttribute(c,`#${b}`);else{const f=d.replace(e,`url(#${b});`);d!=f&&a.setAttribute(c,f)}})})})}function searchIcons(){const a=document.getElementById("searchText");a.blur(),a.focus(),fetchIcons(a.value).then(()=>{filterTags=new Set,searchResults.forEach(a=>{const b=a[1].split(",");b.forEach(a=>{filterTags.add(a)})});const a=document.getElementById("filterTags");a.replaceChildren(),initSuggest(filterTags,a)})}function filterIcons(b,a){searchResults.forEach((d,c)=>{d[1].includes(b)?a[c].classList.remove("d-none"):a[c].classList.add("d-none")})}function filterResults(){const b=[...document.getElementById("result").firstChild.children],a=document.getElementById("filterText");a.blur(),a.focus(),filterIcons(a.value,b)}function sleep(a){return new Promise(b=>setTimeout(b,a))}async function copyToClipboard(){const a=document.getElementById("clipboard"),b=document.getElementById("selectedIcon").innerHTML.trim();await navigator.clipboard.writeText(b),a.textContent="✅ copied!",await sleep(2e3),a.textContent="Copy to clipboard"}function downloadSVG(){const b="icon.svg",c=document.getElementById("selectedIcon").innerHTML.trim(),a=document.createElement("a");a.setAttribute("href","data:text/plain;charset=utf-8,"+encodeURIComponent(c)),a.setAttribute("download",b),a.style.display="none",document.body.appendChild(a),a.click(),document.body.removeChild(a)}loadConfig();const collections=new Map,searchTags=new Set;let filterTags=new Set,searchResults=[];initTags(),initCollections(),new bootstrap.Offcanvas(document.getElementById("details")),document.getElementById("toggleDarkMode").onclick=toggleDarkMode,document.getElementById("search").onclick=searchIcons,document.getElementById("searchText").onkeydown=a=>{a.key=="Enter"&&searchIcons()},document.getElementById("filter").onclick=filterResults,document.getElementById("filterText").onkeydown=a=>{a.key=="Enter"&&filterResults()},document.getElementById("download").onclick=downloadSVG,document.getElementById("clipboard").onclick=copyToClipboard,document.getElementById("previewSize").onchange=b=>{const a=b.target.value.split("x")[0],c=document.getElementById("result");[...c.firstChild.children].forEach(b=>{b.setAttribute("width",a),b.setAttribute("height",a)})}
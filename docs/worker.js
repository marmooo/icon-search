function uniqIds(a){return a.querySelectorAll("[id]").forEach(c=>{const d=c.id,b=Math.random().toString(16).slice(2),e=new RegExp(`url\\(#${d}\\);?`,"g");c.id=b,[...a.getElementsByTagName("*")].forEach(a=>{for(const[c,d]of Object.entries(a.attributes))if(c=="xlink:href"&&d.startsWith("#"))a.setAttribute(c,`#${b}`);else{const f=d.replace(e,`url(#${b});`);d!=f&&a.setAttribute(c,f)}})}),a}function setPreviewInfo(c,b){const a=c.querySelector("svg");return a.setAttribute("width",b),a.setAttribute("height",b),a.setAttribute("role","button"),a.setAttribute("data-bs-toggle","offcanvas"),a.setAttribute("data-bs-target","#details"),a.setAttribute("aria-controls","details"),a}importScripts("node-html-parser.js"),self.addEventListener("message",b=>{const[c,d,e]=b.data,a=HTMLParser.parse(c);uniqIds(a),setPreviewInfo(a,e),postMessage([a.toString(),d])})
function cleanup(a){return a=uniqIds(a),uniqClasses(a)}function uniqIds(a){const b=new Map;function c(d,c){const a="id-"+Math.random().toString(16).slice(2);return b.set(c,a),`id="${a}"`}function d(c,a,d){if(b.has(a)){const c=b.get(a);return`#${c}${d}`}return c}return a=a.replace(/id="([^"]+)"/g,c),a=a.replaceAll(/#([^")]+)([")])/g,d),a}function uniqClasses(b){const a=HTMLParser.parse(b);if(!b.includes("style"))return a;const c=[...a.getElementsByTagName("style")];if(c.length>0){const d=new RegExp("(.[^}]+})","g"),b="id-"+Math.random().toString(16).slice(2),e=a.querySelector("svg");e.setAttribute("id",b),c.forEach(e=>{const a=e.textContent,c=a.replace(d,`#${b} $1`);console.log(a,c),a!=c&&(e.textContent=c)})}return a}function setPreviewInfo(c,b){const a=c.querySelector("svg");return a.setAttribute("width",b),a.setAttribute("height",b),a.setAttribute("role","button"),a.setAttribute("data-bs-toggle","offcanvas"),a.setAttribute("data-bs-target","#details"),a.setAttribute("aria-controls","details"),a}importScripts("node-html-parser.js"),self.addEventListener("message",b=>{const[c,d,e]=b.data,a=cleanup(c);setPreviewInfo(a,e),postMessage([a.toString(),d])})
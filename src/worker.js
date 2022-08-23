function cleanup(svgText) {
  svgText = uniqIds(svgText);
  return uniqClasses(svgText);
}

function uniqIds(svgText) {
  const ids = new Map();
  function idReplacer(_match, p1) {
    const uniqId = "id-" + Math.random().toString(16).slice(2);
    ids.set(p1, uniqId);
    return `id="${uniqId}"`;
  }
  // #id, url(#id)
  function valueReplacer(match, p1, p2) {
    if (ids.has(p1)) {
      const uniqId = ids.get(p1);
      return `#${uniqId}${p2}`;
    } else {
      return match;
    }
  }
  svgText = svgText.replace(/id="([^"]+)"/g, idReplacer);
  svgText = svgText.replaceAll(/#([^")]+)([")])/g, valueReplacer);
  return svgText;
}

function uniqClasses(svgText) {
  const doc = HTMLParser.parse(svgText);
  if (!svgText.includes("style")) return doc;

  const styleElements = [...doc.getElementsByTagName("style")];
  if (styleElements.length > 0) {
    const regexp = new RegExp("(\.[^}]+\})", "g");
    const uniqId = "id-" + Math.random().toString(16).slice(2);
    const svg = doc.querySelector("svg");
    svg.setAttribute("id", uniqId);
    styleElements.forEach((styleElement) => {
      const style = styleElement.textContent;
      const newStyle = style.replace(regexp, `#${uniqId} $1`);
      if (style != newStyle) {
        styleElement.textContent = newStyle;
      }
    });
  }
  return doc;
}

function setPreviewInfo(doc, previewSize) {
  const svg = doc.querySelector("svg");
  svg.setAttribute("width", previewSize);
  svg.setAttribute("height", previewSize);
  svg.setAttribute("role", "button");
  svg.setAttribute("data-bs-toggle", "offcanvas");
  svg.setAttribute("data-bs-target", "#details");
  svg.setAttribute("aria-controls", "details");
  return svg;
}

importScripts("node-html-parser.js");

self.addEventListener("message", (e) => {
  const [svgText, pos, previewSize] = e.data;
  const doc = cleanup(svgText);
  setPreviewInfo(doc, previewSize);
  postMessage([doc.toString(), pos]);
});

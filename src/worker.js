function cleanup(doc) {
  const idElements = [];
  const urlAttributes = [];
  const styleElements = [];
  [...doc.getElementsByTagName("*")].forEach((e) => {
    for (const [name, value] of Object.entries(e.attributes)) {
      if (name == "id") idElements.push(e);
      if (e.tagName == "style") styleElements.push(e);
      if (value.startsWith("#")) urlAttributes.push([e, name, value]);
      if (value.includes("url")) urlAttributes.push([e, name, value]);
    }
  });
  uniqIds(doc, idElements, urlAttributes);
  uniqClasses(doc, styleElements);
}

function uniqIds(doc, idElements, urlAttributes) {
  idElements.forEach((idElement) => {
    const id = idElement.id;
    const uniqId = "id-" + Math.random().toString(16).slice(2);
    const idRegExp = new RegExp(`url\\(#${id}\\)`, "g");
    idElement.setAttribute("id", uniqId);
    urlAttributes.forEach(([e, name, value]) => {
      switch (name) {
        case "href": // SVG 2.0
        case "xlink:href": // SVG 1.1
          if (value == `#${id}`) {
            e.setAttribute(name, `#${uniqId}`);
          }
          break;
        default: {
          const newValue = value.replace(idRegExp, `url(#${uniqId})`);
          if (value != newValue) {
            e.setAttribute(name, newValue);
          }
        }
      }
    });
  });
  return doc;
}

function uniqClasses(doc, styleElements) {
  if (styleElements.length > 0) {
    const regexp = new RegExp("(\.[^}]+\})", "g");
    const uniqId = "id-" + Math.random().toString(16).slice(2);
    const svg = doc.querySelector("svg");
    svg.setAttribute("id", uniqId);
    styleElements.forEach((styleElement) => {
      const style = styleElement.textContent;
      const newStyle = styles.replace(regexp, `#${uniqId} $1`);
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
  const doc = HTMLParser.parse(svgText);
  cleanup(doc);
  setPreviewInfo(doc, previewSize);
  postMessage([doc.toString(), pos]);
});

function uniqIds(doc) {
  doc.querySelectorAll("[id]").forEach((idElement) => {
    const id = idElement.id;
    const uniqId = "id-" + Math.random().toString(16).slice(2);
    const idRegExp = new RegExp(`url\\(#${id}\\);?`, "g");
    idElement.id = uniqId;
    [...doc.getElementsByTagName("*")].forEach((e) => {
      for (const [name, value] of Object.entries(e.attributes)) {
        if (name == "xlink:href" && value.startsWith("#")) {
          e.setAttribute(name, `#${uniqId}`);
        } else {
          const newValue = value.replace(idRegExp, `url(#${uniqId});`);
          if (value != newValue) {
            e.setAttribute(name, newValue);
          }
        }
      }
    });
  });
  return doc;
}

function uniqClasses(doc) {
  const styles = doc.querySelectorAll("style");
  if (styles) {
    const regexp = new RegExp("(\.[^}]+\})", "g");
    const uniqId = "id-" + Math.random().toString(16).slice(2);
    const svg = doc.querySelector("svg");
    svg.setAttribute("id", uniqId);
    styles.forEach((style) => {
      style.textContent = style.textContent.replace(regexp, `#${uniqId} $1`);
    });
  }
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
  uniqIds(doc);
  uniqClasses(doc);
  setPreviewInfo(doc, previewSize);
  postMessage([doc.toString(), pos]);
});

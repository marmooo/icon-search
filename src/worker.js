function uniqIds(svg) {
  svg.querySelectorAll("[id]").forEach((idElement) => {
    const id = idElement.id;
    const uniqId = Math.random().toString(16).slice(2);
    const idRegExp = new RegExp(`url\\(#${id}\\);?`, "g");
    idElement.id = uniqId;
    [...svg.getElementsByTagName("*")].forEach((e) => {
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
}

importScripts("node-html-parser.js");

self.addEventListener("message", (e) => {
  const svg = HTMLParser.parse(e.data);
  uniqIds(svg);
  postMessage(svg.toString());
});

function loadConfig() {
  if (localStorage.getItem("darkMode") == 1) {
    document.documentElement.dataset.theme = "dark";
  }
}

function toggleDarkMode() {
  if (localStorage.getItem("darkMode") == 1) {
    localStorage.setItem("darkMode", 0);
    delete document.documentElement.dataset.theme;
  } else {
    localStorage.setItem("darkMode", 1);
    document.documentElement.dataset.theme = "dark";
  }
}

function initSuggest(json) {
  const obj = document.getElementById("tags");
  json.forEach((tag) => {
    tags.set(tag, true);
    const option = document.createElement("option");
    option.textContent = tag;
    obj.appendChild(option);
  });
}

function initCollections() {
  fetch("/icon-db/collections.json")
    .then((response) => response.json())
    .then((json) => {
      json.forEach((iconSet) => {
        collections.set(iconSet.name, iconSet);
        delete iconSet.name;
      });
    });
}

function initTags() {
  fetch("/icon-db/tags.json")
    .then((response) => response.json())
    .then((json) => initSuggest(json));
}

function showIconDetails(svg, icon) {
  const iconTags = icon[1];
  const iconSetName = icon[2];
  showIconSetDetails(iconTags, iconSetName);
  const selectedIcon = svg.cloneNode(true);
  selectedIcon.removeAttribute("role");
  selectedIcon.removeAttribute("data-bs-toggle");
  selectedIcon.removeAttribute("data-bs-target");
  selectedIcon.removeAttribute("aria-controls");
  selectedIcon.setAttribute("width", 128);
  selectedIcon.setAttribute("height", 128);
  selectedIcon.onclick = null;
  const selectedIconParent = document.getElementById("selectedIcon");
  selectedIconParent.firstChild.replaceWith(selectedIcon);
}

function showIconSetDetails(iconTags, iconSetName) {
  const iconSet = collections.get(iconSetName);
  document.getElementById("iconTags").textContent = iconTags;
  document.getElementById("name").textContent = iconSetName;
  document.getElementById("name").href = iconSet.homepage;
  document.getElementById("license").textContent = iconSet.license;
  document.getElementById("license").href = iconSet.licenseUrl;
  document.getElementById("author").textContent = iconSet.author;
}

function showIcon(icon, previewSize, domParser) {
  // benchmark: https://www.measurethat.net/Benchmarks/Show/14659
  const obj = domParser.parseFromString(icon[0], "image/svg+xml");
  icon[0] = null;
  const svg = obj.documentElement;
  svg.setAttribute("width", previewSize);
  svg.setAttribute("height", previewSize);
  svg.setAttribute("role", "button");
  svg.setAttribute("data-bs-toggle", "offcanvas");
  svg.setAttribute("data-bs-target", "#details");
  svg.setAttribute("aria-controls", "details");
  svg.onclick = () => {
    showIconDetails(svg, icon);
  };
  return svg;
}

function fetchIcons(tag) {
  if (tags.has(tag) === false) {
    document.getElementById("noTags").classList.remove("invisible");
    return;
  }
  document.getElementById("noTags").classList.add("invisible");

  const previewSize =
    document.getElementById("previewSize").value.split("x")[0];
  const result = document.getElementById("result");
  const div = document.createElement("div");
  result.replaceChild(div, result.firstChild);

  // TODO: ReadableStream
  return fetch(`/icon-db/json/${tag}.json`)
    .then((response) => response.json())
    .then((icons) => {
      const domParser = new DOMParser();
      const promises = icons.map((icon) => {
        return new Promise((resolve) => {
          const svg = showIcon(icon, previewSize, domParser);
          div.appendChild(svg);
          uniqIds(svg);
          resolve(svg);
        });
      });
      return Promise.all(promises);
    });
}

function uniqIds(svg) {
  svg.querySelectorAll("[id]").forEach((idElement) => {
    const id = idElement.id;
    const uniqId = Math.random().toString(16).slice(2);
    const idRegExp = new RegExp(`url\\(#${id}\\);?`, "g");
    idElement.id = uniqId;
    [...svg.getElementsByTagName("*")].forEach((e) => {
      [...e.attributes].forEach((attr) => {
        const name = attr.name;
        const value = attr.value;
        if (name == "xlink:href" && value.startsWith("#")) {
          e.setAttribute(name, `#${uniqId}`);
        } else {
          const newValue = value.replace(idRegExp, `url(#${uniqId});`);
          if (value != newValue) {
            e.setAttribute(name, newValue);
          }
        }
      });
    });
  });
}

function searchIcons() {
  const obj = document.getElementById("searchText");
  obj.blur();
  obj.focus();
  fetchIcons(obj.value);
}

loadConfig();
const tags = new Map();
const collections = new Map();
initTags();
initCollections();
new bootstrap.Offcanvas(document.getElementById("details"));

document.getElementById("toggleDarkMode").onclick = toggleDarkMode;
document.getElementById("search").onclick = searchIcons;
document.getElementById("searchText").onkeydown = (event) => {
  if (event.key == "Enter") searchIcons();
};
document.getElementById("previewSize").onchange = (event) => {
  const previewSize = event.target.value.split("x")[0];
  const result = document.getElementById("result");
  [...result.firstChild.children].forEach((svg) => {
    svg.setAttribute("width", previewSize);
    svg.setAttribute("height", previewSize);
  });
};

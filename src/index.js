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

function initSuggest(tags, datalist) {
  // https://www.measurethat.net/Benchmarks/Show/14659
  let html = "";
  tags.forEach((tag) => {
    html += `<option>${tag}</option>`;
  });
  const doc = domParser.parseFromString(html, "text/html");
  datalist.replaceChildren(...doc.body.childNodes);
}

function initCollections() {
  return fetch("/icon-db/collections.json")
    .then((response) => response.json())
    .then((json) => {
      json.forEach((iconSet) => {
        collections.set(iconSet.name, iconSet);
        delete iconSet.name;
      });
    });
}

function initSearchTags() {
  const datalist = document.getElementById("searchTags");
  return fetch("/icon-db/tags.json")
    .then((response) => response.json())
    .then((json) => {
      searchTags = new Set(json);
      initSuggest(json, datalist);
    });
}

function getSelectedIconPos(svg) {
  const icons = [...document.getElementById("result").firstElementChild.children];
  console.log(icons.indexOf(svg));
  return icons.indexOf(svg);
}

function showIconDetails(svg, icon) {
  const iconTags = icon[1];
  const iconSetName = icon[2];
  selectedIconPos = getSelectedIconPos(svg);
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
  selectedIconParent.firstElementChild.replaceWith(selectedIcon);
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

function getPreviewIcon(icon) {
  // https://www.measurethat.net/Benchmarks/Show/14659
  const obj = domParser.parseFromString(icon[0], "image/svg+xml");
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

function drawChunk(chunk, div) {
  buffer += chunk;
  const endPos = buffer.lastIndexOf("\t]");
  if (endPos < 0) return;
  const block = buffer.slice(renderStartPos, endPos + 2);
  renderStartPos = 0;
  buffer = buffer.slice(endPos + 3);
  const icons = JSON.parse(`[${block}]`);
  drawIcons(icons, div);
}

function drawIcons(icons, div) {
  const prevLength = searchResults.length;
  // https://www.measurethat.net/Benchmarks/Show/4223
  searchResults = [...searchResults, ...icons];
  if (pagingFrom <= prevLength + icons.length && prevLength < pagingTo) {
    const from = (pagingFrom < prevLength) ? prevLength : pagingFrom;
    const target = (pagingTo <= 0)
      ? searchResults.slice(from)
      : searchResults.slice(from, pagingTo);
    target.forEach((icon) => {
      const svg = getPreviewIcon(icon);
      div.appendChild(svg);
      uniqIds(svg);
    });
  }
}

function redrawIcons(from, to) {
  document.getElementById("loading").classList.remove("d-none");
  const result = document.getElementById("result");
  const div = document.createElement("div");
  result.replaceChild(div, result.firstElementChild);

  const target = searchResults.slice(from, to);
  target.forEach((icon) => {
    const svg = getPreviewIcon(icon);
    div.appendChild(svg);
    uniqIds(svg);
  });
  document.getElementById("loading").classList.add("d-none");
}

function disablePagination(obj, query) {
  obj.href = `?q=${query}&from=${pagingFrom}&to=${pagingTo}`;
  obj.parentNode.classList.add("disabled");
  obj.setAttribute("tabindex", -1);
  obj.setAttribute("aria-disabled", true);
  obj.onclick = (event) => {
    event.preventDefault();
  };
}

function enablePagination(obj, query, getIndexFunc) {
  const [from, to] = getIndexFunc();
  obj.href = `?q=${query}&from=${from}&to=${to}`;
  obj.parentNode.classList.remove("disabled");
  obj.removeAttribute("tabindex");
  obj.removeAttribute("aria-disabled");
  obj.onclick = (event) => {
    event.preventDefault();
    [pagingFrom, pagingTo] = getIndexFunc();
    redrawIcons(pagingFrom, pagingTo);
    setPagination(query);
  };
}

function getPrevIndex() {
  if (pagingFrom - pagingNum < 0) {
    return [0, pagingNum];
  } else {
    return [pagingFrom - pagingNum, pagingTo - pagingNum];
  }
}

function getNextIndex() {
  if (searchResults.length < pagingTo) {
    return [0, pagingNum];
  } else {
    return [pagingFrom + pagingNum, pagingTo + pagingNum];
  }
}

function setPagination(query) {
  const url = `?q=${query}&from=${pagingFrom}&to=${pagingTo}`;
  history.replaceState(null, null, url);
  const prev = document.getElementById("prevIcons");
  const next = document.getElementById("nextIcons");
  if (pagingFrom - pagingNum < 0) {
    disablePagination(prev, query);
  } else {
    enablePagination(prev, query, getPrevIndex);
  }
  if (searchResults.length < pagingTo) {
    disablePagination(next, query);
  } else {
    enablePagination(next, query, getNextIndex);
  }
}

function initFilterTags() {
  filterTags = new Set();
  searchResults.forEach((icon) => {
    const tags = icon[1].split(",");
    tags.forEach((tag) => {
      filterTags.add(tag);
    });
  });
  const datalist = document.getElementById("filterTags");
  datalist.replaceChildren();
  initSuggest(filterTags, datalist);
}

function iconReader(reader, controller, tag, div) {
  return reader.read().then(({ done, value }) => {
    if (done) {
      controller.close();
      renderStartPos = 1;
      buffer = "";
      document.getElementById("loading").classList.add("d-none");
      document.getElementById("pagination").classList.remove("d-none");
      setPagination(tag);
      initFilterTags();
      return;
    }
    const chunk = new TextDecoder("utf-8").decode(value);
    drawChunk(chunk, div);
    controller.enqueue(value);
    iconReader(reader, controller, tag, div);
  });
}

let renderStartPos = 1;
let buffer = "";
function fetchIcons(tag) {
  const result = document.getElementById("result");
  const div = document.createElement("div");
  result.replaceChild(div, result.firstElementChild);

  return fetch(`/icon-db/json/${tag}.json`)
    .then((response) => {
      const reader = response.body.getReader();
      new ReadableStream({
        start(controller) {
          iconReader(reader, controller, tag, div);
        },
      });
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

  const tag = obj.value;
  document.getElementById("loading").classList.remove("d-none");
  document.getElementById("pagination").classList.add("d-none");
  if (!searchTags.has(tag)) {
    document.getElementById("noTags").classList.remove("invisible");
    return;
  }
  document.getElementById("noTags").classList.add("invisible");

  fetchIcons(tag);
}

function filterIcons(tag, svgs) {
  searchResults.forEach((icon, i) => {
    if (icon[1].includes(tag)) {
      svgs[i].classList.remove("d-none");
    } else {
      svgs[i].classList.add("d-none");
    }
  });
}

function filterResults() {
  const result = document.getElementById("result");
  const svgs = [...result.firstElementChild.children];
  const obj = document.getElementById("filterText");
  obj.blur();
  obj.focus();
  filterIcons(obj.value, svgs);
}

function sleep(msec) {
  return new Promise((resolve) => setTimeout(resolve, msec));
}

function getOriginalSVG(svg) {
  const pos = pagingFrom + selectedIconPos;
  return searchResults[pos][0];
}

async function copyToClipboard() {
  const obj = document.getElementById("clipboard");
  const svg = getOriginalSVG();
  await navigator.clipboard.writeText(svg);
  obj.textContent = "✅ copied!";
  await sleep(2000);
  obj.textContent = "Copy to clipboard";
}

function downloadSVG() {
  const fileName = "icon.svg";
  const svg = getOriginalSVG();
  const a = document.createElement("a");
  a.href = "data:text/plain;charset=utf-8," + encodeURIComponent(svg);
  a.download = fileName;
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

loadConfig();
const domParser = new DOMParser();
const searchParams = new Proxy(new URLSearchParams(location.search), {
  get: (params, prop) => params.get(prop),
});
const collections = new Map();
let searchTags = new Set();
let filterTags = new Set();
let searchResults = [];
let pagingFrom = 0;
let pagingTo = 300;
let pagingNum = 300;
let previewSize = 32;
let prevSearchText = "";
let selectedIconPos;
if (searchParams.from) pagingFrom = parseInt(searchParams.from);
if (searchParams.to) pagingTo = parseInt(searchParams.to);
new bootstrap.Offcanvas(document.getElementById("details"));
Promise.all([
  initSearchTags(),
  initCollections(),
]).then(() => {
  if (searchParams.q) {
    prevSearchText = searchParams.q;
    document.getElementById("searchText").value = searchParams.q;
    searchIcons();
  }
});

document.getElementById("toggleDarkMode").onclick = toggleDarkMode;
document.getElementById("search").onclick = searchIcons;
document.getElementById("searchText").onkeydown = (event) => {
  if (event.key == "Enter") {
    if (prevSearchText == event.target.value) return;
    pagingFrom = 0;
    pagingTo = pagingNum;
    searchResults = [];
    searchIcons();
  }
};
document.getElementById("filter").onclick = filterResults;
document.getElementById("filterText").onkeydown = (event) => {
  if (event.key == "Enter") filterResults();
};
document.getElementById("download").onclick = downloadSVG;
document.getElementById("clipboard").onclick = copyToClipboard;
document.getElementById("pagingNum").onchange = (event) => {
  pagingNum = parseInt(event.target.value);
  if (pagingFrom == 0) pagingTo = pagingNum;
};
document.getElementById("previewSize").onchange = (event) => {
  previewSize = event.target.value.split("x")[0];
  const result = document.getElementById("result");
  [...result.firstElementChild.children].forEach((svg) => {
    svg.setAttribute("width", previewSize);
    svg.setAttribute("height", previewSize);
  });
};

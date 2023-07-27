function loadConfig() {
  if (localStorage.getItem("darkMode") == 1) {
    document.documentElement.setAttribute("data-bs-theme", "dark");
    document.documentElement.setAttribute("data-filter", "false");
  }
}

function toggleDarkMode() {
  if (localStorage.getItem("darkMode") == 1) {
    const filter = document.documentElement.getAttribute("data-filter");
    if (filter == "true") {
      document.documentElement.setAttribute("data-filter", "false");
    } else {
      localStorage.setItem("darkMode", 0);
      document.documentElement.setAttribute("data-bs-theme", "light");
    }
  } else {
    localStorage.setItem("darkMode", 1);
    document.documentElement.setAttribute("data-bs-theme", "dark");
      document.documentElement.setAttribute("data-filter", "true");
  }
}

function initSuggest(input, tags) {
  autocomplete({
    input: input,
    fetch: function (text, update) {
      const suggestions = tags.filter((tag) => tag.startsWith(text));
      update(suggestions);
    },
    render: function (item) {
      const itemElement = document.createElement("div");
      itemElement.textContent = item;
      return itemElement;
    },
    onSelect: function (item) {
      input.value = item;
      searchIcons();
    },
    minLength: 1,
  });
}

function initLightTags() {
  const maxSize = 10 * 1024 * 1024;
  return fetch(`${iconDB}/light.json`)
    .then((response) => response.json())
    .then((tags) => {
      let prevPos = 2;
      let n = 1;
      tags.forEach(([tag, pos]) => {
        let nextPos = prevPos + pos;
        if (maxSize < nextPos) {
          n += 1;
          nextPos = 2 + pos;
          lightTags.set(tag, [2, nextPos, n]);
        } else {
          lightTags.set(tag, [prevPos, nextPos, n]);
        }
        prevPos = nextPos + 2;
      });
    });
}

function initHeavyTags() {
  return fetch(`${iconDB}/heavy.json`)
    .then((response) => response.json())
    .then((tags) => {
      tags.forEach(([tag, num]) => {
        heavyTags.set(tag, num);
      });
    });
}

function initCollections() {
  return fetch(`${iconDB}/collections.json`)
    .then((response) => response.json())
    .then((json) => {
      json.forEach((iconSet) => {
        collections.set(iconSet.name, iconSet);
        delete iconSet.name;
      });
    });
}

function initSearchTags() {
  const searchText = document.getElementById("searchText");
  return fetch(`${iconDB}/tags.json`)
    .then((response) => response.json())
    .then((json) => {
      searchTags = new Set(json);
      initSuggest(searchText, json);
    });
}

function getSelectedIconPos(svg) {
  const icons = [
    ...document.getElementById("result").firstElementChild.children,
  ];
  return icons.indexOf(svg);
}

function showIconDetails(selectedImg) {
  const img = new Image(128, 128);
  img.setAttribute("decoding", "async");
  img.src = selectedImg.src;
  const selectedIconParent = document.getElementById("selectedIcon");
  selectedIconParent.firstElementChild.replaceWith(img);
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

function initIconTemplate(previewSize) {
  const img = new Image(previewSize, previewSize);
  img.className = "btn p-0";
  img.setAttribute("alt", "");
  img.setAttribute("role", "button");
  img.setAttribute("decoding", "async");
  img.setAttribute("data-bs-toggle", "offcanvas");
  img.setAttribute("data-bs-target", "#details");
  img.setAttribute("aria-controls", "details");
  return img;
}

function getPreviewIcon(icon) {
  const img = iconTemplate.cloneNode();
  const [svgText, iconTags, iconSetName] = icon;
  img.onclick = () => {
    selectedIconPos = getSelectedIconPos(img);
    showIconSetDetails(iconTags, iconSetName);
    showIconDetails(img);
  };
  img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svgText);
  return img;
}

function drawChunk(chunk) {
  buffer += chunk;
  const endPos = buffer.lastIndexOf("\t]");
  if (endPos < 0) return;
  const startPos = buffer.indexOf("\t[");
  const block = buffer.slice(startPos + 1, endPos + 2);
  buffer = buffer.slice(endPos + 3);
  const icons = JSON.parse(`[${block}]`);
  drawIcons(icons);
}

function drawIcons(icons) {
  const prevLength = searchResults.length;
  // https://www.measurethat.net/Benchmarks/Show/4223
  searchResults = [...searchResults, ...icons];
  if (pagingFrom <= prevLength + icons.length && prevLength < pagingTo) {
    const from = (pagingFrom < prevLength) ? prevLength : pagingFrom;
    const target = (pagingTo <= 0)
      ? searchResults.slice(from)
      : searchResults.slice(from, pagingTo);
    target.forEach((_icon, i) => {
      const pos = from + i;
      worker.postMessage(pos);
    });
  }
}

function redrawIcons(from, to) {
  document.getElementById("loading").classList.remove("d-none");
  const result = document.getElementById("result");
  const div = document.createElement("div");
  result.replaceChild(div, result.firstElementChild);

  const tag = document.getElementById("searchText").value;
  if (searchResults.length < pagingTo) {
    if (heavyTags.has(tag)) {
      const max = heavyTags.get(tag) - 1;
      if (pageNumForHeavyTags < max) {
        pageNumForHeavyTags += 1;
        fetchIcons(tag);
      }
    } else {
      if (buffer.trimEnd() != "]") fetchIcons(tag);
    }
  }
  const filterText = document.getElementById("filterText").value;
  if (filterText != "") {
    searchResults.map((icon, pos) => {
      if (icon[1].includes(filterText)) return [icon, pos];
    }).filter((icon) => icon)
      .slice(from, to).forEach((data) => {
        const [_icon, pos] = data;
        worker.postMessage(pos);
      });
  } else {
    const target = searchResults.slice(from, to);
    target.forEach((_icon, i) => {
      const pos = from + i;
      worker.postMessage(pos);
    });
  }
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
  if (pagingFrom - pagingSize < 0) {
    return [0, pagingSize];
  } else {
    return [pagingFrom - pagingSize, pagingTo - pagingSize];
  }
}

function getNextIndex() {
  if (searchResults.length < pagingTo) {
    return [0, pagingSize];
  } else {
    return [pagingFrom + pagingSize, pagingTo + pagingSize];
  }
}

function setPagination(query) {
  const url = `?q=${query}&from=${pagingFrom}&to=${pagingTo}`;
  history.replaceState(null, null, url);
  const prev = document.getElementById("prevIcons");
  const next = document.getElementById("nextIcons");
  if (pagingFrom - pagingSize < 0) {
    disablePagination(prev, query);
  } else {
    enablePagination(prev, query, getPrevIndex);
  }
  if (heavyTags.has(query)) {
    if (pageNumForHeavyTags < pagesForHeavyTags.length - 1) {
      enablePagination(next, query, getNextIndex);
    } else {
      if (searchResults.length < pagingTo) {
        disablePagination(next, query);
      } else {
        enablePagination(next, query, getNextIndex);
      }
    }
  } else {
    if (searchResults.length < pagingTo) {
      disablePagination(next, query);
    } else {
      enablePagination(next, query, getNextIndex);
    }
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
  const filterText = document.getElementById("filterText");
  initSuggest(filterText, [...filterTags]);
}

function iconReader(reader, controller, tag) {
  return reader.read().then(({ done, value }) => {
    if (done) {
      controller.close();
      if (!heavyTags.has(tag)) return;
      if (buffer.trimEnd() == "]" && searchResults.length < pagingTo) {
        pageNumForHeavyTags += 1;
        fetchIcons(tag);
      }
      return;
    }
    const chunk = new TextDecoder("utf-8").decode(value);
    drawChunk(chunk);
    controller.enqueue(value);
    iconReader(reader, controller, tag);
  })
    .finally(() => {
      document.getElementById("loading").classList.add("d-none");
      document.getElementById("pagination").classList.remove("d-none");
      setPagination(tag);
      initFilterTags();
    });
}

let buffer = "";
function fetchIcons(tag) {
  if (lightTags.has(tag)) {
    const [from, to, n] = lightTags.get(tag);
    return fetch(`${rareIconDB}/json/@rare.${n}.json`, {
      headers: {
        "content-type": "multipart/byteranges",
        "range": `bytes=${from}-${to}`,
      },
    })
      .then((response) => response.text())
      .then((text) => drawChunk(text))
      .finally(() => {
        document.getElementById("loading").classList.add("d-none");
        document.getElementById("pagination").classList.remove("d-none");
        setPagination(tag);
        initFilterTags();
      });
  } else if (heavyTags.has(tag)) {
    const n = pagesForHeavyTags[pageNumForHeavyTags];
    return fetch(`${iconDB}/json/${tag}.${n}.json`)
      .then((response) => {
        const reader = response.body.getReader();
        new ReadableStream({
          start(controller) {
            iconReader(reader, controller, tag);
          },
        });
      });
  } else {
    return fetch(`${iconDB}/json/${tag}.json`)
      .then((response) => {
        const reader = response.body.getReader();
        new ReadableStream({
          start(controller) {
            iconReader(reader, controller, tag);
          },
        });
      });
  }
}

function clearSearchCache(tag) {
  if (heavyTags.has(tag)) {
    const n = heavyTags.get(tag);
    pagesForHeavyTags = Array(n).fill().map((_, i) => i + 1);
    shuffle(pagesForHeavyTags);
  }
  document.getElementById("filterText").value = "";
  pageNumForHeavyTags = 0;
  pagingFrom = 0;
  pagingTo = pagingSize;
  searchResults = [];
  buffer = "";
  prevSearchText = tag;
}

function searchIcons() {
  const obj = document.getElementById("searchText");
  const tag = obj.value;
  if (prevSearchText == tag) return;
  clearSearchCache(tag);
  obj.blur();
  obj.focus();

  document.getElementById("loading").classList.remove("d-none");
  document.getElementById("pagination").classList.add("d-none");
  if (!searchTags.has(tag)) {
    document.getElementById("noTags").classList.remove("invisible");
    return;
  }
  document.getElementById("noTags").classList.add("invisible");

  const result = document.getElementById("result");
  const div = document.createElement("div");
  result.replaceChild(div, result.firstElementChild);
  fetchIcons(tag);
}

function filterIcons(tag) {
  const query = document.getElementById("searchText").value;
  pagingFrom = 0;
  pagingTo = pagingSize;
  const url = `?q=${query}&from=0&to=${pagingSize}`;
  history.replaceState(null, null, url);
  searchResults.map((icon, i) => {
    if (icon[1].includes(tag)) return [icon, i];
  }).filter((icon) => icon)
    .slice(0, pagingSize).forEach((data) => {
      const [_icon, pos] = data;
      worker.postMessage(pos);
    });
}

function filterResults() {
  const result = document.getElementById("result");
  const div = document.createElement("div");
  result.replaceChild(div, result.firstElementChild);
  const obj = document.getElementById("filterText");
  obj.blur();
  obj.focus();
  filterIcons(obj.value);
}

function sleep(msec) {
  return new Promise((resolve) => setTimeout(resolve, msec));
}

function getOriginalSVG() {
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

function shuffle(array) {
  for (let i = array.length; 1 < i; i--) {
    const k = Math.floor(Math.random() * i);
    [array[k], array[i - 1]] = [array[i - 1], array[k]];
  }
  return array;
}

loadConfig();
const rareIconDB = "/rare-icon-db"; // require same-origin
const iconDB = "https://icon-db.pages.dev";
const worker = new Worker("worker.js");
worker.addEventListener("message", (event) => {
  const pos = event.data;
  const icon = searchResults[pos];
  const svg = getPreviewIcon(icon);
  document.getElementById("result").firstElementChild.appendChild(svg);
});
const searchParams = new Proxy(new URLSearchParams(location.search), {
  get: (params, prop) => params.get(prop),
});
const collections = new Map();
const heavyTags = new Map();
const lightTags = new Map();
let searchTags = new Set();
let filterTags = new Set();
let searchResults = [];
let pagesForHeavyTags = [];
let pageNumForHeavyTags = 0;
let pagingFrom = 0;
let pagingTo = 300;
let pagingSize = 300;
let previewSize = 32;
let prevSearchText = "";
let selectedIconPos;
const iconTemplate = initIconTemplate(previewSize);
if (searchParams.from) pagingFrom = parseInt(searchParams.from);
if (searchParams.to) pagingTo = parseInt(searchParams.to);
new bootstrap.Offcanvas(document.getElementById("details"));
Promise.all([
  initSearchTags(),
  initCollections(),
  initHeavyTags(),
  initLightTags(),
]).then(() => {
  const tag = searchParams.q;
  if (tag) {
    document.getElementById("searchText").value = tag;
    searchIcons();
  }
});

document.getElementById("toggleDarkMode").onclick = toggleDarkMode;
document.getElementById("search").onclick = searchIcons;
document.getElementById("searchText").onkeydown = (event) => {
  if (event.key == "Enter") searchIcons();
};
document.getElementById("filter").onclick = filterResults;
document.getElementById("filterText").onkeydown = (event) => {
  if (event.key == "Enter") filterResults();
};
document.getElementById("download").onclick = downloadSVG;
document.getElementById("clipboard").onclick = copyToClipboard;
document.getElementById("pagingSize").onchange = (event) => {
  pagingSize = parseInt(event.target.value);
  pagingTo = pagingFrom + pagingSize;
  const query = document.getElementById("searchText").value;
  if (query) {
    const url = `?q=${query}&from=${pagingFrom}&to=${pagingTo}`;
    history.replaceState(null, null, url);
    redrawIcons(pagingFrom, pagingTo);
    setPagination(query);
  }
};
document.getElementById("previewSize").onchange = (event) => {
  previewSize = event.target.value.split("x")[0];
  iconTemplate.setAttribute("width", previewSize);
  iconTemplate.setAttribute("height", previewSize);
  const result = document.getElementById("result");
  [...result.firstElementChild.children].forEach((svg) => {
    svg.setAttribute("width", previewSize);
    svg.setAttribute("height", previewSize);
  });
};

const preview = document.getElementById("preview");
const originalLayer = document.getElementById("originalLayer");
const translatedLayer = document.getElementById("translatedLayer");
const statusEl = document.getElementById("status");
const scene = document.getElementById("scene");
const stack = document.getElementById("stack");
const titleEl = document.getElementById("title");
const prevButton = document.getElementById("prevButton");
const nextButton = document.getElementById("nextButton");

const params = new URLSearchParams(location.search);
const id = params.get("id") || "";
const lang = "en";

let data = null;
let manifest = [];

/* ---------- 3D view ---------- */

const DEFAULT_VIEW = { rotX: -15, rotY: -30, zoom: 0 };
let rotX = DEFAULT_VIEW.rotX;
let rotY = DEFAULT_VIEW.rotY;
let zoom = DEFAULT_VIEW.zoom;

let dragging = false;
let lastX = 0;
let lastY = 0;

function applyTransform() {
  stack.style.transform =
    `translateZ(${zoom}px) rotateX(${rotX}deg) rotateY(${rotY}deg)`;
}

scene.addEventListener("pointerdown", (e) => {
  dragging = true;
  lastX = e.clientX;
  lastY = e.clientY;
  scene.setPointerCapture(e.pointerId);
  scene.classList.add("dragging");
});

scene.addEventListener("pointermove", (e) => {
  if (!dragging) return;
  rotY += (e.clientX - lastX) * 0.4;
  rotX -= (e.clientY - lastY) * 0.4;
  rotX = Math.max(-90, Math.min(90, rotX));
  lastX = e.clientX;
  lastY = e.clientY;
  applyTransform();
});

function stopDragging() {
  dragging = false;
  scene.classList.remove("dragging");
}
scene.addEventListener("pointerup", stopDragging);
scene.addEventListener("pointercancel", stopDragging);

scene.addEventListener(
  "wheel",
  (e) => {
    e.preventDefault();
    zoom = Math.max(-600, Math.min(400, zoom - e.deltaY * 0.5));
    applyTransform();
  },
  { passive: false }
);

// Double-click the scene to reset the view
scene.addEventListener("dblclick", () => {
  rotX = DEFAULT_VIEW.rotX;
  rotY = DEFAULT_VIEW.rotY;
  zoom = DEFAULT_VIEW.zoom;
  applyTransform();
});

applyTransform();

/* ---------- Layout + text boxes ---------- */

function sizeStack() {
  if (!data) return;
  const maxW = scene.clientWidth * 0.6;
  const maxH = scene.clientHeight * 0.7;
  const s = Math.min(maxW / data.width, maxH / data.height);
  stack.style.width = Math.round(data.width * s) + "px";
  stack.style.height = Math.round(data.height * s) + "px";
}

function fitText(box, lines) {
  const span = box.firstChild;
  let fs = Math.max(6, box.clientHeight / lines / 1.15);
  box.style.fontSize = fs + "px";

  while (
    fs > 6 &&
    (span.offsetHeight > box.clientHeight + 1 ||
      span.scrollWidth > box.clientWidth + 1)
  ) {
    fs -= 0.5;
    box.style.fontSize = fs + "px";
  }
}

function renderLayer(layer, getText) {
  layer.innerHTML = "";

  data.blocks.forEach((b) => {
    const box = document.createElement("div");
    box.className = "tbox";
    box.style.left = (b.cx / data.width) * 100 + "%";
    box.style.top = (b.cy / data.height) * 100 + "%";
    box.style.width = (b.w / data.width) * 100 + "%";
    box.style.height = (b.h / data.height) * 100 + "%";
    box.style.transform = `translate(-50%, -50%) rotate(${b.angle}deg)`;
    box.style.background = b.bg;
    box.style.color = b.fg;

    const span = document.createElement("span");
    span.textContent = getText(b);
    box.appendChild(span);

    layer.appendChild(box);
    fitText(box, b.lines); // must run after it's in the DOM
  });
}

function renderOriginal() {
  renderLayer(originalLayer, (b) => b.text);
}

function renderTranslated() {
  renderLayer(translatedLayer, (b) => b.translations[lang] || b.text);
}

window.addEventListener("resize", () => {
  sizeStack();
  if (data) {
    renderOriginal();
    renderTranslated();
  }
});

/* ---------- Language + prev/next ---------- */


function go(offset) {
  const i = manifest.findIndex((m) => m.id === id);
  const target = manifest[i + offset];
  if (target) {
    location.href = `viewer.html?id=${target.id}`;
  }
}

prevButton.addEventListener("click", () => go(-1));
nextButton.addEventListener("click", () => go(1));

document.addEventListener("keydown", (e) => {
  const tag = document.activeElement.tagName;
  if (tag === "SELECT" || tag === "INPUT") return;
  if (e.key === "ArrowLeft") go(-1);
  if (e.key === "ArrowRight") go(1);
});

/* ---------- Layer toggles + opacity ---------- */

[
  ["toggleImage", document.querySelector(".layer-image")],
  ["toggleOriginal", originalLayer],
  ["toggleTranslated", translatedLayer],
].forEach(([checkboxId, layer]) => {
  const checkbox = document.getElementById(checkboxId);
  checkbox.addEventListener("change", () => {
    // visibility (not display) keeps the layout, so text still fits correctly
    layer.style.visibility = checkbox.checked ? "" : "hidden";
  });
});

const depthSlider = document.getElementById("depthSlider");
function applyBoxOpacity() {
  document.documentElement.style.setProperty(
    "--box-opacity",
    depthSlider.value / 100
  );
}
depthSlider.addEventListener("input", applyBoxOpacity);
applyBoxOpacity();

/* ---------- Load the image's data ---------- */

async function init() {
  if (!/^[a-z0-9-]+$/.test(id)) {
    location.replace("index.html");
    return;
  }



  try {
    const [mRes, dRes] = await Promise.all([
      fetch("data/manifest.json"),
      fetch(`data/${id}.json`),
    ]);
    if (!dRes.ok) throw new Error("Image not found.");

    manifest = mRes.ok ? await mRes.json() : [];
    data = await dRes.json();

    titleEl.textContent = data.title;
    document.title = data.title + " – Archive";
    preview.src = data.image;
    preview.alt = data.title;

    sizeStack();
    renderOriginal();
    renderTranslated();

    const i = manifest.findIndex((m) => m.id === id);
    prevButton.disabled = i <= 0;
    nextButton.disabled = i < 0 || i >= manifest.length - 1;

    statusEl.textContent = data.blocks.length
      ? ""
      : "No text was detected in this image.";
  } catch (err) {
    statusEl.textContent = err.message;
  }
}

init();
(function () {
  "use strict";

  let project = structuredClone(window.VN_PROJECT);
  const original = structuredClone(project);
  let sceneIndex = 0;
  let selected = "dialogue";
  const layerState = {
    background: { visible: true, locked: true, z: 0 },
    character: { visible: true, locked: false, z: 10 },
    dialogue: { visible: true, locked: false, z: 20 }
  };

  const stage = document.getElementById("design-stage");
  const sceneSelect = document.getElementById("scene-select");
  const layerList = document.getElementById("layer-list");
  const form = document.getElementById("property-form");
  const empty = document.getElementById("empty-selection");
  const exportDialog = document.getElementById("export-dialog");
  const exportText = document.getElementById("export-text");
  const opacityValue = document.getElementById("opacity-value");

  const currentScene = () => project.scenes[sceneIndex];
  const layerData = (key) => key === "background" ? currentScene().background : (currentScene()[key] || (currentScene()[key] = { style: { x: 0, y: 0, width: 0.01, height: 0.01, opacity: 0 } }));
  const layerStyle = (key) => key === "background" ? currentScene().background : (layerData(key).style ||= {});
  const pct = (value) => `${Number(value || 0) * 100}%`;
  const assetUrl = (src) => new URL(src, new URL('../', location.href)).href;

  function syncSceneOptions() {
    sceneSelect.replaceChildren(...project.scenes.map((scene, index) => {
      const option = document.createElement("option");
      option.value = index;
      option.textContent = scene.id;
      return option;
    }));
    sceneSelect.value = sceneIndex;
  }

  function createDesignLayer(key) {
    const data = layerData(key) || {};
    const style = layerStyle(key) || {};
    const element = document.createElement("div");
    element.dataset.layer = key;
    element.className = `design-layer design-${key}${selected === key ? " selected" : ""}${layerState[key].visible ? "" : " hidden"}`;
    element.style.zIndex = layerState[key].z;

    if (key === "background") {
      if (data.src) {
        element.style.background = `center / cover no-repeat url("${assetUrl(data.src).replaceAll('"', '\\"')}")`;
      } else if (data.color) element.style.background = data.color;
    } else {
      element.style.left = pct(style.x);
      element.style.top = pct(style.y);
      element.style.width = pct(style.width);
      element.style.height = pct(style.height);
      element.style.opacity = style.opacity ?? 1;
    }

    if (key === "character" && data.src) {
      element.style.background = `center bottom / contain no-repeat url("${assetUrl(data.src).replaceAll('"', '\\"')}")`;
      element.style.clipPath = "none";
    }
    if (key === "dialogue") {
      element.style.background = style.color || "#081020";
      element.style.borderRadius = `${style.radius ?? 24}px`;
      element.style.setProperty("--blur", `${style.blur ?? 16}px`);
      element.style.fontFamily = style.fontFamily || "system-ui, sans-serif";
      element.style.fontSize = `${Math.max(10, (style.fontSize || 32) * stage.clientWidth / project.meta.width)}px`;
      const name = document.createElement("strong");
      name.textContent = data.name || "";
      const text = document.createElement("p");
      text.textContent = data.text || "";
      element.append(name, text);
    }

    element.addEventListener("pointerdown", beginPointerEdit);
    if (selected === key && key !== "background" && !layerState[key].locked) {
      const handle = document.createElement("span");
      handle.className = "resize-handle";
      handle.dataset.resize = "true";
      element.append(handle);
    }
    return element;
  }

  function renderCanvas() {
    stage.style.setProperty("--ratio", project.meta.width / project.meta.height);
    stage.replaceChildren(...["background", "character", "dialogue"]
      .sort((a, b) => layerState[a].z - layerState[b].z)
      .map(createDesignLayer));
  }

  function renderLayers() {
    layerList.replaceChildren(...["background", "character", "dialogue"]
      .sort((a, b) => layerState[b].z - layerState[a].z)
      .map((key) => {
        const row = document.createElement("div");
        row.className = `layer-row${selected === key ? " selected" : ""}`;
        const name = button(key[0].toUpperCase() + key.slice(1), "layer-name", () => selectLayer(key));
        const visible = button(layerState[key].visible ? "◉" : "○", "", () => { layerState[key].visible = !layerState[key].visible; renderAll(); });
        visible.title = "Toggle visibility";
        const lock = button(layerState[key].locked ? "🔒" : "◇", "", () => { layerState[key].locked = !layerState[key].locked; renderAll(); });
        lock.title = "Toggle lock";
        const up = button("↑", "", () => { layerState[key].z += 1; renderAll(); });
        up.title = "Move up";
        const down = button("↓", "", () => { layerState[key].z -= 1; renderAll(); });
        down.title = "Move down";
        row.append(name, visible, lock, up, down);
        return row;
      }));
  }

  function button(label, className, handler) {
    const element = document.createElement("button");
    element.type = "button";
    element.textContent = label;
    element.className = className;
    element.addEventListener("click", handler);
    return element;
  }

  function selectLayer(key) {
    selected = key;
    renderAll();
  }

  function renderProperties() {
    empty.hidden = Boolean(selected);
    form.hidden = !selected;
    if (!selected) return;
    const data = layerData(selected) || {};
    const style = layerStyle(selected) || {};
    document.getElementById("prop-name").value = selected;
    form.querySelectorAll("[data-prop]").forEach((input) => {
      const prop = input.dataset.prop;
      const fallback = prop === "color" ? "#18233d" : prop === "fontFamily" ? "system-ui, sans-serif" : 0;
      input.value = style[prop] ?? fallback;
      input.disabled = selected === "background" && !["color"].includes(prop);
    });
    opacityValue.value = `Opacity ${Number(style.opacity ?? 1).toFixed(2)}`;
    document.getElementById("prop-animation").value = data.animation || "none";
    document.getElementById("prop-animation").disabled = selected === "background";
  }

  function renderAll() {
    syncSceneOptions();
    renderCanvas();
    renderLayers();
    renderProperties();
  }

  function beginPointerEdit(event) {
    const key = event.currentTarget.dataset.layer;
    selectLayer(key);
    if (key === "background" || layerState[key].locked) return;
    event.preventDefault();
    const style = layerStyle(key);
    const start = { pointerX: event.clientX, pointerY: event.clientY, ...style };
    const resize = Boolean(event.target.dataset.resize);
    const rect = stage.getBoundingClientRect();

    function move(moveEvent) {
      const dx = (moveEvent.clientX - start.pointerX) / rect.width;
      const dy = (moveEvent.clientY - start.pointerY) / rect.height;
      if (resize) {
        style.width = Math.max(0.01, Number(start.width || 0) + dx);
        style.height = Math.max(0.01, Number(start.height || 0) + dy);
      } else {
        style.x = Number(start.x ?? 0) + dx;
        style.y = Number(start.y ?? 0) + dy;
      }
      renderCanvas();
      renderProperties();
    }
    function end() {
      removeEventListener("pointermove", move);
      removeEventListener("pointerup", end);
    }
    addEventListener("pointermove", move);
    addEventListener("pointerup", end, { once: true });
  }

  form.addEventListener("input", (event) => {
    const input = event.target;
    const prop = input.dataset.prop;
    if (!prop || !selected) return;
    const style = layerStyle(selected);
    style[prop] = input.type === "text" || input.type === "color" ? input.value : Number(input.value);
    opacityValue.value = `Opacity ${Number(style.opacity ?? 1).toFixed(2)}`;
    renderCanvas();
  });

  document.getElementById("prop-animation").addEventListener("change", (event) => {
    layerData(selected).animation = event.target.value;
    renderCanvas();
  });

  sceneSelect.addEventListener("change", () => { sceneIndex = Number(sceneSelect.value); renderAll(); });
  document.getElementById("preview-button").addEventListener("click", () => open("../app.html", "vn-preview"));
  document.getElementById("reset-button").addEventListener("click", () => { project = structuredClone(original); sceneIndex = 0; renderAll(); });
  document.getElementById("import-button").addEventListener("click", () => document.getElementById("file-input").click());
  document.getElementById("file-input").addEventListener("change", async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    try {
      const text = await file.text();
      const json = text.replace(/^\s*window\.VN_PROJECT\s*=\s*/, "").replace(/;\s*$/, "");
      project = JSON.parse(json);
      sceneIndex = 0;
      renderAll();
    } catch (error) { alert(`Import failed: ${error.message}`); }
    event.target.value = "";
  });

  function serializedProject() {
    return `window.VN_PROJECT = ${JSON.stringify(project, null, 2)};\n`;
  }

  function showExport() {
    exportText.value = serializedProject();
    exportDialog.showModal();
  }
  document.getElementById("export-button").addEventListener("click", showExport);
  document.getElementById("copy-button").addEventListener("click", async () => { await navigator.clipboard.writeText(exportText.value); });
  document.getElementById("download-button").addEventListener("click", () => {
    const url = URL.createObjectURL(new Blob([serializedProject()], { type: "text/javascript" }));
    const anchor = Object.assign(document.createElement("a"), { href: url, download: "project.js" });
    anchor.click();
    URL.revokeObjectURL(url);
  });
  document.getElementById("save-button").addEventListener("click", async () => {
    if (!("showSaveFilePicker" in window)) return showExport();
    try {
      const handle = await showSaveFilePicker({ suggestedName: "project.js", types: [{ description: "JavaScript", accept: { "text/javascript": [".js"] } }] });
      const writable = await handle.createWritable();
      await writable.write(serializedProject());
      await writable.close();
    } catch (error) { if (error.name !== "AbortError") alert(`Save failed: ${error.message}`); }
  });

  renderAll();
})();

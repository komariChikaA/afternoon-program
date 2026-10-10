(function () {
  "use strict";

  const project = window.VN_PROJECT;
  if (!project) throw new Error("VN_PROJECT was not loaded");

  const stage = document.getElementById("vn-stage");
  const sceneRoot = document.getElementById("vn-scene");
  const transition = document.querySelector(".vn-transition");
  const renderMode = new URLSearchParams(location.search).has("render");
  if (renderMode) document.body.classList.add("vn-render-mode");

  const state = {
    sceneIndex: 0,
    localTime: 0,
    globalTime: 0,
    playing: false,
    startedAt: 0,
    raf: 0
  };

  const percent = (value) => `${Number(value || 0) * 100}%`;

  function applyBox(element, style) {
    element.style.left = percent(style.x);
    element.style.top = percent(style.y);
    element.style.width = percent(style.width);
    element.style.height = percent(style.height);
    element.style.opacity = style.opacity ?? 1;
  }

  function makeBackground(scene) {
    const data = scene.background || {};
    if (data.src) {
      const image = document.createElement("img");
      image.src = data.src;
      image.alt = "";
      image.className = "vn-layer vn-background";
      return image;
    }
    const background = document.createElement("div");
    background.className = "vn-layer vn-background";
    if (data.color) background.style.background = data.color;
    return background;
  }

  function makeCharacter(scene, localTime) {
    const data = scene.character;
    if (!data) return null;
    const element = data.src ? document.createElement("img") : document.createElement("div");
    element.className = `vn-layer vn-character ${data.src ? "" : "vn-character-placeholder"}`;
    element.dataset.layerId = "character";
    if (data.src) {
      element.src = data.src;
      element.alt = data.alt || "Character";
    } else {
      element.setAttribute("role", "img");
      element.setAttribute("aria-label", data.alt || "Character placeholder");
    }
    applyBox(element, data.style || {});
    VNAnimation.applyEntrance(element, data.animation, renderMode, localTime);
    return element;
  }

  function makeDialogue(scene, localTime) {
    const data = scene.dialogue;
    if (!data) return null;
    const style = data.style || {};
    const panel = document.createElement("section");
    panel.className = "vn-layer vn-dialogue";
    panel.dataset.layerId = "dialogue";
    applyBox(panel, style);
    panel.style.setProperty("--panel-opacity", style.opacity ?? 0.88);
    panel.style.setProperty("--panel-blur", `${style.blur ?? 16}px`);
    panel.style.setProperty("--panel-radius", `${style.radius ?? 24}px`);
    if (style.color) panel.style.backgroundColor = style.color;
    if (style.fontFamily) panel.style.fontFamily = style.fontFamily;
    const name = document.createElement("h2");
    name.className = "vn-name";
    name.textContent = data.name || "";
    const text = document.createElement("p");
    text.className = "vn-text";
    text.style.fontSize = `${style.fontSize ?? 32}px`;
    text.textContent = renderMode
      ? VNAnimation.typedText(data.text || "", localTime, project.settings.typingSpeed)
      : data.text || "";
    const next = document.createElement("span");
    next.className = "vn-next";
    next.textContent = "▼";
    panel.append(name, text, next);
    VNAnimation.applyEntrance(panel, data.animation, renderMode, localTime);
    if (!renderMode) VNAnimation.typeInteractive(text, data.text || "", project.settings.typingSpeed);
    return panel;
  }

  function renderScene(index, localTime = 0, entry = null) {
    const scene = project.scenes[index];
    if (!scene) return;
    state.sceneIndex = index;
    state.localTime = localTime;
    sceneRoot.replaceChildren();
    sceneRoot.append(makeBackground(scene));
    const character = makeCharacter(scene, localTime);
    const dialogue = makeDialogue(scene, localTime);
    if (character) sceneRoot.append(character);
    if (dialogue) sceneRoot.append(dialogue);

    const camera = scene.camera || {};
    const zoom = Number(camera.zoom || 1);
    sceneRoot.style.transform = `translate(${Number(camera.x || 0) * 100}%, ${Number(camera.y || 0) * 100}%) scale(${zoom})`;

    if (entry && entry.transition !== "cut" && (renderMode || state.playing)) {
      transition.style.opacity = VNAnimation.transitionOpacity(localTime, entry.duration, entry.transitionDuration || 0);
    } else {
      transition.style.opacity = 0;
    }
    document.title = `${project.meta.title} — ${scene.id}`;
    window.dispatchEvent(new CustomEvent("vn:scenechange", { detail: { scene, index } }));
  }

  function entryAt(time) {
    const timeline = project.timeline || [];
    let cursor = 0;
    for (let i = 0; i < timeline.length; i += 1) {
      const entry = timeline[i];
      if (time < cursor + entry.duration || i === timeline.length - 1) {
        return { entry, localTime: Math.max(0, Math.min(entry.duration, time - cursor)) };
      }
      cursor += entry.duration;
    }
    return null;
  }

  function seek(milliseconds) {
    const total = totalDuration();
    state.globalTime = Math.max(0, Math.min(Number(milliseconds) || 0, total));
    const found = entryAt(state.globalTime);
    if (!found) return;
    const index = project.scenes.findIndex((scene) => scene.id === found.entry.scene);
    renderScene(index, found.localTime, found.entry);
  }

  function totalDuration() {
    return (project.timeline || []).reduce((sum, entry) => sum + Number(entry.duration || 0), 0);
  }

  function tick(now) {
    if (!state.playing) return;
    const nextTime = now - state.startedAt;
    if (nextTime >= totalDuration()) {
      seek(totalDuration());
      pause();
      window.dispatchEvent(new Event("vn:ended"));
      return;
    }
    seek(nextTime);
    state.raf = requestAnimationFrame(tick);
  }

  function play() {
    if (state.playing) return;
    if (state.globalTime >= totalDuration()) seek(0);
    state.playing = true;
    state.startedAt = performance.now() - state.globalTime;
    state.raf = requestAnimationFrame(tick);
    window.dispatchEvent(new Event("vn:play"));
  }

  function pause() {
    state.playing = false;
    cancelAnimationFrame(state.raf);
    window.dispatchEvent(new Event("vn:pause"));
  }

  function goToScene(id) {
    const index = project.scenes.findIndex((scene) => scene.id === id);
    if (index < 0) return false;
    let time = 0;
    let matched = null;
    for (const entry of project.timeline || []) {
      if (entry.scene === id) { matched = entry; break; }
      time += entry.duration;
    }
    if (matched) seek(time);
    else renderScene(index, 0, null);
    return true;
  }

  function next() {
    const index = Math.min(project.scenes.length - 1, state.sceneIndex + 1);
    if (index === state.sceneIndex) {
      window.dispatchEvent(new Event("vn:ended"));
      return;
    }
    goToScene(project.scenes[index].id);
  }

  window.VNPlayer = {
    next,
    goToScene,
    play,
    pause,
    seek,
    totalDuration,
    getState: () => ({ ...state })
  };

  function fitStage() {
    const ratio = project.meta.width / project.meta.height;
    const available = innerWidth / innerHeight;
    if (project.settings.fit === "contain") {
      if (available > ratio) {
        stage.style.width = `${innerHeight * ratio}px`;
        stage.style.height = `${innerHeight}px`;
      } else {
        stage.style.width = `${innerWidth}px`;
        stage.style.height = `${innerWidth / ratio}px`;
      }
    }
  }

  addEventListener("resize", fitStage);
  fitStage();
  seek(0);
  window.VN_READY = Promise.resolve(true);
})();

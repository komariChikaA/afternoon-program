(function () {
  "use strict";

  const className = (name) => name && name !== "none" ? `anim-${name}` : "";

  function applyEntrance(element, name, renderMode, localTime = 0) {
    if (!element || !name || name === "none") return;
    element.classList.add(className(name));
    if (renderMode) {
      element.style.animationPlayState = "paused";
      element.style.animationDelay = `${-Math.max(0, localTime)}ms`;
    }
  }

  function transitionOpacity(localTime, duration, transitionDuration) {
    if (!transitionDuration || transitionDuration <= 0) return 0;
    const enter = Math.max(0, 1 - localTime / transitionDuration);
    const exit = Math.max(0, (localTime - (duration - transitionDuration)) / transitionDuration);
    return Math.min(1, Math.max(enter, exit));
  }

  function typedText(text, localTime, speed) {
    if (!speed || speed <= 0) return text;
    return text.slice(0, Math.max(0, Math.floor(localTime / speed)));
  }

  function typeInteractive(element, text, speed) {
    if (!element || !speed || speed <= 0) return;
    element.textContent = "";
    let index = 0;
    const timer = setInterval(() => {
      if (!element.isConnected || index >= text.length) {
        clearInterval(timer);
        if (element.isConnected) element.textContent = text;
        return;
      }
      index += 1;
      element.textContent = text.slice(0, index);
    }, speed);
  }

  window.VNAnimation = { applyEntrance, transitionOpacity, typedText, typeInteractive };
})();

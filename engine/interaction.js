(function () {
  "use strict";

  const stage = document.getElementById("vn-stage");
  const settings = window.VN_PROJECT.settings || {};

  stage.addEventListener("click", (event) => {
    if (event.target.closest("a, button, input, textarea, select")) return;
    window.VNPlayer.next();
  });

  addEventListener("keydown", (event) => {
    if (event.target.matches("input, textarea, select, [contenteditable=true]")) return;
    if ((settings.advanceKeys || ["Space", "Enter"]).includes(event.code)) {
      event.preventDefault();
      window.VNPlayer.next();
    }
  });
})();

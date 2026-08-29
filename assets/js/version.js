(() => {
  "use strict";
  const meta = Object.freeze({ version: "V0.39", saveSchema: 1 });
  window.GAME_META = meta;
  const applyVersion = () => {
    document.title = `星局 ${meta.version} · 1人 vs 3AI`;
    document.querySelectorAll("[data-game-version]").forEach(el => { el.textContent = meta.version; });
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", applyVersion, { once: true });
  else applyVersion();
})();

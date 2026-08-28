(() => {
  "use strict";

  const IMAGE_RESOURCES = [
    "assets/avatars/avatar-1-02b1108d.png",
    "assets/avatars/avatar-2-a2603c90.png",
    "assets/avatars/avatar-3-8c5b7881.png",
    "assets/avatars/avatar-4-3cade4dc.png",
    "assets/avatars/opponent-gongzi-transparent.png",
    "assets/avatars/opponent-shushi-transparent.png",
    "assets/avatars/opponent-yingjian.webp",
    "assets/avatars/opponent-qingce.webp",
    "assets/avatars/opponent-chiyan.webp",
    "assets/avatars/opponent-zixian.webp"
  ];

  const FONT_FAMILIES = [
    "Bebas Neue",
    "Ma Shan Zheng",
    "Noto Sans SC",
    "ZCOOL KuaiLe",
    "ZCOOL QingKe HuangYou",
    "ZCOOL XiaoWei"
  ];

  const state = {
    skipped: false,
    finished: false,
    failed: [],
    readyPromise: null
  };

  const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
  const withTimeout = (promise, ms, label) => new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`${label} 加载超时`)), ms);
    Promise.resolve(promise).then(
      value => { clearTimeout(timer); resolve(value); },
      error => { clearTimeout(timer); reject(error); }
    );
  });

  function preloadImage(url) {
    return withTimeout(new Promise((resolve, reject) => {
      const img = new Image();
      img.decoding = "async";
      img.onload = async () => {
        try {
          if (typeof img.decode === "function") await img.decode();
        } catch (_) {
          // onload 已确认资源可用；decode 失败时仍允许浏览器正常绘制。
        }
        resolve(url);
      };
      img.onerror = () => reject(new Error(`无法加载 ${url}`));
      img.src = url;
    }), 15000, url);
  }

  function preloadFont(family) {
    if (!document.fonts || typeof document.fonts.load !== "function") return Promise.resolve(family);
    return withTimeout(
      document.fonts.load(`16px "${family}"`, "欢乐牌局 PARTY CARD 1234567890"),
      15000,
      family
    ).then(fonts => {
      if (!fonts || fonts.length === 0) throw new Error(`字体 ${family} 未就绪`);
      return family;
    });
  }

  function waitForWindowLoad() {
    if (document.readyState === "complete") return Promise.resolve("页面核心");
    return withTimeout(new Promise(resolve => {
      window.addEventListener("load", () => resolve("页面核心"), { once: true });
    }), 15000, "页面核心");
  }

  function makeTasks() {
    return [
      ...IMAGE_RESOURCES.map(url => ({ label: url.split("/").pop(), run: () => preloadImage(url) })),
      ...FONT_FAMILIES.map(name => ({ label: `字体 · ${name}`, run: () => preloadFont(name) })),
      { label: "游戏核心", run: waitForWindowLoad }
    ];
  }

  function initLoader() {
    const root = document.getElementById("bootLoader");
    if (!root) return;

    document.documentElement.classList.add("boot-loading");

    const bar = root.querySelector("[data-loader-bar]");
    const percent = root.querySelector("[data-loader-percent]");
    const count = root.querySelector("[data-loader-count]");
    const status = root.querySelector("[data-loader-status]");
    const current = root.querySelector("[data-loader-current]");
    const skipBtn = root.querySelector("[data-loader-skip]");
    const retryBtn = root.querySelector("[data-loader-retry]");
    const tasks = makeTasks();

    let completed = 0;
    let total = tasks.length;
    let hidden = false;

    function updateProgress(label) {
      const value = total > 0 ? Math.round((completed / total) * 100) : 100;
      if (bar) bar.style.width = `${value}%`;
      if (percent) percent.textContent = `${value}%`;
      if (count) count.textContent = `${completed} / ${total}`;
      if (current && label) current.textContent = label;
      root.setAttribute("aria-valuenow", String(value));
    }

    function hideLoader(reason) {
      if (hidden) return;
      hidden = true;
      if (reason === "skip") state.skipped = true;
      root.classList.add("is-leaving");
      document.documentElement.classList.remove("boot-loading");
      window.dispatchEvent(new CustomEvent(reason === "skip" ? "game-loader-skipped" : "game-resources-ready"));
      setTimeout(() => root.remove(), 320);
    }

    async function runBatch(batch) {
      state.failed = [];
      completed = 0;
      total = batch.length;
      if (retryBtn) retryBtn.hidden = true;
      if (status) status.textContent = "正在准备牌桌资源…";
      updateProgress("建立资源队列");

      await Promise.all(batch.map(async task => {
        if (current && !hidden) current.textContent = `加载 ${task.label}`;
        try {
          await task.run();
        } catch (error) {
          state.failed.push({ task, error });
        } finally {
          completed += 1;
          if (!hidden) updateProgress(task.label);
        }
      }));

      if (state.failed.length > 0) {
        if (!hidden) {
          const names = state.failed.slice(0, 2).map(item => item.task.label).join("、");
          if (status) status.textContent = `有 ${state.failed.length} 项资源未完成${names ? `：${names}` : ""}`;
          if (current) current.textContent = "可重试，或跳过后边玩边加载";
          if (retryBtn) retryBtn.hidden = false;
        }
        return false;
      }

      state.finished = true;
      if (!hidden) {
        completed = total;
        updateProgress("资源加载完成");
        if (status) status.textContent = "资源加载完成，正在进入牌桌…";
        if (current) current.textContent = "全部资源已就绪";
        await wait(220);
        hideLoader("ready");
      } else {
        window.dispatchEvent(new CustomEvent("game-resources-ready"));
      }
      return true;
    }

    skipBtn?.addEventListener("click", () => hideLoader("skip"));
    retryBtn?.addEventListener("click", () => {
      if (state.failed.length === 0) return;
      const retryTasks = state.failed.map(item => item.task);
      state.readyPromise = runBatch(retryTasks);
    });

    state.readyPromise = runBatch(tasks);
  }

  window.GameLoader = {
    get skipped() { return state.skipped; },
    get finished() { return state.finished; },
    get failedCount() { return state.failed.length; },
    get whenReady() { return state.readyPromise || Promise.resolve(false); }
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initLoader, { once: true });
  } else {
    initLoader();
  }
})();

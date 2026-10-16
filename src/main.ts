import "./style.css";
import { levels } from "./levels";
import { createBall, shoot, step, STEP, type Ball } from "./physics";
import { GolfScene } from "./scene";
import { Sound } from "./audio";
import { destinations } from "./world-map";
function boot() {
  const app = document.querySelector<HTMLDivElement>("#app")!;
  app.innerHTML = `<div class="cloud cloud-a"></div><div class="cloud cloud-b"></div><div id="viewport"><canvas aria-label="立体高尔夫球场：按住白球向后拖拽，松手击球"></canvas></div>
<header><button id="home" class="icon" aria-label="返回选关">⌂</button><button id="sound" class="icon" aria-label="关闭音效" aria-pressed="true">♫</button></header>
<section id="menu"><div class="logo"><h1 aria-label="一杆归洞"><span>一</span><span>杆<i class="logo-flag">⚑</i></span><span>归</span><span>洞<i class="logo-ball"></i></span></h1><p>微 缩 世 界 <i>一杆出发！</i></p></div><div class="map-caption"><span>你的下一杆，落在哪个世界？</span></div><div id="map-labels">${destinations.map((d, i) => `<button class="map-label" data-level="${i}" aria-label="进入第${i + 1}关 ${d.title}"><span class="island-name">${d.theme}</span><strong>${d.title}</strong><small>${d.feature}</small><i class="progress"></i><b class="enter-mark">↗</b></button>`).join("")}</div><button id="start" class="wood-sign"><small>第一次来？</small><strong>从这里出发 <span>➜</span></strong></button><p class="map-help">点击小岛，开启一杆冒险 <span>· 也可用 Tab 选择，Enter 出发</span></p></section>
<section id="game" hidden><div class="level-title"><span id="subtitle"></span><h2 id="title"></h2></div><div id="shot" class="shot">● 一杆机会</div><div id="tutorial" hidden><span class="hand">☝</span><strong>按住白球，向后拉</strong><span>松手击球 · 拉得越远越有力</span><button id="tutorial-close">知道了，试试看</button></div><div class="game-bottom"><div class="feedback"><span id="status" role="status" aria-live="polite">拖拽白球以瞄准</span><div class="power-row"><span class="tee-icon">⚑</span><div class="meter"><i id="power"></i><span class="meter-ticks"></span></div><b id="percent">0%</b></div></div><div class="controls"><button id="retry">↻ 重新开始</button><button id="back">▦ 返回选关</button></div><p id="hint"></p></div></section>
<div id="result" hidden><div class="resultbox"><div id="stars">✦ ★ ✦</div><span id="result-label"></span><h2 id="result-title"></h2><p id="result-text"></p><div class="result-actions"><button id="next" class="primary">下一关 →</button><button id="retry-result">↻ 再试一次</button><button id="result-menu">返回选关</button></div></div></div><div id="webgl-error" hidden role="alert"><h2>这个小世界暂时无法打开</h2><p>游戏需要 WebGL。请使用较新的 Chrome、Edge、Firefox 或 Safari，并开启浏览器硬件加速后刷新页面。</p><button onclick="location.reload()">重新加载</button></div>`;
  const el = (id: string) => document.getElementById(id)!;
  const canvas = document.querySelector("canvas")!;
  let view: GolfScene;
  try {
    view = new GolfScene(canvas);
  } catch (e) {
    el("webgl-error").hidden = false;
    el("menu").hidden = true;
    el("viewport").hidden = true;
    console.warn("WebGL initialization unavailable", e);
    return;
  }
  let index = 0,
    ball: Ball = createBall(levels[0]),
    screen: "menu" | "game" = "menu",
    drag: { x: number; y: number; id: number } | null = null,
    aim = { x: 0, y: 0 },
    last = 0,
    acc = 0,
    winDelay = -1,
    tutorialSeen = false;
  const sound = new Sound();
  let completed: number[] = [];
  try {
    const saved: unknown = JSON.parse(
      localStorage.getItem("golf-progress") || "[]",
    );
    if (Array.isArray(saved))
      completed = saved.filter((i) => Number.isInteger(i) && i >= 0 && i < 3);
    tutorialSeen = localStorage.getItem("golf-tutorial") === "seen";
    sound.enabled = localStorage.getItem("golf-sound") !== "off";
  } catch {}
  function syncSound() {
    el("sound").textContent = "♫";
    el("sound").classList.toggle("muted", !sound.enabled);
    el("sound").setAttribute(
      "aria-label",
      sound.enabled ? "关闭音效" : "开启音效",
    );
    el("sound").setAttribute("aria-pressed", String(sound.enabled));
  }
  syncSound();
  function clearDrag() {
    if (drag && canvas.hasPointerCapture(drag.id))
      canvas.releasePointerCapture(drag.id);
    drag = null;
    view.clearAim();
  }
  function menu() {
    clearDrag();
    screen = "menu";
    mapPress = null;
    el("menu").classList.remove("departing");
    canvas.style.cursor = "default";
    winDelay = -1;
    el("menu").hidden = false;
    el("game").hidden = true;
    el("result").hidden = true;
    document.body.classList.remove("playing");
    view.showMap();
    hover(-1);
    ball = createBall(levels[0]);
    document
      .querySelectorAll<HTMLElement>(".map-label")
      .forEach(
        (c, i) =>
          (c.querySelector(".progress")!.textContent = completed.includes(i)
            ? "★"
            : ""),
      );
    requestAnimationFrame(() => view.resize());
  }
  function start(i: number) {
    clearDrag();
    index = i;
    ball = createBall(levels[i]);
    acc = 0;
    winDelay = -1;
    screen = "game";
    mapPress = null;
    canvas.style.cursor = "crosshair";
    document.body.classList.add("playing");
    el("menu").hidden = true;
    el("game").hidden = false;
    el("result").hidden = true;
    el("title").textContent = levels[i].name;
    el("subtitle").textContent = `第 0${i + 1} 关 / 微缩世界`;
    el("hint").textContent = [
      "瞄准旗帜 · 松手击球",
      "借上方墙壁反弹",
      "穿过文具间的空隙",
    ][i];
    el("tutorial").hidden = tutorialSeen;
    view.setLevel(i);
    view.updateBall(ball, 0);
    sound.unlock();
    update();
    requestAnimationFrame(() => view.resize());
  }
  function dismissTutorial() {
    tutorialSeen = true;
    el("tutorial").hidden = true;
    try {
      localStorage.setItem("golf-tutorial", "seen");
    } catch {}
  }
  function update() {
    const d = drag
      ? Math.min(Math.hypot(drag.x - aim.x, drag.y - aim.y) / 150, 1)
      : 0;
    el("power").style.width = `${d * 100}%`;
    el("percent").textContent = `${Math.round(d * 100)}%`;
    el("shot").textContent =
      ball.state === "ready" ? "● 一杆机会" : "○ 机会已使用";
    el("status").textContent =
      ball.state === "ready"
        ? drag
          ? "向后蓄力 · 松手出发！"
          : "按住白球，向后拖拽"
        : ball.state === "moving"
          ? "滚动中… 看它的！"
          : ball.state === "won"
            ? "好球！正在归洞"
            : "球停住了 · 再试一杆";
  }
  function result() {
    el("result").hidden = false;
    const won = ball.state === "won";
    el("stars").textContent = won ? "✦ ★ ✦" : "↻";
    el("result-label").textContent = won ? "ONE SHOT. PERFECT!" : "再来一杆";
    el("result-title").textContent = won ? "一杆，归洞。" : "差一点也没关系。";
    el("result-text").textContent = won
      ? index === 2
        ? "三个小世界，全部征服！"
        : "漂亮！下一个小世界等着你。"
      : "换个角度，或轻轻调整力度。";
    el("next").hidden = !won || index === 2;
    if (won && !completed.includes(index)) {
      completed.push(index);
      try {
        localStorage.setItem("golf-progress", JSON.stringify(completed));
      } catch {}
    }
    update();
  }
  function enter(i: number) {
    if (screen !== "menu" || !view.map?.enter(i)) return;
    sound.unlock();
    el("menu").classList.add("departing");
  }
  document.querySelectorAll<HTMLButtonElement>("[data-level]").forEach((b) => {
    const i = Number(b.dataset.level);
    b.onclick = () => enter(i);
    b.onpointerenter = () => hover(i);
    b.onpointerleave = () => hover(-1);
    b.onfocus = () => hover(i);
    b.onblur = () => hover(-1);
  });
  function hover(i: number) {
    if (!view.map || view.map.transitioning) return;
    view.map.hover(i);
    document
      .querySelectorAll("[data-level]")
      .forEach((b, n) => b.classList.toggle("active", n === i));
    canvas.style.cursor = i >= 0 ? "pointer" : "default";
  }
  el("start").onclick = () => enter(0);
  el("retry").onclick = el("retry-result").onclick = () => start(index);
  el("back").onclick = el("home").onclick = el("result-menu").onclick = menu;
  el("next").onclick = () => start(index + 1);
  el("tutorial-close").onclick = dismissTutorial;
  el("sound").onclick = () => {
    sound.toggle();
    syncSound();
    try {
      localStorage.setItem("golf-sound", sound.enabled ? "on" : "off");
    } catch {}
  };
  let mapPress: { id: number; x: number; y: number; level: number } | null =
    null;
  canvas.onpointerdown = (e) => {
    if (screen === "menu" && e.isPrimary) {
      const level = view.map?.pick(e.clientX, e.clientY) ?? -1;
      hover(level);
      mapPress = { id: e.pointerId, x: e.clientX, y: e.clientY, level };
      canvas.setPointerCapture(e.pointerId);
      return;
    }
    if (screen !== "game" || ball.state !== "ready" || drag || !e.isPrimary)
      return;
    const projected = view.project(ball.x, ball.y, 9);
    if (Math.hypot(e.clientX - projected.x, e.clientY - projected.y) > 30)
      return;
    const p = view.planePoint(e.clientX, e.clientY, 9);
    if (!p) return;
    dismissTutorial();
    sound.unlock();
    canvas.setPointerCapture(e.pointerId);
    drag = { ...p, id: e.pointerId };
    aim = p;
    update();
  };
  canvas.onpointermove = (e) => {
    if (screen === "menu" && e.pointerType !== "touch") {
      hover(view.map?.pick(e.clientX, e.clientY) ?? -1);
      return;
    }
    if (drag && drag.id === e.pointerId) {
      const p = view.planePoint(e.clientX, e.clientY, 9);
      if (p) {
        aim = p;
        view.showAim(ball, drag.x - aim.x, drag.y - aim.y);
        update();
      }
    }
  };
  canvas.onpointerup = (e) => {
    if (screen === "menu") {
      const p = mapPress;
      mapPress = null;
      if (
        p &&
        p.id === e.pointerId &&
        p.level >= 0 &&
        Math.hypot(p.x - e.clientX, p.y - e.clientY) < 18 &&
        (view.map?.pick(e.clientX, e.clientY) ?? -1) === p.level
      )
        enter(p.level);
      if (canvas.hasPointerCapture(e.pointerId))
        canvas.releasePointerCapture(e.pointerId);
      return;
    }
    if (!drag || drag.id !== e.pointerId) return;
    const p = view.planePoint(e.clientX, e.clientY, 9);
    if (p) aim = p;
    const dx = drag.x - aim.x,
      dy = drag.y - aim.y;
    shoot(ball, dx, dy);
    if (ball.state === "moving") {
      sound.play("shot", Math.min(Math.hypot(dx, dy) / 150, 1));
      view.bump();
    }
    clearDrag();
    update();
  };
  canvas.onpointerleave = () => {
    if (screen === "menu" && !mapPress) hover(-1);
  };
  canvas.onpointercancel = () => {
    mapPress = null;
    hover(-1);
    clearDrag();
    update();
  };
  canvas.onlostpointercapture = () => {
    if (drag) {
      drag = null;
      view.clearAim();
      update();
    }
  };
  window.onkeydown = (e) => {
    if ((e.target as HTMLElement).tagName === "BUTTON" && e.key === " ") return;
    if (screen === "game" && e.key.toLowerCase() === "r") start(index);
    if (e.key === "Escape") menu();
  };
  document.addEventListener("visibilitychange", () => {
    last = performance.now();
    acc = 0;
    clearDrag();
    update();
  });
  canvas.addEventListener("webglcontextlost", (e) => {
    e.preventDefault();
    el("webgl-error").hidden = false;
  });
  canvas.addEventListener("webglcontextrestored", () => location.reload());
  function frame(t: number) {
    const dt = Math.min(Math.max((t - last) / 1000, 0), 0.05);
    last = t;
    if (screen === "menu" && view.map) {
      const destination = view.map.update(t / 1000, dt);
      const offset = el("app").getBoundingClientRect();
      document.querySelectorAll<HTMLElement>("[data-level]").forEach((b, i) => {
        const p = view.map!.anchor(i, true);
        b.style.left = `${p.x - offset.left}px`;
        b.style.top = `${p.y - offset.top}px`;
      });
      const p = view.map.anchor(0);
      el("start").style.left = `${p.x - offset.left + 100}px`;
      el("start").style.top =
        `${Math.min(p.y - offset.top + 120, innerHeight - 95)}px`;
      if (destination !== null) start(destination);
    }
    if (screen === "game") {
      if (ball.state === "moving") {
        acc += dt;
        const bounces = ball.bounces;
        while (acc >= STEP && ball.state === "moving") {
          step(ball, levels[index]);
          acc -= STEP;
        }
        if (ball.bounces > bounces) {
          view.bump();
          sound.play(
            ball.surface || "wood",
            Math.min(Math.hypot(ball.vx, ball.vy) / 400, 1),
          );
        }
        const state = (ball as Ball).state;
        if (state === "won") {
          view.captureBall(ball);
          sound.play("win");
          winDelay = 0;
          update();
        } else if (state === "lost") {
          result();
        }
      }
      view.updateBall(ball, dt);
      if (winDelay >= 0) {
        winDelay += dt;
        if (winDelay > 0.9) {
          winDelay = -1;
          result();
        }
      }
    }
    view.render(t / 1000, dt, screen === "menu");
    requestAnimationFrame(frame);
  }
  menu();
  requestAnimationFrame(frame);
  // Read-only projection diagnostics for browser tests; no physics mutations exposed.
  if (import.meta.env.DEV) {
    Object.defineProperty(window, "golfDebug", {
      value: {
        project: (x: number, y: number, h = 9) => view.project(x, y, h),
        unproject: (x: number, y: number) => view.planePoint(x, y, 9),
        state: () => ({ ...ball }),
        menu: () => view.map?.snapshot(),
        island: (i: number) => view.map?.anchor(i),
        pick: (x: number, y: number) => view.map?.pick(x, y),
        visual: () => ({
          scale: view.ball.scale.toArray(),
          position: view.ball.position.toArray(),
          rotation: view.ball.quaternion.toArray(),
          particles: view.particles.children.length,
          aim: view.aim.children.length,
        }),
        colliders: () => view.collisionBounds(),
        renderer: () => ({
          calls: view.renderer.info.render.calls,
          triangles: view.renderer.info.render.triangles,
          geometries: view.renderer.info.memory.geometries,
        }),
      },
    });
  }
}
boot();

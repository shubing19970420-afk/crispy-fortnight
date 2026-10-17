import "./style.css";
import "./toy-ui.css";
import "./fonts.css";
import "./typography.css";
import "./stage-a.css";
import { woodProp, difficultyStars } from "./ui-props";
import { icon } from "./ui-icons";
import gameLogo from "./assets/game-logo.png";
import { levels } from "./levels";
import { createBall, shoot, step, STEP, type Ball } from "./physics";
import { GolfScene } from "./scene";
import { Sound } from "./audio";
import { destinations } from "./world-map";
import { type Route } from "./route-hints";
import { victory, readScores } from "./records";
function boot() {
  const app = document.querySelector<HTMLDivElement>("#app")!;
  app.innerHTML = `<div class="cloud cloud-a"></div><div class="cloud cloud-b"></div><div id="viewport"><canvas aria-label="立体高尔夫球场：按住白球向后拖拽，松手击球"></canvas></div>
<header><button id="home" class="icon" aria-label="返回选关">${icon("home")}</button><div class="header-tools"><button id="sound" class="icon" aria-label="关闭音效" aria-pressed="true">${icon("sound")}<span class="icon-label">音效开</span></button><button id="settings-open" class="icon" aria-label="打开设置" aria-haspopup="dialog">${icon("settings")}<span class="icon-label">设置</span></button></div></header>
<section id="menu"><div class="logo has-official-logo"><h1><img class="official-logo" src="${gameLogo}" width="2023" height="777" alt="一杆归洞" draggable="false" fetchpriority="high"></h1></div><div id="map-labels">${destinations.map((d, i) => `<button class="map-label" data-level="${i}" aria-label="进入第${i + 1}关 ${d.title}">${woodProp()}<span class="plank-hangers" aria-hidden="true"></span><span class="level-number" aria-hidden="true">0${i+1}</span><strong>${d.title}</strong>${difficultyStars(i+1)}<i class="progress" aria-label="通关进度"></i></button>`).join("")}</div><button id="start" class="wood-sign">${woodProp()}<span class="start-play" aria-hidden="true">▶</span><strong>开始游戏</strong></button><button id="menu-assist" hidden class="assist-setting" aria-pressed="false">⚑ 办公室路线辅助：关闭</button></section>
<section id="game" hidden><div class="level-title">${woodProp()}<span id="subtitle"></span><h2 id="title"></h2></div><div id="shot" class="shot">● 一杆机会</div><div id="tutorial" hidden><span class="hand">☝</span><strong>拖拽白球，松手击球</strong><button id="tutorial-close">知道了</button></div><div class="game-bottom"><div class="feedback"><span id="status" role="status" aria-live="polite">拖拽白球以瞄准</span><div class="power-row"><span class="tee-icon" aria-hidden="true">⚑</span><div class="meter"><i id="power"></i><span class="meter-ticks"></span><span class="power-ball" aria-hidden="true"></span></div><b id="percent">0%</b></div></div><div class="controls"><button id="retry">↻ 重试</button><button id="back" hidden>▦ 选关</button><aside id="route-dock" hidden><button id="route-drawer" aria-expanded="false" aria-controls="route-content">路线提示 <span aria-hidden="true">⌃</span></button><div id="route-content" hidden><h3>路线提示</h3><p class="route-note">沿虚线首段出杆。</p><div id="route-help" hidden role="status"><span id="route-message"></span><button id="offer-route" hidden>显示路线</button></div><button id="route-toggle" aria-pressed="false">⚑ 显示路线</button></div></aside></div><p id="hint"></p></div></section>
<dialog id="settings" aria-labelledby="settings-title"><div class="settings-head"><div><h2 id="settings-title">设置</h2></div><button id="settings-close" class="icon" aria-label="关闭设置">${icon("close")}</button></div><div class="setting-row"><div><strong>音效</strong></div><button id="settings-sound" class="toy-switch" role="switch" aria-label="游戏音效" aria-checked="true"><span class="switch-knob"></span><b>开</b></button></div><div class="setting-row"><div><strong>第三关路线辅助</strong></div><button id="settings-assist" class="toy-switch" role="switch" aria-label="办公室路线辅助" aria-checked="false"><span class="switch-knob"></span><b>关</b></button></div><button id="settings-done">返回游戏</button></dialog>
<div id="result" hidden><div class="resultbox" role="dialog" aria-modal="true" aria-labelledby="result-title"><div class="ribbon-confetti" aria-hidden="true"><i style="--n:0">★</i><i style="--n:1">▪</i><i style="--n:2">▪</i><i style="--n:3">★</i><i style="--n:4">▪</i><i style="--n:5">▪</i><i style="--n:6">★</i><i style="--n:7">▪</i><i style="--n:8">▪</i><i style="--n:9">★</i><i style="--n:10">▪</i><i style="--n:11">▪</i></div><div id="stars">✦ ★ ✦</div><span id="result-label"></span><h2 id="result-title"></h2><p id="result-text"></p><div id="result-stats" hidden><div><small>本次用时</small><strong id="score-time"></strong></div><div><small>历史最佳</small><strong id="score-best"></strong></div><div><small>反弹次数</small><strong id="score-bounces"></strong></div></div><div id="result-route-offer" hidden><span>需要路线提示吗？</span><button id="result-route">显示路线</button></div><div class="result-actions"><button id="next" class="primary">下一关 →</button><button id="retry-result">↻ 再试一次</button><button id="result-menu">返回选关</button></div></div></div><div id="webgl-error" hidden role="alert"><h2>这个小世界暂时无法打开</h2><p>游戏需要 WebGL。请使用较新的 Chrome、Edge、Firefox 或 Safari，并开启浏览器硬件加速后刷新页面。</p><button onclick="location.reload()">重新加载</button></div>`;
  const el = (id: string) => document.getElementById(id)!;
  const canvas = document.querySelector("canvas")!;
  const settings = el("settings") as HTMLDialogElement;
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
  // Reuse one worker: expensive unsuccessful searches never block pointer input.
  const routeWorker=new Worker(new URL('./route-worker.ts',import.meta.url),{type:'module'});
  let generation=0, searching=false, workerAvailable=true;
  routeWorker.onmessage=(e:MessageEvent<{route:Route|null;time:number;generation:number}>)=>{
    searching=false;
    if(e.data.generation!==generation || screen!=="game" || index!==2 || !assist || ball.state!=="ready") return;
    route=e.data.route && ball.time-e.data.time<=.5?e.data.route:null;
    view.showRoute(route?.points);
    el("route-message").textContent=route?`推荐力度 ${Math.round(route.power/150*100)}% · 可出杆`:"等待同事经过";
  };
  routeWorker.onerror=()=>{workerAvailable=false;searching=false;route=null;view.showRoute();el("route-message").textContent="提示不可用，请重载";};
  let completed: number[] = [];
  let settled=false, assist=false, failures=[0,0,0], nextHint=0, route:Route|null=null, scoreFrame=0;
  try { assist=localStorage.getItem("golf-assist")==="on"; const f=JSON.parse(localStorage.getItem("golf-failures")||"[]"); failures=failures.map((_,i)=>Number.isSafeInteger(f?.[i])&&f[i]>=0?f[i]:0); } catch {}
  let best: Record<string, number> = {};
  try {
    best = readScores(localStorage.getItem("golf-best-v4"));
  } catch {}
  try {
    const saved: unknown = JSON.parse(
      localStorage.getItem("golf-progress-v4") || "[]",
    );
    if (Array.isArray(saved))
      completed = saved.filter((i) => Number.isInteger(i) && i >= 0 && i < 3);
    tutorialSeen = localStorage.getItem("golf-tutorial") === "seen";
    sound.enabled = localStorage.getItem("golf-sound") !== "off";
  } catch {}
  function syncSound() {
    el("sound").innerHTML = icon(sound.enabled ? "sound" : "muted") + `<span class="icon-label">${sound.enabled ? "音效开" : "已静音"}</span>`;
    el("settings-sound").setAttribute("aria-checked", String(sound.enabled));
    el("settings-sound").querySelector("b")!.textContent = sound.enabled ? "开" : "关";
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
    setRouteOpen(false);
    cancelAnimationFrame(scoreFrame);
    generation++;
    syncAssist();
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
            ? "✓"
            : ""),
      );
    requestAnimationFrame(() => view.resize());
  }
  function start(i: number) {
    setRouteOpen(false);
    clearDrag();
    cancelAnimationFrame(scoreFrame);
    settled=false; route=null; nextHint=0; generation++;
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
    el("subtitle").textContent = `第 0${i + 1} 关`;
    el("hint").textContent = [
      "箭头指向出球方向",
      "北侧缺口 → 南侧缺口",
      "注意同事经过 · 桌底可穿行",
    ][i];
    el("tutorial").hidden = tutorialSeen;
    view.setLevel(i);
    view.updateBall(ball, 0);
    syncAssist();
    sound.unlock();
    update();
    requestAnimationFrame(() => view.resize());
  }
  function dismissTutorial() {
    tutorialSeen = true;
    el("tutorial").hidden = true;
    update();
    try {
      localStorage.setItem("golf-tutorial", "seen");
    } catch {}
  }
  function update() {
    const d = drag
      ? Math.min(Math.hypot(drag.x - aim.x, drag.y - aim.y) / 150, 1)
      : 0;
    el("power").style.width = `${d * 100}%`;
    el("power").parentElement!.style.setProperty("--power", String(d));
    el("percent").textContent = `${Math.round(d * 100)}%`;
    el("shot").textContent =
      ball.state === "ready" ? "仅一杆" : "已击球";
    el("retry").hidden = ball.state === "won" || ball.state === "lost";
    el("status").textContent =
      ball.state === "ready"
        ? !tutorialSeen && !drag ? "" : drag
          ? "松手击球"
          : index === 2
            ? "观察同事后出杆"
            : index === 1
              ? "借墙反弹"
              : "拖拽白球，松手击球"
        : ball.state === "moving"
          ? "滚动中"
          : ball.state === "won"
            ? "进洞"
            : "未进洞";
  }
  function result() {
    if(settled) return;
    settled=true;
    el("result").hidden=false;
    const won=ball.state==="won";
    el("result").classList.toggle("victory",won);
    el("result").classList.remove("new-record");
    el("stars").textContent=won?"✦ ★ ✦":"↻";
    el("result-title").textContent=won?"一杆归洞！":"再来一杆！";
    el("result-label").textContent="";
    el("result-text").textContent=won?"":"调整方向或力度再试。";
    el("result-stats").hidden=!won;
    if(won) {
      const score=victory(ball.time-ball.shotAt,best[String(index)]);
      best[String(index)]=score.best;
      el("result-label").textContent={first:"首次通关！",record:"NEW RECORD！新纪录！",success:"挑战成功！"}[score.kind];
      el("result").classList.toggle("new-record",score.kind==="record");
      el("score-best").textContent=score.best.toFixed(2)+" 秒";
      el("score-bounces").textContent=String(ball.bounces)+" 次";
      const began=performance.now();
      const count=(t:number)=>{ const progress=matchMedia('(prefers-reduced-motion: reduce)').matches?1:Math.min((t-began)/420,1); el("score-time").textContent=(score.seconds*(1-(1-progress)**3)).toFixed(2)+" 秒"; if(progress<1) scoreFrame=requestAnimationFrame(count); };
      scoreFrame=requestAnimationFrame(count);
      failures[index]=0;
      if(!completed.includes(index)) completed.push(index);
      try { localStorage.setItem("golf-best-v4",JSON.stringify(best)); localStorage.setItem("golf-progress-v4",JSON.stringify(completed)); } catch {}
    } else failures[index]++;
    try {localStorage.setItem("golf-failures",JSON.stringify(failures));} catch {}
    el("result-route-offer").hidden=won||index!==2||failures[2]<3||assist;
    el("next").hidden=!won||index===2;
    syncAssist(); update();
  }
  function syncAssist() {
    el("menu-assist").textContent=`第三关提示：${assist?"开":"关"}`;
    el("menu-assist").setAttribute("aria-pressed",String(assist));
    el("route-dock").hidden=index!==2;
    el("settings-assist").setAttribute("aria-checked",String(assist));
    el("settings-assist").querySelector("b")!.textContent=assist?"开":"关";
    el("route-toggle").textContent=assist?"关闭路线":"显示路线";
    el("route-toggle").setAttribute("aria-pressed",String(assist));
    const offer=index===2&&!assist&&failures[2]>=3;
    el("route-drawer").classList.toggle("has-offer",offer);
    el("route-toggle").hidden=offer;
    el("route-help").hidden=screen!=="game"||index!==2||(!assist&&!offer);
    el("offer-route").hidden=!offer;
    if(offer) el("route-message").textContent="需要路线提示吗？";
    if(!assist) {route=null; view.showRoute();}
    else el("route-message").textContent="正在验证路线…";
  }
  function toggleAssist() {
    assist=!assist; nextHint=0; generation++;
    try {localStorage.setItem("golf-assist",assist?"on":"off");} catch {}
    syncAssist();
  }
  function setRouteOpen(open: boolean) {
    el("route-content").hidden=!open;
    el("route-drawer").setAttribute("aria-expanded",String(open));
    el("route-drawer").firstChild!.textContent=open?"收起提示 ":"路线提示 ";
    document.body.classList.toggle("route-open",open);
  }
  el("route-drawer").onclick=()=>setRouteOpen(el("route-content").hidden);
  el("settings-assist").onclick=toggleAssist;
  el("settings-open").onclick=()=>{clearDrag();update();settings.showModal();};
  el("settings-close").onclick=el("settings-done").onclick=()=>settings.close();
  settings.addEventListener("close",()=>{last=performance.now();acc=0;});
  settings.addEventListener("keydown",(e)=>{
    if(e.key!=="Tab") return;
    const buttons=Array.from(settings.querySelectorAll<HTMLButtonElement>("button:not([disabled])"));
    const first=buttons[0], lastButton=buttons.at(-1);
    if(e.shiftKey && (document.activeElement===first || document.activeElement===settings)) {
      e.preventDefault(); lastButton?.focus();
    } else if(!e.shiftKey && document.activeElement===lastButton) {
      e.preventDefault(); first?.focus();
    }
  });
  settings.addEventListener("click",(e)=>{
    const r=settings.getBoundingClientRect();
    if(e.target===settings && (e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)) settings.close();
  });
  el("result-route").onclick=()=>{if(!assist) toggleAssist();start(index);};
  el("menu-assist").onclick=el("route-toggle").onclick=el("offer-route").onclick=toggleAssist;
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
  el("sound").onclick = el("settings-sound").onclick = () => {
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
      setRouteOpen(false);
      view.showRoute();
      el("route-help").hidden=true;
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
    if(settings.open) return;
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
    if (document.hidden || settings.open) {
      last = t;
      requestAnimationFrame(frame);
      return;
    }
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
      if(index===2 && assist && ball.state==="ready" && ball.time>=nextHint) {
        if(route && ball.time-route.launchAt>.5) {route=null; view.showRoute();el("route-message").textContent="正在验证路线…";}
        if(!searching && workerAvailable) {
          nextHint=ball.time+.25; searching=true;
          routeWorker.postMessage({level:levels[index],time:ball.time,generation});
        }
        el("route-help").hidden=false;
      }
      if (ball.state === "moving" || ball.state === "ready") {
        acc += dt;
        const bounces = ball.bounces;
        while (
          acc >= STEP &&
          (ball.state === "moving" || ball.state === "ready")
        ) {
          step(ball, levels[index]);
          acc -= STEP;
        }
        if (ball.bounces > bounces) {
          view.bump(ball.surface, ball.lastCollider);
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
        state: () => ({ ...ball, hits: [...ball.hits] }),
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
        hint: () => route ? {angle:route.angle,power:route.power,launchAt:route.launchAt,points:route.points.length} : null,
        colliders: () => view.collisionBounds(),
        course: () => view.courseSnapshot(),
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

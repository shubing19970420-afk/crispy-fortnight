import "./style.css";
import "./toy-ui.css";
import "./fonts.css";
import "./typography.css";
import "./stage-a.css";
import "./stage-b.css";
import "./ui-tokens.css";
import "./ui-kit.css";
import "./iteration.css";
import "./world-refresh.css";
import "./local-polish.css";
import {menuBackdrop} from "./menu-backdrop";
import { carvedPlaque, recordMedals, solidIcon, toyFace, powerSegments } from "./ui-kit";
import { routeMap } from "./route-map";
import { Music } from "./music";
import { woodProp, bulbProp } from "./ui-props";
import { icon } from "./ui-icons";
import gameLogo from "./assets/game-logo.png";
import { levels } from "./levels";
import { createBall, shoot, step, STEP, actorAt, type Ball } from "./physics";
import { GolfScene } from "./scene";
import { Sound } from "./audio";
import { destinations } from "./world-map";
import { type Route } from "./route-hints";
import { victory, readScores } from "./records";
function boot() {
  const app = document.querySelector<HTMLDivElement>("#app")!;
  app.innerHTML = `${menuBackdrop}<div class="cloud cloud-a"></div><div class="cloud cloud-b"></div><div id="viewport"><div id="canvas-surface"><canvas aria-label="立体高尔夫球场：按住白球向后拖拽，松手击球"></canvas><div id="map-labels">${destinations.map((d, i) => `<button class="map-label" data-level="${i}" aria-label="进入第${i + 1}关 ${d.title}">${carvedPlaque()}<span class="plank-hangers" aria-hidden="true"></span><span class="level-number" aria-hidden="true">0${i+1}</span><strong>${d.title}</strong>${recordMedals(undefined)}<i class="progress" aria-label="通关进度"></i></button>`).join("")}</div></div></div>
<header><button id="home" class="icon prop-button" aria-label="返回选关">${toyFace(solidIcon("home"))}</button><div class="header-tools"><button id="sound" class="icon prop-button" aria-label="关闭音效" aria-pressed="true">${icon("sound")}<span class="icon-label">音效开</span></button><button id="settings-open" class="icon prop-button" aria-label="打开设置" aria-haspopup="dialog">${toyFace(solidIcon("settings"))}</button></div></header>
<section id="menu"><div class="logo has-official-logo"><h1><img class="official-logo" src="${gameLogo}" width="2023" height="777" alt="一杆归洞" draggable="false" fetchpriority="high"></h1><span class="logo-english" aria-hidden="true">HOLE IN ONE</span></div><button id="menu-assist" hidden class="assist-setting" aria-pressed="false">⚑ 办公室路线辅助：关闭</button></section>
<section id="game" hidden><div class="level-title">${carvedPlaque()}<span id="subtitle"></span><h2 id="title"></h2></div><div id="shot" class="shot">● 一杆机会</div><div id="tutorial" hidden><span class="hand">☝</span><strong>拖拽白球，松手击球</strong><button id="tutorial-close">知道了</button></div><div class="game-bottom"><div class="feedback"><span id="status" role="status" aria-live="polite">拖拽白球以瞄准</span><div class="power-row"><span class="tee-icon" aria-hidden="true">⚑</span><div class="meter"><i id="power"></i><span class="meter-ticks">${powerSegments()}</span><span class="power-ball" aria-hidden="true"></span></div><b id="percent">0%</b></div></div><div class="controls"><aside id="route-dock" hidden><button id="route-drawer" aria-label="打开路线提示" aria-expanded="false" aria-controls="route-content">${bulbProp()}</button></aside><button id="retry" class="prop-button prop-button--coral">${toyFace(`${solidIcon("retry")}<span>重试</span>`)}</button><button id="back" hidden>▦ 选关</button></div><p id="hint"></p></div></section>
<div id="route-content" hidden role="region" tabindex="0" aria-label="路线提示木牌，点击空白或按 Escape 收起"><span class="route-posts" aria-hidden="true"></span>${woodProp()}<h3>路线提示</h3><button id="route-close" aria-label="关闭路线提示">${icon("close")}</button><div id="route-map"></div><div id="route-help" role="status"><span id="route-message"></span><button id="offer-route" hidden>显示路线</button></div><button id="route-toggle" aria-pressed="false">显示路线</button></div><dialog id="settings" aria-labelledby="settings-title"><div class="settings-frame" aria-hidden="true">${woodProp()}</div><div class="settings-head"><div class="settings-sign">${woodProp()}<h2 id="settings-title">设置</h2></div><button id="settings-close" class="icon" aria-label="关闭设置">${icon("close")}</button></div><div class="settings-paper"><div class="setting-row"><strong>♫ 音乐</strong><button id="settings-music" class="toy-switch" role="switch" aria-label="背景音乐" aria-checked="false"><span class="switch-knob"></span><b>关</b></button></div><div class="setting-row"><strong>♪ 音效</strong><button id="settings-sound" class="toy-switch" role="switch" aria-label="游戏音效" aria-checked="true"><span class="switch-knob"></span><b>开</b></button></div><button id="instructions-toggle" aria-expanded="false" aria-controls="instructions">玩法说明 <span aria-hidden="true">⌄</span></button><div id="instructions" hidden>向后拖拽白球，松手击球。<br>每次仅一杆，球经过洞口即通关。<br>第三关起点击灯泡查看路线。</div></div><button id="settings-done">返回游戏</button></dialog>
<div id="result" hidden><div class="resultbox" role="dialog" aria-modal="true" aria-labelledby="result-title"><div class="ribbon-confetti" aria-hidden="true"><i style="--n:0">★</i><i style="--n:1">▪</i><i style="--n:2">▪</i><i style="--n:3">★</i><i style="--n:4">▪</i><i style="--n:5">▪</i><i style="--n:6">★</i><i style="--n:7">▪</i><i style="--n:8">▪</i><i style="--n:9">★</i><i style="--n:10">▪</i><i style="--n:11">▪</i></div><div class="failure-scene" aria-hidden="true"><span class="failure-ball"></span><span class="failure-hole"></span><span class="failure-flag"></span></div><div id="stars">✦ ★ ✦</div><span id="result-label"></span><h2 id="result-title"></h2><p id="result-text"></p><div id="result-stats" hidden><div><small>本次用时</small><strong id="score-time"></strong></div><div><small>历史最佳</small><strong id="score-best"></strong></div><div><small>反弹次数</small><strong id="score-bounces"></strong></div></div><div id="result-route-offer" hidden><span>需要路线提示吗？</span><button id="result-route">显示路线</button></div><div class="result-actions"><button id="next" class="primary">下一关 →</button><button id="retry-result">↻ 再试一次</button><button id="result-menu">返回选关</button></div></div></div><div id="webgl-error" hidden role="alert"><h2>这个小世界暂时无法打开</h2><p>游戏需要 WebGL。请使用较新的 Chrome、Edge、Firefox 或 Safari，并开启浏览器硬件加速后刷新页面。</p><button onclick="location.reload()">重新加载</button></div>`;
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
  let mapScroll=0;
  const sound = new Sound();
  const music = new Music();
  try { music.enabled=localStorage.getItem("golf-music")!=="off"; } catch {}
  document.addEventListener("pointerdown",()=>music.unlock());
  document.addEventListener("keydown",()=>music.unlock());
  document.addEventListener("visibilitychange",()=>music.visibility());
  window.addEventListener("pagehide",()=>music.dispose(),{once:true});
  function syncMusic() {el("settings-music").setAttribute("aria-checked",String(music.enabled));el("settings-music").querySelector("b")!.textContent=music.enabled?"开":"关";}
  syncMusic();
  el("settings-music").onclick=()=>{music.toggle();syncMusic();try{localStorage.setItem("golf-music",music.enabled?"on":"off");}catch{}};
  el("instructions-toggle").onclick=()=>{const open=el("instructions").hidden;el("instructions").hidden=!open;el("instructions-toggle").setAttribute("aria-expanded",String(open));};
  // Reuse one worker: expensive unsuccessful searches never block pointer input.
  const routeWorker=new Worker(new URL('./route-worker.ts',import.meta.url),{type:'module'});
  let generation=0, searching=false, workerAvailable=true, routeOpen=false;
  routeWorker.onmessage=(e:MessageEvent<{route:Route|null;time:number;generation:number}>)=>{
    searching=false;
    if(e.data.generation!==generation || screen!=="game" || index<2 || !assist || !routeOpen || ball.state!=="ready") return;
    route=e.data.route && ball.time-e.data.time<=.25?e.data.route:null;
    view.showRoute(route?.points);
    el("route-map").innerHTML=routeMap(levels[index],route,ball.time);
    el("route-message").textContent=route?`推荐力度 ${Math.round(route.power/150*100)}% · 可出杆`:levels[index].rotor?"等待叶片转到合适位置":"等待同事经过";
  };
  routeWorker.onerror=()=>{workerAvailable=false;searching=false;route=null;view.showRoute();el("route-map").innerHTML=routeMap(levels[index],null,ball.time);el("route-message").textContent="提示不可用，请重载";};
  let completed: number[] = [];
  let settled=false, assist=false, failures=levels.map(()=>0), nextHint=0, route:Route|null=null, scoreFrame=0;
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
      completed = saved.filter((i) => Number.isInteger(i) && i >= 0 && i < levels.length);
    tutorialSeen = localStorage.getItem("golf-tutorial") === "seen";
    sound.enabled = localStorage.getItem("golf-sound") !== "off";
  } catch {}
  function syncSound() {
    el("sound").innerHTML = toyFace(solidIcon(sound.enabled ? "sound" : "muted"));
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
    sound.reset();
    setRouteOpen(false);
    cancelAnimationFrame(scoreFrame);
    generation++;
    syncAssist();
    clearDrag();
    screen = "menu";
    syncAssist();
    mapPress = null;
    el("menu").classList.remove("departing");
    el("map-labels").classList.remove("departing");
    canvas.style.cursor = "default";
    winDelay = -1;
    el("menu").hidden = false;
    el("game").hidden = true;
    el("result").hidden = true;
    document.body.classList.remove("playing","sea-course");
    view.showMap([...new Set([...completed,...Object.keys(best).map(Number)])]);
    hover(-1);
    ball = createBall(levels[0]);
    document.querySelectorAll<HTMLElement>(".map-label").forEach((c,i)=>{
      c.querySelector(".medal-rack")!.outerHTML=recordMedals(best[String(i)],completed.includes(i));
      const locked=!unlocked(i);c.classList.toggle("locked",locked);c.setAttribute("aria-disabled",String(locked));
      c.querySelector(".progress")!.textContent=locked?"完成上一关解锁":"";
    });
    requestAnimationFrame(() => {view.resize();el("viewport").scrollTop=mapScroll;});
  }
  function start(i: number) {
    sound.reset();
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
    document.body.classList.toggle("sea-course",!!levels[i].platforms);
    el("menu").hidden = true;
    el("game").hidden = false;
    el("result").hidden = true;
    el("title").textContent = levels[i].name;
    el("subtitle").textContent = `0${i + 1}`;
    el("hint").textContent = [
      "箭头指向出球方向",
      "北侧缺口 → 南侧缺口",
      "注意同事经过 · 桌底可穿行",
      "顺时针转动 · 借叶片推一把",
      "蓝门入，橙门出 · 方向随出口改变",
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
          : index === 3 ? "借叶片转向" : index === 4 ? "借挡板三次反弹" : index === 2
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
    el("stars").textContent=won?"✦ ★ ✦":"";
    el("result-title").textContent=won?"一杆归洞！":"再来一杆！";
    el("result-label").textContent="";
    el("result-text").textContent="";
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
    el("result-route-offer").hidden=won||index<2||failures[index]<3||assist;
    el("next").hidden=!won||index===levels.length-1;
    syncAssist(); update();
  }
  function syncAssist() {
    el("menu-assist").textContent=`第三关提示：${assist?"开":"关"}`;
    el("menu-assist").setAttribute("aria-pressed",String(assist));
    el("route-dock").hidden=screen!=="game"||index<2;

    el("route-toggle").textContent=assist?"关闭路线":"显示路线";
    el("route-toggle").setAttribute("aria-pressed",String(assist));
    const offer=index>=2&&!assist&&failures[index]>=3;
    el("route-drawer").classList.toggle("has-offer",offer);
    el("route-toggle").hidden=offer;
    el("route-help").hidden=screen!=="game"||index<2||(!assist&&!offer);
    el("offer-route").hidden=!offer;
    if(offer) el("route-message").textContent="需要路线提示吗？";
    if(!assist) {route=null; view.showRoute();el("route-map").innerHTML=routeMap(levels[index],null,ball.time);}
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
    routeOpen=open;generation++;route=null;nextHint=0;view.showRoute();
    el("route-drawer").setAttribute("aria-label",open?"关闭路线提示":"打开路线提示");
    if(open) {if(!assist) toggleAssist();el("route-map").innerHTML=routeMap(levels[index],null,ball.time);el("route-message").textContent="正在验证路线…";}
    else el("route-map").innerHTML="";
    document.body.classList.toggle("route-open",open);
  }
  el("route-drawer").onclick=()=>setRouteOpen(el("route-content").hidden);
  el("route-close").onclick=()=>{setRouteOpen(false);el("route-drawer").focus();};
  el("route-content").onclick=(e)=>{if(!(e.target as Element).closest("button"))setRouteOpen(false);};
  el("route-content").onkeydown=(e)=>{if(e.key==="Escape"||e.key==="Enter"){e.preventDefault();e.stopPropagation();setRouteOpen(false);el("route-drawer").focus();}};
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
  el("result-route").onclick=()=>{if(!assist) toggleAssist();start(index);setRouteOpen(true);};
  el("menu-assist").onclick=el("route-toggle").onclick=el("offer-route").onclick=toggleAssist;
  function unlocked(i:number){return i<3||completed.includes(i-1)||Number.isFinite(best[String(i-1)]);}
  function enter(i: number) {
    if(!unlocked(i)){el("menu").setAttribute("aria-label",`先完成第${i}关，解锁下一座岛`);return;}
    if (screen !== "menu" || !view.map?.enter(i)) return;
    mapScroll=el("viewport").scrollTop;
    sound.unlock();
    el("menu").classList.add("departing");
    el("map-labels").classList.add("departing");
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
    if(routeOpen && e.key==="Escape") {e.preventDefault();setRouteOpen(false);el("route-drawer").focus();return;}
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
      const offset = el("canvas-surface").getBoundingClientRect();
      document.querySelectorAll<HTMLElement>("[data-level]").forEach((b, i) => {
        const p = view.map!.anchor(i, true);
        const labelX=p.x-offset.left;
        b.style.left = `${innerWidth<650?Math.max(75,Math.min(innerWidth-75,labelX)):labelX}px`;
        b.style.top = `${p.y - offset.top}px`;
      });
      if (destination !== null) start(destination);
    }
    if (screen === "game") {
      if(routeOpen) {const a=actorAt(levels[index],ball.time), dot=el("route-map").querySelector("#route-person");if(a&&dot){dot.setAttribute("cx",String(a.x));dot.setAttribute("cy",String(a.y));}}
      if(index>=2 && assist && routeOpen && ball.state==="ready" && ball.time>=nextHint) {
        if(route && ball.time-route.launchAt>.25) {route=null; view.showRoute();el("route-message").textContent="正在验证路线…";el("route-map").innerHTML=routeMap(levels[index],null,ball.time);}
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
          const previousBounces=ball.bounces,previousTransfers=ball.teleports||0;
          step(ball, levels[index]);
          if(ball.bounces>previousBounces){
            view.contactFeedback(ball);
            sound.impact(ball.surface||"wood",Math.min(Math.hypot(ball.vx,ball.vy)/500,1),ball.time);
          }
          if((ball.teleports||0)>previousTransfers){view.teleport(ball);sound.play("portal",.6);}
          acc -= STEP;
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
        if (winDelay > 0.65) {
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
        music: () => ({enabled:music.enabled,playing:music.playing}),
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

import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
  headless: true,
  args: ["--no-sandbox", "--enable-unsafe-swiftshader"],
});
try {
  const page = await browser.newPage({
    viewport: { width: 1280, height: 900 },
    hasTouch: true,
  });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  const url = process.env.GOLF_URL || "http://127.0.0.1:5173";
  await page.goto(url);
  await page.waitForFunction(() => !!window.golfDebug);
  await fs.mkdir("test-results", { recursive: true });
  await page.screenshot({ path: "test-results/menu-desktop.png" });
  const solutions = JSON.parse(
    await fs.readFile("/tmp/golf-solutions.json", "utf8"),
  );
  async function stable() {
    await page.evaluate(
      () =>
        new Promise((r) =>
          requestAnimationFrame(() => requestAnimationFrame(r)),
        ),
    );
  }
  async function openLevel(i, raycast = false) {
    if (raycast) {
      await stable();
      const p = await page.evaluate((i) => window.golfDebug.island(i), i);
      assert.equal(
        await page.evaluate(
          (p) => document.elementFromPoint(p.x, p.y).tagName,
          p,
        ),
        "CANVAS",
      );
      await page.mouse.click(p.x, p.y);
    } else await page.locator(`[data-level="${i}"]`).click();
    await page.locator("#game").waitFor({ state: "visible" });
    await page.waitForFunction(() => !window.golfDebug.menu());
    await stable();
  }
  async function project(x, y) {
    return page.evaluate(({ x, y }) => window.golfDebug.project(x, y), {
      x,
      y,
    });
  }
  async function fit() {
    const r = await page.locator("canvas").boundingBox();
    for (const x of [0, 900])
      for (const y of [0, 560]) {
        const p = await page.evaluate(
          ({ x, y }) => window.golfDebug.project(x, y, 0),
          { x, y },
        );
        assert.ok(
          p.x >= r.x &&
            p.x <= r.x + r.width &&
            p.y >= r.y &&
            p.y <= r.y + r.height,
        );
      }
  }
  async function shoot(dx, dy, start, touch = false) {
    await stable();
    await fit();
    const a = await project(start.x, start.y),
      b = await project(start.x - dx, start.y - dy);
    // The projection must round-trip through the exact gameplay ray plane.
    const round = await page.evaluate(
      (p) => window.golfDebug.unproject(p.x, p.y),
      b,
    );
    assert.ok(
      Math.abs(round.x - (start.x - dx)) < 0.001 &&
        Math.abs(round.y - (start.y - dy)) < 0.001,
    );
    if (touch) {
      const c = await page.context().newCDPSession(page);
      await c.send("Input.dispatchTouchEvent", {
        type: "touchStart",
        touchPoints: [{ x: a.x, y: a.y, id: 1 }],
      });
      await c.send("Input.dispatchTouchEvent", {
        type: "touchMove",
        touchPoints: [{ x: b.x, y: b.y, id: 1 }],
      });
      assert.notEqual(await page.locator("#percent").textContent(), "0%");
      await c.send("Input.dispatchTouchEvent", {
        type: "touchEnd",
        touchPoints: [],
      });
      await c.detach();
    } else {
      await page.mouse.move(a.x, a.y);
      await page.mouse.down();
      await page.mouse.move(b.x, b.y, { steps: 5 });
      assert.notEqual(await page.locator("#percent").textContent(), "0%");
      await page.mouse.up();
    }
  }
  const starts = [
    { x: 180, y: 280 },
    { x: 180, y: 360 },
    { x: 150, y: 390 },
  ];
  for (let i = 0; i < 3; i++) {
    await openLevel(i, true);
    await stable();
    if (await page.locator("#tutorial").isVisible())
      await page.locator("#tutorial-close").click();
    for (const { rect, bounds } of await page.evaluate(() =>
      window.golfDebug.colliders(),
    ))
      for (const key of ["x", "y", "w", "h"])
        assert.ok(
          Math.abs(rect[key] - bounds[key]) < 0.01,
          `level ${i + 1} ${key} collider alignment`,
        );
    await page.screenshot({ path: `test-results/level-${i + 1}.png` });
    await shoot(solutions[i].dx, solutions[i].dy, starts[i]);
    const first = await page.evaluate(() => window.golfDebug.state());
    assert.equal(first.state, "moving");
    // A second pointer gesture cannot fire another shot.
    await page.locator("canvas").dispatchEvent("pointerdown", {
      pointerId: 2,
      isPrimary: true,
      clientX: 10,
      clientY: 10,
    });
    await page.waitForFunction(
      () => window.golfDebug.state().state === "won",
      {},
      { timeout: 40000 },
    );
    const state = await page.evaluate(() => window.golfDebug.state());
    assert.equal(state.bounces, i === 0 ? 0 : 1);
    await page
      .getByText("一杆，归洞。", { exact: true })
      .waitFor({ timeout: 15000 });
    if (i === 2) await page.screenshot({ path: "test-results/success.png" });
    if (i < 2) {
      await page.locator("#next").click();
      assert.equal(
        await page.locator("#title").textContent(),
        ["", "请走弯路", "办公室高尔夫"][i + 1],
      );
    }
    await page.locator(i === 2 ? "#result-menu" : "#home").click();
    console.log(
      "PASS desktop level",
      i + 1,
      "drag, projection, collider bounds, win, navigation",
    );
  }
  await openLevel(0);
  await shoot(8, 0, starts[0]);
  await page
    .getByText("差一点也没关系。", { exact: true })
    .waitFor({ timeout: 10000 });
  await page.locator("#retry-result").click();
  assert.ok(await page.locator("#result").isHidden());
  assert.equal(
    (await page.evaluate(() => window.golfDebug.state())).state,
    "ready",
  );
  console.log("PASS failure and immediate retry");
  // Pointer cancellation must not fire.
  await stable();
  const start = await project(180, 280);
  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  await page.mouse.move(start.x - 20, start.y + 10);
  await page.locator("canvas").dispatchEvent("pointercancel");
  await page.mouse.up();
  assert.equal(
    (await page.evaluate(() => window.golfDebug.state())).state,
    "ready",
  );
  console.log("PASS cancelled gesture");
  await page.locator("#sound").click();
  assert.equal(
    await page.locator("#sound").getAttribute("aria-pressed"),
    "false",
  );
  await page.locator("#home").click();
  await page.reload();
  assert.equal(
    await page.locator("#sound").getAttribute("aria-pressed"),
    "false",
  );
  console.log("PASS audio toggle persistence");
  await page.setViewportSize({ width: 390, height: 844 });
  await openLevel(0);
  await stable();
  await page.screenshot({ path: "test-results/mobile.png" });
  assert.ok(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  );
  await shoot(solutions[0].dx, solutions[0].dy, starts[0], true);
  await page
    .getByText("一杆，归洞。", { exact: true })
    .waitFor({ timeout: 40000 });
  console.log("PASS actual touch drag and mobile win");
  await page.locator("#result-menu").click();
  await stable();
  const before = await page.evaluate(() => window.golfDebug.renderer());
  for (let i = 0; i < 8; i++) {
    await openLevel(2);
    await page.locator("#home").click();
  }
  await stable();
  const after = await page.evaluate(() => window.golfDebug.renderer());
  assert.ok(after.geometries <= before.geometries + 3);
  console.log(
    "PASS repeated scene changes without geometry accumulation",
    after,
  );
  const fallback = await browser.newPage();
  await fallback.addInitScript(() => {
    HTMLCanvasElement.prototype.getContext = function () {
      return null;
    };
  });
  await fallback.goto(url);
  await fallback
    .getByRole("heading", { name: "这个小世界暂时无法打开" })
    .waitFor();
  console.log("PASS WebGL unavailable friendly fallback");
  assert.deepEqual(errors, []);
  console.log("PASS no uncaught browser errors");
} finally {
  await browser.close();
}

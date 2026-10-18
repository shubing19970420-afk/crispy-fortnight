import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
  args: ["--no-sandbox", "--enable-unsafe-swiftshader"],
});
try {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 960 },
    hasTouch: true,
  });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(process.env.GOLF_URL || "http://127.0.0.1:5173");
  await page.waitForFunction(() => window.golfDebug?.menu());
  await fs.mkdir("test-results", { recursive: true });
  await page.evaluate(()=>localStorage.setItem("golf-progress-v4","[0,1,2,3]"));await page.reload();await page.waitForFunction(()=>window.golfDebug?.menu());
  assert.equal(
    await page.locator(".level-button,.level-select,.card").count(),
    0,
  );
  assert.equal(await page.locator("canvas").count(), 1);
  async function idle() {
    await page.evaluate(
      () =>
        new Promise((r) =>
          requestAnimationFrame(() => requestAnimationFrame(r)),
        ),
    );
  }
  async function point(i) {
    await page.locator(`[data-level="${i}"]`).scrollIntoViewIfNeeded();
    await idle();
    return page.evaluate((i) => window.golfDebug.island(i), i);
  }
  async function enter(i, touch = false) {
    const p = await point(i);
    assert.equal(
      await page.evaluate((p) => window.golfDebug.pick(p.x, p.y), p),
      i,
    );
    assert.equal(
      await page.evaluate(
        (p) => document.elementFromPoint(p.x, p.y).tagName,
        p,
      ),
      "CANVAS",
    );
    if (touch) {
      const c = await page.context().newCDPSession(page);
      await c.send("Input.dispatchTouchEvent", {
        type: "touchStart",
        touchPoints: [{ x: p.x, y: p.y, id: 1 }],
      });
      await c.send("Input.dispatchTouchEvent", {
        type: "touchEnd",
        touchPoints: [],
      });
      await c.detach();
    } else await page.mouse.click(p.x, p.y);
    await page.waitForFunction(() => window.golfDebug.menu()?.transitioning);
    await page.waitForFunction(() => window.golfDebug.menu()?.zoom > 1.05);
    assert.ok(await page.locator("#game").isHidden());
    await page.locator("#game").waitFor({ state: "visible" });
    assert.equal(
      await page.locator("#title").textContent(),
      ["就在眼前", "请走弯路", "办公室高尔夫", "风车捣蛋鬼", "不可能的一杆"][i],
    );
    await page.locator("#home").click();
    await idle();
    assert.equal(await page.locator(".map-label.active").count(), 0);
  }
  for (let i = 0; i < 5; i++) {
    const p = await point(i),
      before = await page.evaluate(() => window.golfDebug.menu());
    await page.mouse.move(p.x, p.y);
    await page.waitForFunction(
      (i) => window.golfDebug.menu().islands[i].scale > 1.015,
      i,
    );
    const after = await page.evaluate(() => window.golfDebug.menu());
    assert.equal(after.hovered, i);
    assert.ok(after.islands[i].position[1] > before.islands[i].position[1]);
    assert.ok(
      await page
        .locator(`[data-level="${i}"]`)
        .evaluate((e) => e.classList.contains("active")),
    );
    if (i === 1)
      assert.notDeepEqual(before.islands[i].trees, after.islands[i].trees);
    if (i === 2)
      assert.notEqual(before.islands[i].chair, after.islands[i].chair);
    await enter(i);
    console.log(
      "PASS desktop island",
      i + 1,
      "raycast, lift, environment animation and camera transition",
    );
  }
  await page.mouse.move(25, 850);
  await idle();
  await page.screenshot({ path: "test-results/map-desktop.png" });
  await page.locator('[data-level="1"]').focus();
  await page.keyboard.press("Enter");
  await page.locator("#game").waitFor({ state: "visible" });
  assert.equal(await page.locator("#title").textContent(), "请走弯路");
  await page.locator("#home").click();
  console.log("PASS keyboard island selection");
  assert.equal(await page.locator("#start").count(),0);
  await page.locator('[data-level="0"]').click();
  await page.locator("#game").waitFor({ state: "visible" });
  assert.equal(await page.locator("#title").textContent(), "就在眼前");
  await page.locator("#home").click();
  console.log("PASS direct wooden plaque entry without a start button");
  await page.setViewportSize({ width: 390, height: 844 });
  await idle();
  for (let i = 0; i < 5; i++) await enter(i, true);
  console.log("PASS mobile touch selection of all five islands");
  await page.mouse.move(0, 0);
  await idle();
  await page.screenshot({ path: "test-results/map-mobile.png" });
  assert.ok(
    await page.evaluate(
      () => document.documentElement.scrollWidth === innerWidth,
    ),
  );
  const before = await page.evaluate(() => window.golfDebug.renderer());
  for (let i = 0; i < 4; i++) await enter(i % 5, true);
  await idle();
  const after = await page.evaluate(() => window.golfDebug.renderer());
  assert.ok(after.geometries <= before.geometries + 3);
  console.log("PASS map resources released across repeated transitions", after);
  assert.deepEqual(errors, []);
  console.log("PASS menu without browser errors");
} finally {
  await browser.close();
}

import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
  args: ["--no-sandbox", "--enable-unsafe-swiftshader"],
});
try {
  const page = await browser.newPage({
    viewport: { width: 1280, height: 900 },
  });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(process.env.GOLF_URL || "http://127.0.0.1:5173");
  await page.locator('[data-level="2"]').click();
  await page.locator("#game").waitFor({ state: "visible" });
  if (await page.locator("#tutorial").isVisible())
    await page.locator("#tutorial-close").click();
  const snap = await page.evaluate(() => ({
    t: window.golfDebug.state().time,
    course: window.golfDebug.course(),
  }));
  assert.ok(Math.abs(snap.course.actor.x - 575) < 0.01);
  assert.ok(
    Math.abs(
      snap.course.actor.y - (230 + 160 * Math.sin((snap.t * Math.PI) / 4)),
    ) < 0.01,
  );
  assert.ok(Math.abs(snap.course.actor.r - 20) < 0.15);
  assert.ok(snap.course.upperTransparent.every(Boolean));
  console.log(
    "PASS actual character model matches physical patrol coordinates",
  );
  const paused = await page.evaluate(async () => {
    const before = window.golfDebug.state().time;
    Object.defineProperty(document, "hidden", {
      configurable: true,
      get: () => true,
    });
    await new Promise((r) =>
      requestAnimationFrame(() => requestAnimationFrame(r)),
    );
    const after = window.golfDebug.state().time;
    delete document.hidden;
    document.dispatchEvent(new Event("visibilitychange"));
    return { before, after };
  });
  assert.equal(paused.before, paused.after);
  console.log("PASS background visibility freezes simulation clock");
  await page.waitForFunction(() => window.golfDebug.state().time % 8 < 2.2);
  const solutions = JSON.parse(
      await fs.readFile("/tmp/golf-solutions.json", "utf8"),
    ),
    s = solutions[2];
  const [a, b] = await page.evaluate(
    (s) => [
      window.golfDebug.project(s.start.x, s.start.y),
      window.golfDebug.project(s.start.x - s.dx, s.start.y - s.dy),
    ],
    s,
  );
  await page.mouse.move(a.x, a.y);
  await page.mouse.down();
  await page.mouse.move(b.x, b.y, { steps: 5 });
  await page.mouse.up();
  await page.waitForFunction(
    () => {
      const b = window.golfDebug.state();
      return (
        b.state === "moving" && b.x > 250 && b.x < 360 && b.y > 155 && b.y < 300
      );
    },
    {},
    { timeout: 30000 },
  );
  assert.ok(
    (await page.evaluate(() => window.golfDebug.course().upperOpacity))[0] <
      0.3,
  );
  await page
    .locator("canvas")
    .screenshot({ path: "test-results/under-desk.png" });
  console.log("PASS ball passes beneath real desk, overhead model fades");
  await page.waitForFunction(
    () => window.golfDebug.state().state === "won",
    {},
    { timeout: 30000 },
  );
  assert.ok(
    (await page.evaluate(() => window.golfDebug.course().upperOpacity))[1] <
      0.3,
  );
  await page
    .locator("canvas")
    .screenshot({ path: "test-results/behind-desk.png" });
  console.log("PASS camera-ray occlusion fades foreground desk at the hole");
  assert.deepEqual(errors, []);
} finally {
  await browser.close();
}

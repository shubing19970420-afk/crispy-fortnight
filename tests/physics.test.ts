import assert from "node:assert/strict";
import { levels } from "../src/levels";
import { createBall, shoot, step, holeEntry } from "../src/physics";
function run(i: number, dx: number, dy: number) {
  const b = createBall(levels[i]);
  shoot(b, dx, dy);
  for (let n = 0; n < 5000 && b.state === "moving"; n++) step(b, levels[i]);
  return b;
}
const solutions: { dx: number; dy: number; bounces: number }[] = [];
for (let i = 0; i < 3; i++) {
  let solution;
  outer: for (let angle = i === 0 ? 0 : -1.1; angle <= 0.01; angle += 0.004) {
    for (let power = 50; power <= 150; power += 0.7) {
      const dx = Math.cos(angle) * power,
        dy = Math.sin(angle) * power,
        b = run(i, dx, dy);
      if (b.state === "won" && b.bounces === (i === 0 ? 0 : 1)) {
        solution = { dx, dy, bounces: b.bounces };
        break outer;
      }
    }
  }
  assert.ok(solution, `Level ${i + 1} solvable`);
  solutions.push(solution!);
  console.log(`PASS level ${i + 1} solution`, solution);
}
let b = createBall(levels[0]);
shoot(b, 0, 0);
assert.equal(b.state, "ready");
shoot(b, 100, 0);
const vx = b.vx;
shoot(b, 0, 100);
assert.equal(b.vx, vx);
console.log("PASS zero drag and one-shot lock");
assert.equal(run(0, 8, 0).state, "lost");
assert.equal(run(0, 150, 0).state, "won");
console.log("PASS stopped outside fails, fast crossing captures");
b = createBall(levels[0]);
shoot(b, 100, 0);
b.x = -1;
step(b, levels[0]);
assert.equal(b.state, "lost");
console.log("PASS out of bounds");
b = createBall(levels[1]);
b.x = 400;
b.y = 300;
b.vx = 300;
b.state = "moving";
for (let n = 0; n < 20; n++) step(b, levels[1]);
assert.ok(b.vx < 0);
console.log("PASS obstacle reflection");
for (const speed of [20, 149, 200, 780]) {
  b = createBall(levels[0]);
  b.x = 634;
  b.y = 280;
  b.vx = speed;
  b.state = "moving";
  step(b, levels[0]);
  assert.equal(b.state, "won");
  assert.notEqual(b.x, 650);
  const x = b.x;
  step(b, levels[0]);
  assert.equal(b.x, x);
}
console.log("PASS immediate edge capture at all speeds and terminal state");
assert.equal(holeEntry(600, 280, 700, 280, 650, 280), 0.34);
assert.equal(holeEntry(600, 297, 700, 297, 650, 280), null);
assert.equal(holeEntry(650, 280, 650, 280, 650, 280), 0);
assert.equal(holeEntry(600, 280, 600, 280, 650, 280), null);
assert.equal(holeEntry(700, 280, 600, 280, 650, 280), 0.34);
assert.equal(holeEntry(600, 296, 700, 296, 650, 280), 0.5);
console.log("PASS continuous crossing, tangent, reverse and near-miss");
assert.equal(createBall(levels[0]).state, "ready");
console.log("PASS fresh retry");
await import("node:fs/promises").then((fs) =>
  fs.writeFile("/tmp/golf-solutions.json", JSON.stringify(solutions)),
);

// A whole step can cross the disk without either endpoint inside it.
b = createBall(levels[0]);
b.x = 600;
b.y = 280;
b.vx = 24000;
b.state = "moving";
step(b, levels[0]);
assert.equal(b.state, "won");
assert.equal(b.x, 634);
console.log("PASS swept capture through entire hole in one step");
for (const o of levels[2].obstacles) {
  b = createBall(levels[2]);
  b.x = o.x + o.w / 2;
  b.y = o.y - 9.5;
  b.vy = 300;
  b.state = "moving";
  step(b, levels[2]);
  assert.ok(b.vy < 0);
  assert.equal(b.surface, o.model === "eraser" ? "rubber" : "wood");
}
console.log("PASS office collisions and material events");
b = createBall(levels[1]);
b.x = 440;
b.y = 300;
b.vx = 1;
b.state = "moving";
step(b, levels[1]);
assert.ok(b.x <= 411 || b.x >= 489 || b.y <= 221 || b.y >= 519);
console.log("PASS initial penetration correction");

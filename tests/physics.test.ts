import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { levels, type Level } from "../src/levels";
import {
  createBall,
  shoot,
  step,
  holeEntry,
  actorAt,
  R,
  STEP,
  type Ball,
} from "../src/physics";
import { referenceShots } from "./solutions";
function clear(b: Ball, l: Level) {
  assert.ok(Number.isFinite(b.x + b.y + b.vx + b.vy));
  assert.ok(
    b.x >= 37 - 0.03 &&
      b.x <= 863 + 0.03 &&
      b.y >= 37 - 0.03 &&
      b.y <= 523 + 0.03,
    "closed course",
  );
  if (b.state === "won") return;
  for (const o of l.obstacles) {
    const x = Math.max(o.x, Math.min(b.x, o.x + o.w)),
      y = Math.max(o.y, Math.min(b.y, o.y + o.h));
    assert.ok(
      Math.hypot(b.x - x, b.y - y) >= R - 0.03,
      `${o.id} no penetration`,
    );
  }
  for (const o of l.circles)
    assert.ok(
      Math.hypot(b.x - o.x, b.y - o.y) >= R + o.r - 0.03,
      `${o.id} no penetration`,
    );
  const a = actorAt(l, b.time);
  if (a)
    assert.ok(
      Math.hypot(b.x - a.x, b.y - a.y) >= R + a.r - 0.05,
      "moving actor no penetration",
    );
}
function run(l: Level, angle: number, power: number, wait = 0, verify = false) {
  const b = createBall(l),
    trace: { x: number; y: number }[] = [];
  for (let k = 0; k < Math.round(wait / STEP); k++) step(b, l);
  shoot(b, Math.cos(angle) * power, Math.sin(angle) * power);
  for (let k = 0; k < 4000 && b.state === "moving"; k++) {
    step(b, l);
    if (verify) clear(b, l);
    if (k % 8 === 0) trace.push({ x: b.x, y: b.y });
  }
  assert.notEqual(b.state, "moving", "simulation must terminate");
  return { b, trace };
}
const solutions = [];
for (let i = 0; i < 3; i++) {
  const s = referenceShots[i],
    { b, trace } = run(levels[i], s.angle, s.power, s.wait, true);
  assert.equal(b.state, "won");
  assert.equal(b.bounces, i === 0 ? 0 : i === 1 ? 2 : 1);
  solutions.push({
    ...s,
    dx: Math.cos(s.angle) * s.power,
    dy: Math.sin(s.angle) * s.power,
    bounces: b.bounces,
    hits: b.hits,
    start: levels[i].start,
    trace,
  });
  console.log(
    `PASS level ${i + 1} one shot: ${b.bounces} bounces, ${(b.time - b.shotAt).toFixed(2)}s`,
  );
}
// Check a neighbourhood of powers and angles rather than a single lucky pixel.
for (const i of [1, 2])
  for (const da of [-0.004, 0, 0.004])
    for (const power of [115, 125, 135])
      assert.equal(
        run(levels[i], referenceShots[i].angle + da, power, 0, true).b.state,
        "won",
      );
console.log("PASS 18 neighbouring forest/office solutions");
for (const i of [1, 2]) {
  const l = levels[i],
    a = Math.atan2(l.hole.y - l.start.y, l.hole.x - l.start.x);
  for (const power of [60, 90, 120, 150])
    assert.equal(run(l, a, power).b.state, "lost");
}
console.log("PASS direct shots blocked in both advanced courses");
const furnitureBank = run(levels[2], -0.78, 125, 0, true).b;
assert.equal(furnitureBank.state, "won");
assert.ok(furnitureBank.hits.includes("desk-1-leg-1-0"));
console.log("PASS alternate office route banks off an actual desk leg");
const timed = run(levels[2], referenceShots[2].angle, 125, 4.5, true).b;
assert.equal(timed.state, "lost");
assert.ok(timed.hits.includes("colleague"));
for (let n = 0; n < 3; n++) {
  const again = run(levels[2], referenceShots[2].angle, 125, 4.5, true).b;
  assert.deepEqual(again, timed);
}
const cycle = run(levels[2], referenceShots[2].angle, 125, 8, true).b;
assert.equal(cycle.state, "won");
assert.ok(
  Math.abs(cycle.x - run(levels[2], referenceShots[2].angle, 125).b.x) < 1e-6,
);
console.log("PASS timing changes outcome, exact retries, 8s periodic clock");
for (const l of levels)
  for (const o of [...l.obstacles, ...l.circles]) {
    const isolated: Level = {
      ...l,
      obstacles: "w" in o ? [o] : [],
      circles: "r" in o ? [o] : [],
      walker: undefined,
      rotor:undefined,portals:undefined,platforms:undefined,
      hole: { x: 850, y: 510 },
    };
    const b = createBall(isolated);
    const fromRight="r" in o&&o.x-o.r-10<37;
    b.x = "w" in o ? o.x - 10 : fromRight?o.x+o.r+10:o.x-o.r-10;
    b.y = "w" in o ? o.y + o.h / 2 : o.y;
    b.vx = fromRight?-600:600;
    b.state = "moving";
    step(b, isolated);
    assert.ok(fromRight?b.vx>0:b.vx < 0, `${o.id} reflects`);
    assert.equal(b.surface, o.surface);
    clear(b, isolated);
  }
console.log(
  "PASS every tree, rock, stump, fence, cabinet, desk leg and chair collides",
);
const empty: Level = {
  ...levels[0],
  hole: { x: 850, y: 510 },
  obstacles: [],
  circles: [],
  walker: { x: 450, y: 280, amplitude: 80, period: 8, r: 20 },
};
function actorBounce(time: number) {
  const b = createBall(empty);
  b.time = time;
  b.x = 450;
  b.y = 240;
  b.vy = 600;
  b.state = "moving";
  for (let n = 0; n < 12 && !b.hits.length; n++) step(b, empty);
  assert.equal(b.lastCollider, "colleague");
  assert.equal(b.surface, "person");
  clear(b, empty);
  return b.vy;
}
const away = actorBounce(0),
  toward = actorBounce(4);
assert.ok(away < 0 && toward < away - 100);
console.log("PASS character reflects relative velocity (toward / away differ)");
let b = createBall(levels[0]);
shoot(b, 0, 0);
assert.equal(b.state, "ready");
step(b, levels[0]);
assert.equal(b.x, 180);
assert.ok(b.time > 0);
shoot(b, 100, 0);
const vx = b.vx;
shoot(b, 0, 100);
assert.equal(b.vx, vx);
assert.equal(run(levels[0], 0, 8).b.state, "lost");
assert.equal(run(levels[0], 0, 150).b.state, "won");
console.log("PASS ready clock, one-shot lock, failure and fast capture");
assert.equal(holeEntry(600, 280, 700, 280, 650, 280), 0.34);
assert.equal(holeEntry(600, 297, 700, 297, 650, 280), null);
assert.equal(holeEntry(650, 280, 650, 280, 650, 280), 0);
b = createBall(levels[0]);
b.x = 600;
b.y = 280;
b.vx = 24000;
b.state = "moving";
step(b, levels[0]);
assert.equal(b.state, "won");
const frozen = structuredClone(b);
step(b, levels[0]);
assert.deepEqual(b, frozen);
console.log("PASS swept capture and terminal freeze");
// A hole behind a wall must never win before the earlier wall contact.
const barrier: Level = {
  ...levels[0],
  start: { x: 300, y: 280 },
  hole: { x: 400, y: 280 },
  obstacles: [
    {
      id: "test-wall",
      x: 340,
      y: 200,
      w: 10,
      h: 150,
      model: "fence",
      surface: "wood",
    },
  ],
};
b = createBall(barrier);
b.vx = 24000;
b.state = "moving";
step(b, barrier);
assert.notEqual(b.state, "won");
assert.ok(b.vx < 0);
console.log("PASS continuous collision takes priority over occluded hole");
const circleBarrier: Level = {
  ...levels[0],
  start: { x: 300, y: 280 },
  hole: { x: 430, y: 280 },
  circles: [
    {
      id: "test-stump",
      x: 350,
      y: 280,
      r: 14,
      model: "stump",
      surface: "wood",
    },
  ],
};
b = createBall(circleBarrier);
b.vx = 24000;
b.state = "moving";
step(b, circleBarrier);
assert.ok(b.vx < 0);
assert.equal(b.lastCollider, "test-stump");
console.log("PASS high speed swept circle prevents tunnelling");
let seed = 73219;
const random = () =>
  (seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 2 ** 32;
for (const l of levels.slice(1,3))
  for (let i = 0; i < 120; i++)
    run(l, random() * Math.PI * 2, 6 + random() * 144, random() * 8, true);
console.log(
  "PASS 240 deterministic stress shots: no tunnelling, penetration, escape or endless motion",
);
await fs.writeFile("/tmp/golf-solutions.json", JSON.stringify(solutions));

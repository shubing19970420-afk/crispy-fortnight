import { WIDTH, HEIGHT, type Level, type Rect, type Surface } from "./levels";
export const R = 9,
  DRAG = 90,
  MAX_SPEED = 780,
  STEP = 1 / 240,
  HOLE_RADIUS = 16;
export function diskEntry(
  ax: number,
  ay: number,
  bx: number,
  by: number,
  hx: number,
  hy: number,
  r: number,
): number | null {
  const dx = bx - ax,
    dy = by - ay,
    ox = ax - hx,
    oy = ay - hy,
    c = ox * ox + oy * oy - r * r;
  if (c <= 0) return 0;
  const a = dx * dx + dy * dy;
  if (a < 1e-16) return null;
  const bb = 2 * (ox * dx + oy * dy),
    disc = bb * bb - 4 * a * c;
  if (disc < 0) return null;
  const t = (-bb - Math.sqrt(disc)) / (2 * a);
  return t >= 0 && t <= 1 ? t : null;
}
export const holeEntry = (
  ax: number,
  ay: number,
  bx: number,
  by: number,
  hx: number,
  hy: number,
) => diskEntry(ax, ay, bx, by, hx, hy, HOLE_RADIUS);
export function actorAt(l: Level, t: number) {
  const a = l.walker;
  if (!a) return null;
  const w = (2 * Math.PI) / a.period;
  return {
    x: a.x,
    y: a.y + Math.sin(t * w) * a.amplitude,
    vx: 0,
    vy: Math.cos(t * w) * a.amplitude * w,
    r: a.r,
  };
}
export type Ball = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  state: "ready" | "moving" | "won" | "lost";
  bounces: number;
  surface?: Surface;
  lastCollider?: string;
  hits: string[];
  time: number;
  shotAt: number;
  actorHitAt: number;
};
export function createBall(l: Level): Ball {
  return {
    ...l.start,
    vx: 0,
    vy: 0,
    state: "ready",
    bounces: 0,
    hits: [],
    time: 0,
    shotAt: 0,
    actorHitAt: -999,
  };
}
export function shoot(b: Ball, dx: number, dy: number) {
  if (b.state !== "ready") return;
  const d = Math.hypot(dx, dy);
  if (d < 6) return;
  const v = Math.min(d / 150, 1) * MAX_SPEED;
  b.vx = (dx / d) * v;
  b.vy = (dy / d) * v;
  b.state = "moving";
  b.shotAt = b.time;
}
type Contact = {
  t: number;
  nx: number;
  ny: number;
  push: number;
  vx: number;
  vy: number;
  id: string;
  surface: Surface;
};
function circleHit(
  x: number,
  y: number,
  dx: number,
  dy: number,
  cx: number,
  cy: number,
  r: number,
): Pick<Contact, "t" | "nx" | "ny" | "push"> | null {
  const dist = Math.hypot(x - cx, y - cy);
  if (dist < r - 1e-6) {
    return {
      t: 0,
      nx: dist > 1e-8 ? (x - cx) / dist : 1,
      ny: dist > 1e-8 ? (y - cy) / dist : 0,
      push: r - dist + 0.001,
    };
  }
  const t = diskEntry(x, y, x + dx, y + dy, cx, cy, r);
  if (t === null) return null;
  const nx = (x + dx * t - cx) / r,
    ny = (y + dy * t - cy) / r;
  if (dx * nx + dy * ny >= -1e-8) return null;
  return { t, nx, ny, push: 0.001 };
}
function rectHit(
  x: number,
  y: number,
  dx: number,
  dy: number,
  o: Rect,
): Pick<Contact, "t" | "nx" | "ny" | "push"> | null {
  const qx = Math.max(o.x, Math.min(x, o.x + o.w)),
    qy = Math.max(o.y, Math.min(y, o.y + o.h)),
    dist = Math.hypot(x - qx, y - qy);
  if (dist < R - 1e-6) {
    if (dist > 1e-8)
      return {
        t: 0,
        nx: (x - qx) / dist,
        ny: (y - qy) / dist,
        push: R - dist + 0.001,
      };
    const s = [
      { d: x - o.x, nx: -1, ny: 0 },
      { d: o.x + o.w - x, nx: 1, ny: 0 },
      { d: y - o.y, nx: 0, ny: -1 },
      { d: o.y + o.h - y, nx: 0, ny: 1 },
    ].sort((a, b) => a.d - b.d)[0];
    return { t: 0, nx: s.nx, ny: s.ny, push: R + s.d + 0.001 };
  }
  const candidates: Pick<Contact, "t" | "nx" | "ny" | "push">[] = [];
  for (const [axis, plane, nx, ny] of [
    [0, o.x - R, -1, 0],
    [0, o.x + o.w + R, 1, 0],
    [1, o.y - R, 0, -1],
    [1, o.y + o.h + R, 0, 1],
  ]) {
    const speed = axis === 0 ? dx : dy;
    if (speed * (axis === 0 ? nx : ny) >= 0) continue;
    const t = (plane - (axis === 0 ? x : y)) / speed;
    if (t < 0 || t > 1) continue;
    const other = axis === 0 ? y + dy * t : x + dx * t;
    if (
      other >= (axis === 0 ? o.y : o.x) &&
      other <= (axis === 0 ? o.y + o.h : o.x + o.w)
    )
      candidates.push({ t, nx, ny, push: 0.001 });
  }
  for (const cx of [o.x, o.x + o.w])
    for (const cy of [o.y, o.y + o.h]) {
      const c = circleHit(x, y, dx, dy, cx, cy, R);
      if (c) candidates.push(c);
    }
  return candidates.sort((a, b) => a.t - b.t)[0] || null;
}
const restitution: Record<Surface, number> = {
  wood: 0.9,
  stone: 0.8,
  leaves: 0.84,
  fabric: 0.79,
  person: 0.75,
  rubber: 0.8,
};
/** Fixed simulation time starts at level entry, advances during aiming, freezes on outcome. */
export function step(b: Ball, l: Level, dt = STEP) {
  if (b.state === "won" || b.state === "lost") return;
  if (b.state === "ready") {
    b.time += dt;
    return;
  }
  if (
    !Number.isFinite(b.x + b.y + b.vx + b.vy) ||
    b.x < 0 ||
    b.x > WIDTH ||
    b.y < 0 ||
    b.y > HEIGHT
  ) {
    b.state = "lost";
    return;
  }
  let remaining = dt,
    elapsed = 0;
  for (let iteration = 0; remaining > 1e-9 && iteration < 8; iteration++) {
    const dx = b.vx * remaining,
      dy = b.vy * remaining;
    let contact: Contact | null = null;
    const consider = (c: Contact | null) => {
      if (c && (!contact || c.t < contact.t)) contact = c;
    };
    for (const [axis, plane, nx, ny] of [
      [0, 37, 1, 0],
      [0, 863, -1, 0],
      [1, 37, 0, 1],
      [1, 523, 0, -1],
    ]) {
      const pos = axis === 0 ? b.x : b.y,
        speed = axis === 0 ? dx : dy,
        n = axis === 0 ? nx : ny;
      if (speed * n < 0) {
        const t = (plane - pos) / speed;
        if (t >= 0 && t <= 1)
          consider({
            t,
            nx,
            ny,
            push: 0.001,
            vx: 0,
            vy: 0,
            id: "edge",
            surface: "wood",
          });
      }
    }
    for (const o of l.obstacles) {
      const hit = rectHit(b.x, b.y, dx, dy, o);
      if (hit) consider({ ...hit, vx: 0, vy: 0, id: o.id, surface: o.surface });
    }
    for (const o of l.circles) {
      const hit = circleHit(b.x, b.y, dx, dy, o.x, o.y, R + o.r);
      if (hit) consider({ ...hit, vx: 0, vy: 0, id: o.id, surface: o.surface });
    }
    const actor = actorAt(l, b.time + elapsed),
      nextActor = actorAt(l, b.time + elapsed + remaining);
    if (actor && nextActor) {
      const avx = (nextActor.x - actor.x) / remaining,
        avy = (nextActor.y - actor.y) / remaining,
        hit = circleHit(
          b.x,
          b.y,
          dx - (nextActor.x - actor.x),
          dy - (nextActor.y - actor.y),
          actor.x,
          actor.y,
          R + actor.r,
        );
      if (hit)
        consider({
          ...hit,
          vx: avx,
          vy: avy,
          id: "colleague",
          surface: "person",
        });
    }
    const hit = contact as Contact | null,
      hole = holeEntry(b.x, b.y, b.x + dx, b.y + dy, l.hole.x, l.hole.y);
    if (hole !== null && (!hit || hole < hit.t)) {
      b.x += dx * hole;
      b.y += dy * hole;
      b.time += elapsed + remaining * hole;
      b.vx = b.vy = 0;
      b.state = "won";
      return;
    }
    if (!hit) {
      b.x += dx;
      b.y += dy;
      elapsed += remaining;
      remaining = 0;
      break;
    }
    b.x += dx * hit.t + hit.nx * hit.push;
    b.y += dy * hit.t + hit.ny * hit.push;
    const dot = (b.vx - hit.vx) * hit.nx + (b.vy - hit.vy) * hit.ny;
    if (dot < 0) {
      const k = (1 + restitution[hit.surface]) * dot;
      b.vx -= k * hit.nx;
      b.vy -= k * hit.ny;
      b.bounces++;
      b.surface = hit.surface;
      b.lastCollider = hit.id;
      if (b.hits.length < 64) b.hits.push(hit.id);
      if (hit.id === "colleague")
        b.actorHitAt = b.time + elapsed + remaining * hit.t;
    }
    const used = remaining * Math.max(hit.t, 1e-6);
    elapsed += used;
    remaining -= used;
  }
  // Contact iteration cap fails safely instead of teleporting through a crowded corner.
  if (remaining > 1e-9) {
    b.vx = b.vy = 0;
  }
  b.time += dt;
  const speed = Math.hypot(b.vx, b.vy),
    next = Math.max(0, speed - DRAG * dt);
  if (next < 2) {
    b.vx = b.vy = 0;
    b.state = "lost";
  } else {
    const cap = Math.min(next, 1000) / speed;
    b.vx *= cap;
    b.vy *= cap;
  }
}

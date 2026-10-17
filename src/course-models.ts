import * as T from "three";
import type { GolfScene } from "./scene";
import type { Level, Rect, Circle, Surface } from "./levels";
import { actorAt, type Ball } from "./physics";
export class CourseModels {
  rects: { rect: Rect; mesh: T.Mesh }[] = [];
  circles: { circle: Circle; mesh: T.Mesh }[] = [];
  private uppers: {
    group: T.Group;
    desk: { x: number; y: number; w: number; h: number };
  }[] = [];
  private actor?: T.Group;
  private legs: T.Group[] = [];
  private arms: T.Group[] = [];
  private head?: T.Object3D;
  private actorDisk?: T.Mesh;
  private feedback?: { id: string; age: number };
  private meshes = new Map<string, T.Mesh>();
  constructor(
    private host: GolfScene,
    private level: Level,
  ) {
    if (level.forest) this.fairway();
    if (level.office) this.officeFloor();
    for (const o of level.obstacles) this.rect(o);
    for (const o of level.circles) this.circle(o);
    for (const d of level.desks || []) this.desk(d);
    if (level.office) this.officeDecor();
    if (level.walker) this.colleague();
  }
  private box(
    w: number,
    h: number,
    d: number,
    c: T.ColorRepresentation,
    x: number,
    y: number,
    z: number,
    p: T.Object3D = this.host.root,
    round = 0,
  ) {
    return this.host.box(w, h, d, c, x, y, z, round, p);
  }
  private mesh(
    g: T.BufferGeometry,
    c: T.ColorRepresentation,
    x: number,
    y: number,
    z: number,
    p: T.Object3D = this.host.root,
  ) {
    return this.host.mesh(g, c, x, y, z, p);
  }
  private disk(
    x: number,
    z: number,
    r: number,
    c: T.ColorRepresentation,
    height = 1,
    y = 0.7,
    p: T.Object3D = this.host.root,
  ) {
    return this.mesh(new T.CylinderGeometry(r, r, height, 32), c, x, y, z, p);
  }
  private flat(
    w: number,
    d: number,
    c: T.ColorRepresentation,
    x: number,
    z: number,
    y = 0.25,
  ) {
    const m = this.box(w, 0.15, d, c, x, y, z);
    m.castShadow = false;
    return m;
  }
  private fairway() {
    const points = this.level.fairway!;
    const paint = (polygon: { x: number; y: number }[]) => {
      // Clip the grass ribbon to the inside of the solid boundary walls.
      for (const [axis, limit, sign] of [
        ["x", 28, 1],
        ["x", 872, -1],
        ["y", 28, 1],
        ["y", 532, -1],
      ] as const) {
        const input = polygon;
        polygon = [];
        for (let j = 0; j < input.length; j++) {
          const a = input[j],
            b = input[(j + 1) % input.length],
            ia = (a[axis] - limit) * sign >= 0,
            ib = (b[axis] - limit) * sign >= 0;
          if (ia) polygon.push(a);
          if (ia !== ib) {
            const t = (limit - a[axis]) / (b[axis] - a[axis]);
            polygon.push({
              x: a.x + (b.x - a.x) * t,
              y: a.y + (b.y - a.y) * t,
            });
          }
        }
      }
      if (polygon.length < 3) return;
      const shape = new T.Shape();
      polygon.forEach((p, i) =>
        i === 0
          ? shape.moveTo(p.x - 450, 280 - p.y)
          : shape.lineTo(p.x - 450, 280 - p.y),
      );
      shape.closePath();
      const geo = new T.ShapeGeometry(shape);
      geo.rotateX(-Math.PI / 2);
      this.mesh(geo, 0xa0cc72, 0, 0.3, 0).castShadow = false;
    };
    for (let i = 0; i < points.length - 1; i++) {
      const a = points[i],
        end = points[i + 1],
        dx = end.x - a.x,
        dy = end.y - a.y,
        len = Math.hypot(dx, dy),
        nx = (-dy / len) * 52,
        ny = (dx / len) * 52,
        trim = i === points.length - 2 ? 24 : 0,
        b = { x: end.x - (dx / len) * trim, y: end.y - (dy / len) * trim };
      paint([
        { x: a.x + nx, y: a.y + ny },
        { x: b.x + nx, y: b.y + ny },
        { x: b.x - nx, y: b.y - ny },
        { x: a.x - nx, y: a.y - ny },
      ]);
      paint(
        Array.from({ length: 24 }, (_, j) => ({
          x: a.x + Math.cos((j / 24) * Math.PI * 2) * 52,
          y: a.y + Math.sin((j / 24) * Math.PI * 2) * 52,
        })),
      );
    }
    for (const [x, y, angle] of [
      [310, 95, -0.5],
      [615, 475, 0.5],
    ]) {
      const shape = new T.Shape();
      shape.moveTo(-9, -11);
      shape.lineTo(9, 0);
      shape.lineTo(-9, 11);
      shape.lineTo(-3, 0);
      shape.closePath();
      const geo = new T.ShapeGeometry(shape);
      geo.rotateX(-Math.PI / 2);
      const m = this.mesh(geo, 0xf5e6a5, x - 450, 0.6, y - 280);
      m.rotation.y = angle;
      m.castShadow = false;
    }
  }
  private officeFloor() {
    for (let x = 108; x < 872; x += 80) {
      if (Math.abs(x - this.level.hole.x) > 20)
        this.flat(1, 504, 0xb8c6bc, x - 450, 0, 0.16);
      else
        for (const [lo, hi] of [
          [28, this.level.hole.y - 21],
          [this.level.hole.y + 21, 532],
        ])
          this.flat(1, hi - lo, 0xb8c6bc, x - 450, (lo + hi) / 2 - 280, 0.16);
    }
    for (let y = 108; y < 532; y += 80) {
      if (Math.abs(y - this.level.hole.y) > 20)
        this.flat(844, 1, 0xb8c6bc, 0, y - 280, 0.16);
      else
        for (const [lo, hi] of [
          [28, this.level.hole.x - 21],
          [this.level.hole.x + 21, 872],
        ])
          this.flat(hi - lo, 1, 0xb8c6bc, (lo + hi) / 2 - 450, y - 280, 0.16);
    }
    // Carpet islands indicate separate workspaces, never add invisible collision.
    this.flat(310, 225, 0x7aa4a0, -128, -50, 0.38);
    this.flat(275, 225, 0xb99473, 260, 110, 0.38);
    // The back wall sits on the existing solid edge, leaving the floor readable.
    this.box(844, 85, 14, 0x9cbdb0, 0, 42, -266);
    this.box(844, 7, 16, 0xe7dcb8, 0, 88, -266);
    this.box(14, 85, 125, 0x9cbdb0, -430, 42, -200);
    this.host.label("STUDIO 03", -240, 89, -265, 105, 19, "#3f6a60");
  }
  private rect(o: Rect) {
    const x = o.x + o.w / 2 - 450,
      z = o.y + o.h / 2 - 280;
    let body: T.Mesh;
    if (o.model === "fence") {
      body = this.box(o.w, 30, o.h, 0xc38d59, x, 15, z);
      for (let y = o.y + 12; y <= o.y + o.h - 9; y += 55) {
        this.box(o.w, 51, 18, 0xa6744a, x, 25.5, y - 280);
      }
      this.box(o.w, 5, o.h, 0xe0b67e, x, 33, z);
    } else if (o.model === "cabinet") {
      body = this.box(o.w, 102, o.h, 0x78a49a, x, 51, z);
      this.box(o.w, 6, o.h, 0xc1ceae, x, 105, z);
      for (let i = 0; i < 3; i++) {
        this.box(o.w - 8, 27, 2, 0xa5bfb0, x, 20 + i * 31, o.y + o.h - 280 + 1);
        this.box(
          Math.min(30, o.w - 18),
          3,
          3,
          0x476c66,
          x,
          22 + i * 31,
          o.y + o.h - 280 + 3,
        );
      }
    } else body = this.box(o.w, 101, o.h, 0x9c795b, x, 50.5, z);
    this.rects.push({ rect: o, mesh: body });
    this.meshes.set(o.id, body);
  }
  private circle(o: Circle) {
    const x = o.x - 450,
      z = o.y - 280;
    let body: T.Mesh;
    if (o.model === "tree") {
      body = this.mesh(
        new T.CylinderGeometry(o.r, o.r, 48, 32),
        0x98714b,
        x,
        24,
        z,
      );
      this.mesh(new T.ConeGeometry(o.r * 2.1, 65, 7), 0x3d8663, x, 77, z);
      this.mesh(new T.ConeGeometry(o.r * 1.65, 51, 7), 0x65a96b, x, 105, z);
    } else if (o.model === "rock") {
      body = this.mesh(
        new T.CylinderGeometry(o.r, o.r, 18, 32),
        0x9ca69d,
        x,
        9,
        z,
      );
      const rock = this.mesh(
        new T.DodecahedronGeometry(o.r * 0.95, 0),
        0xb9c0a8,
        x,
        22,
        z,
      );
      rock.scale.y = 0.75;
      rock.rotation.y = o.x * 0.1;
    } else if (o.model === "stump") {
      body = this.mesh(
        new T.CylinderGeometry(o.r, o.r, 24, 32),
        0xa5774a,
        x,
        12,
        z,
      );
      this.disk(x, z, o.r - 2, 0xe7c28a, 1, 24.5);
      const ring = this.mesh(
        new T.TorusGeometry(o.r * 0.58, 1, 4, 20),
        0xba905d,
        x,
        25.2,
        z,
      );
      ring.rotation.x = Math.PI / 2;
    } else {
      // Solid circular chair chassis makes the complete physical footprint visible.
      body = this.mesh(
        new T.CylinderGeometry(o.r, o.r, 12, 32),
        0x52746d,
        x,
        6,
        z,
      );
      this.box(7, 24, 7, 0x476b64, x, 23, z);
      this.box(40, 10, 38, 0xdc9879, x, 39, z, this.host.root, 3);
      this.box(40, 42, 8, 0xdc9879, x, 61, z + 16, this.host.root, 3);
      for (let i = 0; i < 5; i++) {
        const angle = (i * Math.PI * 2) / 5;
        const wheel = this.mesh(
          new T.CylinderGeometry(5, 5, 7, 8),
          0x3b5853,
          x + Math.cos(angle) * 20,
          6,
          z + Math.sin(angle) * 20,
        );
        wheel.rotation.x = Math.PI / 2;
      }
    }
    this.circles.push({ circle: o, mesh: body });
    this.meshes.set(o.id, body);
  }
  private desk(d: { x: number; y: number; w: number; h: number }) {
    // Legs are separate collision rectangles from levels.ts. Tabletop is overhead clearance.
    const upper = new T.Group();
    this.host.root.add(upper);
    this.uppers.push({ group: upper, desk: d });
    const x = d.x + d.w / 2 - 450,
      z = d.y + d.h / 2 - 280;
    this.box(d.w, 11, d.h, 0xd9ae79, x, 106, z, upper, 3);
    this.box(76, 49, 8, 0x486e69, x, 139, z - 30, upper, 3);
    this.box(66, 39, 1, 0x99c4c3, x, 139, z - 25.5, upper);
    this.box(7, 18, 7, 0x486e69, x, 117, z - 30, upper);
    this.box(44, 3, 25, 0x557c73, x, 113, z - 30, upper);
    this.box(65, 3, 26, 0xe8ddbb, x, 113, z + 25, upper, 2);
    for (let i = 0; i < 3; i++)
      this.box(54, 1, 1, 0xaab5a2, x, 115, z + 17 + i * 6, upper);
    this.box(24, 1, 24, 0xffd96a, x - 75, 113, z + 17, upper);
    this.mesh(
      new T.CylinderGeometry(10, 9, 20, 12),
      0xf2e8c8,
      x + 78,
      122,
      z + 28,
      upper,
    );
    this.mesh(
      new T.CylinderGeometry(8, 8, 1, 12),
      0x76533e,
      x + 78,
      132.5,
      z + 28,
      upper,
    );
    const handle = this.mesh(
      new T.TorusGeometry(6, 2, 5, 10),
      0xf2e8c8,
      x + 89,
      122,
      z + 28,
      upper,
    );
    handle.rotation.y = Math.PI / 2;
  }
  private officeDecor() {
    // Plants occupy the back wall shelf; they never hide an unlisted floor obstacle.
    for (const x of [-280, 80]) {
      this.box(48, 4, 35, 0xd3b082, x, 76, -253);
      this.mesh(new T.CylinderGeometry(11, 8, 17, 9), 0xddaa85, x, 86, -253);
      this.mesh(new T.IcosahedronGeometry(16, 0), 0x609375, x, 108, -253);
    }
  }
  private colleague() {
    const g = (this.actor = new T.Group());
    this.host.root.add(g);
    const w = this.level.walker!;
    this.actorDisk = this.mesh(
      new T.CylinderGeometry(w.r, w.r, 0.3, 32),
      0xe7bc72,
      0,
      0.3,
      0,
      g,
    );
    (this.actorDisk.material as T.MeshStandardMaterial).transparent = true;
    (this.actorDisk.material as T.MeshStandardMaterial).opacity = 0.32;
    this.actorDisk.castShadow = false;
    this.box(28, 32, 23, 0x6895ad, 0, 43, 0, g, 3);
    const head = (this.head = new T.Group());
    head.position.y = 76;
    g.add(head);
    this.mesh(new T.IcosahedronGeometry(15, 1), 0xe9bc93, 0, 0, 0, head);
    this.box(26, 8, 25, 0x705748, 0, 10, -2, head, 3);
    for (const x of [-5, 5])
      this.mesh(new T.SphereGeometry(1.8, 6, 4), 0x3e544b, x, 2, 13, head);
    for (const x of [-8, 8]) {
      const leg = new T.Group();
      leg.position.set(x, 27, 0);
      g.add(leg);
      this.box(9, 25, 10, 0x527168, 0, -12, 0, leg);
      this.box(11, 6, 16, 0x405f58, 0, -25, 3, leg, 2);
      this.legs.push(leg);
    }
    for (const x of [-19, 19]) {
      const arm = new T.Group();
      arm.position.set(x, 55, 0);
      g.add(arm);
      this.box(8, 24, 9, 0x6895ad, 0, -11, 0, arm, 2);
      this.mesh(new T.IcosahedronGeometry(5, 0), 0xe9bc93, 0, -25, 0, arm);
      this.arms.push(arm);
    }
    // Dashed patrol lane reveals the deterministic movement limits without extra HUD text.
    for (let y = w.y - w.amplitude; y <= w.y + w.amplitude; y += 22) {
      const m = this.flat(4, 9, 0xa9b4a1, w.x - 450, y - 280, 0.48);
      m.receiveShadow = false;
    }
  }
  update(b: Ball) {
    for (const { group, desk: d } of this.uppers) {
      const under =
        b.x > d.x - 8 &&
        b.x < d.x + d.w + 8 &&
        b.y > d.y - 8 &&
        b.y < d.y + d.h + 8;
      // Also fade overhead furniture in front of the ball along the camera ray.
      const camera = this.host.camera.position,
        t = (106 - 9) / (camera.y - 9),
        sx = b.x + (camera.x + 450 - b.x) * t,
        sy = b.y + (camera.z + 280 - b.y) * t;
      const occluded =
        under ||
        (sx > d.x - 8 &&
          sx < d.x + d.w + 8 &&
          sy > d.y - 8 &&
          sy < d.y + d.h + 8);
      group.traverse((o) => {
        if (o instanceof T.Mesh) {
          const m = o.material as T.MeshStandardMaterial;
          if (!m.transparent) {
            m.transparent = true;
            m.needsUpdate = true;
          }
          m.opacity = occluded ? 0.22 : 1;
          m.depthWrite = !occluded;
        }
      });
    }
    const a = actorAt(this.level, b.time);
    if (this.actor && a) {
      this.actor.position.set(a.x - 450, 0, a.y - 280);
      this.actor.rotation.y = (Math.PI * (1 - Math.tanh(a.vy / 18))) / 2;
      const gait = Math.sin(b.time * 8) * Math.min(1, Math.abs(a.vy) / 80),
        surprise = Math.max(0, 1 - (b.time - b.actorHitAt) / 0.5);
      this.legs.forEach(
        (leg, i) => (leg.rotation.x = gait * (i ? -0.38 : 0.38)),
      );
      this.arms.forEach((arm, i) => {
        arm.rotation.x = gait * (i ? 0.3 : -0.3);
        arm.rotation.z = surprise * (i ? -1.5 : 1.5);
      });
      if (this.head) this.head.rotation.z = Math.sin(surprise * Math.PI) * 0.2;
    }
  }
  hit(id: string) {
    if (this.feedback) {
      const old = this.meshes.get(this.feedback.id);
      if (old) (old.material as T.MeshStandardMaterial).emissiveIntensity = 0;
    }
    this.feedback = { id, age: 0 };
  }
  animate(dt: number) {
    if (this.feedback) {
      const f = this.feedback;
      f.age += dt;
      const mesh = this.meshes.get(f.id);
      if (mesh) {
        const m = mesh.material as T.MeshStandardMaterial;
        m.emissive.setHex(0xf3bb76);
        m.emissiveIntensity = Math.max(0, 1 - f.age / 0.22) * 0.35;
      }
      if (f.age > 0.22) this.feedback = undefined;
    }
  }
  snapshot() {
    return {
      actor: this.actorBounds(),
      upperOpacity: this.uppers.map(
        (u) =>
          (
            u.group.children[0] as T.Mesh<
              T.BufferGeometry,
              T.MeshStandardMaterial
            >
          ).material.opacity,
      ),
      upperTransparent: this.uppers.map(
        (u) =>
          (
            u.group.children[0] as T.Mesh<
              T.BufferGeometry,
              T.MeshStandardMaterial
            >
          ).material.transparent,
      ),
      arms: this.arms.map((a) => a.rotation.z),
    };
  }
  actorBounds() {
    if (!this.actorDisk) return null;
    const b = new T.Box3().setFromObject(this.actorDisk);
    return {
      x: (b.min.x + b.max.x) / 2 + 450,
      y: (b.min.z + b.max.z) / 2 + 280,
      r: (b.max.x - b.min.x) / 2,
    };
  }
}

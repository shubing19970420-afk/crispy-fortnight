import * as T from "three";
import type { GolfScene } from "./scene";

export const destinations = [
  {
    title: "就在眼前",
    theme: "草地岛",
    feature: "瞄准 · 轻轻一杆",
    color: "#76b95a",
  },
  {
    title: "请走弯路",
    theme: "森林岛",
    feature: "双折返 · 绕过树林",
    color: "#388c79",
  },
  {
    title: "办公室高尔夫",
    theme: "办公室岛",
    feature: "家具之间 · 注意同事",
    color: "#ee9464",
  },
];
type Island = {
  group: T.Group;
  hit: T.Mesh;
  trees: T.Group[];
  flag?: T.Mesh;
  ball?: T.Mesh;
  chair?: T.Group;
  person?: T.Group;
  lift: number;
  liftVelocity: number;
};
/** A separate menu mode, sharing the gameplay renderer, lighting and model builders. */
export class WorldMap {
  root = new T.Group();
  islands: Island[] = [];
  hovered = -1;
  private ray = new T.Raycaster();
  private paths = new T.Group();
  private travel: { index: number; t: number } | null = null;
  private basePosition = new T.Vector3(250, 1050, 1400);
  private selected = -1;
  constructor(private host: GolfScene) {
    host.scene.add(this.root);
    this.root.add(this.paths);
    for (let i = 0; i < 3; i++) this.buildIsland(i);
    this.layout();
  }
  private box(
    w: number,
    h: number,
    d: number,
    c: T.ColorRepresentation,
    x: number,
    y: number,
    z: number,
    parent: T.Object3D,
    round = 0,
  ) {
    return this.host.box(w, h, d, c, x, y, z, round, parent);
  }
  private mesh(
    g: T.BufferGeometry,
    c: T.ColorRepresentation,
    x: number,
    y: number,
    z: number,
    parent: T.Object3D,
  ) {
    return this.host.mesh(g, c, x, y, z, parent);
  }
  private islandShape(w: number, d: number) {
    const s = new T.Shape();
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2,
        r = i % 3 === 0 ? 0.92 : 1;
      const x = ((Math.cos(a) * w) / 2) * r,
        y = ((Math.sin(a) * d) / 2) * r;
      if (i === 0) s.moveTo(x, y);
      else s.lineTo(x, y);
    }
    s.closePath();
    return s;
  }
  private slab(
    w: number,
    d: number,
    h: number,
    c: T.ColorRepresentation,
    y: number,
    p: T.Group,
  ) {
    const g = new T.ExtrudeGeometry(this.islandShape(w, d), {
      depth: h,
      bevelEnabled: true,
      bevelSize: 4,
      bevelThickness: 3,
      bevelSegments: 1,
    });
    g.rotateX(-Math.PI / 2);
    return this.mesh(g, c, 0, y - h, 0, p);
  }
  private tree(x: number, z: number, size: number, parent: T.Group) {
    const tree = new T.Group();
    tree.position.set(x, 0, z);
    this.box(9, 30, 9, 0x956747, 0, 15, 0, tree);
    this.mesh(
      new T.ConeGeometry(28 * size, 64 * size, 6),
      0x317c65,
      0,
      47 * size,
      0,
      tree,
    );
    this.mesh(
      new T.ConeGeometry(23 * size, 50 * size, 6),
      0x61ab72,
      0,
      70 * size,
      0,
      tree,
    );
    parent.add(tree);
    return tree;
  }
  private hole(x: number, z: number, p: T.Group, height = 6) {
    const m = this.mesh(
      new T.CylinderGeometry(14, 14, 1, 24),
      0x1b4842,
      x,
      height + 0.1,
      z,
      p,
    );
    m.castShadow = false;
    const rim = this.mesh(
      new T.TorusGeometry(14, 1.7, 4, 24),
      0xffefba,
      x,
      height + 0.9,
      z,
      p,
    );
    rim.rotation.x = Math.PI / 2;
    this.mesh(
      new T.CylinderGeometry(1.6, 1.8, 78, 6),
      0xfff5d0,
      x + 16,
      height + 39,
      z,
      p,
    );
    const geo = new T.BufferGeometry();
    geo.setAttribute(
      "position",
      new T.Float32BufferAttribute([0, 0, 0, 34, -12, 0, 0, -24, 0], 3),
    );
    geo.computeVertexNormals();
    const f = this.mesh(geo, 0xf47c59, x + 16, height + 78, z, p);
    (f.material as T.MeshStandardMaterial).side = T.DoubleSide;
    return f;
  }
  private buildIsland(i: number) {
    const g = new T.Group();
    g.userData.level = i;
    this.root.add(g);
    this.slab(338, 265, 37, i === 2 ? 0x916d56 : 0xa98161, -12, g);
    this.slab(350, 270, 13, [0x90c95f, 0x63aa77, 0xe2bb7e][i], 0, g);
    // Generous raycast disk, separate from decorative meshes. It never receives a game collider.
    const hit = new T.Mesh(
      new T.CylinderGeometry(184, 184, 140, 12),
      new T.MeshBasicMaterial({ visible: false }),
    );
    hit.position.y = 35;
    hit.scale.z = 0.82;
    hit.userData.level = i;
    g.add(hit);
    const island: Island = { group: g, hit, trees: [], lift: 0, liftVelocity: 0 };
    this.islands.push(island);
    if (i === 0) {
      this.box(210, 1, 120, 0x9ed977, -12, 3.6, 3, g, 10);
      island.flag = this.hole(55, 22, g);
      island.ball = this.mesh(
        new T.IcosahedronGeometry(10, 2),
        0xfff9df,
        -70,
        11,
        25,
        g,
      );
      island.trees.push(
        this.tree(-120, -60, 0.85, g),
        this.tree(-100, -90, 0.65, g),
      );
      for (const [x, z] of [
        [110, -65],
        [125, -45],
        [-100, 80],
      ])
        this.mesh(new T.DodecahedronGeometry(12, 0), 0xa5b5a4, x, 8, z, g);
      for (let j = 0; j < 5; j++) {
        const x = 80 + j * 11;
        this.mesh(new T.CylinderGeometry(1, 1, 12, 4), 0x4d8c62, x, 7, 85, g);
        this.mesh(
          new T.IcosahedronGeometry(4, 0),
          j % 2 ? 0xffd760 : 0xf38b72,
          x,
          15,
          85,
          g,
        );
      }
    } else if (i === 1) {
      const path = new T.CatmullRomCurve3([
        new T.Vector3(-135, 2, 55),
        new T.Vector3(-50, 2, 65),
        new T.Vector3(-20, 2, -10),
        new T.Vector3(75, 2, -25),
        new T.Vector3(125, 2, -60),
      ]);
      const trail = this.mesh(
        new T.TubeGeometry(path, 28, 14, 5, false),
        0xf2dba5,
        0,
        0,
        0,
        g,
      );
      trail.scale.y = 0.1;
      trail.position.y = 4;
      trail.castShadow = false;
      for (const [x, z, s] of [
        [-125, -65, 0.85],
        [-75, -90, 1],
        [-25, -90, 0.9],
        [115, 45, 1],
        [70, 75, 0.8],
        [120, 85, 0.7],
        [-135, 20, 0.65],
      ])
        island.trees.push(this.tree(x, z, s, g));
      for (const [x, z, r] of [
        [-20, 40, 15],
        [45, -65, 21],
        [90, 20, 12],
      ])
        this.mesh(new T.DodecahedronGeometry(r, 0), 0x9eaaa0, x, 10, z, g);
      this.box(14, 30, 67, 0xdba36a, 15, 15, -8, g, 2);
      island.flag = this.hole(113, -60, g);
    } else {
      // Toy office: the miniature is a menu illustration, not new gameplay geometry.
      this.box(270, 9, 200, 0xf2d798, 0, 5, 0, g, 4);
      const desk = new T.Group();
      desk.position.set(-30, 0, -32);
      g.add(desk);
      this.box(145, 10, 70, 0xc58856, 0, 58, 0, desk, 3);
      for (const x of [-59, 59])
        for (const z of [-24, 24]) this.box(7, 54, 7, 0x6a8b85, x, 28, z, desk);
      this.box(55, 37, 6, 0x426761, 0, 84, -18, desk, 2);
      this.box(47, 28, 1, 0x9acfd1, 0, 84, -14.5, desk);
      this.box(6, 15, 6, 0x426761, 0, 63, -18, desk);
      this.box(35, 2, 15, 0xffe9ac, 0, 65, 12, desk, 1);
      this.box(18, 2, 22, 0xf59870, 47, 65, 5, desk);
      const chair = (island.chair = new T.Group());
      chair.position.set(-35, 0, 47);
      g.add(chair);
      this.box(46, 8, 40, 0xe88763, 0, 32, 0, chair, 4);
      this.box(43, 40, 8, 0xe88763, 0, 54, 17, chair, 3);
      this.box(5, 26, 5, 0x51776e, 0, 15, 0, chair);
      this.box(50, 5, 6, 0x51776e, 0, 4, 0, chair);
      this.box(6, 5, 40, 0x51776e, 0, 4, 0, chair);
      this.box(49, 72, 48, 0x71aaa3, 98, 41, -45, g, 3);
      for (let j = 0; j < 3; j++) {
        this.box(44, 19, 2, 0xa6ccc0, 98, 18 + j * 23, -20, g);
        this.box(13, 3, 3, 0x426761, 98, 19 + j * 23, -17, g);
      }
      const person = (island.person = new T.Group());
      g.add(person);
      this.box(19, 30, 14, 0x6c97be, 0, 36, 0, person, 3);
      this.mesh(new T.IcosahedronGeometry(11, 1), 0xf3c6a1, 0, 61, 0, person);
      this.box(20, 6, 17, 0x6b5149, 0, 70, -2, person, 2);
      for (const x of [-6, 6]) this.box(6, 20, 7, 0x496d6e, x, 12, 0, person);
      this.box(34, 2, 27, 0xffe36e, -100, 12, 50, g);
      island.flag = this.hole(100, 75, g, 10);
    }
    // A pennant-shaped 3D number marker, not a flat web card.
    const post = this.box(5, 46, 5, 0x8c654b, -128, 22, 47, g);
    post.castShadow = false;
    this.box(43, 28, 5, 0xffe7ab, -128, 50, 47, g, 2);
    const c = document.createElement("canvas");
    c.width = 128;
    c.height = 96;
    const ctx = c.getContext("2d")!;
    ctx.font = "900 64px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#315c4d";
    ctx.fillText(`0${i + 1}`, 64, 50);
    const texture = new T.CanvasTexture(c);
    texture.colorSpace = T.SRGBColorSpace;
    const label = new T.Mesh(
      new T.PlaneGeometry(38, 27),
      new T.MeshBasicMaterial({ map: texture, transparent: true }),
    );
    label.position.set(-128, 50, 50);
    g.add(label);
  }
  layout() {
    const portrait = this.host.canvas.parentElement!.clientWidth < 650;
    const positions = portrait
      ? [
          [-75, 0, 450],
          [100, 28, 0],
          [-30, 5, -480],
        ]
      : [
          [-385, 0, 150],
          [0, 45, -185],
          [400, -4, 60],
        ];
    this.islands.forEach((island, i) => {
      island.group.position.fromArray(positions[i]);
      island.group.userData.baseY = positions[i][1];
    });
    this.disposeObjects(this.paths);
    this.paths.clear();
    for (let i = 0; i < 2; i++) {
      const a = this.islands[i].group.position,
        b = this.islands[i + 1].group.position;
      const curve = new T.CatmullRomCurve3([
        a.clone().add(new T.Vector3(100, -6, -10)),
        a
          .clone()
          .lerp(b, 0.5)
          .add(new T.Vector3(35, -30, 40)),
        b.clone().add(new T.Vector3(-120, -6, 35)),
      ]);
      for (let j = 1; j < 22; j++) {
        const p = curve.getPoint(j / 22),
          dot = this.mesh(
            new T.SphereGeometry(j % 4 === 0 ? 5 : 3, 6, 4),
            0xffedbd,
            p.x,
            p.y,
            p.z,
            this.paths,
          );
        dot.castShadow = false;
      }
    }
    this.host.camera.position.copy(this.basePosition);
    this.host.camera.lookAt(0, 0, 0);
    this.host.camera.zoom = 1;
    this.host.camera.updateMatrixWorld();
    const r = this.host.canvas.parentElement!.getBoundingClientRect(),
      aspect = r.width / r.height;
    let minX = Infinity,
      maxX = -Infinity,
      minY = Infinity,
      maxY = -Infinity;
    this.root.updateMatrixWorld(true);
    this.root.traverse((o) => {
      if (
        !(o instanceof T.Mesh) ||
        (o.material instanceof T.MeshBasicMaterial && !o.material.visible)
      )
        return;
      o.geometry.computeBoundingBox();
      const bounds = o.geometry.boundingBox!;
      for (const x of [bounds.min.x, bounds.max.x])
        for (const y of [bounds.min.y, bounds.max.y])
          for (const z of [bounds.min.z, bounds.max.z]) {
            const p = new T.Vector3(x, y, z)
              .applyMatrix4(o.matrixWorld)
              .applyMatrix4(this.host.camera.matrixWorldInverse);
            minX = Math.min(minX, p.x);
            maxX = Math.max(maxX, p.x);
            minY = Math.min(minY, p.y);
            maxY = Math.max(maxY, p.y);
          }
    });
    minX -= 25;
    maxX += 25;
    minY -= 55;
    maxY += 30;
    const h = Math.max(maxY - minY, (maxX - minX) / aspect) * 1.04,
      w = h * aspect,
      cx = (maxX + minX) / 2,
      cy = (maxY + minY) / 2,
      c = this.host.camera;
    c.left = cx - w / 2;
    c.right = cx + w / 2;
    c.top = cy + h / 2;
    c.bottom = cy - h / 2;
    c.near = 1;
    c.far = 4000;
    c.updateProjectionMatrix();
  }
  pick(clientX: number, clientY: number) {
    if (this.travel) return -1;
    const r = this.host.canvas.getBoundingClientRect();
    this.ray.setFromCamera(
      new T.Vector2(
        ((clientX - r.left) / r.width) * 2 - 1,
        (-(clientY - r.top) / r.height) * 2 + 1,
      ),
      this.host.camera,
    );
    const hits = this.ray.intersectObjects(
      this.islands.map((i) => i.hit),
      false,
    );
    return hits.length ? (hits[0].object.userData.level as number) : -1;
  }
  hover(index: number) {
    this.hovered = index;
  }
  enter(index: number) {
    if (this.travel) return false;
    this.selected = index;
    this.hovered = index;
    this.travel = { index, t: 0 };
    return true;
  }
  get transitioning() {
    return this.travel !== null;
  }
  anchor(index: number, label = false) {
    const p = this.islands[index].group.position.clone();
    p.y = this.islands[index].group.userData.baseY + (label ? -12 : 10);
    if (label) p.z += 142;
    const v = p.project(this.host.camera),
      r = this.host.canvas.getBoundingClientRect();
    return {
      x: r.left + ((v.x + 1) * r.width) / 2,
      y: r.top + ((1 - v.y) * r.height) / 2,
    };
  }
  update(t: number, dt: number): number | null {
    for (let i = 0; i < 3; i++) {
      const s = this.islands[i],
        active = i === this.hovered;
      // Only menu feedback: a small damped spring, independent of ball physics.
      for(let n=0;n<3;n++) {
        s.liftVelocity += ((active ? 18 : 0)-s.lift)*180*dt/3;
        s.liftVelocity *= Math.exp(-16*dt/3);
        s.lift += s.liftVelocity*dt/3;
      }
      s.group.position.y = s.group.userData.baseY + s.lift;
      const scale = T.MathUtils.damp(
        s.group.scale.x,
        active ? 1.045 : 1,
        8,
        dt,
      );
      s.group.scale.setScalar(scale);
      for (let j = 0; j < s.trees.length; j++)
        s.trees[j].rotation.z =
          Math.sin(t * (active ? 2.7 : 1) + j) * (active ? 0.065 : 0.012);
      if (s.flag)
        s.flag.rotation.y =
          Math.sin(t * (active ? 4 : 2)) * (active ? 0.3 : 0.1);
      if (s.ball) {
        s.ball.position.x = -65 + Math.sin(t * (active ? 1.8 : 0.65)) * 35;
        s.ball.rotation.z = -t * 2;
      }
      if (s.chair)
        s.chair.rotation.y =
          Math.sin(t * (active ? 1.8 : 0.7)) * (active ? 0.5 : 0.1);
      if (s.person) {
        s.person.position.set(
          55 + Math.sin(t * (active ? 1.4 : 0.4)) * 24,
          Math.abs(Math.sin(t * 5)) * (active ? 2 : 0.3),
          45 + Math.cos(t * (active ? 1.4 : 0.4)) * 25,
        );
        s.person.rotation.y = Math.cos(t) * 0.3;
      }
    }
    if (this.travel) {
      this.travel.t += dt;
      const u = Math.min(this.travel.t / 0.8, 1),
        e = u * u * (3 - 2 * u),
        p = this.islands[this.selected].group.position;
      this.host.camera.position
        .copy(this.basePosition)
        .addScaledVector(p, e * 0.72);
      this.host.camera.lookAt(p.clone().multiplyScalar(e * 0.72));
      this.host.camera.zoom = 1 + e * 0.85;
      this.host.camera.updateProjectionMatrix();
      this.host.camera.updateMatrixWorld();
      if (u >= 1) return this.selected;
    }
    return null;
  }
  snapshot() {
    return {
      hovered: this.hovered,
      transitioning: this.transitioning,
      zoom: this.host.camera.zoom,
      islands: this.islands.map((s) => ({
        position: s.group.position.toArray(),
        scale: s.group.scale.x,
        trees: s.trees.map((t) => t.rotation.z),
        chair: s.chair?.rotation.y,
        person: s.person?.position.toArray(),
      })),
    };
  }
  private disposeObjects(root: T.Object3D) {
    const geos = new Set<T.BufferGeometry>(),
      materials = new Set<T.Material>(),
      textures = new Set<T.Texture>();
    root.traverse((o) => {
      if (o instanceof T.Mesh) {
        geos.add(o.geometry);
        for (const m of Array.isArray(o.material) ? o.material : [o.material]) {
          materials.add(m);
          const map = (m as T.MeshBasicMaterial).map;
          if (map) textures.add(map);
        }
      }
    });
    geos.forEach((g) => g.dispose());
    materials.forEach((m) => m.dispose());
    textures.forEach((t) => t.dispose());
  }
  dispose() {
    this.disposeObjects(this.root);
    this.root.removeFromParent();
    this.root.clear();
  }
}

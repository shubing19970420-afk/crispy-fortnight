import {SpecialModels} from "./special-models";
import * as T from "three";
import { CourseModels } from "./course-models";
import { WorldMap } from "./world-map";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { levels, WIDTH, HEIGHT, type Level, type Rect } from "./levels";
import { createBall, shoot, step, STEP, R, type Ball } from "./physics";
export const world = (x: number, y: number, h = 0) =>
  new T.Vector3(x - WIDTH / 2, h, y - HEIGHT / 2);
const cream = 0xfff3cf,
  green = 0x82c95e,
  coral = 0xf47c59;
export class GolfScene {
  renderer: T.WebGLRenderer;
  map?: WorldMap;
  scene = new T.Scene();
  camera = new T.OrthographicCamera();
  root = new T.Group();
  ball = new T.Group();
  flag = new T.Group();
  aim = new T.Group();
  route = new T.Group();
  particles = new T.Group();
  colliders: { rect: Rect; mesh: T.Object3D }[] = [];
  private course?: CourseModels;
  private special?:SpecialModels;
  private ray = new T.Raycaster();
  private plane = new T.Plane(new T.Vector3(0, 1, 0), 0);
  private level: Level = levels[0];
  private flagMesh?: T.Mesh;
  private lastBall?: T.Vector3;
  private shadow: T.Mesh;
  private shadowTexture: T.CanvasTexture;
  private burstTime = -1;
  private impact = 0;
  private capture?: { x: number; y: number; t: number };
  private resizeObserver: ResizeObserver;
  constructor(public canvas: HTMLCanvasElement) {
    this.renderer = new T.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = T.PCFSoftShadowMap;
    this.renderer.outputColorSpace = T.SRGBColorSpace;
    this.scene.add(new T.HemisphereLight(0xf9fff0, 0x669e91, 2));
    const sun = new T.DirectionalLight(0xfff1d2, 3);
    sun.position.set(-450, 850, 400);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    Object.assign(sun.shadow.camera, {
      left: -750,
      right: 750,
      top: 650,
      bottom: -650,
      near: 1,
      far: 2200,
    });
    sun.shadow.normalBias = 1.5;
    sun.shadow.bias = -0.0003;
    sun.shadow.radius = 4;
    this.scene.add(sun);
    const ground = new T.Mesh(
      new T.PlaneGeometry(6000, 6000),
      new T.ShadowMaterial({ opacity: 0.13 }),
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -88;
    ground.receiveShadow = true;
    this.scene.add(ground);
    this.scene.add(this.root);
    this.camera.position.set(480, 1050, 1150);
    this.camera.lookAt(0, 0, 0);
    const c = document.createElement("canvas");
    c.width = c.height = 64;
    const ctx = c.getContext("2d")!;
    const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, "rgba(30,56,45,.4)");
    g.addColorStop(1, "rgba(30,56,45,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 64, 64);
    this.shadowTexture = new T.CanvasTexture(c);
    this.shadow = new T.Mesh(
      new T.PlaneGeometry(34, 34),
      new T.MeshBasicMaterial({
        map: this.shadowTexture,
        transparent: true,
        depthWrite: false,
      }),
    );
    this.shadow.rotation.x = -Math.PI / 2;
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(canvas.parentElement!);
    this.setLevel(0);
  }
  material(color: T.ColorRepresentation) {
    return new T.MeshStandardMaterial({
      color,
      roughness: 0.88,
      metalness: 0,
      flatShading: true,
    });
  }
  mesh(
    geo: T.BufferGeometry,
    color: T.ColorRepresentation,
    x: number,
    y: number,
    z: number,
    parent: T.Object3D = this.root,
  ) {
    const m = new T.Mesh(geo, this.material(color));
    m.position.set(x, y, z);
    m.castShadow = true;
    m.receiveShadow = true;
    parent.add(m);
    return m;
  }
  box(
    w: number,
    h: number,
    d: number,
    color: T.ColorRepresentation,
    x: number,
    y: number,
    z: number,
    round = 0,
    parent: T.Object3D = this.root,
  ) {
    return this.mesh(
      round
        ? new RoundedBoxGeometry(w, h, d, 2, round)
        : new T.BoxGeometry(w, h, d),
      color,
      x,
      y,
      z,
      parent,
    );
  }
  private contact(x: number, z: number, w: number, d: number) {
    const m = new T.Mesh(
      new T.PlaneGeometry(w, d),
      new T.MeshBasicMaterial({
        map: this.shadowTexture,
        transparent: true,
        opacity: 0.55,
        depthWrite: false,
      }),
    );
    m.rotation.x = -Math.PI / 2;
    m.position.set(x, 0.35, z);
    this.root.add(m);
  }
  label(
    text: string,
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    color = "#fff3cf",
  ) {
    const c = document.createElement("canvas");
    c.width = 512;
    c.height = 128;
    const ctx = c.getContext("2d")!;
    ctx.fillStyle = color;
    ctx.font = "bold 64px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, 256, 64);
    const texture = new T.CanvasTexture(c);
    texture.colorSpace = T.SRGBColorSpace;
    const m = new T.Mesh(
      new T.PlaneGeometry(w, h),
      new T.MeshBasicMaterial({
        map: texture,
        transparent: true,
        depthWrite: false,
      }),
    );
    m.rotation.x = -Math.PI / 2;
    m.position.set(x, y, z);
    this.root.add(m);
  }
  private clearLevel() {
    this.root.traverse((o) => {
      if (o instanceof T.Mesh || o instanceof T.Line) {
        if(o instanceof T.InstancedMesh) o.dispose();
        o.geometry.dispose();
        const ms = Array.isArray(o.material) ? o.material : [o.material];
        for (const m of ms) {
          const map = (m as T.MeshBasicMaterial).map;
          if (map && map !== this.shadowTexture) map.dispose();
          m.dispose();
        }
      }
    });
    this.root.clear();
    this.colliders = [];
    this.course = undefined;
    this.special=undefined;
    this.capture = undefined;
    this.burstTime = -1;
    this.lastBall = undefined;
  }
  showMap() {
    this.clearLevel();
    this.root.visible = false;
    this.map?.dispose();
    this.map = new WorldMap(this);
    this.resize();
  }
  setLevel(index: number) {
    this.map?.dispose();
    this.map = undefined;
    this.root.visible = true;
    this.camera.zoom = 1;
    this.camera.position.set(480, 1050, 1150);
    this.camera.lookAt(0, 0, 0);
    this.clearLevel();
    const l = (this.level = levels[index]),
      office = !!l.office;
    if(l.platforms) {
      for(const p of l.platforms){
        this.box(p.w,54,p.h,0xb78c64,p.x+p.w/2-450,-37,p.y+p.h/2-280,8);
        const shape=new T.Shape();shape.moveTo(p.x-450,280-p.y);shape.lineTo(p.x+p.w-450,280-p.y);shape.lineTo(p.x+p.w-450,280-p.y-p.h);shape.lineTo(p.x-450,280-p.y-p.h);shape.closePath();
        if(l.hole.x>p.x&&l.hole.x<p.x+p.w){const hole=new T.Path();hole.absarc(l.hole.x-450,280-l.hole.y,17,0,Math.PI*2,true);shape.holes.push(hole);}
        const geo=new T.ExtrudeGeometry(shape,{depth:10,bevelEnabled:false,curveSegments:24});geo.rotateX(-Math.PI/2);this.mesh(geo,green,0,-10,0).castShadow=false;
      }
    } else {
    this.box(900, 54, 560, office ? 0xb98760 : 0xb78c64, 0, -37, 0, 12);
    this.box(860, 18, 520, office ? 0x936546 : 0x8a7459, 0, -71, 0, 8);
    // Extruded surface contains a genuine hole; all positions use physics units.
    const s = new T.Shape();
    s.moveTo(-450, -280);
    s.lineTo(450, -280);
    s.lineTo(450, 280);
    s.lineTo(-450, 280);
    s.closePath();
    const hole = new T.Path();
    hole.absarc(l.hole.x - 450, 280 - l.hole.y, 17, 0, Math.PI * 2, true);
    s.holes.push(hole);
    const geo = new T.ExtrudeGeometry(s, {
      depth: 10,
      bevelEnabled: false,
      curveSegments: 24,
    });
    geo.rotateX(-Math.PI / 2);
    this.mesh(
      geo,
      office ? 0xd8dfce : l.forest ? 0x699d66 : green,
      0,
      -10,
      0,
    ).castShadow = false;
    // Colour patches are flush with the surface, never extra collision geometry.
    if (!office && !l.forest)
      for (let i = 0; i < 7; i++) {
        const x = -390 + i * 120;
        const hz = l.hole.y - 280;
        for (const [a, b] of [
          [-250, hz - 23],
          [hz + 23, 250],
        ]) {
          if (b > a) {
            const patch = this.box(
              58,
              0.12,
              b - a,
              office ? 0xefd18b : 0x8bce65,
              x,
              0.08,
              (a + b) / 2,
            );
            patch.castShadow = false;
          }
        }
      }
    }
    // Do not let decorative stripes cover the actual hole.
    const well = this.mesh(
      new T.CylinderGeometry(16.8, 16.8, 10, 32, 1, true),
      0x254c48,
      l.hole.x - 450,
      -5,
      l.hole.y - 280,
    );
    (well.material as T.MeshStandardMaterial).side = T.DoubleSide;
    this.mesh(
      new T.CylinderGeometry(16.8, 16.8, 1, 32),
      0x173b36,
      l.hole.x - 450,
      -10,
      l.hole.y - 280,
    );
    const rim = new T.Mesh(
      new T.RingGeometry(17, 20, 32),
      this.material(cream),
    );
    rim.rotation.x = -Math.PI / 2;
    rim.position.copy(world(l.hole.x, l.hole.y, 0.3));
    this.root.add(rim);
    // Inner edge of each wall is exactly x/y=28 or width/height-28.
    for (const a of (l.platforms ? [] : [
      { x: 14, y: 280, w: 28, h: 560 },
      { x: 886, y: 280, w: 28, h: 560 },
      { x: 450, y: 14, w: 844, h: 28 },
      { x: 450, y: 546, w: 844, h: 28 },
    ])) {
      this.box(
        a.w,
        18,
        a.h,
        office ? 0xbc875c : 0x4e9875,
        a.x - 450,
        9,
        a.y - 280,
        3,
      );
    }
    this.course = new CourseModels(this, l);
    this.special = new SpecialModels(this,l);
    this.colliders = this.course.rects;
    if (!office && !l.forest && !l.platforms) this.garden();
    this.flag = new T.Group();
    this.flag.position.copy(world(l.hole.x + 19, l.hole.y, 0));
    this.root.add(this.flag);
    this.mesh(
      new T.CylinderGeometry(1.8, 2, 103, 8),
      cream,
      0,
      51.5,
      0,
      this.flag,
    );
    const flagGeo = new T.BufferGeometry();
    flagGeo.setAttribute(
      "position",
      new T.Float32BufferAttribute([0, 98, 0, 42, 85, 0, 0, 73, 0], 3),
    );
    flagGeo.computeVertexNormals();
    this.flagMesh = this.mesh(flagGeo, coral, 0, 0, 0, this.flag);
    (this.flagMesh.material as T.MeshStandardMaterial).side = T.DoubleSide;
    this.ball = new T.Group();
    const sphere = this.mesh(
      new T.IcosahedronGeometry(R, 3),
      0xfff9df,
      0,
      0,
      0,
      this.ball,
    );
    (sphere.material as T.MeshStandardMaterial).roughness = 0.35;
    // Sparse golf markings make real rolling rotation visible.
    for (let i = 0; i < 14; i++) {
      const a = i * 2.3999,
        y = 1 - (2 * (i + 0.5)) / 14,
        r = Math.sqrt(1 - y * y);
      const dot = new T.Mesh(
        new T.SphereGeometry(0.65, 5, 4),
        this.material(0xc9d9ca),
      );
      dot.position.set(Math.cos(a) * r * R, y * R, Math.sin(a) * r * R);
      this.ball.add(dot);
    }
    this.root.add(this.ball);
    this.root.add(this.shadow);
    this.aim = new T.Group();
    this.root.add(this.aim);
    this.route = new T.Group();
    this.root.add(this.route);
    this.particles = new T.Group();
    this.root.add(this.particles);
    this.updateBall(createBall(l), 0);
    this.resize();
  }
  private garden() {
    // Tiny trees are confined to the solid 28-unit border outside the playable area.
    for (const [x, z, scale] of [
      [-410, -260, 1],
      [-300, -260, 0.75],
      [400, 260, 0.75],
    ]) {
      this.mesh(new T.CylinderGeometry(5, 7, 30, 6), 0x9c7151, x, 22, z);
      const tree = this.mesh(
        new T.ConeGeometry(27 * scale, 65 * scale, 7),
        0x398f72,
        x,
        63 * scale,
        z,
      );
      tree.rotation.y = 0.4;
      this.mesh(
        new T.ConeGeometry(22 * scale, 48 * scale, 7),
        0x56b282,
        x,
        88 * scale,
        z,
      );
    }
    for (const x of [-220, -185, 280, 310]) {
      this.mesh(new T.DodecahedronGeometry(8, 0), 0xa2b2a2, x, 12, -263);
    }
    for (const x of [-110, -80, 70, 100]) {
      this.mesh(new T.CylinderGeometry(1, 1, 12, 5), 0x4c976f, x, 20, 263);
      this.mesh(
        new T.IcosahedronGeometry(5, 0),
        x < 0 ? coral : cream,
        x,
        28,
        263,
      );
    }
  }
  courseSnapshot() {
    return this.course?.snapshot();
  }
  collisionBounds() {
    const rects = this.colliders.map(({ rect, mesh }) => {
      const b = new T.Box3().setFromObject(mesh);
      return {
        rect,
        bounds: {
          x: b.min.x + 450,
          y: b.min.z + 280,
          w: b.max.x - b.min.x,
          h: b.max.z - b.min.z,
        },
      };
    });
    const circles = (this.course?.circles || []).map(({ circle, mesh }) => {
      const b = new T.Box3().setFromObject(mesh);
      return {
        circle,
        bounds: {
          x: (b.min.x + b.max.x) / 2 + 450,
          y: (b.min.z + b.max.z) / 2 + 280,
          r: (b.max.x - b.min.x) / 2,
        },
      };
    });
    return { rects, circles, actor: this.course?.actorBounds() };
  }
  resize() {
    const r = this.canvas.parentElement!.getBoundingClientRect();
    if (r.width < 1 || r.height < 1) return;
    this.renderer.setSize(r.width, r.height, false);
    if (this.map) {
      this.map.layout();
      return;
    }
    const aspect = r.width / r.height;
    this.camera.updateMatrixWorld();
    let minX = Infinity,
      maxX = -Infinity,
      minY = Infinity,
      maxY = -Infinity;
    for (const x of [-490, 490])
      for (const y of [-90, 175])
        for (const z of [-405, 310]) {
          const p = new T.Vector3(x, y, z).applyMatrix4(
            this.camera.matrixWorldInverse,
          );
          minX = Math.min(minX, p.x);
          maxX = Math.max(maxX, p.x);
          minY = Math.min(minY, p.y);
          maxY = Math.max(maxY, p.y);
        }
    const h = Math.max(maxY - minY, (maxX - minX) / aspect) * 1.08,
      w = h * aspect,
      cx = (minX + maxX) / 2,
      cy = (minY + maxY) / 2;
    this.camera.left = cx - w / 2;
    this.camera.right = cx + w / 2;
    this.camera.top = cy + h / 2;
    this.camera.bottom = cy - h / 2;
    this.camera.near = 1;
    this.camera.far = 4000;
    this.camera.updateProjectionMatrix();
  }
  planePoint(clientX: number, clientY: number, height = 0) {
    const r = this.canvas.getBoundingClientRect();
    this.ray.setFromCamera(
      new T.Vector2(
        ((clientX - r.left) / r.width) * 2 - 1,
        (-(clientY - r.top) / r.height) * 2 + 1,
      ),
      this.camera,
    );
    this.plane.constant = -height;
    const p = this.ray.ray.intersectPlane(this.plane, new T.Vector3());
    return p ? { x: p.x + 450, y: p.z + 280 } : null;
  }
  project(x: number, y: number, height = 0) {
    const p = world(x, y, height).project(this.camera),
      r = this.canvas.getBoundingClientRect();
    return {
      x: r.left + ((p.x + 1) * r.width) / 2,
      y: r.top + ((1 - p.y) * r.height) / 2,
    };
  }
  updateBall(b: Ball, dt: number) {
    this.course?.update(b);
    this.special?.update(b.time);
    if (this.capture) {
      const c = this.capture;
      c.t += dt;
      const t = Math.min(c.t / 0.65, 1),
        e = 1 - (1 - t) ** 3;
      this.ball.position.copy(
        world(
          c.x + (this.level.hole.x - c.x) * e,
          c.y + (this.level.hole.y - c.y) * e,
          R - 28 * e,
        ),
      );
      this.ball.scale.setScalar(Math.max(0.001, 1 - e));
      this.shadow.visible = false;
      return;
    }
    const squash = 1 - Math.sin((this.impact / 0.15) * Math.PI) * 0.12;
    this.ball.scale.set(1 / Math.sqrt(squash), squash, 1 / Math.sqrt(squash));
    this.shadow.visible = true;
    const p = world(b.x, b.y, R);
    if (this.lastBall) {
      const dx = p.x - this.lastBall.x,
        dz = p.z - this.lastBall.z,
        dist = Math.hypot(dx, dz);
      if (dist > 0) {
        const axis = new T.Vector3(dz, 0, -dx).normalize();
        this.ball.quaternion.premultiply(
          new T.Quaternion().setFromAxisAngle(axis, dist / R),
        );
      }
    }
    this.ball.position.copy(p);
    this.lastBall = p.clone();
    this.shadow.position.copy(world(b.x, b.y, 0.7));
  }
  showAim(b: Ball, dx: number, dy: number) {
    for (const c of [...this.aim.children]) {
      c.traverse((o) => {
        if (o instanceof T.Mesh || o instanceof T.Line) {
          o.geometry.dispose();
          (o.material as T.Material).dispose();
        }
      });
      this.aim.remove(c);
    }
    const len = Math.hypot(dx, dy);
    if (len < 6) return;
    const dir = new T.Vector3(dx / len, 0, dy / len),
      origin = world(b.x, b.y, 2);
    const arrow = new T.ArrowHelper(
      dir,
      origin,
      40 + Math.min(len, 150) * 0.35,
      coral,
      16,
      13,
    );
    this.aim.add(arrow);
    // Short prediction uses the exact physics, at most .26 seconds; never a full route.
    const predicted = { ...b, hits: [...b.hits] };
    shoot(predicted, dx, dy);
    for (let n = 0; n < 64 && predicted.state === "moving"; n++) {
      step(predicted, this.level, STEP);
      if (n % 8 === 7)
        this.mesh(
          new T.SphereGeometry(2.5, 6, 4),
          cream,
          predicted.x - 450,
          2,
          predicted.y - 280,
          this.aim,
        );
    }
  }
  clearAim() {
    this.showAim(createBall(this.level), 0, 0);
  }
  showRoute(points: {x:number;y:number;breakBefore?:boolean}[] = []) {
    for(const o of this.route.children) {
      if(o instanceof T.InstancedMesh) o.dispose();
      const line=o as T.Line; line.geometry.dispose(); (line.material as T.Material).dispose();
    }
    this.route.clear();
    if(points.length<2) return;
    // Teleports break a trajectory; never stretch a dash across the empty gap.
    const chunks:T.Vector3[][]=[];
    for(const p of points){if(!chunks.length||p.breakBefore)chunks.push([]);chunks.at(-1)!.push(world(p.x,p.y,3.5));}
    const strokes:{a:T.Vector3;b:T.Vector3}[]=[];
    for(const path of chunks){
      if(path.length<2)continue;
      const distances=[0];for(let i=1;i<path.length;i++)distances.push(distances[i-1]+path[i].distanceTo(path[i-1]));
      const total=distances.at(-1)!;
      const at=(d:number)=>{let i=1;while(i<distances.length-1&&distances[i]<d)i++;return path[i-1].clone().lerp(path[i],(d-distances[i-1])/(distances[i]-distances[i-1]||1));};
      for(let d=0;d<total;d+=22)strokes.push({a:at(d),b:at(Math.min(d+12,total))});
    }
    const up=new T.Vector3(0,1,0);
    for(const [radius,opacity,color] of [[3.8,.16,0xfff3ad],[1.6,.85,0xfff3ad]]) {
      const dashes=new T.InstancedMesh(new T.CylinderGeometry(radius,radius,1,6),new T.MeshBasicMaterial({color,transparent:true,opacity,depthWrite:false}),strokes.length);
      const dummy=new T.Object3D();
      strokes.forEach(({a,b},i)=>{const direction=b.clone().sub(a);dummy.position.copy(a).add(b).multiplyScalar(.5);dummy.quaternion.setFromUnitVectors(up,direction.clone().normalize());dummy.scale.set(1,direction.length(),1);dummy.updateMatrix();dashes.setMatrixAt(i,dummy.matrix);});
      dashes.instanceMatrix.needsUpdate=true;this.route.add(dashes);
    }
  }

  captureBall(b: Ball) {
    this.capture = { x: b.x, y: b.y, t: 0 };
    this.burstTime = 0;
    this.impact = 0.35;
    for (let i = 0; i < 34; i++) {
      const p = this.mesh(
        new T.BoxGeometry(5, 3, 8),
        [coral, cream, 0x67cabc, 0xffcf55][i % 4],
        this.level.hole.x - 450,
        12,
        this.level.hole.y - 280,
        this.particles,
      );
      p.userData.velocity = new T.Vector3(
        Math.cos(i * 2.4) * (50 + (i % 5) * 14),
        110 + (i % 7) * 19,
        Math.sin(i * 2.4) * (50 + (i % 5) * 14),
      );
    }
  }
  bump(_surface?: string, id?: string) {
    this.impact = 0.15;
    if (id) this.course?.hit(id);
  }
  render(t: number, dt: number, _menu: boolean) {
    this.course?.animate(dt);
    if (this.flagMesh) {
      this.flagMesh.rotation.y = Math.sin(t * 2) * 0.14;
      this.flagMesh.rotation.z = Math.sin(t * 1.8) * 0.035;
    }
    if (this.burstTime >= 0) {
      this.burstTime += dt;
      for (const p of this.particles.children) {
        const v = p.userData.velocity as T.Vector3;
        v.y -= 150 * dt;
        p.position.addScaledVector(v, dt);
        p.rotation.x += dt * 3;
        p.rotation.z += dt * 2;
        (p as T.Mesh).visible = this.burstTime < 2.2;
      }
    }
    this.impact = Math.max(0, this.impact - dt);
    this.camera.setViewOffset(
      this.renderer.domElement.width,
      this.renderer.domElement.height,
      Math.sin(t * 70) * this.impact * 5,
      Math.cos(t * 60) * this.impact * 4,
      this.renderer.domElement.width,
      this.renderer.domElement.height,
    );
    this.renderer.render(this.scene, this.camera);
    this.camera.clearViewOffset();
  }
}

import * as T from 'three';
import type {GolfScene} from './scene';
import type {Level} from './levels';
export type Point={x:number;y:number};
/** Shared original procedural art. All top surfaces remain at physical Y=0. */
export function surface(host:GolfScene,points:Point[],color:T.ColorRepresentation,y:number,parent:T.Object3D,hole?:Point,depth=6){
  const s=new T.Shape();points.forEach((p,i)=>i?s.lineTo(p.x,-p.y):s.moveTo(p.x,-p.y));s.closePath();
  if(hole){const well=new T.Path();well.absarc(hole.x,-hole.y,17,0,Math.PI*2,true);s.holes.push(well);}
  const g=new T.ExtrudeGeometry(s,{depth,bevelEnabled:false,curveSegments:24});g.rotateX(-Math.PI/2);
  return host.mesh(g,color,0,y-depth,0,parent);
}
export function rockIsland(host:GolfScene,points:Point[],parent:T.Object3D,depth=145){
  const cx=points.reduce((s,p)=>s+p.x,0)/points.length,cy=points.reduce((s,p)=>s+p.y,0)/points.length;
  const positions:number[]=[],colors:number[]=[],palette=[0x9d9f89,0x7d9286,0xa5aa91,0x82978a];
  const rings=[{scale:1,y:-5},{scale:1.01,y:-.25*depth},{scale:.86,y:-.66*depth},{scale:.2,y:-depth}];
  for(let r=0;r<rings.length-1;r++)for(let i=0;i<points.length;i++){
    const j=(i+1)%points.length,a=rings[r],b=rings[r+1];
    const v=(k:number,ring:typeof a)=>[cx+(points[k].x-cx)*ring.scale,ring.y,cy+(points[k].y-cy)*ring.scale];
    const aa=v(i,a),bb=v(j,a),cc=v(i,b),dd=v(j,b);
    positions.push(...aa,...cc,...bb,...bb,...cc,...dd);
    const c=new T.Color(palette[(i+r)%palette.length]);for(let k=0;k<6;k++)colors.push(c.r,c.g,c.b);
  }
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setAttribute('color',new T.Float32BufferAttribute(colors,3));g.computeVertexNormals();
  const mesh=host.mesh(g,0xffffff,0,0,0,parent);(mesh.material as T.MeshStandardMaterial).vertexColors=true;(mesh.material as T.MeshStandardMaterial).side=T.DoubleSide;
}
function scaled(points:Point[],scale:number){const x=points.reduce((s,p)=>s+p.x,0)/points.length,y=points.reduce((s,p)=>s+p.y,0)/points.length;return points.map(p=>({x:x+(p.x-x)*scale,y:y+(p.y-y)*scale}));}
export function seaIsland(host:GolfScene,points:Point[],parent:T.Object3D,hole?:Point,depth=145){
  rockIsland(host,points,parent,depth);
  surface(host,points,0xcabb8b,0,parent,hole,7);
  surface(host,scaled(points,.87),0xa2c786,.16,parent,hole,1);
  surface(host,scaled(points,.73),0xa8cd8b,.24,parent,hole,.5);
}
export function palm(host:GolfScene,x:number,z:number,parent:T.Object3D,scale=1){
  const tree=new T.Group();tree.position.set(x,0,z);tree.scale.setScalar(scale);parent.add(tree);
  const trunk=host.mesh(new T.CylinderGeometry(3.4,6,55,6),0xc1996c,0,27.5,0,tree);
  for(let i=0;i<5;i++){const leaf=new T.Group();leaf.position.set(0,54,0);leaf.rotation.y=i*Math.PI*2/5;tree.add(leaf);const blade=host.mesh(new T.ConeGeometry(9,38,3),i%2?0x75a47b:0x8ab883,0,-3,18,leaf);blade.rotation.x=Math.PI*.35;blade.scale.z=.25;}
  return trunk;
}
export function farmHouse(host:GolfScene,parent:T.Object3D,x:number,z:number,scale=1){
  const house=new T.Group();house.position.set(x,0,z);house.scale.setScalar(scale);parent.add(house);
  host.mesh(new T.CylinderGeometry(20,28,67,8),0xe9d4a5,0,33,0,house);
  host.mesh(new T.ConeGeometry(33,28,8),0xbd8163,0,80,0,house);
  host.box(13,22,2,0x75958a,0,14,26,2,house);
  host.box(11,12,2,0x8bb5b6,0,48,23,1,house);
  const blades=new T.Group();blades.position.set(0,66,30);house.add(blades);
  for(let i=0;i<4;i++){const arm=new T.Group();arm.rotation.z=i*Math.PI/2;blades.add(arm);host.box(7,56,4,0xd4a86d,0,27,0,1,arm);host.box(14,30,3,0xffe9b5,3,34,1,1,arm);}
  host.mesh(new T.CylinderGeometry(6,6,6,8),0xbb895a,0,66,33,house).rotation.x=Math.PI/2;
  return blades;
}
export class CourseLandscape {
  private mill?:T.Group;
  private water:T.Mesh[]=[];
  constructor(private host:GolfScene,private level:Level){
    if(level.rotor)this.mountain();
    if(level.platforms)this.ocean();
  }
  private mountain(){
    const h=this.host,p=h.root;
    const outline=[[-500,-240],[-440,-350],[-160,-365],[120,-345],[440,-350],[520,-240],[530,80],[500,290],[280,350],[-40,345],[-420,330],[-530,150]].map(([x,y])=>({x,y}));
    rockIsland(h,outline,p,140);surface(h,outline,0x9dbe7c,-9,p,undefined,7);
    // Slopes and wheat sit outside the original solid perimeter, never in a ball lane.
    for(const [x,z,r] of [[-470,-210,38],[-370,-315,35],[-50,-325,36],[410,-315,39],[480,180,36],[-440,280,27]]){
      const hill=h.mesh(new T.IcosahedronGeometry(r,1),0xa8c788,x,1,z,p);hill.scale.set(1.4,.45,1.2);
    }
    for(const [x,z,r] of [[-470,90,24],[490,-50,27],[-360,310,19],[260,310,20]])h.mesh(new T.DodecahedronGeometry(r),0xa6aa91,x,-4,z,p);
    for(const [x,z,r] of [[-390,-470,100],[-160,-485,125],[180,-470,105],[425,-450,80]]){
      const peak=h.mesh(new T.ConeGeometry(r,r*1.5,5),0xc5d6c2,x,r*.55-20,z,p);peak.scale.z=.65;peak.castShadow=false;
    }
    this.mill=farmHouse(h,p,185,-321,.85);
    for(const [cx,cz] of [[-300,-325],[-160,-328]]){
      h.box(105,2,38,0xc8ba7e,cx,1,cz,5,p);
      const wheat=new T.InstancedMesh(new T.CylinderGeometry(1.1,1.1,20,4),h.material(0xe2c77d),24),dummy=new T.Object3D();
      for(let i=0;i<24;i++){dummy.position.set(cx-44+(i%8)*12,13,cz-12+Math.floor(i/8)*12);dummy.rotation.z=(i%3-1)*.06;dummy.updateMatrix();wheat.setMatrixAt(i,dummy.matrix);}p.add(wheat);
      const ears=new T.InstancedMesh(new T.IcosahedronGeometry(3,0),h.material(0xefdb9c),24);
      for(let i=0;i<24;i++){dummy.position.set(cx-44+(i%8)*12,24,cz-12+Math.floor(i/8)*12);dummy.scale.set(.65,1.6,.7);dummy.updateMatrix();ears.setMatrixAt(i,dummy.matrix);}p.add(ears);
    }
    for(const x of [20,80,140]){h.box(5,28,5,0xb79166,x,14,-310,1,p);h.box(60,5,5,0xd3b284,x+30,21,-310,1,p);}
    for(const [x,y,z] of [[-250,160,-460],[330,155,-450]]){
      const cloud=h.mesh(new T.IcosahedronGeometry(25,2),0xe6ebd8,x,y,z,p);cloud.scale.set(2.5,.45,.8);cloud.castShadow=false;
    }
  }
  private ocean(){
    const h=this.host;
    const sea=h.mesh(new T.PlaneGeometry(12000,12000),0x65aab6,0,-255,0);sea.rotation.x=-Math.PI/2;sea.castShadow=false;sea.receiveShadow=false;
    for(const [i,p] of this.level.platforms!.entries()){
      const points=p.outline!.map(q=>({x:q.x-450,y:q.y-280}));
      const hole=i===1?{x:this.level.hole.x-450,y:this.level.hole.y-280}:undefined;
      seaIsland(h,points,h.root,hole,220);
      const c=document.createElement('canvas');c.width=c.height=64;const ctx=c.getContext('2d')!,gradient=ctx.createRadialGradient(32,32,2,32,32,32);gradient.addColorStop(0,'rgba(44,105,110,.24)');gradient.addColorStop(1,'rgba(44,105,110,0)');ctx.fillStyle=gradient;ctx.fillRect(0,0,64,64);
      const shade=new T.Mesh(new T.PlaneGeometry(p.w*1.5,p.h*1.35),new T.MeshBasicMaterial({map:new T.CanvasTexture(c),transparent:true,depthWrite:false}));shade.rotation.x=-Math.PI/2;shade.position.set(p.x+p.w/2-450,-254.4,p.y+p.h/2-280);h.root.add(shade);
      // Palms and shore rocks are built by CourseModels from real circle colliders.
      for(let j=0;j<3;j++){const s=points[(j+4)%points.length];const shell=h.mesh(new T.SphereGeometry(3,6,4),0xffefce,s.x,1,s.y);shell.scale.y=.35;}
    }
    for(let i=0;i<20;i++){
      const x=-650+(i%5)*320+(i%3)*31,z=-440+Math.floor(i/5)*260;
      const foam=h.mesh(new T.TorusGeometry(27+(i%4)*7,1.6,3,18,Math.PI*1.3),0xc6e5da,x,-253.7,z);foam.rotation.x=-Math.PI/2;foam.scale.y=.26;foam.castShadow=false;
      const m=foam.material as T.MeshStandardMaterial;m.transparent=true;m.opacity=.55;foam.userData.baseX=x;this.water.push(foam);
    }
  }
  update(time:number){
    if(this.mill)this.mill.rotation.z=-time*.35;
    this.water.forEach((w,i)=>{w.position.x=w.userData.baseX+Math.sin(time*.22+i)*5;(w.material as T.MeshStandardMaterial).opacity=.4+Math.sin(time*.4+i)*.16;});
  }
}

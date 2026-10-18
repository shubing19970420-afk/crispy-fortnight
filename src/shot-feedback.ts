import * as T from 'three';
import type { Ball } from './physics';
import type { Level } from './levels';

type Mark = {mesh:T.Mesh<T.BufferGeometry,T.MeshBasicMaterial>; age:number; life:number; size:number; velocity:T.Vector3};
// Fixed-size pools: feedback never accumulates objects during a shot.
export class ShotFeedback {
  readonly root=new T.Group();
  private trail:Mark[]=[];
  private rings:Mark[]=[];
  private sparks:Mark[]=[];
  private tint=0xfff3cf;
  private tintTime=0;
  constructor(parent:T.Group){
    parent.add(this.root);
    const create=(geometry:T.BufferGeometry):Mark=>{
      const mesh=new T.Mesh(geometry,new T.MeshBasicMaterial({color:0xfff3cf,transparent:true,opacity:0,depthWrite:false}));
      mesh.visible=false;this.root.add(mesh);
      return {mesh,age:1,life:0,size:1,velocity:new T.Vector3()};
    };
    const dot=new T.SphereGeometry(1,6,4),ring=new T.RingGeometry(.78,1,28);
    for(let i=0;i<16;i++)this.trail.push(create(dot));
    for(let i=0;i<10;i++){const m=create(ring);m.mesh.rotation.x=-Math.PI/2;this.rings.push(m);}
    for(let i=0;i<36;i++)this.sparks.push(create(dot));
  }
  private mark(pool:Mark[],x:number,y:number,height:number,color:number,life:number,size:number){
    const m=pool.find(p=>p.age>=p.life)??pool.reduce((a,b)=>a.age/a.life>b.age/b.life?a:b);
    m.age=0;m.life=life;m.size=size;m.velocity.set(0,0,0);m.mesh.position.set(x-450,height,y-280);
    m.mesh.material.color.setHex(color);m.mesh.material.opacity=1;m.mesh.visible=true;m.mesh.scale.setScalar(size);return m;
  }
  contact(b:Ball){
    const speed=Math.hypot(b.vx,b.vy),color=b.surface==='stone'?0xd8eee7:b.surface==='rubber'?0x92e8d5:0xffe3a3;
    // Position the spark on the struck side rather than inside the ball.
    const x=b.x-(speed?b.vx/speed:0)*8,y=b.y-(speed?b.vy/speed:0)*8;
    this.mark(this.rings,x,y,2,color,.23,5+Math.min(speed/80,7));
    for(let i=0;i<5;i++){
      const a=i*Math.PI*2/5+b.time*3,m=this.mark(this.sparks,x,y,5,color,.19+i*.015,1.4);
      m.velocity.set(Math.cos(a)*38,22+i*3,Math.sin(a)*38);
    }
  }
  teleport(level:Level,exitIndex:number){
    if(!level.portals)return;
    this.trail.forEach(m=>{m.age=m.life;m.mesh.visible=false;});
    level.portals.forEach((p,i)=>{
      const m=this.mark(this.rings,p.x,p.y,3,i===0?0x78e1eb:0xffb587,.38,i===exitIndex?20:29);
      m.velocity.x=i===exitIndex?1:-1;
    });
    this.tint=exitIndex===0?0x78e1eb:0xffb587;this.tintTime=.5;
  }
  update(b:Ball,dt:number){
    this.tintTime=Math.max(0,this.tintTime-dt);
    for(const m of this.trail){m.age+=dt;m.mesh.visible=m.age<m.life;m.mesh.material.opacity=Math.max(0,1-m.age/m.life)*.3;m.mesh.scale.setScalar(m.size*Math.max(.1,1-m.age/m.life));}
    if(b.state==='moving'&&Math.hypot(b.vx,b.vy)>200&&dt>0){this.mark(this.trail,b.x,b.y,8,this.tintTime?this.tint:0xfff3cf,.14,3.6);}
    for(const m of this.rings){m.age+=dt;const t=Math.min(1,m.age/m.life);m.mesh.visible=m.age<m.life;m.mesh.material.opacity=(1-t)*.65;m.mesh.scale.setScalar(m.size*(m.velocity.x===-1?1-.7*t:1+1.5*t));}
    for(const m of this.sparks){m.age+=dt;m.mesh.visible=m.age<m.life;if(m.mesh.visible){m.mesh.position.addScaledVector(m.velocity,dt);m.velocity.y-=110*dt;m.mesh.material.opacity=1-m.age/m.life;}}
  }
}

import * as T from 'three';
import type {GolfScene} from './scene';
import type {Level} from './levels';
/** Geometry dimensions are in physics units, on XZ; Y is presentation only. */
export class SpecialModels {
  private rotor?:T.Group;
  private rings:T.Mesh[]=[];
  constructor(private host:GolfScene,private level:Level){
    const h=host,l=level;
    if(l.rotor){const r=l.rotor;this.rotor=new T.Group();this.rotor.position.set(r.x-450,10,r.y-280);h.root.add(this.rotor);
      for(let i=0;i<r.arms;i++){const arm=new T.Group();arm.rotation.y=-i*2*Math.PI/r.arms;this.rotor.add(arm);const length=r.length-21;
        h.box(length,16,r.width,0xe8c886,21+length/2,0,0,2,arm);
        h.box(18,17,r.width+1,0xef9166,r.length-12,0,0,1,arm);
        for(let j=0;j<3;j++)h.box(3,1,r.width-4,0xbe925f,40+j*30,8.6,0,0,arm);
      }
      h.mesh(new T.CylinderGeometry(17,21,27,8),0xffe9ae,r.x-450,15,r.y-280);
      // The stump/hub already has an exact circle collider in level data.
      const arrow=h.mesh(new T.TorusGeometry(153,1.6,4,40,Math.PI*1.6),0xf3dfa8,r.x-450,.6,r.y-280);arrow.rotation.x=Math.PI/2;arrow.castShadow=false;
    }
    for(const [i,p] of (l.portals||[]).entries()){
      const color=i===0?0x66c5ce:0xef9166;
      const ring=h.mesh(new T.TorusGeometry(p.r,5,6,24),color,p.x-450,5,p.y-280);ring.rotation.x=Math.PI/2;this.rings.push(ring);
      const disc=h.mesh(new T.CylinderGeometry(p.r-5,p.r-5,1,24),i===0?0x347983:0xa45f46,p.x-450,.5,p.y-280);disc.castShadow=false;
      const marker=new T.Group();marker.position.set(p.x-450,1,p.y-280);marker.rotation.y=-p.angle;h.root.add(marker);
      h.box(7,7,p.r*2+28,0xffedb8,0,43,0,2,marker);
      const arrow=new T.Shape();arrow.moveTo(38,-5);arrow.lineTo(57,-5);arrow.lineTo(57,-12);arrow.lineTo(73,0);arrow.lineTo(57,12);arrow.lineTo(57,5);arrow.lineTo(38,5);arrow.closePath();
      const geo=new T.ShapeGeometry(arrow);geo.rotateX(-Math.PI/2);h.mesh(geo,color,0,.4,0,marker).castShadow=false;
    }
  }
  update(time:number){if(this.rotor)this.rotor.rotation.y=-(this.level.rotor!.phase+this.level.rotor!.omega*time);for(const ring of this.rings)ring.scale.setScalar(1+Math.sin(time*2)*.025);}
}

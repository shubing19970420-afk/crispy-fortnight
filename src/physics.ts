import {WIDTH,HEIGHT,type Level} from './levels';
export const R=9, DRAG=90, MAX_SPEED=780, STEP=1/240;
export type Ball={x:number;y:number;vx:number;vy:number;state:'ready'|'moving'|'won'|'lost';bounces:number};
export function createBall(l:Level):Ball{return {...l.start,vx:0,vy:0,state:'ready',bounces:0};}
export function shoot(b:Ball,dx:number,dy:number){if(b.state!=='ready')return;const d=Math.hypot(dx,dy);if(d<6)return;const v=Math.min(d/150,1)*MAX_SPEED;b.vx=dx/d*v;b.vy=dy/d*v;b.state='moving';}
export function step(b:Ball,l:Level,dt=STEP){
 if(b.state!=='moving')return;
 if(!Number.isFinite(b.x+b.y+b.vx+b.vy)||b.x<0||b.x>WIDTH||b.y<0||b.y>HEIGHT){b.state='lost';return;}
 b.x+=b.vx*dt;b.y+=b.vy*dt;
 const edge=28;
 if(b.x<edge+R){b.x=edge+R;b.vx=Math.abs(b.vx)*.88;b.bounces++;}
 if(b.x>WIDTH-edge-R){b.x=WIDTH-edge-R;b.vx=-Math.abs(b.vx)*.88;b.bounces++;}
 if(b.y<edge+R){b.y=edge+R;b.vy=Math.abs(b.vy)*.88;b.bounces++;}
 if(b.y>HEIGHT-edge-R){b.y=HEIGHT-edge-R;b.vy=-Math.abs(b.vy)*.88;b.bounces++;}
 for(const o of l.obstacles){
 const nx=Math.max(o.x,Math.min(b.x,o.x+o.w)),ny=Math.max(o.y,Math.min(b.y,o.y+o.h));
 let dx=b.x-nx,dy=b.y-ny,d=Math.hypot(dx,dy);
 if(d<R){if(d===0){const sides=[{d:b.x-o.x,x:-1,y:0},{d:o.x+o.w-b.x,x:1,y:0},{d:b.y-o.y,x:0,y:-1},{d:o.y+o.h-b.y,x:0,y:1}].sort((a,c)=>a.d-c.d);dx=sides[0].x;dy=sides[0].y;d=1;}else{dx/=d;dy/=d;}
 b.x+=dx*(R-d+.01);b.y+=dy*(R-d+.01);const dot=b.vx*dx+b.vy*dy;if(dot<0){b.vx-=1.88*dot*dx;b.vy-=1.88*dot*dy;b.bounces++;}}
 }
 const speed=Math.hypot(b.vx,b.vy);
 if(Math.hypot(b.x-l.hole.x,b.y-l.hole.y)<15&&speed<150){b.state='won';b.x=l.hole.x;b.y=l.hole.y;b.vx=b.vy=0;return;}
 const next=Math.max(0,speed-DRAG*dt);if(next<2){b.vx=b.vy=0;b.state='lost';}else{b.vx*=next/speed;b.vy*=next/speed;}
}

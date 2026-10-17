import { createBall, shoot, step, STEP, actorAt, R } from './physics';
import type { Level } from './levels';
export type Route = { angle:number; power:number; launchAt:number; seconds:number; bounces:number; contacts?:string[]; points:{x:number;y:number;breakBefore?:boolean}[] };
// Search real physics at the current deterministic patrol time; no geometry shortcuts.
export function simulateRoute(level:Level, time:number, angle:number, power:number, safeWindow=0):Route|null {
  const b=createBall(level); b.time=time;
  shoot(b,Math.cos(angle)*power,Math.sin(angle)*power);
  const points:Route["points"]=[{x:b.x,y:b.y}]; let bounce=0;
  for(let n=0;n<2400 && b.state==='moving';n++) {
    const old={x:b.x,y:b.y},transfers=b.teleports||0;
    step(b,level,STEP);
    if((b.teleports||0)!==transfers)points.push(old,{x:b.x,y:b.y,breakBefore:true});
    if(safeWindow && level.walker) {
      // Exact vertical envelope of the colleague over all possible release times.
      // A conservative extra 7 units covers motion between 240 Hz samples.
      const w=level.walker, a=b.time*2*Math.PI/w.period, z=(b.time+safeWindow)*2*Math.PI/w.period;
      const ys=[actorAt(level,b.time)!.y,actorAt(level,b.time+safeWindow)!.y];
      for(let k=Math.ceil((a-Math.PI/2)/Math.PI);Math.PI/2+k*Math.PI<=z;k++) ys.push(w.y+Math.sin(Math.PI/2+k*Math.PI)*w.amplitude);
      const lo=Math.min(...ys),hi=Math.max(...ys), y=Math.max(lo,Math.min(hi,b.y));
      if(Math.hypot(b.x-w.x,b.y-y)<R+w.r+7) return null;
    }
    if(n%6===0 || b.bounces!==bounce || b.state!=='moving') points.push({x:b.x,y:b.y});
    bounce=b.bounces;
  }
  return b.state==='won'?{angle,power,launchAt:time,seconds:b.time-time,bounces:b.bounces,contacts:[...b.hits],points}:null;
}
export function findOfficeRoute(level:Level,time:number):Route|null {
  // Known useful banks seed a neighbourhood search, but every result is replayed.
  const angles=[-.748,-.752,-.744,-.756,-.740,-.78,-.776,-.784,-.72,-.80,-.70,-.82];
  for(const power of [125,120,130,115,135,140]) for(const angle of angles) {
    const route=simulateRoute(level,time,angle,power,.6);
    // Require a stable release window, rather than an exact one-frame solution.
    if(route) return route;
  }
  return null;
}
/** New mechanism levels: replay candidates at real simulation time, and only
 * advertise a rotor shot if it succeeds throughout a 0.6-second release window. */
export function findRoute(level:Level,time:number):Route|null {
  if(level.walker)return findOfficeRoute(level,time);
  if(level.portals)return simulateRoute(level,time,0,70);
  if(!level.rotor)return null;
  const angles=[-.41,-.4,-.44,-.36,-.48,-.32,-1.23,-1.11,0,-.15,-.9,-.6,-.3,.15,.3,-1.4];
  for(const power of [95,100,105,90,110,80,120,130,140])for(const angle of angles){
    const route=simulateRoute(level,time,angle,power);
    if(!route||!route.contacts?.some(id=>id.startsWith("windmill-blade")))continue;
    let safe=true;for(let d=.025;d<=.60001;d+=.025)if(!simulateRoute(level,time+d,angle,power)){safe=false;break;}
    if(safe)return route;
  }
  return null;
}

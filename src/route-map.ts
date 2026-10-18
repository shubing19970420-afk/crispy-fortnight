import { WIDTH, HEIGHT, type Level } from './levels';
import { actorAt } from './physics';
import type { Route } from './route-hints';
// Read-only view of actual collision geometry and verified simulator points.
export function routeMap(level: Level, route: Route | null, time: number) {
  const actor = actorAt(level, time);
  const chunks:Route['points'][]=[];
  for(const p of route?.points||[]){if(!chunks.length||p.breakBefore)chunks.push([]);chunks.at(-1)!.push(p);}
  const path = route ? chunks.map(points=> `<polyline data-verified-route points="${points.map(p=>`${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' ')}" fill="none" stroke="#e6aa32" stroke-width="10" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="16 17"/>`).join('') : '';
  return `<svg viewBox="-14 -14 ${WIDTH+28} ${HEIGHT+28}" role="img" aria-label="${level.name}真实碰撞地图${route?'及已验证参考路线':'，等待验证路线'}"><rect width="${WIDTH}" height="${HEIGHT}" rx="22" fill="#fff0be" stroke="#cfb981" stroke-width="7"/>
  ${(level.platforms||[]).map(p=>p.outline?`<polygon points="${p.outline.map(v=>`${v.x},${v.y}`).join(' ')}" fill="#a9d578" stroke="#8e5d3c" stroke-width="5"/>`:`<rect x="${p.x}" y="${p.y}" width="${p.w}" height="${p.h}" fill="#a9d578" stroke="#8e5d3c" stroke-width="5"/>`).join('')}
  ${(level.portals||[]).map((p,i)=>`<circle cx="${p.x}" cy="${p.y}" r="${p.r}" fill="none" stroke="${i?'#ef9166':'#66c5ce'}" stroke-width="9"/>`).join('')}
  ${level.rotor?Array.from({length:level.rotor.arms},(_,i)=>{const r=level.rotor!,a=r.phase+r.omega*time+i*2*Math.PI/r.arms;return `<line x1="${r.x}" y1="${r.y}" x2="${r.x+Math.cos(a)*r.length}" y2="${r.y+Math.sin(a)*r.length}" stroke="#d5a16e" stroke-width="${r.width}"/>`}).join(''):''}
  ${(level.desks||[]).map(d=>`<rect x="${d.x}" y="${d.y}" width="${d.w}" height="${d.h}" rx="8" fill="#d5a16e" opacity=".17"/>`).join('')}
  ${level.obstacles.map(o=>`<rect data-collider="${o.id}" x="${o.x}" y="${o.y}" width="${o.w}" height="${o.h}" rx="2" fill="${o.model==='desk-leg'?'#a47950':'#6b9483'}" stroke="#355c4d" stroke-width="3"/>`).join('')}
  ${(level.circles||[]).map(c=>`<circle data-collider="${c.id}" cx="${c.x}" cy="${c.y}" r="${c.r}" fill="#83ad80" stroke="#355c4d" stroke-width="3"/>`).join('')}
  ${level.walker?`<path d="M${level.walker.x} ${level.walker.y-level.walker.amplitude}V${level.walker.y+level.walker.amplitude}" stroke="#db9770" stroke-width="5" stroke-dasharray="8 12"/>`:''}${path}
  ${actor?`<circle id="route-person" cx="${actor.x}" cy="${actor.y}" r="${level.walker!.r}" fill="#ef9166" stroke="#a8654b" stroke-width="4"/>`:''}
  <circle cx="${level.start.x}" cy="${level.start.y}" r="14" fill="#fffef2" stroke="#a9ae91" stroke-width="4"/>
  <circle cx="${level.hole.x}" cy="${level.hole.y}" r="17" fill="#355c4d"/><path d="M${level.hole.x} ${level.hole.y}v-65l44 14-44 16" fill="#ef9166" stroke="#fff9df" stroke-width="5"/></svg>`;
}

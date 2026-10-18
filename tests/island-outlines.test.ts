import assert from 'node:assert/strict';
import {levels} from '../src/levels';
import {platformContains,createBall,shoot,step} from '../src/physics';
const level=levels[4],pads=level.platforms!;
assert.equal(pads.length,2);
for(const p of pads){assert.ok(p.outline&&p.outline.length>=8);for(const v of p.outline)assert.equal(platformContains(p,v.x,v.y),false,'ball centre cannot stand on cliff lip');}
const area=(a:NonNullable<typeof pads[0]['outline']>)=>Math.abs(a.reduce((s,v,i)=>{const w=a[(i+1)%a.length];return s+v.x*w.y-w.x*v.y},0))/2;
assert.ok(area(pads[1].outline!)/area(pads[0].outline!)>1.1,'island sizes differ');
assert.ok(platformContains(pads[0],level.start.x,level.start.y));assert.ok(platformContains(pads[1],level.hole.x,level.hole.y));
for(const [i,p] of level.portals!.entries())assert.ok(platformContains(pads[i],p.x,p.y),'portal on real ground');
assert.equal(platformContains(pads[0],375,125),false,'old square corner is now a real cliff');
assert.equal(platformContains(pads[0],440,280),false,'gap remains water');
const b=createBall(level);shoot(b,70,0);for(let n=0;n<2000&&b.state==='moving';n++)step(b,level);assert.equal(b.state,'won');assert.equal(b.teleports,1);
console.log('PASS shared island outlines: different sizes, safe inset, irregular cliffs, ocean gap and unchanged portal solution');

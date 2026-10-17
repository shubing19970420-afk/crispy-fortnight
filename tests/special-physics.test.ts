import assert from 'node:assert/strict';
import {levels,type Level} from '../src/levels';
import {createBall,shoot,step,STEP,DRAG,R} from '../src/physics';
import {simulateRoute,findRoute} from '../src/route-hints';
import {routeMap} from '../src/route-map';
import {readScores} from '../src/records';
function run(l:Level,a:number,p:number,time=0){const b=createBall(l);b.time=time;shoot(b,Math.cos(a)*p,Math.sin(a)*p);for(let n=0;n<6000&&b.state==='moving';n++){step(b,l);assert.ok(Number.isFinite(b.x+b.y+b.vx+b.vy));assert.ok(Math.hypot(b.vx,b.vy)<=1000.001);assert.ok(b.x>=0&&b.x<=900&&b.y>=0&&b.y<=560);
if(b.state==='moving')for(const o of l.obstacles){const x=Math.max(o.x,Math.min(b.x,o.x+o.w)),y=Math.max(o.y,Math.min(b.y,o.y+o.h));assert.ok(Math.hypot(b.x-x,b.y-y)>=R-.03,`${o.id}: no static penetration`);}
if(l.rotor&&b.state==='moving'){const r=l.rotor;for(let arm=0;arm<r.arms;arm++){const a=r.phase+r.omega*b.time+arm*2*Math.PI/r.arms,c=Math.cos(a),s=Math.sin(a),rx=b.x-r.x,ry=b.y-r.y,x=c*rx+s*ry,y=-s*rx+c*ry;const d=Math.hypot(x-Math.max(21,Math.min(r.length,x)),y-Math.max(-r.width/2,Math.min(r.width/2,y)));assert.ok(d>=R-.03,'no blade penetration');}}
}assert.notEqual(b.state,'moving','simulation terminates');return b;}
const wind=levels[3],portal=levels[4];
const reference=run(wind,-.41,95);assert.equal(reference.state,'won');assert.ok(reference.hits.some(h=>h.startsWith('windmill-blade')));
for(let n=0;n<3;n++)assert.deepEqual(run(wind,-.41,95),reference,'retry restores phase exactly');
// Observe a full tolerant release window and neighbouring directions/powers.
for(let time=0;time<=.60001;time+=.01)assert.equal(run(wind,-.41,95,time).state,'won');
let neighbours=0;for(const a of [-.42,-.41,-.4,-.39,-.38])for(const p of [95,100,105])if(run(wind,a,p).state==='won')neighbours++;
assert.ok(neighbours>=6);assert.equal(run(wind,Math.atan2(wind.hole.y-wind.start.y,wind.hole.x-wind.start.x),100).state,'lost','direct route blocked');
assert.notEqual(run({...wind,rotor:undefined},-.41,95).state,'won','blade is genuinely the helper');
const route=findRoute(wind,0)!;assert.ok(route);assert.ok(simulateRoute(wind,.6,route.angle,route.power));
function bladeKick(omega:number){const l:Level={...levels[0],hole:{x:850,y:510},rotor:{x:450,y:280,length:135,width:20,arms:4,omega,phase:0}};const b=createBall(l);b.x=330;b.y=258;b.vx=0;b.vy=600;b.state='moving';for(let k=0;k<10&&!b.hits.length;k++)step(b,l);assert.ok(b.hits[0]?.startsWith('windmill-blade'));return b.vy;}
assert.ok(bladeKick(.5)<bladeKick(0)-40,'moving blade transfers relative surface velocity');
console.log(`PASS windmill: real helper required, exact retries, 61 release times, ${neighbours} neighbouring shots, relative-motion kick`);
const win=run(portal,0,70);assert.equal(win.state,'won');assert.equal(win.teleports,1);assert.equal(win.bounces,0);
for(const a of [-.06,-.03,0,.03,.06])for(const p of [65,70,75])assert.equal(run(portal,a,p).state,'won');
const b=createBall(portal);b.x=276;b.y=280;b.vx=600;b.vy=0;b.state='moving';step(b,portal);assert.equal(b.teleports,1);assert.ok(Math.abs(b.vx)<1e-8);assert.ok(Math.abs(b.vy-(600-DRAG*STEP))<1e-6,'portal preserves speed; only ordinary friction is deducted');assert.ok(b.y>183&&b.x===650);
for(let k=0;k<20;k++)step(b,portal);assert.equal(b.teleports,1,'no immediate teleport loop');
assert.equal(run(portal,Math.PI/2,80).state,'lost','gap/cliff fails rather than invisible bridge');
const r=findRoute(portal,10)!;assert.ok(r.points.some(p=>p.breakBefore));assert.equal((routeMap(portal,r,10).match(/data-verified-route/g)||[]).length,2,'no fake line across gap');
assert.deepEqual(readScores('{"0":2,"3":3.1,"4":1.8,"5":9}'),{'0':2,'3':3.1,'4':1.8});
console.log('PASS portals: 15 tolerant shots, exit orientation, speed preservation, no loop, cliff failure, segmented true route, five independent records');
let seed=89123;const random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/2**32);
for(const l of [wind,portal])for(let n=0;n<120;n++)run(l,random()*Math.PI*2,6+random()*144,random()*13);
console.log('PASS 240 deterministic new-mechanism stress shots: finite bounded motion and termination');

import assert from 'node:assert/strict';
import {levels} from '../src/levels';
import {createBall,shoot,step} from '../src/physics';
function run(i:number,dx:number,dy:number){const b=createBall(levels[i]);shoot(b,dx,dy);for(let n=0;n<5000&&b.state==='moving';n++)step(b,levels[i]);return b;}
const solutions:{dx:number;dy:number;bounces:number}[]=[];
for(let i=0;i<3;i++){
 let solution;
 outer:for(let angle=(i===0?0:-1.1);angle<=.01;angle+=.004){for(let power=50;power<=150;power+=.7){const dx=Math.cos(angle)*power,dy=Math.sin(angle)*power,b=run(i,dx,dy);if(b.state==='won'&&b.bounces===(i===0?0:1)){solution={dx,dy,bounces:b.bounces};break outer;}}}
 assert.ok(solution,`Level ${i+1} solvable`);solutions.push(solution!);console.log(`PASS level ${i+1} solution`,solution);
}
let b=createBall(levels[0]);shoot(b,0,0);assert.equal(b.state,'ready');shoot(b,100,0);const vx=b.vx;shoot(b,0,100);assert.equal(b.vx,vx);console.log('PASS zero drag and one-shot lock');
assert.equal(run(0,8,0).state,'lost');assert.equal(run(0,150,0).state,'lost');console.log('PASS stopped outside and fast hole pass fail');
b=createBall(levels[0]);shoot(b,100,0);b.x=-1;step(b,levels[0]);assert.equal(b.state,'lost');console.log('PASS out of bounds');
b=createBall(levels[1]);b.x=400;b.y=300;b.vx=300;b.state='moving';for(let n=0;n<20;n++)step(b,levels[1]);assert.ok(b.vx<0);console.log('PASS obstacle reflection');
b=createBall(levels[0]);b.x=650;b.y=280;b.vx=200;b.state='moving';step(b,levels[0]);assert.equal(b.state,'moving');b.vx=100;step(b,levels[0]);assert.equal(b.state,'won');console.log('PASS slow capture only');
assert.equal(createBall(levels[0]).state,'ready');console.log('PASS fresh retry');
await import('node:fs/promises').then(fs=>fs.writeFile('/tmp/golf-solutions.json',JSON.stringify(solutions)));

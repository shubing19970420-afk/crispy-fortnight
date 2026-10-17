import assert from 'node:assert/strict';
import { findOfficeRoute,simulateRoute } from '../src/route-hints';
import { victory,readScores } from '../src/records';
import { levels } from '../src/levels';
assert.equal(victory(1.234,undefined).kind,'first');
assert.equal(victory(1.234,1.23).kind,'success');
assert.equal(victory(1.22,1.23).kind,'record');
assert.equal(victory(1.25,1.23).best,1.23);
for(const raw of ['null','[]','[1,2,3]','broken','{"0":-2,"1":"fast","2":null}']) assert.deepEqual(readScores(raw),{});
assert.deepEqual(readScores('{"0":1.5,"2":2.5,"3":99}'),{'0':1.5,'2':2.5,'3':99});
let successes=0,waits=0;
for(let time=0;time<8;time+=.25) {
  const route=findOfficeRoute(levels[2],time);
  if(!route){waits++;continue;}
  successes++;
  assert.ok(route.bounces>=1,'reference must include a real bank');
  assert.ok(route.points.length>5);
  for(const offset of [0,.15,.3,.45,.6]) assert.ok(simulateRoute(levels[2],time+offset,route.angle,route.power),'entire displayed release window must win');
}
assert.ok(successes>=20); assert.ok(waits>0);
const blocked={...levels[2],hole:{x:470,y:380}};
assert.equal(findOfficeRoute(blocked,0),null,'never fabricate an unverified route inside a cabinet');
console.log(`PASS score classification/storage corruption; ${successes}/32 patrol phases with verified bank routes, ${waits} honestly wait; blocked layout yields no hint`);

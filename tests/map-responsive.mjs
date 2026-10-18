import {chromium} from '@playwright/test';import assert from 'node:assert/strict';
const b=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox','--enable-unsafe-swiftshader']});const p=await b.newPage();const errors=[];p.on('pageerror',e=>errors.push(e.message));
try{await p.goto('http://localhost:5173');await p.waitForFunction(()=>!!window.golfDebug);await p.evaluate(()=>document.fonts.ready);
for(const [width,height,name] of [[1440,960,'desktop'],[844,390,'landscape'],[700,600,'narrow'],[650,600,'boundary'],[390,844,'mobile'],[320,640,'small']]){
 await p.setViewportSize({width,height});await p.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
 const a=await p.locator('[data-level]').evaluateAll(es=>es.map(e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,right:r.right,bottom:r.bottom}}));
 for(let i=0;i<a.length;i++){assert.ok(a[i].x>=0&&a[i].right<=width+1,`${name}: within width`);if(i)assert.ok(width>=650?a[i].x>a[i-1].x:a[i].y>a[i-1].y,`${name}: sequence`);for(let j=i+1;j<a.length;j++)assert.ok(Math.min(a[i].right,a[j].right)-Math.max(a[i].x,a[j].x)<=2||Math.min(a[i].bottom,a[j].bottom)-Math.max(a[i].y,a[j].y)<=2,`${name}: no overlap`)}
 await p.locator('#viewport').evaluate(e=>e.scrollTop=0);await p.screenshot({path:`docs/screenshots/art-menu-${name}.png`});if(width<650){await p.locator('#viewport').evaluate(e=>e.scrollTop=e.scrollHeight);await p.screenshot({path:`docs/screenshots/art-menu-${name}-bottom.png`});}
 console.log('PASS map',name,width,height)
}assert.deepEqual(errors,[])}finally{await b.close()}

import {chromium} from '@playwright/test';import assert from 'node:assert/strict';
const b=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox','--enable-unsafe-swiftshader']});const p=await b.newPage({viewport:{width:390,height:844},hasTouch:true});
try{
 await p.addInitScript(()=>localStorage.setItem('golf-progress-v4','[0,1,2]'));
 await p.goto('http://localhost:5173');await p.waitForFunction(()=>!!window.golfDebug);await p.evaluate(()=>document.fonts.ready);
 const c=await p.context().newCDPSession(p);await c.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:35,y:690,id:1}]});
 for(const y of [650,590,530,470,410]){await c.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:35,y,id:1}]});await p.waitForTimeout(45)}
 await c.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await c.detach();
 await p.waitForFunction(()=>document.querySelector('#viewport').scrollTop>100);assert.ok(await p.locator('#menu').isVisible(),'scroll gesture never enters an island');
 await p.waitForTimeout(400);await p.locator('[data-level="3"]').scrollIntoViewIfNeeded();await p.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
 const scroll=await p.locator('#viewport').evaluate(e=>e.scrollTop),q=await p.evaluate(()=>window.golfDebug.island(3));await p.touchscreen.tap(q.x,q.y);await p.locator('#game').waitFor({state:'visible'});assert.equal(await p.locator('#title').textContent(),'风车捣蛋鬼');
 await p.locator('#home').click();await p.waitForFunction(s=>Math.abs(document.querySelector('#viewport').scrollTop-s)<2,scroll);console.log('PASS real touch: swipe scroll without accidental entry, island tap and map scroll restored after return');
}finally{await b.close()}

import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox','--enable-unsafe-swiftshader']});
const page=await browser.newPage({viewport:{width:1440,height:960}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
try{
 await page.goto(process.env.GOLF_URL||'http://127.0.0.1:5173');await page.waitForFunction(()=>window.golfDebug?.menu());
 const scores='{"0":1.75,"1":4.2}',progress='[0,1,2]';
 await page.evaluate(({scores,progress})=>{localStorage.setItem('golf-best-v4',scores);localStorage.setItem('golf-progress-v4',progress);localStorage.setItem('golf-tutorial','seen');},{scores,progress});
 await page.reload();await page.waitForFunction(()=>window.golfDebug?.menu());
 assert.deepEqual(await page.locator('.medal-rack').evaluateAll(a=>a.map(e=>e.querySelectorAll('.earned').length)),[3,2,1]);
 assert.equal(await page.evaluate(()=>localStorage.getItem('golf-best-v4')),scores);assert.equal(await page.evaluate(()=>localStorage.getItem('golf-progress-v4')),progress);
 await fs.mkdir('docs/screenshots',{recursive:true});await page.evaluate(()=>document.fonts.ready);
 await page.screenshot({path:'docs/screenshots/ui-kit-records.png'});
 // Fresh-save capture, distinct from the labelled record fixture above.
 await page.evaluate(()=>{localStorage.removeItem('golf-best-v4');localStorage.removeItem('golf-progress-v4');});await page.reload();await page.waitForFunction(()=>window.golfDebug?.menu());
 assert.equal(await page.locator('.medal-star.earned').count(),0);
 for(const [width,height,name] of [[1440,960,'desktop'],[390,844,'mobile'],[320,640,'small']]){
  await page.setViewportSize({width,height});await page.waitForTimeout(300);await page.evaluate(()=>document.fonts.ready);
  for(const sign of await page.locator('.map-label').all()){const r=await sign.boundingBox();assert.ok(r.x>=0&&r.x+r.width<=width+1);assert.ok(await sign.locator('strong').evaluate(e=>e.scrollWidth<=e.clientWidth+1));}
  await page.screenshot({path:`docs/screenshots/ui-kit-menu-${name}.png`});
  await page.locator('#start').click();await page.locator('#game').waitFor({state:'visible'});if(await page.locator('#tutorial-close').isVisible())await page.locator('#tutorial-close').click();
  await page.waitForTimeout(250);await page.screenshot({path:`docs/screenshots/ui-kit-level1-${name}.png`});
  assert.equal(await page.locator('.power-segment').count(),10);
  const a=await page.evaluate(()=>{const s=window.golfDebug.state();return window.golfDebug.project(s.x,s.y)});await page.mouse.move(a.x,a.y);await page.mouse.down();
  const b=await page.evaluate(()=>{const s=window.golfDebug.state();return window.golfDebug.project(s.x-65,s.y)});await page.mouse.move(b.x,b.y);
  assert.ok(Number((await page.locator('#percent').textContent()).replace('%',''))>20);await page.mouse.up();assert.equal(await page.evaluate(()=>window.golfDebug.state().state),'moving');
  await page.locator('#retry').click();assert.equal(await page.evaluate(()=>window.golfDebug.state().state),'ready');
  await page.locator('#home').click();await page.locator('[data-level="2"]').click();await page.locator('#game').waitFor({state:'visible'});
  const title=await page.locator('.level-title').boundingBox(),tools=await page.locator('.header-tools').boundingBox();assert.ok(title.x+title.width<=tools.x);assert.ok(await page.locator('#title').evaluate(e=>e.scrollWidth<=e.clientWidth+1));
  await page.locator('#sound').click();assert.equal(await page.locator('#sound').getAttribute('aria-pressed'),'false');await page.locator('#sound').click();
  await page.locator('#settings-open').click();assert.equal(await page.locator('#settings').evaluate(e=>e.open),true);await page.locator('#settings-close').click();
  await page.waitForTimeout(150);await page.screenshot({path:`docs/screenshots/ui-kit-level3-${name}.png`});
  await page.locator('#home').click();assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 }
 // A moving, focused start button used to scroll the overflow:hidden app.
 // Reproduce a real win, return, then resize; never mutate ball state.
 await page.setViewportSize({width:1440,height:960});await page.locator('#start').click();await page.locator('#game').waitFor({state:'visible'});
 const [start,end]=await page.evaluate(()=>{const s=window.golfDebug.state();return [window.golfDebug.project(s.x,s.y),window.golfDebug.project(s.x-65,s.y)]});
 await page.mouse.move(start.x,start.y);await page.mouse.down();await page.mouse.move(end.x,end.y);await page.mouse.up();await page.locator('#result').waitFor({state:'visible',timeout:40000});assert.equal(await page.evaluate(()=>window.golfDebug.state().state),'won');await page.locator('#result-menu').click();
 assert.equal(await page.locator('[data-level="0"] .medal-star.earned').count(),3);
 for(const [width,height,name] of [[1440,960,'desktop'],[390,844,'mobile']]){await page.setViewportSize({width,height});await page.mouse.move(width/2,110);await page.waitForTimeout(300);assert.equal(await page.locator('#app').evaluate(e=>e.scrollLeft),0,'focused moving props cannot scroll the game');assert.equal(await page.evaluate(()=>scrollX),0);await page.screenshot({path:`docs/screenshots/ui-kit-menu-cleared-${name}.png`});}
 assert.deepEqual(errors,[]);console.log('PASS UI kit: record-derived medals/no save mutation, 3 layouts, real start/shot/power/retry/home, all level labels, solid sound/settings controls, no browser errors');
}catch(e){await page.screenshot({path:'test-results/ui-kit-failure.png'});throw e;}finally{await browser.close();}

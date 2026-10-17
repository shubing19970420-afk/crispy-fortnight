import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox','--enable-unsafe-swiftshader']});
const page=await browser.newPage({viewport:{width:1440,height:960}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
try {
 await page.goto(process.env.GOLF_URL||'http://127.0.0.1:5173');await page.waitForFunction(()=>window.golfDebug?.menu());await page.evaluate(()=>document.fonts.ready);
 await fs.mkdir('docs/screenshots',{recursive:true});
 await page.evaluate(()=>{localStorage.setItem('golf-tutorial','seen');localStorage.setItem('golf-best-v4','{"0":1.75,"2":1.58}');});
 await page.reload();await page.waitForFunction(()=>window.golfDebug?.menu());
 await page.locator('#settings-open').click();assert.equal(await page.locator('#settings-music').getAttribute('aria-checked'),'false');
 await page.locator('#settings-music').click();await page.waitForFunction(()=>window.golfDebug.music().playing);assert.equal(await page.evaluate(()=>localStorage.getItem('golf-music')),'on');
 await page.locator('#settings-sound').click();assert.equal(await page.locator('#sound').getAttribute('aria-pressed'),'false');
 await page.locator('#instructions-toggle').click();assert.equal(await page.locator('#instructions').isVisible(),true);await page.locator('#instructions-toggle').click();
 await page.keyboard.press('Shift+Tab');assert.ok(await page.evaluate(()=>document.querySelector('#settings').contains(document.activeElement)));
 await page.waitForTimeout(250);await page.screenshot({path:'docs/screenshots/stage-b-settings-desktop.png'});
 await page.keyboard.press('Escape');assert.equal(await page.locator('#settings').evaluate(e=>e.open),false);
 await page.reload();await page.waitForFunction(()=>window.golfDebug?.menu());await page.locator('#settings-open').click();await page.waitForFunction(()=>window.golfDebug.music().playing);assert.equal(await page.locator('#settings-music').getAttribute('aria-checked'),'true');await page.locator('#settings-music').click();assert.equal(await page.evaluate(()=>window.golfDebug.music().playing),false);await page.locator('#settings-close').click();
 async function enter(i){await page.locator(`[data-level="${i}"]`).click();await page.locator('#game').waitFor({state:'visible'});if(await page.locator('#tutorial-close').isVisible())await page.locator('#tutorial-close').click();}
 for(const i of [0,1]){await enter(i);assert.equal(await page.locator('#route-drawer').isVisible(),false);await page.locator('#home').click();}
 await enter(2);assert.equal(await page.locator('#route-drawer').textContent(),'');
 await page.locator('#settings-open').click();const t=await page.evaluate(()=>window.golfDebug.state().time);await page.waitForTimeout(400);assert.equal(await page.evaluate(()=>window.golfDebug.state().time),t);await page.locator('#settings-done').click();
 for(const [width,height,name] of [[1440,960,'desktop'],[390,844,'mobile'],[320,640,'small'],[844,390,'landscape']]){
  await page.setViewportSize({width,height});await page.waitForTimeout(400);
  const before=await page.evaluate(()=>window.golfDebug.project(100,430));
  await page.screenshot({path:`docs/screenshots/stage-b-bulb-${name}.png`});
  await page.locator('#route-drawer').click();await page.waitForFunction(()=>window.golfDebug.hint(),{},{timeout:40000});await page.waitForTimeout(100);
  const after=await page.evaluate(()=>window.golfDebug.project(100,430));assert.ok(Math.abs(before.x-after.x)<.01&&Math.abs(before.y-after.y)<.01,'opening map never refits camera');
  assert.ok(await page.locator('[data-collider]').count()>10,'actual office geometry is present');
  await page.waitForFunction(()=>{const h=window.golfDebug.hint(),n=document.querySelector('[data-verified-route]')?.points.numberOfItems||0;return h&&n>5&&n===h.points},{},{timeout:40000}); // Read transient live route and graphic together; stale paths are intentionally removed.
  const r=await page.locator('#route-content').boundingBox();assert.ok(r.x>=0&&r.x+r.width<=width+1&&r.y>=0&&r.y+r.height<=height,`${name} board fits`);
  for(const [x,y] of [[100,430],[785,250]]){const p=await page.evaluate(({x,y})=>window.golfDebug.project(x,y),{x,y});assert.ok(!(p.x>=r.x&&p.x<=r.x+r.width&&p.y>=r.y&&p.y<=r.y+r.height),`${name} board avoids ball/hole`);}
  await page.screenshot({path:`docs/screenshots/stage-b-route-${name}.png`});
  await page.locator('#route-map').click();assert.equal(await page.locator('#route-content').isVisible(),false);assert.equal(await page.evaluate(()=>window.golfDebug.hint()),null);
  await page.locator('#route-drawer').click();await page.locator('#route-content').focus();await page.keyboard.press('Escape');assert.equal(await page.locator('#route-content').isVisible(),false);
  await page.locator('#settings-open').click();assert.ok(await page.locator('#settings').evaluate(e=>e.scrollWidth<=e.clientWidth+1));const done=await page.locator('#settings-done').boundingBox();assert.ok(done.y+done.height<=height,`${name} settings return button fits`);await page.screenshot({path:`docs/screenshots/stage-b-settings-${name}.png`});await page.locator('#settings-close').click();
 }
 await page.setViewportSize({width:1440,height:960});await page.locator('#route-drawer').click();await page.waitForFunction(()=>window.golfDebug.hint(),{},{timeout:40000});
 const a=await page.evaluate(()=>{const s=window.golfDebug.state();return window.golfDebug.project(s.x,s.y)});await page.mouse.move(a.x,a.y);await page.mouse.down();
 await page.waitForFunction(()=>{const h=window.golfDebug.hint();return h&&window.golfDebug.state().time-h.launchAt<.1},{},{timeout:40000});
 const {h,b}=await page.evaluate(()=>{const h=window.golfDebug.hint(),s=window.golfDebug.state();return {h,b:window.golfDebug.project(s.x-Math.cos(h.angle)*h.power,s.y-Math.sin(h.angle)*h.power)}});
 await page.mouse.move(b.x,b.y);await page.mouse.up();assert.ok(await page.evaluate(h=>window.golfDebug.state().shotAt-h.launchAt<=.6,h));await page.locator('#result').waitFor({state:'visible',timeout:40000});assert.equal(await page.evaluate(()=>window.golfDebug.state().state),'won');
 assert.deepEqual(errors,[]);console.log('PASS stage B: genuine music and persistence, sound, native settings/focus/pause, instructions, no lamp in first two levels, 4 layouts, unchanged camera, actual geometry/verified route, close/reopen and real hinted shot wins');
} catch(e){await page.screenshot({path:'test-results/stage-b-failure.png'});throw e;} finally {await browser.close();}

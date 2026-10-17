import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox','--enable-unsafe-swiftshader']});
try {
 const page=await browser.newPage({viewport:{width:1440,height:960}});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const url=process.env.GOLF_URL||'http://127.0.0.1:5173';
 await page.goto(url);await page.waitForFunction(()=>window.golfDebug?.menu());
 await page.evaluate(()=>{localStorage.setItem('golf-tutorial','seen');localStorage.setItem('golf-best-v4','{"0":1.75,"2":1.58}');});
 await page.reload();await page.waitForFunction(()=>window.golfDebug?.menu());await page.evaluate(()=>document.fonts.ready);
 await fs.mkdir('docs/screenshots',{recursive:true});
 await page.screenshot({path:'docs/screenshots/menu.png'});
 await page.locator('[data-level="1"]').hover();await page.waitForTimeout(500);
 await page.screenshot({path:'docs/screenshots/toy-selection.png'});
 await page.locator('#settings-open').click();assert.equal(await page.locator('#settings').evaluate(e=>e.open),true);
 assert.ok(await page.evaluate(()=>document.querySelector('#settings').contains(document.activeElement)));
 await page.keyboard.press('Shift+Tab');assert.ok(await page.evaluate(()=>document.querySelector('#settings').contains(document.activeElement)));
 await page.screenshot({path:'docs/screenshots/toy-settings.png'});
 await page.locator('#settings-sound').click();assert.equal(await page.locator('#sound').getAttribute('aria-pressed'),'false');
 await page.locator('#settings-music').click();assert.equal(await page.locator('#settings-music').getAttribute('aria-checked'),'true');
 await page.keyboard.press('Escape');assert.equal(await page.locator('#settings').evaluate(e=>e.open),false);
 await page.locator('[data-level="2"]').click();await page.locator('#game').waitFor({state:'visible'});
 await page.waitForFunction(()=>!window.golfDebug.menu());
 assert.equal(await page.locator('#route-content').isVisible(),false);
 await page.screenshot({path:'docs/screenshots/toy-hud.png'});
 await page.locator('#settings-open').click();
 const clock=await page.evaluate(()=>window.golfDebug.state().time);await page.waitForTimeout(600);
 assert.equal(await page.evaluate(()=>window.golfDebug.state().time),clock,'settings pause the deterministic patrol clock');
 await page.keyboard.press('r');assert.equal(await page.evaluate(()=>window.golfDebug.state().time),clock,'R must not reset a level while editing settings');
 await page.locator('#settings-done').click();await page.waitForTimeout(200);
 assert.ok(await page.evaluate(t=>window.golfDebug.state().time>t,clock),'clock resumes');
 await page.locator('#route-drawer').click();await page.waitForFunction(()=>window.golfDebug.hint(),{},{timeout:40000});
 await page.waitForTimeout(400);
 async function clearPaths(){
  const r=await page.locator('#route-content').boundingBox();
  for(const [x,y] of [[100,430],[785,250]]){
   const p=await page.evaluate(({x,y})=>window.golfDebug.project(x,y),{x,y});
   assert.ok(!(p.x>=r.x&&p.x<=r.x+r.width&&p.y>=r.y&&p.y<=r.y+r.height),'drawer must not cover ball or hole');
  }
  // Stage B uses a fixed edge prop; stage-b.mjs separately asserts no camera refit.
 }
 await clearPaths();await page.screenshot({path:'docs/screenshots/toy-route.png'});
 await page.locator('#route-drawer').click();assert.equal(await page.evaluate(()=>window.golfDebug.hint()),null);
 await page.locator('#route-drawer').click();await page.waitForFunction(()=>window.golfDebug.hint(),{},{timeout:40000});
 await page.setViewportSize({width:390,height:844});await page.waitForTimeout(500);await clearPaths();
 await page.screenshot({path:'docs/screenshots/toy-route-mobile.png'});
 await page.locator('#route-drawer').click();await page.waitForTimeout(300);
 await page.screenshot({path:'docs/screenshots/toy-hud-mobile.png'});
 await page.locator('#settings-open').click();await page.screenshot({path:'docs/screenshots/toy-settings-mobile.png'});await page.locator('#settings-close').click();
 await page.locator('#home').click();await page.waitForFunction(()=>window.golfDebug.menu());await page.waitForTimeout(300);
 await page.screenshot({path:'docs/screenshots/menu-mobile.png'});
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 await page.reload();await page.waitForFunction(()=>window.golfDebug?.menu());
 assert.equal(await page.locator('#sound').getAttribute('aria-pressed'),'false');
 assert.equal(await page.evaluate(()=>localStorage.getItem('golf-best-v4')),'{"0":1.75,"2":1.58}');
 assert.deepEqual(errors,[]);
 console.log('PASS toy UI: settings focus/Escape, sound persistence, unchanged best records, paused/resumed patrol, default folded drawer, real route validation, safe desktop/mobile HUD, no browser errors');
} finally {await browser.close();}

import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox','--enable-unsafe-swiftshader']});
try {
 const page=await browser.newPage({viewport:{width:1440,height:960}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(process.env.GOLF_URL||'http://127.0.0.1:5173');await page.waitForFunction(()=>window.golfDebug?.menu());await page.evaluate(()=>document.fonts.ready);
 await fs.mkdir('docs/screenshots',{recursive:true});
 for(let i=0;i<3;i++){
  const sign=page.locator(`[data-level="${i}"]`);
  assert.equal(await sign.locator('.difficulty svg').count(),i+1);
  assert.equal(await sign.locator('.difficulty').getAttribute('aria-label'),`难度 ${i+1} 星`);
  assert.equal(await sign.locator('.level-number').textContent(),`0${i+1}`);
 }
 await page.evaluate(()=>localStorage.setItem('golf-progress-v4','[0,1,2]'));await page.reload();await page.waitForFunction(()=>window.golfDebug?.menu());await page.evaluate(()=>document.fonts.ready);
 assert.deepEqual(await page.locator('.difficulty').evaluateAll(a=>a.map(e=>e.querySelectorAll('svg').length)),[1,2,3]);
 assert.deepEqual(await page.locator('.progress').allTextContents(),['✓','✓','✓']);
 assert.equal(await page.locator('#menu-assist').isVisible(),false);
 await page.evaluate(()=>localStorage.setItem('golf-progress-v4','[]'));await page.reload();await page.waitForFunction(()=>window.golfDebug?.menu());await page.evaluate(()=>document.fonts.ready);
 for(const [width,height,name] of [[1440,960,'desktop'],[390,844,'mobile'],[320,640,'small'],[844,390,'landscape']]){
  await page.setViewportSize({width,height});await page.waitForTimeout(300);
  for(const b of await page.locator('.map-label').all()){
   const r=await b.boundingBox();assert.ok(r.x>=0&&r.x+r.width<=width,`${name} sign in viewport`);
   assert.ok(await b.locator('strong').evaluate(e=>e.scrollWidth<=e.clientWidth+1),`${name} title fits`);
  }
  await page.screenshot({path:`docs/screenshots/stage-a-menu-${name}.png`});
  await page.locator('[data-level="2"]').click();await page.locator('#game').waitFor({state:'visible'});await page.waitForTimeout(600);
  if(await page.locator('#tutorial-close').isVisible())await page.locator('#tutorial-close').click();
  assert.equal(await page.locator('#back').isVisible(),false);
  const title=await page.locator('.level-title').boundingBox(),tools=await page.locator('.header-tools').boundingBox();
  assert.ok(title.x+title.width<=tools.x,`${name} HUD title avoids tool buttons`);
  assert.ok(await page.locator('#title').evaluate(e=>e.scrollWidth<=e.clientWidth+1),`${name} HUD title fits`);
  await page.locator('#sound').hover();await page.mouse.move(width/2,120);await page.waitForTimeout(350);
  await page.screenshot({path:`docs/screenshots/stage-a-office-${name}.png`});
  await page.locator('#sound').click();assert.equal(await page.locator('#sound').getAttribute('aria-pressed'),'false');await page.locator('#sound').click();
  if(name==='desktop'){
   const [a,b]=await page.evaluate(()=>{const s=window.golfDebug.state();return [window.golfDebug.project(s.x,s.y),window.golfDebug.project(s.x-70,s.y+35)]});
   await page.mouse.move(a.x,a.y);await page.mouse.down();await page.mouse.move(b.x,b.y,{steps:4});
   const percent=Number((await page.locator('#percent').textContent()).replace('%',''));
   assert.ok(percent>10&&percent<100);const ratio=await page.locator('.meter').evaluate(e=>Number(e.style.getPropertyValue('--power')));assert.ok(Math.abs(ratio*100-percent)<1);
   await page.screenshot({path:'docs/screenshots/stage-a-aim.png'});
   await page.mouse.up();assert.equal(await page.evaluate(()=>window.golfDebug.state().state),'moving');await page.locator('#retry').click();assert.equal(await page.evaluate(()=>window.golfDebug.state().state),'ready');
  }
  await page.locator('#home').click();await page.waitForFunction(()=>window.golfDebug.menu());
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`${name} no horizontal overflow`);
 }
 assert.deepEqual(errors,[]);console.log('PASS stage A: fixed difficulty stars independent of completion, number chips, 4 viewports, HUD separation, sound toggle, real drag/power pointer, retry/home and actual screenshots');
}finally{await browser.close();}

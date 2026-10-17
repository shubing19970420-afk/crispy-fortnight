import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox','--enable-unsafe-swiftshader']});
const page=await browser.newPage({viewport:{width:1440,height:960}});
const errors=[];page.on('pageerror',e=>errors.push(e.message));
const url=process.env.GOLF_URL||'http://127.0.0.1:5173';
try {
 await page.goto(url);await page.waitForFunction(()=>window.golfDebug?.menu());
 await page.evaluate(async()=>{await Promise.all([document.fonts.load('24px "Maoken Assorted Sans"',"一杆归洞0123456789"),document.fonts.load("24px HuangYou","一杆归洞")]);await document.fonts.ready;});
 assert.ok(await page.evaluate(()=>document.fonts.check('24px "Maoken Assorted Sans"')&&document.fonts.check('24px HuangYou')));
 await page.locator('#settings-open').click();await page.locator('#settings-music').click();assert.equal(await page.locator('#settings-music').getAttribute('aria-checked'),'true');await page.locator('#settings-music').click();assert.equal(await page.locator('#settings-music').getAttribute('aria-checked'),'false');await page.locator('#settings-close').click();
 await fs.mkdir('test-results',{recursive:true});
 await page.screenshot({path:'test-results/menu-fonts.png'});
 async function enter(i){await page.locator(`[data-level="${i}"]`).click();await page.locator('#game').waitFor({state:'visible'});await page.waitForFunction(()=>!window.golfDebug.menu());}
 async function openHints(){if(!await page.locator("#route-content").isVisible()) await page.locator("#route-drawer").click();}
 async function toggleHints(){await page.locator('#route-drawer').click();}
 async function shot(dx,dy){const [a,b]=await page.evaluate(({dx,dy})=>{const s=window.golfDebug.state();return [window.golfDebug.project(s.x,s.y),window.golfDebug.project(s.x-dx,s.y-dy)]},{dx,dy});await page.mouse.move(a.x,a.y);await page.mouse.down();await page.mouse.move(b.x,b.y,{steps:4});await page.mouse.up();}
 await enter(0);await shot(65,0);
 await page.locator('#result').waitFor({state:'visible',timeout:40000});
 assert.equal(await page.locator('#result-label').textContent(),'首次通关！');
 assert.equal(await page.locator('#result-title').textContent(),'一杆归洞！');
 await page.waitForFunction(()=>document.querySelector('#score-time').textContent!=='0.00 秒');
 await page.screenshot({path:'test-results/victory-banner.png'});
 const original=await page.evaluate(()=>JSON.parse(localStorage.getItem('golf-best-v4'))['0']);
 await page.locator('#retry-result').click();await shot(65,0);await page.locator('#result').waitFor({state:'visible',timeout:40000});
 assert.equal(await page.locator('#result-label').textContent(),'挑战成功！');
 assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('golf-best-v4'))['0']),original);
 await page.evaluate(()=>localStorage.setItem('golf-best-v4','{"0":99}'));await page.reload();await page.waitForFunction(()=>window.golfDebug?.menu());await enter(0);await shot(65,0);await page.locator('#result').waitFor({state:'visible',timeout:40000});
 assert.equal(await page.locator('#result-label').textContent(),'NEW RECORD！新纪录！');
 assert.ok(await page.locator('#result').evaluate(e=>e.classList.contains('new-record')));
 await page.locator('#result-menu').click();assert.equal(await page.locator('[data-level="0"] .medal-star.earned').count(),3,'actual saved victory updates menu medals');await enter(2);
 for(let n=0;n<3;n++){await shot(7,0);await page.locator('#result').waitFor({state:'visible',timeout:40000});if(n===2){assert.equal(await page.locator('#result-route-offer').isVisible(),true);assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('golf-failures'))[2]),3);await page.locator('#result-route').click();}else await page.locator('#retry-result').click();}
 await openHints();await page.waitForFunction(()=>window.golfDebug.hint(),{},{timeout:40000});
 await toggleHints();
 assert.equal(await page.locator('#route-drawer').getAttribute('aria-expanded'),'false');
 await openHints();
 await page.waitForFunction(()=>window.golfDebug.hint(),{},{timeout:40000});
 assert.ok((await page.locator('#route-message').textContent()).includes('推荐力度'));
 await page.screenshot({path:'test-results/office-route.png'});
 await toggleHints();assert.equal(await page.evaluate(()=>window.golfDebug.hint()),null);
 await toggleHints();
 await page.waitForFunction(()=>window.golfDebug.hint(),{},{timeout:40000});
 // Real input from the verified live recommendation, no mutation of physics state.
 // Position the pointer first, then take a fresh recommendation. Four slow
 // software-rendered interpolation frames can exceed the real 0.6s window.
 const a=await page.evaluate(()=>{const s=window.golfDebug.state();return window.golfDebug.project(s.x,s.y)});
 await page.mouse.move(a.x,a.y);await page.mouse.down();
 await page.waitForFunction(()=>{const h=window.golfDebug.hint();return h&&window.golfDebug.state().time-h.launchAt<.1},{},{timeout:40000});
 const {h,b}=await page.evaluate(()=>{const h=window.golfDebug.hint(),s=window.golfDebug.state();return {h,b:window.golfDebug.project(s.x-Math.cos(h.angle)*h.power,s.y-Math.sin(h.angle)*h.power)}});
 await page.mouse.move(b.x,b.y);await page.mouse.up();
 assert.ok(await page.evaluate(h=>window.golfDebug.state().shotAt-h.launchAt<=.6,h),'real release inside the verified window');
 await page.locator('#result').waitFor({state:'visible',timeout:40000});
 assert.equal(await page.evaluate(()=>window.golfDebug.state().state),'won',JSON.stringify({hint:h,actual:await page.evaluate(()=>window.golfDebug.state())}));
 assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('golf-failures'))[2]),0);
 await page.reload();await page.waitForFunction(()=>window.golfDebug?.menu());
 assert.equal(await page.locator('#menu-assist').getAttribute('aria-pressed'),'true');
 await page.setViewportSize({width:390,height:844});await page.screenshot({path:'test-results/menu-fonts-mobile.png'});
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 assert.deepEqual(errors,[]);
 console.log('PASS local fonts, first/normal/record banners, persisted scores, three-failure offer, opt-in/out, real hinted shot wins, failure reset, menu preference and mobile fit');
} finally {await browser.close();}

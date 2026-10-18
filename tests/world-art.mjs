import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox','--enable-unsafe-swiftshader']});
const page=await browser.newPage({viewport:{width:1440,height:960},hasTouch:true});
const errors=[],failures=[],reports=[];
page.on('pageerror',e=>errors.push(e.message));page.on('requestfailed',r=>failures.push(r.url()));
page.on('response',r=>{if(r.status()>=400)failures.push(`${r.status()} ${r.url()}`)});
async function stable(){await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))))}
async function scrollNode(i){
  await page.locator(`[data-level="${i}"]`).scrollIntoViewIfNeeded();await stable();
  const info=await page.evaluate(i=>({p:window.golfDebug.island(i),v:document.querySelector('#viewport').getBoundingClientRect().toJSON()}),i);
  if(info.p.y<info.v.top+55){await page.locator('#viewport').evaluate(e=>e.scrollTop=Math.max(0,e.scrollTop-110));await stable()}
}
async function open(i){await scrollNode(i);await page.locator(`[data-level="${i}"]`).click();await page.locator('#game').waitFor({state:'visible'});if(await page.locator('#tutorial-close').isVisible())await page.locator('#tutorial-close').click()}
try{
 await mkdir('docs/screenshots',{recursive:true});await mkdir('test-results',{recursive:true});
 await page.goto('http://localhost:5173');await page.waitForFunction(()=>!!window.golfDebug);
 await page.evaluate(async()=>{await document.fonts.load('400 16px "Golf UI Sans"','设置本次用时历史最佳仅一杆');await document.fonts.load('700 16px "Golf UI Sans"','0123456789');await document.fonts.ready});
 assert.ok(await page.locator('.official-logo').evaluate(e=>e.complete&&e.naturalWidth===2023));
 assert.equal(await page.locator('[data-level="3"]').getAttribute('aria-disabled'),'true');
 assert.deepEqual(await page.evaluate(()=>window.golfDebug.menu().links.map(l=>[l.from,l.to])),[[0,1],[1,2],[2,3],[3,4]]);
 const before=await page.evaluate(()=>window.golfDebug.menu().links);assert.equal(before[2].opacity,.2);
 await page.screenshot({path:'docs/screenshots/art-menu-desktop.png'});
 await page.evaluate(()=>{localStorage.setItem('golf-progress-v4','[0,1,2,3]');localStorage.setItem('golf-tutorial','seen')});await page.reload();await page.waitForFunction(()=>!!window.golfDebug);
 assert.equal(await page.evaluate(()=>window.golfDebug.menu().links[2].opacity),1,'completed paths brighten');
 for(const [width,height,name] of [[1440,960,'desktop'],[1024,768,'tablet'],[844,390,'landscape'],[390,844,'mobile'],[320,640,'small']]){
  await page.setViewportSize({width,height});await stable();
  const points=await page.evaluate(()=>Array.from({length:5},(_,i)=>window.golfDebug.island(i)));
  if(width>=650){for(let i=1;i<5;i++)assert.ok(points[i].x>points[i-1].x,'screen order moves left to right');assert.ok(points[0].y<points[1].y&&points[2].y<points[1].y&&points[2].y<points[3].y&&points[4].y<points[3].y,'alternating two rows');}
  else for(let i=1;i<5;i++)assert.ok(points[i].y>points[i-1].y,'mobile is top to bottom');
  for(let i=0;i<5;i++){
   await scrollNode(i);const box=await page.locator(`[data-level="${i}"]`).boundingBox();
   assert.ok(box.x>=0&&box.x+box.width<=width+1,`${name} plaque ${i+1} within width`);
   assert.ok(await page.locator(`[data-level="${i}"] strong`).evaluate(e=>e.scrollWidth<=e.clientWidth+1),'full title fits');
   const v=await page.locator('#viewport').boundingBox();assert.ok(box.y>=v.y-1&&box.y+box.height<=v.y+v.height+1,`${name} plaque can be fully scrolled into view`);
   const p=await page.evaluate(i=>window.golfDebug.island(i),i);
   assert.equal(await page.evaluate(p=>document.elementFromPoint(p.x,p.y)?.tagName,p),'CANVAS',`${name}: island ${i+1} centre is exposed`);
  }
  const overlaps=await page.locator('[data-level]').evaluateAll(es=>{const a=es.map(e=>e.getBoundingClientRect());return a.flatMap((r,i)=>a.slice(i+1).filter(s=>Math.min(r.right,s.right)-Math.max(r.left,s.left)>2&&Math.min(r.bottom,s.bottom)-Math.max(r.top,s.top)>2).map(()=>i))});
  assert.deepEqual(overlaps,[],`${name} wooden plaques do not overlap`);
  await page.locator('#viewport').evaluate(e=>e.scrollTop=0);await stable();
  await page.screenshot({path:`docs/screenshots/art-menu-${name}.png`});
  if(width<650){await page.locator('#viewport').evaluate(e=>e.scrollTop=e.scrollHeight);await stable();await page.screenshot({path:`docs/screenshots/art-menu-${name}-bottom.png`});}
  reports.push({name,width,height,points,overlaps});
 }
 await page.setViewportSize({width:1440,height:960});await stable();
 for(const i of [3,4]){await open(i);await page.screenshot({path:`docs/screenshots/art-level-${i+1}-desktop.png`});const s=await page.evaluate(()=>window.golfDebug.state());assert.equal(s.state,'ready');assert.equal(s.x,i===3?180:110);assert.equal(s.y,i===3?430:280);await page.locator('#retry').click();assert.equal(await page.evaluate(()=>window.golfDebug.state().shotAt),0);await page.locator('#home').click()}
 await open(0);const projected=await page.evaluate(()=>{const s=window.golfDebug.state();return [window.golfDebug.project(s.x,s.y),window.golfDebug.project(s.x-10,s.y)]});await page.mouse.move(projected[0].x,projected[0].y);await page.mouse.down();await page.mouse.move(projected[1].x,projected[1].y);await page.mouse.up();await page.locator('#result').waitFor({state:'visible'});
 const [card,title,art,actions]=await Promise.all(['.resultbox','#result-title','.failure-scene','.result-actions'].map(s=>page.locator(s).boundingBox()));
 assert.ok(Math.abs(title.y+title.height/2-(card.y+card.height/2))<45,'failure title near card visual centre');assert.ok(title.y+title.height+16<actions.y,'heading has space before buttons');assert.ok(art.height<80);assert.equal(await page.locator('.result-actions button:visible').count(),2);await page.screenshot({path:'docs/screenshots/art-failure-desktop.png'});await page.locator('#retry-result').click();
 const [a,z]=await page.evaluate(()=>{const s=window.golfDebug.state();return [window.golfDebug.project(s.x,s.y),window.golfDebug.project(s.x-65,s.y)]});await page.mouse.move(a.x,a.y);await page.mouse.down();await page.mouse.move(z.x,z.y);await page.mouse.up();await page.locator('#result').waitFor({state:'visible',timeout:20000});assert.equal(await page.evaluate(()=>window.golfDebug.state().state),'won');
 for(const [w,h,n] of [[1440,960,'desktop'],[320,640,'small']]){await page.setViewportSize({width:w,height:h});await stable();assert.ok(await page.locator('#result-stats').evaluate(e=>e.scrollWidth<=e.clientWidth+1),'score text fits');for(const sel of ['#score-time','#score-best','#score-bounces','#result-stats small'])assert.match(await page.locator(sel).first().evaluate(e=>getComputedStyle(e).fontFamily),/Golf UI Sans/);await page.screenshot({path:`docs/screenshots/art-score-${n}.png`})}
 await page.locator('#result-menu').click();await page.setViewportSize({width:390,height:844});await open(4);await page.screenshot({path:'docs/screenshots/art-level-5-mobile.png'});await page.locator('#home').click();await open(3);await page.screenshot({path:'docs/screenshots/art-level-4-mobile.png'});
 await page.locator('#settings-open').click();await page.locator('#instructions-toggle').click();for(const sel of ['#instructions','.setting-row strong'])assert.match(await page.locator(sel).first().evaluate(e=>getComputedStyle(e).fontFamily),/Golf UI Sans/);await page.screenshot({path:'docs/screenshots/art-settings-mobile.png'});await page.locator('#settings-close').click();
 assert.deepEqual(errors,[]);assert.deepEqual(failures,[]);await writeFile('test-results/world-art.json',JSON.stringify({reports,errors,failures},null,2));console.log('PASS art: five viewports, ordered map, completed paths, exposed islands and plaques, scrolling, no overlap, original logo, new fonts, failure spacing, scores, settings and stage art');
}catch(e){await page.screenshot({path:'test-results/world-art-failure.png'});throw e}finally{await browser.close()}

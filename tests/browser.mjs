import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
const page=await browser.newPage({viewport:{width:1200,height:900}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.goto('http://127.0.0.1:5173');
const solutions=JSON.parse(await fs.readFile('/tmp/golf-solutions.json','utf8'));
async function drag(dx,dy,start){const r=await page.locator('canvas').boundingBox();const x=r.x+start.x*r.width/900,y=r.y+start.y*r.height/560;await page.mouse.move(x,y);await page.mouse.down();await page.mouse.move(x-dx*r.width/900,y-dy*r.height/560,{steps:10});await page.mouse.up();}
const starts=[{x:180,y:280},{x:180,y:360},{x:150,y:390}];
for(let i=0;i<3;i++){await page.locator(`[data-level="${i}"]`).click();await drag(solutions[i].dx,solutions[i].dy,starts[i]);await page.getByText('一杆，归洞。',{exact:true}).waitFor({timeout:20000});if(i<2){await page.locator('#next').click();assert.equal(await page.locator('#title').textContent(),['','请走弯路','办公室高尔夫'][i+1]);}await page.locator('#back').click();console.log('PASS browser drag + win + navigation level',i+1);}
await page.locator('[data-level="0"]').click();await drag(8,0,starts[0]);await page.getByText('差一点也没关系。',{exact:true}).waitFor();await page.locator('#retry-result').click();await page.locator('#result').isHidden().then(x=>assert.ok(x));assert.equal(await page.locator('#shot').textContent(),'一杆机会');console.log('PASS browser failure and retry');
await page.setViewportSize({width:390,height:844});await page.locator('#back').click();assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.locator('[data-level="0"]').click();await page.screenshot({path:'/tmp/golf-mobile.png'});assert.deepEqual(errors,[]);console.log('PASS mobile layout and no browser errors');await browser.close();

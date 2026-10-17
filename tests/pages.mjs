// Exercises the built production bundle, never the Vite dev server or DEV hooks.
import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
if(process.env.PAGES_URL!==undefined&&!process.env.PAGES_URL.trim())throw new Error('Published PAGES_URL must not be empty');
const prefix='/crispy-fortnight/', root=resolve('dist');
let server;
if(!process.env.PAGES_URL){
 const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.woff2':'font/woff2','.png':'image/png','.svg':'image/svg+xml'};
 server=createServer(async(req,res)=>{try{
  const path=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  if(!path.startsWith(prefix)){res.writeHead(404);res.end('Prefix required');return;}
  const file=resolve(root,path.slice(prefix.length)||'index.html');
  if(!file.startsWith(root+sep)){res.writeHead(403);res.end();return;}
  const data=await readFile(file);res.writeHead(200,{'Content-Type':mime[extname(file)]||'application/octet-stream'});res.end(data);
 }catch{res.writeHead(404);res.end('Missing static file');}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
}
const url=process.env.PAGES_URL||`http://127.0.0.1:${server.address().port}${prefix}`;
const browser=await chromium.launch({...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),args:['--no-sandbox','--enable-unsafe-swiftshader']}).catch(error=>{server?.close();throw error;});
const page=await browser.newPage({viewport:{width:1280,height:900}});
const errors=[],failures=[],resources=[];
page.on('pageerror',e=>errors.push(e.message));
page.on('requestfailed',r=>failures.push(`${r.url()}: ${r.failure()?.errorText}`));
page.on('response',r=>{resources.push({url:r.url(),status:r.status()});if(r.status()>=400)failures.push(`${r.status()} ${r.url()}`);});
const output=`test-results/pages/${process.env.PAGES_URL?'published':'built'}`;
await mkdir(output,{recursive:true});
try{
 // Allow a newly published Pages deployment to propagate; preserve real failures.
 let loaded=false;
 for(let attempt=0;attempt<(process.env.PAGES_URL?10:1);attempt++){
  const response=await page.goto(url,{waitUntil:'domcontentloaded'});
  if(response?.status()===200){loaded=true;break;}
  if(process.env.PAGES_URL&&attempt<9){failures.length=0;await page.waitForTimeout(3000);}
 }
 assert.ok(loaded,'Pages must serve index.html successfully');
 await page.locator('[data-level="0"]').waitFor({state:'visible'});
 await page.evaluate(async()=>{
  await Promise.all([document.fonts.load('24px "Maoken Assorted Sans"','一杆归洞办公室高尔夫'),document.fonts.load('24px HuangYou','设置0123456789'),document.fonts.load('24px Smiley','0123456789')]);await document.fonts.ready;
 });
 const fonts=await page.evaluate(()=>[...document.fonts].filter(f=>f.status==='loaded').map(f=>f.family));
 for(const font of ['Maoken Assorted Sans','HuangYou','Smiley'])assert.ok(fonts.includes(font),`${font} decoded`);
 assert.ok(await page.locator('.official-logo').evaluate(e=>e.complete&&e.naturalWidth>1000&&e.naturalHeight>300),'original logo loaded');
 assert.equal(await page.locator('#webgl-error').isVisible(),false);
 assert.equal(await page.locator('canvas').count(),1);
 await page.screenshot({path:`${output}/menu.png`});
 const names=['就在眼前','请走弯路','办公室高尔夫'];
 for(let i=0;i<3;i++){
  await page.locator(`[data-level="${i}"]`).click();await page.locator('#game').waitFor({state:'visible'});await page.waitForTimeout(250);
  assert.equal(await page.locator('#title').textContent(),names[i]);
  if(await page.locator('#tutorial-close').isVisible())await page.locator('#tutorial-close').click();
  assert.equal(await page.locator('#webgl-error').isVisible(),false);
  const canvas=await page.locator('canvas').boundingBox();assert.ok(canvas.width>200&&canvas.height>200);
  await page.screenshot({path:`${output}/level-${i+1}.png`});
  await page.locator('#retry').click();assert.equal(await page.locator('#title').textContent(),names[i]);
  if(i===2){await page.locator('#route-drawer').click();await page.waitForFunction(()=>!!document.querySelector('[data-verified-route]'),{},{timeout:40000});await page.locator('#route-close').click();}
  await page.locator('#home').click();await page.locator('#menu').waitFor({state:'visible'});
 }
 await page.setViewportSize({width:390,height:844});await page.waitForTimeout(200);await page.screenshot({path:`${output}/mobile.png`});
 assert.ok(resources.some(r=>r.url.includes('route-worker-')&&r.status===200),'production route worker loaded');
 assert.ok(resources.filter(r=>r.url.includes('.woff2')&&r.status===200).length>=3,'font requests succeeded');
 assert.deepEqual(errors,[]);assert.deepEqual(failures,[]);
 await writeFile(`${output}/report.json`,JSON.stringify({url,fonts,levels:names,resources,errors,failures},null,2));
 console.log(`PASS ${process.env.PAGES_URL?'published':'production subdirectory'} game: CSS/JS, original logo, 3 local fonts, WebGL, all 3 levels/retry/home, real route worker, mobile; no failed resources`);
}catch(error){await page.screenshot({path:`${output}/failure.png`});await writeFile(`${output}/report.json`,JSON.stringify({url,resources,errors,failures,error:String(error)},null,2));throw error;}
finally{await browser.close();await new Promise(r=>server?server.close(r):r());}

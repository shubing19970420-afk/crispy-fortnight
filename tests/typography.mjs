import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox','--enable-unsafe-swiftshader']});
try {
 const page=await browser.newPage(); const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(process.env.GOLF_URL||'http://127.0.0.1:5173');
 await page.waitForFunction(()=>window.golfDebug?.menu());
 const fonts=await page.evaluate(async()=>{
  await Promise.all([document.fonts.load('25px "Maoken Assorted Sans"','办公室高尔夫'),document.fonts.load('25px "Title Loading Fallback"','办公室高尔夫'),document.fonts.load('17px HuangYou','操作说明0123456789')]);await document.fonts.ready;
  const c=document.createElement('canvas').getContext('2d'); c.font='25px "Maoken Assorted Sans"';const a=c.measureText('办公室高尔夫').width;c.font='25px "Title Loading Fallback"';const b=c.measureText('办公室高尔夫').width;
  return {loaded:[...document.fonts].filter(f=>f.status==='loaded').map(f=>f.family),title:getComputedStyle(document.querySelector('.map-label strong')).fontFamily,body:getComputedStyle(document.querySelector('#settings')).fontFamily,a,b};
 });
 assert.ok(fonts.loaded.includes('Maoken Assorted Sans'));assert.ok(fonts.loaded.includes('HuangYou'));assert.ok(fonts.title.includes('Maoken'));assert.ok(fonts.body.includes('Golf UI Sans'));assert.ok(Math.abs(fonts.a-fonts.b)<2,'Chinese fallback widths match');
 for(const [width,height] of [[1440,960],[390,844],[320,640],[844,390]]){
  await page.setViewportSize({width,height});await page.waitForTimeout(350);
  assert.equal(await page.locator('.map-label').count(),5);
  for(const title of await page.locator('.map-label strong').all())assert.ok(await title.evaluate(e=>e.scrollWidth<=e.clientWidth+1),'island title fits');
  await page.locator('#settings-open').click();
  assert.ok(await page.locator('#settings').evaluate(e=>e.scrollWidth<=e.clientWidth+1),'settings text fits');
  await page.locator('#settings-close').click();
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'viewport has no horizontal overflow');
 }
 assert.deepEqual(errors,[]);console.log('PASS typography: actual local font loading, Chinese fallback metrics, title/body roles, 4 viewport text layouts',fonts);
} finally {await browser.close();}

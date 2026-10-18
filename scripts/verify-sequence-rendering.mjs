// Real iframe/browser integration; mocked claim transport, no real points issued.
import assert from "node:assert/strict";
import { createHmac, randomBytes } from "node:crypto";
import { pathToFileURL } from "node:url";
const { chromium } = await import(process.argv[2] ? pathToFileURL(process.argv[2]).href : "playwright");
const origin = process.env.MATHWEEK_TEST_ORIGIN || "http://localhost:3000";
const key = createHmac("sha256",process.env.SUPABASE_SERVICE_ROLE_KEY).update("mathweek:site-cookie:v1").digest();
const payload=`${Math.floor(Date.now()/1000)+3600}.${randomBytes(16).toString('hex')}`;
const token=`${payload}.${createHmac('sha256',key).update(payload).digest('hex')}`;
const browser=await chromium.launch({channel:'msedge',headless:true});
try {
  const context=await browser.newContext({viewport:{width:1920,height:1080},deviceScaleFactor:2});
  await context.addCookies([{name:'mathweek-site-access',value:token,url:origin}]);
  const page=await context.newPage();
  const errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.goto(origin+'/games');
  const f=page.frameLocator('iframe');
  await f.getByRole('button',{name:'Open Number Sequence',exact:true}).click();
  await f.locator('.ns-home-start').waitFor();
  assert.equal(await f.locator('.ns-home-sky').evaluate(el=>getComputedStyle(el).animationName),'none');
  async function checkComposition(){
    const bounds=await f.locator('.ns-canvas').evaluate(el=>{const r=el.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height,vw:innerWidth,vh:innerHeight,translate:getComputedStyle(el).translate}});
    assert.ok(Math.abs(bounds.x+bounds.w/2-bounds.vw/2)<2,JSON.stringify(bounds));
    assert.ok(Math.abs(bounds.y+bounds.h/2-bounds.vh/2)<2,JSON.stringify(bounds));
    assert.ok(bounds.x>=-2&&bounds.y>=-2&&bounds.x+bounds.w<=bounds.vw+2&&bounds.y+bounds.h<=bounds.vh+2);
    assert.equal(bounds.translate,'none');
  }
  for(const viewport of [{width:1920,height:1080},{width:3840,height:2160},{width:1280,height:720}]){
    await page.setViewportSize(viewport);await page.waitForTimeout(200);await checkComposition();
  }
  await f.locator('.ns-home-start').click();
  await f.locator('.ns-runes button').first().waitFor();
  await f.locator('.game-guide-label').waitFor();
  assert.equal(await f.locator('.game-guide-shade, .game-guide-layer svg').count(),0);
  assert.equal(await f.locator('.game-guide-focus').count(),2);
  assert.equal(await f.locator('.ns-red-overlay').evaluate(el=>getComputedStyle(el).display),'none');
  assert.equal(await f.locator('.game-guide-focus').first().evaluate(el=>getComputedStyle(el).animationName),'none');
  for(const viewport of [{width:1920,height:1080},{width:3840,height:2160},{width:1280,height:720}]){
    await page.setViewportSize(viewport);await page.waitForTimeout(250);await checkComposition();
    const controls=await f.locator('.ns-runes').evaluate(el=>{const r=el.getBoundingClientRect();return {x:r.x,y:r.y,r:r.right,b:r.bottom,vw:innerWidth,vh:innerHeight}});
    assert.ok(controls.x>=0&&controls.y>=0&&controls.r<=controls.vw+1&&controls.b<=controls.vh+1,JSON.stringify(controls));
  }
  assert.deepEqual(errors,[]);
  console.log('PASS: Sequence intro and gameplay stay centered and fully visible after 1920/3840/1280 viewport changes; hints retain two static focus rings without a full-screen SVG mask; no runtime errors.');
} finally { await browser.close(); }

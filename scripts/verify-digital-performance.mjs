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
  const context=await browser.newContext({viewport:{width:1440,height:1000}});
  await context.addCookies([{name:'mathweek-site-access',value:token,url:origin}]);
  const page=await context.newPage();
  const requests=[],errors=[]; let reports=0;
  page.on('request',r=>requests.push(new URL(r.url()).pathname));
  page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/api/games/claim-result',async route=>{
    reports++;
    await new Promise(resolve=>setTimeout(resolve,300));
    await route.fulfill({json:{token:'test-only',expiresAt:new Date(Date.now()+60000).toISOString(),used:false,pointsAwarded:19,claimUrl:origin+'/claim/test-only'}});
  });
  await page.route('**/api/claim/*/status',route=>route.fulfill({json:{used:false,expired:false}}));
  await page.goto(origin+'/games',{waitUntil:'domcontentloaded'});
  const frame=page.frameLocator('iframe');
  await frame.getByRole('button',{name:'Open Conway',exact:true}).waitFor();
  assert.equal(await page.locator('.background-scene').count(),0,'Host decorations must not run behind the game');
  assert.equal(requests.filter(url=>/\/assets\/(Conway|Planarity|Symmetry|KNN|NumberSequence|DealOrNoDeal)-.*\.js$/.test(url)).length,0,'Home must not load all game modules');
  // The island intentionally floats continuously, so it never satisfies the
  // automation-only requirement for two identical animation-frame bounds.
  await frame.getByRole('button',{name:'Open Conway',exact:true}).click({force:true});
  await frame.getByText('Conway Table Tennis Arena',{exact:true}).waitFor();
  assert.ok(requests.some(url=>/\/assets\/Conway-.*\.js$/.test(url)));
  assert.equal(requests.filter(url=>/\/assets\/(Planarity|Symmetry|KNN|NumberSequence|DealOrNoDeal)-.*\.js$/.test(url)).length,0);
  const gameFrame=page.frames().find(item=>item.url().includes('/digital-play/'));
  const start=Date.now();
  await gameFrame.evaluate(()=>{
    const result={gameId:'conway',attemptId:'browser-performance-only',finalizedAt:new Date().toISOString()};
    window.dispatchEvent(new CustomEvent('mathweek:competition-result',{detail:{...result,playerSlot:'p1',outcome:'win',finalScore:1210}}));
    window.dispatchEvent(new CustomEvent('mathweek:competition-result',{detail:{...result,playerSlot:'p2',outcome:'loss',finalScore:20}}));
  });
  await frame.getByRole('img',{name:'Scan to sign in and claim this result'}).waitFor();
  const elapsed=Date.now()-start;
  assert.equal(await frame.getByText('Conway Table Tennis Arena',{exact:true}).count(),0,'Finished game must unmount while QR is displayed');
  assert.equal(reports,1);
  await frame.getByRole('button',{name:'RETRY QR',exact:true}).click();
  await page.waitForTimeout(350);
  assert.equal(reports,1,'Ready QR retry must reuse the same code without another result request');
  assert.equal(requests.filter(url=>/\/assets\/(conway|deal|knn|sequence|planarity|symmetry)-.*\.png$/.test(url)).length,0);
  await frame.getByRole('button',{name:'RETURN HOME',exact:true}).click();
  for (const [label,module] of [['Open Deal or No Deal','DealOrNoDeal'],['Open KNN','KNN'],['Open Number Sequence','NumberSequence'],['Open Planarity','Planarity'],['Open Symmetry','Symmetry']]) {
    await frame.getByRole('button',{name:label,exact:true}).click({force:true});
    await frame.getByRole('button',{name:'Open Home navigation',exact:true}).waitFor();
    await gameFrame.waitForFunction(()=>!document.querySelector('.game-module-loading'));
    assert.ok(requests.some(url=>new RegExp('/assets/'+module+'-.*\\.js$').test(url)),module+' must load on selection');
    await frame.getByRole('button',{name:'Open Home navigation',exact:true}).click();
    await frame.getByRole('button',{name:'Return to Home',exact:true}).click();
    await frame.getByRole('button',{name:label,exact:true}).waitFor();
  }
  assert.deepEqual(errors,[]);
  console.log(`PASS: games load on demand, no heavy island PNGs or host background, finished game unmounts, QR visible in ${elapsed}ms with a mocked 300ms server delay, retry makes no extra result request. No real scores created.`);
} finally { await browser.close(); }

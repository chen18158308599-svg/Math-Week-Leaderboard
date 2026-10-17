// Browser checks against the real bundled games. Claim requests are mocked.
import assert from "node:assert/strict";
import { createHmac, randomBytes } from "node:crypto";
import { pathToFileURL } from "node:url";
const { chromium } = await import(pathToFileURL(process.argv[2]).href);
const origin = process.env.MATHWEEK_TEST_ORIGIN || "http://localhost:3000";
const key = createHmac("sha256", process.env.SUPABASE_SERVICE_ROLE_KEY).update("mathweek:site-cookie:v1").digest();
const payload = `${Math.floor(Date.now()/1000)+3600}.${randomBytes(16).toString("hex")}`;
const token = `${payload}.${createHmac("sha256",key).update(payload).digest("hex")}`;
const browser = await chromium.launch({channel:"msedge",headless:true});
try {
  const context = await browser.newContext({viewport:{width:1440,height:1000}});
  await context.addCookies([{name:"mathweek-site-access",value:token,url:origin}]);
  const page = await context.newPage();
  const errors = [];
  const reportedResults = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.route("**/api/games/claim-result", route => {
    const result=route.request().postDataJSON();
    reportedResults.push(result);
    return route.fulfill({json:{token:"test",expiresAt:new Date(Date.now()+60000).toISOString(),pointsAwarded:result.gameKey==="symmetry"?result.finalScore:19,used:false,claimUrl:origin+"/claim/test"}});
  });
  await page.route("**/api/claim/*/status", route => route.fulfill({json:{used:false,expired:false}}));
  await page.goto(origin+"/games");
  const f = page.frameLocator("iframe");
  const open = async name => { await f.getByRole("button",{name:"Open "+name,exact:true}).dispatchEvent("click"); };
  await open("Conway");
  await f.locator('.cw-entry-start').click();
  await page.clock.install();
  await f.getByRole('button',{name:'Got it \u2014 start match'}).click();
  for(let round=0;round<3;round++) {
    await page.clock.runFor(2100);
    await f.locator('.cw-board-blue .cw-cell').nth(27).click();
    await f.locator('.cw-board-panel-one footer button').click();
    await f.locator('.cw-board-pink .cw-cell').nth(27).click();
    await f.locator('.cw-board-panel-two footer button').click();
    await page.clock.runFor(10100);
    await f.locator('.cw-summary-card .cw-primary-button').click();
    assert.equal(await f.locator('.cw-power-panel').count(),0);
    assert.match(await f.locator('.cw-next-conway').textContent(),/25s LEFT/);
    await page.clock.runFor(25100);
    if(round<2) await f.locator('.cw-conway.is-ready').waitFor();
  }
  await f.getByRole('heading',{name:'GAME OVER',exact:true}).waitFor();
  assert.equal(reportedResults.length,0,'A tied match does not mint winner points');
  assert.deepEqual(errors,[]);
  console.log('PASS: every table round ends after 25s even without a serve; exactly three tied rounds end the match; no skills or winner QR.');
} finally { await browser.close(); }
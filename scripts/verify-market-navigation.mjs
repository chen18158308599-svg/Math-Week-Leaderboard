// Browser regression test with mocked market responses; no real orders/accounts.
// node --env-file=.env.local scripts/verify-market-navigation.mjs <playwright-module-path>
import assert from "node:assert/strict";
import { createHmac, randomBytes } from "node:crypto";
import { pathToFileURL } from "node:url";
import QRCode from "qrcode";
const { chromium } = await import(process.argv[2] ? pathToFileURL(process.argv[2]).href : "playwright");
const origin = process.env.MATHWEEK_TEST_ORIGIN || "http://localhost:3000";
const key = createHmac("sha256", process.env.SUPABASE_SERVICE_ROLE_KEY).update("mathweek:site-cookie:v1").digest();
const payload = `${Math.floor(Date.now()/1000)+3600}.${randomBytes(16).toString("hex")}`;
const token = `${payload}.${createHmac("sha256",key).update(payload).digest("hex")}`;
const browser = await chromium.launch({ channel: "msedge", headless: true });
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  await context.addCookies([{ name: "mathweek-site-access", value: token, url: origin }]);
  let paired = false;
  let waiting = false;
  let trades=[];
  let cash=5000;
  let holdings={LIB:0,BOOK:0,DONA:0};
  let holdNextRead=false, releaseRead, releasePair;
  let delayPair=false;
  let offset=0;
  const stocks = ["LIB","BOOK","DONA"].map(code => ({ code,price:100,change:0,prices:Array(24).fill(100),clue_en:"Clue coming soon.",clue_zh:"" }));
  const state = () => ({day:1,settledDay:0,phase:"open",close:"22:00",serverTime:new Date().toISOString(),lastSettlement:null,stocks,leaderboard:[],pairing:waiting?"waiting":"none",portfolio:paired?{nickname:"Browser test investor",sessionId:"test-session",cash,assets:5000,holdings,expiresAt:new Date(Date.now()+900000).toISOString(),trades}:null});
  const qr = await QRCode.toDataURL(`${origin}/market-pair/test`);
  const page = await context.newPage();
  const errors=[];
  page.on("pageerror",e=>errors.push(e.message));
  await page.route("**/api/stock-market**", async route => {
    const request=route.request();
    if(request.method()==="POST") {
      const body=request.postDataJSON();
      if(body.action==="pair") { waiting=true; if(delayPair) await new Promise(resolve=>releasePair=resolve); await route.fulfill({json:{qr,sessionId:"test-session",expiresAt:new Date(Date.now()+offset+120000).toISOString()}}); }
      else if(body.action==="trade") {
        const quantity=body.quantity;
        const amount=quantity*100;
        cash+=body.side==='buy'?-amount:amount;
        holdings={...holdings,[body.code]:holdings[body.code]+(body.side==='buy'?quantity:-quantity)};
        const trade={id:`trade-${trades.length}`,day:1,code:body.code,side:body.side,quantity,price:100,amount,cash_after:cash,units_after:holdings[body.code],created_at:new Date().toISOString()};
        trades=[trade,...trades];
        await route.fulfill({json:trade});
      }
      else { paired=false;waiting=false;await route.fulfill({json:{ended:true}}); }
    } else {
      const snapshot=state();
      if(holdNextRead) {holdNextRead=false;await new Promise(resolve=>releaseRead=resolve);}
      await route.fulfill({json:snapshot});
    }
  });
  await page.goto(origin,{waitUntil:"domcontentloaded"});
  const link=page.getByRole("link",{name:"Open MAT Stock Market",exact:true});
  assert.equal(await link.getAttribute("href"),"/stock-market");
  await link.click();
  await page.waitForURL("**/stock-market");
  const start=page.getByRole("button",{name:"LOG IN TO TRADE →",exact:true});
  await start.waitFor({state:"visible"});
  await page.waitForFunction(()=>[...document.querySelectorAll('button')].some(b=>b.textContent.includes('LOG IN TO TRADE')&&!b.disabled));
  const banner=await page.getByRole("heading",{name:"Log in to start investing"}).boundingBox();
  const cashBox=await page.getByText("Available cash",{exact:true}).boundingBox();
  assert.ok(banner.y<cashBox.y,"Sign-in banner must precede the cash summary");
  await page.screenshot({path:"tmp/market-login-banner.png",fullPage:true});
  await page.getByRole("button",{name:"Asset leaderboard",exact:true}).click();
  assert.equal(await page.locator('a[href="/leaderboard"]').count(),0);
  await page.getByRole("button",{name:"Market",exact:true}).click();
  holdNextRead=true;
  for(let i=0;i<100 && !releaseRead;i++) await page.waitForTimeout(50);
  assert.ok(releaseRead,'Capture an in-flight read from before pairing');
  delayPair=true;
  await start.click();
  await page.getByText('Preparing your login QR…',{exact:true}).waitFor();
  assert.ok(page.url().endsWith('/stock-market'));
  for(let i=0;i<50 && !releasePair;i++) await page.waitForTimeout(50);
  releasePair(); delayPair=false;
  await page.getByRole('img',{name:'Scan to connect your school account',exact:true}).waitFor();
  releaseRead();
  await page.waitForTimeout(500);
  await page.getByRole("heading",{name:"Scan to connect",exact:true}).waitFor();
  const qrBox=await page.getByRole("img",{name:"Scan to connect your school account",exact:true}).boundingBox();
  const dialogBox=await page.locator('dialog[open]').boundingBox();
  assert.ok(Math.abs((qrBox.x+qrBox.width/2)-(dialogBox.x+dialogBox.width/2))<2,"QR must be centered in the dialog");
  await page.keyboard.press('Escape');
  await page.waitForFunction(()=>!document.querySelector('dialog[open]'));
  assert.ok(page.url().endsWith('/stock-market'),'Cancel QR must stay in the market');
  await start.click();
  await page.getByRole('img',{name:'Scan to connect your school account',exact:true}).waitFor();
  await page.clock.install();
  offset+=105000;
  await page.clock.runFor(105000);
  assert.ok(page.url().endsWith('/stock-market'),'Valid QR must not be interrupted by idle navigation');
  await page.getByRole('button',{name:'Get a new code',exact:true}).click();
  await page.getByRole('img',{name:'Scan to connect your school account',exact:true}).waitFor();
  offset+=70000;
  await page.clock.runFor(70000);
  assert.ok(page.url().endsWith('/stock-market'),'Renewed QR gets its own complete waiting window');
  assert.equal(await page.locator('dialog[open]').count(),1);
  paired=true;waiting=false;
  await page.getByText("Browser test investor",{exact:true}).waitFor({timeout:15000});
  await page.waitForFunction(()=>![...document.querySelectorAll('dialog[open]')].some(d=>d.textContent.includes('Scan to connect')));
  assert.ok(page.url().endsWith('/stock-market'),"QR close must not return home");
  // A real browser clock proves confirmation gets a fresh inactivity window.
  offset+=45000;
  await page.clock.runFor(45000);
  assert.ok(page.url().endsWith('/stock-market'));
  assert.equal(await page.getByText("Browser test investor",{exact:true}).count(),1);
  for(const [i,code] of ['LIB','BOOK','DONA'].entries()) {
    const card=page.locator('article').filter({has:page.locator('h3',{hasText:code==='LIB'?'Library Footfall':code==='BOOK'?'Book Borrowing':'Book Donations'})});
    await card.getByRole('button',{name:'Buy',exact:true}).click();
    await page.getByRole('button',{name:'Confirm trade',exact:true}).click();
    await page.getByRole('heading',{name:'Trade successful',exact:true}).waitFor();
    await page.getByText('Saved to your account. No further confirmation needed.',{exact:true}).waitFor();
    if(i===0) await page.screenshot({path:"tmp/market-trade-success.png"});
    if(i<2) {
      await page.getByText(`You can trade ${2-i} other stocks today, or finish now.`,{exact:true}).waitFor();
      await page.getByRole('button',{name:'Trade another stock',exact:true}).click();
      assert.equal(await page.getByText('Trade saved',{exact:false}).count(),1);
    } else {
      await page.getByText("Today's trades are complete. Come back on the next trading day.",{exact:true}).waitFor();
      assert.equal(await page.getByRole('button',{name:'Trade another stock',exact:true}).count(),0);
      await page.clock.runFor(10500);
      await page.waitForURL(origin+'/');
    }
  }
  assert.deepEqual(errors,[]);
  await page.screenshot({path:"tmp/market-navigation.png",fullPage:true});
  console.log("PASS: stale reads and slow pairing cannot close login; cancel stays on market; original/renewed QR survive idle; phone confirmation gets 60s; three trades show receipts and next steps; final countdown returns home. Mock responses only.");
} finally { await browser.close(); }

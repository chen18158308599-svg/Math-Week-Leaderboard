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
  const stocks = ["LIB","BOOK","DONA"].map(code => ({ code,price:100,change:0,prices:Array(24).fill(100),clue_en:"Clue coming soon.",clue_zh:"" }));
  const state = () => ({day:1,settledDay:0,phase:"open",close:"22:00",serverTime:new Date().toISOString(),lastSettlement:null,stocks,leaderboard:[],pairing:waiting?"waiting":"none",portfolio:paired?{nickname:"Browser test investor",sessionId:"test-session",cash:5000,assets:5000,holdings:{LIB:0,BOOK:0,DONA:0},expiresAt:new Date(Date.now()+900000).toISOString(),trades:[]}:null});
  const qr = await QRCode.toDataURL(`${origin}/market-pair/test`);
  const page = await context.newPage();
  const errors=[];
  page.on("pageerror",e=>errors.push(e.message));
  await page.route("**/api/stock-market**", async route => {
    const request=route.request();
    if(request.method()==="POST") {
      const body=request.postDataJSON();
      if(body.action==="pair") { waiting=true; await route.fulfill({json:{qr,sessionId:"test-session",expiresAt:new Date(Date.now()+120000).toISOString()}}); }
      else { paired=false;waiting=false;await route.fulfill({json:{ended:true}}); }
    } else await route.fulfill({json:state()});
  });
  await page.goto(origin,{waitUntil:"domcontentloaded"});
  const link=page.getByRole("link",{name:"Open MAT Stock Market",exact:true});
  assert.equal(await link.getAttribute("href"),"/stock-market");
  await link.click();
  await page.waitForURL("**/stock-market");
  const start=page.getByRole("button",{name:"Start trading · Scan to sign in",exact:true});
  await start.waitFor({state:"visible"});
  await page.waitForFunction(()=>[...document.querySelectorAll('button')].some(b=>b.textContent.includes('Start trading')&&!b.disabled));
  const banner=await page.getByRole("heading",{name:"Sign in to start trading"}).boundingBox();
  const cash=await page.getByText("Available cash",{exact:true}).boundingBox();
  assert.ok(banner.y<cash.y,"Sign-in banner must precede the cash summary");
  await start.click();
  await page.getByRole("heading",{name:"Scan to connect",exact:true}).waitFor();
  paired=true;waiting=false;
  await page.getByText("Browser test investor",{exact:true}).waitFor({timeout:15000});
  await page.waitForFunction(()=>![...document.querySelectorAll('dialog[open]')].some(d=>d.textContent.includes('Scan to connect')));
  assert.ok(page.url().endsWith('/stock-market'),"QR close must not return home");
  // A real browser clock proves confirmation gets a fresh inactivity window.
  await page.clock.install();
  await page.clock.runFor(45000);
  assert.ok(page.url().endsWith('/stock-market'));
  assert.equal(await page.getByText("Browser test investor",{exact:true}).count(),1);
  assert.deepEqual(errors,[]);
  await page.screenshot({path:"tmp/market-navigation.png",fullPage:true});
  console.log("PASS: homepage navigates directly, sign-in is above assets, QR confirmation closes only its own dialog, account remains on market after 45s, no browser errors. Mock responses only.");
} finally { await browser.close(); }

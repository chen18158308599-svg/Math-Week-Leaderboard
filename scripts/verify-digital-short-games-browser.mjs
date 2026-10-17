// Browser checks against the real bundled games. Claim requests are mocked.
import assert from "node:assert/strict";
import { createHmac, randomBytes } from "node:crypto";
import { pathToFileURL } from "node:url";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { uniqueSequenceDeck } from "../digital-games/src/scoring/shortGameRules.js";
const seqSource = readFileSync(new URL("../digital-games/src/games/NumberSequence/NumberSequence.jsx",import.meta.url),"utf8");
const bank = vm.runInNewContext(seqSource.slice(seqSource.indexOf("const WAVES = [")+"const WAVES = ".length,seqSource.indexOf("const WAVE_META")).trim().replace(/;$/,""));
const deck = uniqueSequenceDeck(bank);
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
  const home = async () => { await f.getByRole("button",{name:"Open Home navigation",exact:true}).click(); await f.getByRole("button",{name:"Return to Home",exact:true}).click(); };
  await open("Conway");
  await f.locator(".cw-entry-start").click();
  await f.locator(".life-rule-examples article").first().waitFor();
  assert.equal(await f.locator(".life-rule-examples article").count(),4);
  await page.screenshot({path:"output/digital_games/conway-rules-preview.png"});
  await f.getByRole("button",{name:"Got it — start match"}).click();
  await f.locator(".cw-board-blue.is-active").waitFor();
  await f.locator(".game-guide-label").waitFor();
  for (const i of [27,28,29]) await f.locator(".cw-board-blue .cw-cell").nth(i).click();
  await f.locator(".cw-board-panel-one footer button").click();
  for (const i of [27,28,29]) await f.locator(".cw-board-pink .cw-cell").nth(i).click();
  await f.locator(".cw-board-panel-two footer button").click();
  await f.locator('.cw-cell.is-evolving').first().waitFor();
  assert.equal(await f.locator('.game-guide-reopen').count(),0);
  assert.equal(await f.locator('.cw-cell.is-evolving').first().evaluate(el=>getComputedStyle(el).animationName),'cw-generation-tick');
  await f.locator(".cw-summary-card .cw-primary-button").waitFor({timeout:25000});
  await f.locator('.cw-summary-play-hint').waitFor();
  const summaryBox = await f.locator('.cw-summary-card .cw-primary-button').boundingBox();
  const summaryHint = await f.locator('.cw-summary-play-hint').boundingBox();
  assert.ok(summaryHint.y >= summaryBox.y + summaryBox.height, 'Table-tennis prompt sits below the button without covering results');
  await page.screenshot({path:'output/digital_games/conway-summary-preview.png'});
  await f.locator(".cw-summary-card .cw-primary-button").click();
  await f.locator('.cw-table').waitFor();
  assert.equal(await f.locator('.cw-power-panel').count(),0,'Table tennis has no skill controls');
  assert.match(await f.locator('.cw-next-conway').textContent(),/25s LEFT/);
  assert.equal(await f.locator('.cw-serve-button').count(),0,'No central serve button');
  const courtBox=await f.locator('.cw-table').boundingBox();
  const startBall=await f.locator('.cw-ball').getAttribute('style');
  await page.mouse.move(courtBox.x+courtBox.width*.8,courtBox.y+courtBox.height*.2);
  await page.mouse.down();
  await page.mouse.move(courtBox.x+courtBox.width*.75,courtBox.y+courtBox.height*.1,{steps:4});
  await page.mouse.up();
  await page.waitForTimeout(120);
  assert.notEqual(await f.locator('.cw-ball').getAttribute('style'),startBall,'Swinging a paddle serves automatically');
  await page.screenshot({path:'output/digital_games/conway-serve-preview.png'});
  await f.locator('.cw-conway.is-ready').waitFor({timeout:15000});
  assert.equal(await f.locator('.cw-cell.alive').count(),0,'Next point begins with a new cultivation board');
  await home();
  await open("KNN");
  await f.locator(".knn-start-btn").click();
  await f.locator(".map-confirm").click();
  await f.locator(".game-guide-label").waitFor();
  await f.locator('.obj-card').click({force:true});
  assert.match(await f.locator('.game-guide-label strong').textContent(), /Drag the stick/, 'Unrelated taps must not skip the movement hint');
  const stickBox = await f.locator('.stick').boundingBox();
  await page.mouse.move(stickBox.x + stickBox.width / 2, stickBox.y + stickBox.height / 2);
  await page.mouse.down();
  await f.locator('.game-guide-label').waitFor({state:'hidden'});
  assert.equal(await f.locator('.game-guide-label').count(),0, 'Pressing the joystick dismisses the hint before release');
  await page.mouse.up();
  await f.locator('.obj-card').click({force:true});
  assert.equal(await f.locator('.game-guide-label').count(),0,'The interaction hint waits until its control appears');
  const sizes = await f.locator(".stick,.mini-map,.obj-card").evaluateAll(nodes => nodes.map(el => { const b=el.getBoundingClientRect(); return {class:el.className,width:b.width,height:b.height,x:b.x,y:b.y}; }));
  console.log("KNN control geometry",sizes);
  assert.ok(sizes.find(s=>s.class==="stick").width>=140);
  assert.ok(sizes.find(s=>s.class==="mini-map").width>=240);
  await page.screenshot({path:"output/digital_games/knn-controls-preview.png"});
  await home();
  await open("Deal or No Deal");
  await f.locator(".hs4-entry-start").click();
  await f.locator(".game-guide-label").waitFor();
  console.log("Sailing geometry",await f.locator(".hs4-joystick,.hs4-fire-button,.hs4-minimap").evaluateAll(nodes=>nodes.map(el=>({class:el.className,width:el.getBoundingClientRect().width,height:el.getBoundingClientRect().height}))));
  await f.locator('.hs4-action-button.ammo').click();
  assert.equal(await f.locator('.hs4-ammo-resource strong').textContent(),'15');
  assert.equal(await f.locator('.hs4-coins-resource strong').textContent(),'600');
  assert.match(await f.locator('.hs4-purchase-float.credit').textContent(),/5 AMMO/);
  assert.equal(await f.locator('.hs4-coin-particle').count(),4);
  await page.screenshot({path:"output/digital_games/sailing-controls-preview.png"});
  await home();
  await open("Symmetry");
  const gf = page.frames().find(frame=>frame.url().includes("/digital-play/"));
  const startButton = f.locator(".launch-button");
  await startButton.click();
  await f.locator(".symmetry-countdown").waitFor();
  assert.equal(await f.locator(".game-guide-layer").count(),0);
  await page.screenshot({path:"output/digital_games/symmetry-countdown-preview.png"});
  assert.equal(await gf.locator(".symmetry-countdown strong").textContent(),"01:30");
  await home();
  await open("Number Sequence");
  await f.locator(".ns-home-start").click();
  await f.locator(".ns-runes button").first().waitFor();
  await f.locator('.game-guide-label').waitFor({timeout:1000});
  await page.screenshot({path:"output/digital_games/sequence-preview.png"});
  await f.locator('.game-guide-label').waitFor();
  assert.equal(await f.locator('.game-guide-focus').count(),2,'Sequence and all four choices must both be highlighted');
  assert.equal(await f.locator('.game-guide-reopen').count(),0,'Manual How to play buttons have been removed');
  const seenQuestions = new Set();
  for(let i=0;i<9;i++) {
    await f.locator(".ns-runes button:not(:disabled)").first().waitFor();
    const question = await f.locator(".ns-sequence").textContent();
    assert.ok(!seenQuestions.has(question),"No repeated question, including on encounter transitions");
    seenQuestions.add(question);
    if(i===1) {
      await f.locator('.game-guide-label').filter({hasText:'Try Insight'}).waitFor();
      await f.locator('.ns-skill--insight:not(:disabled)').click();
      await f.locator('.game-guide-label').filter({hasText:'Tap an enemy'}).waitFor();
      await f.locator('.ns-minion:not(.is-down):not(:disabled)').first().click();
      await f.locator('.game-guide-label').waitFor({state:'hidden'});
    }
    if(i===5) {
      assert.equal(await f.locator('.game-guide-layer').count(),0,'Final encounter has no automatic hints');
      assert.equal(await f.locator('.ns-boss-shield').textContent(),'SHIELDED');
    }
    const answer = deck[i].answer;
    await f.locator(".ns-rune-value").filter({hasText:new RegExp("^"+answer.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")+"$")}).click();
    if(i===0) assert.equal(await f.locator('.game-guide-layer').count(),0,'Hints stay hidden during answer and defeat animations');
    if(i<8) await gf.waitForFunction(previous=>{
      const q=document.querySelector('.ns-sequence');
      return q && q.textContent!==previous && document.querySelector('.ns-runes button:not(:disabled)');
    },question);
  }
  await f.getByRole("img",{name:"Scan to sign in and claim this result"}).waitFor();
  await f.getByRole("button",{name:"RETURN HOME",exact:true}).click();
  await open("Planarity");
  await f.locator(".versus-only").click();
  await f.locator(".game-guide-label").waitFor();
  await gf.waitForFunction(()=>getComputedStyle(document.querySelector('.planarity-app .game-shell')).filter==='none');
  await page.screenshot({path:"output/digital_games/planarity-preview.png"});
  const intro = await f.locator('.game-guide-label strong').textContent();
  await page.waitForTimeout(600);
  assert.equal(await f.locator('.game-guide-label strong').textContent(),intro,'First hint must not flash away');
  assert.equal(await f.locator('.skill-card').count(),0,'No separate skill controls');
  await f.locator('.versus-status').click();
  assert.equal(await f.locator('.game-guide-layer').count(),1,'Blank clicks do not skip node guidance');
  const firstNode = await f.locator('.side-p1 .graph-node').first().boundingBox();
  await page.mouse.move(firstNode.x + firstNode.width / 2, firstNode.y + firstNode.height / 2);
  await page.mouse.down();
  await f.locator('.game-guide-layer').waitFor({state:'hidden'});
  await page.mouse.up();
  assert.equal(await f.locator('.game-guide-layer').count(),0,'Touching a node dismisses the movement hint');
  await f.locator('.versus-status').click();
  await f.locator('.versus-status').click();
  assert.equal(await f.locator('.game-guide-layer').count(),0,'Blank clicks cannot consume the future attack hint');
  const solveNetwork = async (side = 'p1') => {
    const svg = f.locator(`.side-${side} .graph-svg`);
    const bounds = await svg.boundingBox();
    const count = await svg.locator(".graph-node").count();
    const outer = count - 1;
    for (let i=0; i<count; i++) {
      if ((await svg.locator("..").locator(".crossing-counter").count()) > 0 && /CLEAR/.test(await svg.locator("..").locator(".crossing-counter").textContent())) return;
      const rect = await svg.locator(".graph-node").nth(i).boundingBox();
      assert.ok(rect,`Node ${i} must remain visible during solving`);
      const angle = -Math.PI/2+2*Math.PI*i/outer;
      const x = i===outer?50:50+Math.cos(angle)*38;
      const y = i===outer?32:32+Math.sin(angle)*23;
      await page.mouse.move(rect.x+rect.width/2,rect.y+rect.height/2);
      await page.mouse.down();
      await page.mouse.move(bounds.x+bounds.width*x/100,bounds.y+bounds.height*y/64,{steps:2});
      await page.mouse.up();
    }
  };
  assert.equal(await f.locator('.skill-grid').count(),0,'Skills have been removed');
  for(let i=0;i<4;i++) {
    await solveNetwork();
    if(i<3) await gf.waitForFunction(round=>Number(document.querySelector('.match-status > div strong')?.textContent)>=round,i+2);
  }
  await f.getByRole("img",{name:"Scan to sign in and claim this result"}).waitFor();
  assert.equal(await f.locator(".post-game-player").count(),1,"Only the winning player receives a claim code");
  const frameBox = await page.locator('iframe').boundingBox();
  const p1Qr = await f.locator('.claim-qr').boundingBox();
  assert.ok(p1Qr.x + p1Qr.width / 2 < frameBox.x + frameBox.width / 2,'P1 winner QR is on the left');
  await f.getByRole("button",{name:"RETURN HOME",exact:true}).click();
  await open('Planarity');
  await f.locator('.versus-only').click();
  for(let i=0;i<4;i++) {
    await solveNetwork('p2');
    if(i<3) await gf.waitForFunction(round=>Number(document.querySelector('.match-status > div:last-child strong')?.textContent)>=round,i+2);
  }
  await f.locator('.claim-qr').waitFor();
  const p2Qr = await f.locator('.claim-qr').boundingBox();
  assert.ok(p2Qr.x + p2Qr.width / 2 > frameBox.x + frameBox.width / 2,'P2 winner QR is on the right');
  assert.equal(await f.locator('.post-game-player').count(),1);
  await page.screenshot({path:'output/digital_games/p2-winner-qr-preview.png'});
  await f.getByRole("button",{name:"RETURN HOME",exact:true}).click();
  await open("Symmetry");
  await page.clock.install();
  await f.locator(".launch-button").click();
  for(let i=0;i<89 && !reportedResults.some(r=>r.gameKey==="symmetry");i++) {
    await page.clock.runFor(1000);
    if(await f.locator(".console-question h3").count()) {
      const clockValues = await gf.evaluate(()=>[document.querySelector('.symmetry-countdown strong').textContent,document.querySelector('.symmetry-modal-run-clock strong').textContent]);
      assert.equal(clockValues[0],clockValues[1],'Question and running view share exactly one run clock');
      const question=await f.locator(".console-question h3").textContent();
      const match=question.match(/P\((-?\d+),\s*(-?\d+)\)/);
      if(match) {
        const x=Number(match[1]),y=Number(match[2]);
        const answer=question.includes('y-axis')?[-x,y]:question.includes('x-axis')?[x,-y]:question.includes('180')?[-x,-y]:[y,x];
        const options=f.locator('.security-options button:not(:disabled)');
        for(let j=0;j<await options.count();j++) {
          const text=await options.nth(j).locator('strong').textContent();
          if(text.replace(/\s/g,'')!==`(${answer[0]},${answer[1]})`) { await options.nth(j).click(); break; }
        }
      }
    }
  }
  await f.getByRole("img",{name:"Scan to sign in and claim this result"}).waitFor();
  const survivalResult=reportedResults.find(r=>r.gameKey==="symmetry");
  assert.equal(survivalResult.outcome,"loss");
  assert.ok(survivalResult.finalScore>=1&&survivalResult.finalScore<=9);
  assert.deepEqual(errors,[]);
  console.log("PASS: all six introductions; Conway cultivation to serve; sequence wins with nine distinct questions; Planarity knockout and winner QR; natural Symmetry loss to 1–9 point QR. No real points created.");
} finally { await browser.close(); }


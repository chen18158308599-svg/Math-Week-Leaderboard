import assert from "node:assert/strict";
import { createHmac, randomBytes } from "node:crypto";
import { pathToFileURL } from "node:url";
const { chromium } = await import(pathToFileURL(process.argv[2]).href);
const origin=process.env.MATHWEEK_TEST_ORIGIN||"http://localhost:3000";
const key=createHmac("sha256",process.env.SUPABASE_SERVICE_ROLE_KEY).update("mathweek:site-cookie:v1").digest();
const payload=`${Math.floor(Date.now()/1000)+3600}.${randomBytes(16).toString("hex")}`;
const token=`${payload}.${createHmac("sha256",key).update(payload).digest("hex")}`;
const browser=await chromium.launch({channel:"msedge",headless:true});
try {
  const context=await browser.newContext();
  await context.addCookies([{name:"mathweek-site-access",value:token,url:origin}]);
  const page=await context.newPage();
  const errors=[];page.on("pageerror",e=>errors.push(e.message));
  for(const viewport of [{width:1280,height:720},{width:1440,height:900}]) {
    await page.setViewportSize(viewport);
    await page.goto(origin+"/games");
    const f=page.frameLocator("iframe");
    for(const [name,selector] of [["KNN",".knn-start-btn"],["Symmetry",".launch-button"]]) {
      await f.getByRole("button",{name:"Open "+name,exact:true}).dispatchEvent("click");
      await f.locator(selector).waitFor();
      const geometry=await f.locator(selector).evaluate(el=>{
        const r=el.getBoundingClientRect();
        return {top:r.top,bottom:r.bottom,height:innerHeight,uncovered:el.contains(document.elementFromPoint(r.left+r.width/2,r.top+r.height/2))};
      });
      assert.ok(geometry.top>=0&&geometry.bottom<=geometry.height,`${name} start must be inside ${viewport.width}x${viewport.height}: ${JSON.stringify(geometry)}`);
      assert.ok(geometry.uncovered,`${name} start must not be covered`);
      await page.screenshot({path:`output/digital_games/${name.toLowerCase()}-intro-${viewport.width}.png`});
      await f.locator(selector).click();
      if(name==="KNN") await f.locator(".map-confirm").waitFor();
      else await f.locator(".symmetry-countdown").waitFor();
      await f.getByRole("button",{name:"Open Home navigation",exact:true}).click();
      await f.getByRole("button",{name:"Return to Home",exact:true}).click();
    }
  }
  assert.deepEqual(errors,[]);
  console.log("PASS: KNN and Mirror Rush start buttons are uncovered, on screen and clickable at 1280x720 and 1440x900.");
} finally {await browser.close();}

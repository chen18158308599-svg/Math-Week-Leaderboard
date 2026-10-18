const { chromium } = await import(process.argv[2] || 'playwright');
import { createHmac, randomBytes } from 'node:crypto';
import { mkdirSync } from 'node:fs';
mkdirSync('output/explore_week', {recursive:true});
const browser = await chromium.launch({channel:'msedge', headless:true});
const context = await browser.newContext({viewport:{width:1440,height:1000}});
const key = createHmac('sha256',process.env.SUPABASE_SERVICE_ROLE_KEY).update('mathweek:site-cookie:v1').digest();
const payload = `${Math.floor(Date.now()/1000)+3600}.${randomBytes(16).toString('hex')}`;
await context.addCookies([{name:'mathweek-site-access',value:`${payload}.${createHmac('sha256',key).update(payload).digest('hex')}`,url:'http://localhost:3000'}]);
const page = await context.newPage();
page.setDefaultNavigationTimeout(120000);
const errors=[];
page.on('pageerror', e=>errors.push(e.message));
page.on('response',r=>{if(r.status()>=400 && /whats-on-today|_next\/image/.test(r.url()))errors.push(`${r.status()} ${r.url()}`)});
for(const width of [1440,390]) {
 await page.setViewportSize({width,height:1000});
 await page.goto('http://localhost:3000/leaderboard');
 await page.getByRole('heading',{name:'How to gain points',exact:true}).waitFor();
 for(const title of ['Solve a puzzle card','Play a digital game','Take a committee challenge']) {
  const button=page.getByRole('button',{name:new RegExp('^'+title)});
  await button.click();
  await page.getByRole('dialog').getByRole('heading',{name:title,exact:true}).waitFor();
  await page.keyboard.press('Escape');
  if(!await button.evaluate(el=>el===document.activeElement))throw Error('Focus was not restored');
  await button.press('Enter');
  await page.getByRole('button',{name:'Back to leaderboard',exact:true}).click();
 }
 const image=page.getByRole('img',{name:/Math Week awards/});
 await image.scrollIntoViewIfNeeded();
 await image.evaluate(img=>img.decode());
 if(await page.getByRole('link',{name:/View activities/}).count())throw Error('Old link remains');
 if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth))throw Error('Overflow');
 await page.evaluate(()=>window.scrollTo(0,0));
 await page.screenshot({path:`output/explore_week/leaderboard-guide-${width}.png`,fullPage:true});
 console.log('Leaderboard guide',width,'passed');
}
await browser.close();
if(errors.length)throw Error(errors.join('\n'));

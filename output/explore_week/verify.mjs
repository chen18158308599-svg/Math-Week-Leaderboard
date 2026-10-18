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
for (const width of [1920,1440,768,390,320]) {
 await page.setViewportSize({width,height:width>=1440?1080:844});
 for (const [name,path] of (process.argv.includes('--directory-only') ? [['directory','/directory']] : [['directory','/directory'],['home','/']])) {
  await page.goto('http://localhost:3000'+path); await page.waitForTimeout(1200);
  if(name==='home') await page.getByRole('button',{name:'Pause',exact:true}).click();
  if(name==='directory') {
   for(const img of await page.locator('img').all()) await img.scrollIntoViewIfNeeded();
   await page.evaluate(()=>window.scrollTo(0,0));
   await page.waitForTimeout(600);
   const showcase=page.getByRole('region',{name:'Math Week highlights'});
   if(width===1920) {
    await page.waitForTimeout(5500);
    if(!await showcase.locator('img').getAttribute('src').then(src=>src.includes('prizes-composite')))throw Error('Auto rotation failed');
   }
   await showcase.getByRole('button',{name:'Previous slide',exact:true}).click();
   await showcase.getByRole('button',{name:'Next slide',exact:true}).click();
   await showcase.getByRole('button',{name:'Show ★ Awards',exact:true}).click();
   if(!await showcase.locator('img').getAttribute('src').then(src=>src.includes('prizes-composite')))throw Error('Awards slide missing');
   await showcase.getByRole('button',{name:'Show Puzzle Cards & Mystery Chest',exact:true}).click();
   await showcase.getByText('PHOTO COMING SOON',{exact:true}).waitFor();
   await showcase.getByRole('button',{name:'Show Math Week',exact:true}).click();
   if(await page.getByRole('navigation',{name:'Choose an event date'}).getByRole('button').count()!==7)throw Error('Date buttons missing');
   await page.getByRole('button',{name:/Sun 25/}).click();
   await page.getByText('Visiting on Sunday?',{exact:false}).waitFor();
   await page.getByRole('button',{name:/Mon 19/}).click();
   if(await page.locator('[class*="experienceGrid"] > button').count()!==7)throw Error('Missing experiences');
   await page.locator('[class*="experienceGrid"] > button').first().click();
   await page.getByRole('button',{name:'Back to exploring'}).click();
   await page.evaluate(()=>window.scrollTo(0,0));
  }
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);
  if(overflow)errors.push(`Horizontal overflow ${name} ${width}`);
  await page.screenshot({path:`output/explore_week/after-${name}-${width}.png`,fullPage:true});
  console.log(name,width,'overflow:',overflow);
  if(name==='home') {
   const link=page.getByRole('link',{name:"Open What's on",exact:true});
   await link.focus();await page.keyboard.press('Enter');await page.waitForURL('**/directory');
  }
 }
}
console.log('Errors:',JSON.stringify(errors));
if(errors.length)process.exitCode=1;
await browser.close();


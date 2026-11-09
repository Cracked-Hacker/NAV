// Test real packaged pages without replacing auth scripts or disabling CSP.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {existsSync,readFileSync,mkdirSync,writeFileSync,statSync} from 'node:fs';
import {resolve,extname,sep} from 'node:path';
import {chromium} from 'playwright';
import AxeBuilder from '@axe-core/playwright';
const out=process.env.NAV_QA_OUTPUT||'qa-screenshots';
mkdirSync(out,{recursive:true});
const root=resolve('.site-build');
let server,base=process.env.NAV_QA_URL;
const mime={'.html':'text/html','.css':'text/css','.js':'text/javascript','.mjs':'text/javascript','.pdf':'application/pdf','.webp':'image/webp','.xml':'application/xml','.txt':'text/plain'};
if(!base){
  assert.ok(existsSync(root+'/index.html'),'Build the public artifact first');
  server=createServer((req,res)=>{
    const url=new URL(req.url,'http://localhost');
    if(url.pathname==='/account.html'){res.writeHead(301,{Location:'/account/'+url.search});return res.end();}
    let file=resolve(root,'.'+decodeURIComponent(url.pathname));
    if(file!==root&&!file.startsWith(root+sep)){res.writeHead(403);return res.end();}
    if(existsSync(file)&&statSync(file).isDirectory())file=resolve(file,'index.html');
    if(!existsSync(file)){res.writeHead(404);return res.end('Not found');}
    res.writeHead(200,{'Content-Type':mime[extname(file)]||'application/octet-stream'});res.end(readFileSync(file));
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  base=`http://127.0.0.1:${server.address().port}/`;
}
const channel=process.env.NAV_BROWSER_CHANNEL||(process.platform==='win32'?'chrome':undefined);
const browser=await chromium.launch({headless:true,...(channel?{channel}:{})});
const context=await browser.newContext({reducedMotion:'reduce'});
const page=await context.newPage();
const errors=[],missing=[],results=[],accessibility=[];
page.on('pageerror',e=>errors.push(e.message));
page.on('response',r=>{if(r.url().startsWith(base)&&r.status()>=400)missing.push({url:r.url(),status:r.status()});});
const routes=['','coaching.html','nav-coach.html','coach-nate.html','resume.html','research.html','classroom/','classroom/course/week-1/index.html','account/auth.html?mode=login','account/auth.html?mode=signup','account/auth.html?mode=reset'];
try{
  for(const width of [320,390,768,1024,1440,1920]){
    await page.setViewportSize({width,height:1000});
    for(const route of routes){
      const response=await page.goto(new URL(route,base).href,{waitUntil:'networkidle'});
      assert.ok(response.ok(),`${route}: ${response.status()}`);
      if(route.startsWith('account/auth'))await page.locator('form:not([hidden]) button').waitFor({state:'visible'});
      await page.evaluate(async()=>{for(const img of document.images)img.loading='eager';await Promise.all([...document.images].map(img=>img.decode().catch(()=>{})));});
      const metrics=await page.evaluate(()=>({width:innerWidth,scrollWidth:document.documentElement.scrollWidth,h1:document.querySelectorAll('h1').length,
        cardWidth:document.querySelector('.account-wrap--auth .account-card')?.getBoundingClientRect().width,
        columns:document.querySelector('.account-auth-layout')?getComputedStyle(document.querySelector('.account-auth-layout')).gridTemplateColumns.split(' ').length:null,
        brokenImages:[...document.images].filter(i=>!i.naturalWidth).map(i=>i.getAttribute('src'))}));
      assert.equal(metrics.width,width);
      assert.ok(metrics.scrollWidth<=width+1,`${route}/${width}: horizontal overflow ${metrics.scrollWidth}`);
      assert.equal(metrics.h1,1,`${route}: one page heading`);
      assert.deepEqual(metrics.brokenImages,[],`${route}: broken images`);
      if(metrics.cardWidth){assert.equal(metrics.columns,width>1100?2:1);assert.ok(metrics.cardWidth>=(width>=1440?520:240));}
      results.push({route,width,...metrics});
      const name=(route||'home').replaceAll(/[^a-z0-9]+/gi,'-');
      await page.screenshot({path:`${out}/${name}-${width}.png`,fullPage:true});
      if([390,1440].includes(width)){
        const audit=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze();
        accessibility.push({route,width,violations:audit.violations.map(v=>({id:v.id,impact:v.impact,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary}))}))});
      }
    }
    if(width<=1024){await page.goto(base);await page.locator('.mobile-nav summary').click();await page.locator('.mobile-nav [data-nav-signup]').click();await page.locator('#signup-form').waitFor({state:'visible'});}
    console.log(`PASS rendered ${routes.length} pages at ${width}px`);
  }
  await page.setViewportSize({width:1440,height:1000});
  await page.goto(new URL('account/auth.html?mode=login',base).href);
  await page.keyboard.press('Tab');
  assert.ok(await page.locator('.skip-link').evaluate(el=>el===document.activeElement),'Keyboard skip link');
  await page.keyboard.press('Enter');
  await page.getByRole('button',{name:'Log In',exact:true}).click();
  assert.equal(await page.locator('#login-form input[name=email]').evaluate(el=>el.validity.valueMissing),true);
  await page.getByRole('link',{name:'Forgot your password?'}).click();await page.locator('#reset-form').waitFor({state:'visible'});
  await page.goto(new URL('account/',base).href);await page.waitForURL(/account\/auth(?:\.html)?\?mode=login/);
  const poster=await context.request.get(new URL('assets/coach-nate-research-poster.pdf',base).href);
  assert.equal(poster.status(),200);assert.ok((await poster.body()).subarray(0,5).toString().startsWith('%PDF-'));
  assert.deepEqual(errors,[],'Browser script exceptions');assert.deepEqual(missing,[],'Missing public assets');
  writeFileSync(`${out}/report.json`,JSON.stringify({base,checkedAt:new Date().toISOString(),results,accessibility,errors,missing,
    journeys:['mobile menu → Create Account','keyboard skip link','native empty-login validation','forgot-password form','signed-out My NAV guard','poster PDF bytes'],
    notVerified:['new-user email confirmation','authenticated website/app round trip','real client/coach/dual-role production sessions','password recovery email and expiry']},null,2));
  const violations=accessibility.flatMap(a=>a.violations.map(v=>({...v,route:a.route,width:a.width})));
  assert.deepEqual(violations,[],'Automated WCAG A/AA violations; see report.json');
  console.log(`PASS ${results.length} viewport/page checks, ${accessibility.length} accessibility audits and critical public journeys`);
}finally{await browser.close();if(server)await new Promise(resolve=>server.close(resolve));}

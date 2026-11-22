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
const routes=['','coaching.html','nav-coach.html','coach-nate.html','resume.html','research.html','classroom/','account/auth.html?mode=login','account/auth.html?mode=signup','account/auth.html?mode=reset'];
try{
  for(const width of [320,390,768,1024,1440,1920]){
    await page.setViewportSize({width,height:1000});
    for(const route of routes){
      const response=await page.goto(new URL(route,base).href,{waitUntil:'networkidle'});
      assert.ok(response.ok(),`${route}: ${response.status()}`);
      if(route.startsWith('account/auth'))await page.locator(route.includes('mode=reset')?'#reset-form a.button':'form:not([hidden]) button').waitFor({state:'visible'});
      await page.evaluate(async()=>{for(const img of document.images)img.loading='eager';await Promise.all([...document.images].map(img=>img.decode().catch(()=>{})));});
      const metrics=await page.evaluate(()=>({width:innerWidth,scrollWidth:document.documentElement.scrollWidth,h1:document.querySelectorAll('h1').length,
        cardWidth:document.querySelector('.account-wrap--auth .account-card')?.getBoundingClientRect().width,
        columns:document.querySelector('.account-auth-layout')?getComputedStyle(document.querySelector('.account-auth-layout')).gridTemplateColumns.split(' ').length:null,
        brokenImages:[...document.images].filter(i=>!i.naturalWidth).map(i=>i.getAttribute('src'))}));
      assert.equal(metrics.width,width);
      if(metrics.scrollWidth>width+1){
        const culprits=await page.evaluate(()=>[...document.querySelectorAll('body *')]
          .filter(el=>el.getBoundingClientRect().right>innerWidth+1)
          .slice(0,15).map(el=>({tag:el.tagName,classes:el.className?.toString().slice(0,90),right:Math.round(el.getBoundingClientRect().right),width:Math.round(el.getBoundingClientRect().width)})));
        console.error('Horizontal overflow diagnostics',JSON.stringify({route,width,culprits}));
      }
      assert.ok(metrics.scrollWidth<=width+1,`${route}/${width}: horizontal overflow ${metrics.scrollWidth}`);
      assert.equal(metrics.h1,1,`${route}: one page heading`);
      assert.equal(await page.locator('.desktop-nav a').filter({hasText:'Coach Nate'}).count(),1,`${route}: one Coach Nate link after Netlify Pretty URLs`);
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
    if(width<=1024){await page.goto(base);await page.locator('.mobile-nav > summary').click();await page.locator('.mobile-nav .nav-dropdown').filter({has:page.locator('summary').filter({hasText:'Account'})}).locator('summary').click();await page.locator('.mobile-nav').getByRole('link',{name:'Create Account'}).click();await page.locator('#signup-form').waitFor({state:'visible'});}
    console.log(`PASS rendered ${routes.length} pages at ${width}px`);
  }
  // Blinnergy reviews: only complete verbatim source copy, without summaries or inactive arrows.
  await page.setViewportSize({width:390,height:900});
  await page.goto(new URL('coaching.html',base).href,{waitUntil:'networkidle'});
  const reviewTrack=page.locator('[data-review-track]');
  const reviewSlides=reviewTrack.locator('[data-review-slide]');
  assert.equal(await reviewSlides.count(),1,'One fully sourced review; no summary-only slides');
  assert.equal((await reviewSlides.first().locator('blockquote').textContent()).trim(),'“Great place. Nate is a great instructor and he was amazing. First time here and I highly recommend this place :)”');
  assert.equal(await page.locator('.blinnergy-reviews .blinnergy-review-source').count(),1);
  assert.ok(await page.locator('.blinnergy-review-controls').isHidden(),'No dead arrows on one review');
  assert.equal(await page.locator('.blinnergy-review-access,.blinnergy-review-subject,.blinnergy-review-note,.blinnergy-review-more,.blinnergy-review-venue-stars').count(),0);
  assert.equal(await page.locator('a').filter({hasText:'Get the Blinnergy App'}).count(),1);
  console.log('PASS full Blinnergy review quote, source link, clean presentation, no dead controls');
  await page.setViewportSize({width:1440,height:1000});
  await page.goto(new URL('account/auth.html?mode=login',base).href);
  await page.keyboard.press('Tab');
  assert.ok(await page.locator('.skip-link').evaluate(el=>el===document.activeElement),'Keyboard skip link');
  await page.keyboard.press('Enter');
  await page.getByRole('button',{name:'Log In',exact:true}).click();
  assert.equal(await page.locator('#login-form input[name=email]').evaluate(el=>el.validity.valueMissing),true);
  await page.getByRole('link',{name:'Forgot your password?'}).click();await page.locator('#reset-form').waitFor({state:'visible'});
  await page.locator('#reset-form a.button').click();
  await page.getByRole('heading',{name:"We'll send you a reset link.",exact:true}).waitFor({state:'visible'});
  await page.goto(new URL('account/',base).href);await page.waitForURL(/account\/auth(?:\.html)?\?mode=login/);
  // Unreleased lessons are excluded from the public artifact rather than
  // cosmetically hidden behind a browser-only code form.
  await page.goto(new URL("classroom/",base).href);
  assert.match(await page.locator("h1").textContent(),/Private testing is in development/i);
  assert.equal(await page.locator('a[href="https://nav-coach-app-eight.vercel.app/beta"]').count(),0);
  assert.equal(await page.locator('a[href="../contact.html"]').count() >= 1,true,"Contact option remains available");
  for (const hidden of ["classroom/quizzes.html","classroom/labs.html",
    "classroom/course/week-1/index.html","classroom/weekly-question-bank.js",
    "classroom/classroom.js"]) {
    const response=await context.request.get(new URL(hidden,base).href);
    assert.equal(response.status(),404,`${hidden}: unreleased file must not ship to Netlify`);
  }
  console.log("PASS public catalog has no unpublished course pages or quiz answer bank");
  // Study Tools: verify uncapped custom amounts, Venmo URL data, and copy on slider release.
  await page.goto(new URL('products.html',base).href,{waitUntil:'networkidle'});
  await page.locator('#muscle-card-options > summary').click();
  const customAmount=page.locator('#muscle-contribution-custom');
  const paymentLink=page.locator('#muscle-cards .study-download-actions a[href^="https://venmo.com/"]');
  await customAmount.fill('275');
  const suggestedPayment=new URL(await paymentLink.getAttribute('href'));
  assert.equal(suggestedPayment.searchParams.get('txn'),'pay');
  assert.equal(suggestedPayment.searchParams.get('amount'),'275.00');
  assert.equal(suggestedPayment.searchParams.get('note'),'NAV Ultimate Muscle Card Set');
  assert.equal(await customAmount.inputValue(),'275','Amounts over $100 stay available');
  // Browser permission prompts vary; instrument the clipboard to verify truthful confirmation.
  await page.evaluate(()=>{
    Object.defineProperty(navigator,'clipboard',{configurable:true,value:{
      writeText:async value=>{window.__copiedAmount=value;}
    }});
  });
  await page.locator('#muscle-contribution').evaluate(el=>{
    el.value='42';
    el.dispatchEvent(new Event('input',{bubbles:true}));
    el.dispatchEvent(new Event('change',{bubbles:true}));
  });
  await page.waitForFunction(()=>window.__copiedAmount==='42.00');
  assert.equal(await customAmount.inputValue(),'42');
  assert.match(await page.locator('#muscle-amount-explanation').textContent(),/Copied \$42\.00/);
  await customAmount.fill('0');
  assert.equal(await paymentLink.getAttribute('href'),'https://venmo.com/u/Nate-Holochwost');
  for (const id of ['muscle-cards','science-atlases','nutrition-guide']) {
    assert.ok(await page.locator('#'+id+' a[download]').count()>0,id+' must allow free download');
  }
  // All product cards now use the same compact disclosure; open each before interacting.
  await page.locator('#atlas-options > summary').click();
  assert.equal(await page.locator('#muscle-card-options').evaluate(el=>el.open),false,'Opening atlas should close flashcard options');
  assert.equal(await page.locator('#atlas-options').evaluate(el=>el.open),true,'Atlas options must open');
  await page.locator('#nutrition-options > summary').click();
  assert.equal(await page.locator('#atlas-options').evaluate(el=>el.open),false,'Opening nutrition should close atlas options');
  assert.equal(await page.locator('#nutrition-options').evaluate(el=>el.open),true,'Nutrition options must open');
  await page.locator('#nutrition-contribution-custom').fill('275');
  const nutritionPayment=new URL(await page.locator('#nutrition-venmo').getAttribute('href'));
  assert.equal(nutritionPayment.searchParams.get('txn'),'pay');
  assert.equal(nutritionPayment.searchParams.get('amount'),'275.00');
  assert.equal(nutritionPayment.searchParams.get('note'),'NAV Performance Nutrition Guide');
  console.log('PASS Learning Resources downloads and separate optional contributions');

  // Independent rendered copy crawl: source inventory also covers closed disclosure
  // and metadata text. This checks actual released page copy and controls.
  const copyCrawl=[];
  const publicCopyRoutes=['404.html','about.html','accessibility.html','coach-nate.html',
    'coaching.html','contact.html','disclaimer.html','index.html','nav-coach.html',
    'products.html','privacy.html','research.html','resources.html','resume.html',
    'science.html','terms.html','classroom/'];
  for(const width of [390,1440]){
    await page.setViewportSize({width,height:1000});
    for(const route of publicCopyRoutes){
      const response=await page.goto(new URL(route,base).href,{waitUntil:'domcontentloaded'});
      assert.ok(response.ok(),route+' must render');
      const visible=await page.evaluate(()=>{
        for(const el of document.querySelectorAll('details'))el.open=true;
        const interactive=[...document.querySelectorAll('button,summary,a')];
        const unnamed=interactive.filter(el=>el.getClientRects().length&&
          !(el.getAttribute('aria-label')||el.textContent||el.querySelector('img[alt]')?.getAttribute('alt')||'').trim())
          .map(el=>el.outerHTML.slice(0,160));
        return {textLength:document.body.innerText.length,interactiveCount:interactive.length,
          unnamed,scrollWidth:document.documentElement.scrollWidth,
          overflowing:[...document.querySelectorAll('body *')].filter(el=>el.getClientRects().length && el.getBoundingClientRect().right>innerWidth+1).slice(0,6).map(el=>el.tagName.toLowerCase()+(el.className&&typeof el.className==='string'?'.'+el.className.trim().replace(/\s+/g,'.'):'')),
          h1:document.querySelectorAll('h1').length};
      });
      assert.equal(visible.h1,1,route+' heading');
      assert.ok(visible.textLength>30,route+' should contain readable copy');
      assert.deepEqual(visible.unnamed,[],route+' has an unnamed control');
      assert.ok(visible.scrollWidth<=width+1,route+'/'+width+' horizontal overflow: '+visible.overflowing.join(', '));
      copyCrawl.push({route,width,...visible});
    }
  }
  console.log('PASS rendered copy crawl of '+copyCrawl.length+' page/viewport combinations');
  const poster=await context.request.get(new URL('assets/coach-nate-research-poster.pdf',base).href);
  assert.equal(poster.status(),200);assert.ok((await poster.body()).subarray(0,5).toString().startsWith('%PDF-'));
  assert.deepEqual(errors,[],'Browser script exceptions');assert.deepEqual(missing,[],'Missing public assets');
  writeFileSync(`${out}/report.json`,JSON.stringify({base,checkedAt:new Date().toISOString(),results,copyCrawl,accessibility,errors,missing,
    journeys:['public beta status → contact; unverified redemption absent','unpublished course assets return 404','mobile menu → Create Account','keyboard skip link','native empty-login validation','website recovery → canonical app reset form','signed-out My NAV guard','poster PDF bytes'],
    notVerified:['new-user email confirmation','authenticated website/app round trip','real client/coach/dual-role production sessions','password recovery email and expiry']},null,2));
  const violations=accessibility.flatMap(a=>a.violations.map(v=>({...v,route:a.route,width:a.width})));
  assert.deepEqual(violations,[],'Automated WCAG A/AA violations; see report.json');
  console.log(`PASS ${results.length} viewport/page checks, ${accessibility.length} accessibility audits and critical public journeys`);
}finally{await browser.close();if(server)await new Promise(resolve=>server.close(resolve));}

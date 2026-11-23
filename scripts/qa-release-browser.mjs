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
const routes=['','coaching.html','nav-coach.html','coach-nate.html','research.html','classroom/','account/auth.html?mode=login','account/auth.html?mode=signup','account/auth.html?mode=reset'];
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

  // The résumé page was retired; the primary CTA opens the approved PDF.
  await page.goto(new URL('coach-nate.html',base).href,{waitUntil:'domcontentloaded'});
  const resumeButton=page.locator('section.hero a.btn');
  assert.equal(await resumeButton.textContent(),'View Resume');
  assert.equal(await resumeButton.getAttribute('href'),'assets/pdf/Nathan_Holochwost_Resume_2026-11.pdf');
  assert.equal(await resumeButton.getAttribute('target'),'_blank');
  assert.equal(await resumeButton.getAttribute('rel'),'noopener noreferrer');
  const resumePDFResponse=await context.request.get(new URL('assets/pdf/Nathan_Holochwost_Resume_2026-11.pdf',base).href);
  assert.equal(resumePDFResponse.status(),200,'Direct résumé PDF must exist');
  assert.ok((await resumePDFResponse.body()).subarray(0,5).toString().startsWith('%PDF-'),'Résumé must have real PDF bytes');
  console.log('PASS direct View Resume PDF with no intermediate HTML page');

  // Story link from About NAV now leads to four complete Coach Nate essays.
  await page.goto(new URL('about.html',base).href,{waitUntil:'domcontentloaded'});
  const storyLink=page.locator('a[href="coach-nate.html#my-story"]');
  assert.equal(await storyLink.count(),1,'About must link directly to the personal essays');
  await storyLink.click();
  await page.waitForURL(url=>url.pathname.endsWith('/coach-nate.html')&&url.hash==='#my-story');
  const storyCards=page.locator('#my-story article.story-essay');
  assert.equal(await storyCards.count(),4,'All four personal essays must be on Coach Nate');
  assert.equal(await page.locator('#my-story h2').textContent(),'My story');
  for(const width of [320,390,768,1024,1440,1920]){
    await page.setViewportSize({width,height:1000});
    const dimensions=await storyCards.evaluateAll(cards=>cards.map(card=>{
      const rect=card.getBoundingClientRect();
      const summary=card.querySelector('details.essay-disclosure summary');
      return {width:rect.width,height:rect.height,overflow:card.scrollHeight-card.clientHeight,readMore:summary?.getBoundingClientRect().height||0};
    }));
    assert.ok(dimensions.every(card=>Math.abs(card.width-dimensions[0].width)<=1),width+': story preview card widths differ');
    assert.ok(dimensions.every(card=>Math.abs(card.height-dimensions[0].height)<=1),width+': story preview card heights differ');
    assert.ok(dimensions.every(card=>card.overflow<=2 && card.readMore>=40),width+': story preview content clips or control disappears');
  }
  await page.setViewportSize({width:1440,height:1000});
  const storyDisclosure=storyCards.first().locator('details.essay-disclosure');
  await storyDisclosure.locator('summary').click();
  assert.equal(await storyDisclosure.evaluate(el=>el.open),true,'Read more expands original essay');
  const expandedMetrics=await page.locator('#my-story').evaluate(section=>{
    const grid=section.querySelector('.story-grid');
    const active=grid.querySelector('.essay-disclosure[open]').closest('article.story-essay');
    return {fullWidth:Math.abs(active.getBoundingClientRect().width-grid.getBoundingClientRect().width)<2,
      autoRows:getComputedStyle(grid).gridAutoRows};
  });
  assert.equal(expandedMetrics.fullWidth,true,'Expanded essay should occupy full reading width');
  assert.equal(expandedMetrics.autoRows,'auto','Expanding one essay must not stretch other rows to its height');
  assert.equal(await storyDisclosure.locator('summary').evaluate(el=>getComputedStyle(el).display),'none','Expanded button disappears');
  await storyDisclosure.locator('.essay-rest p').first().click();
  assert.equal(await storyDisclosure.evaluate(el=>el.open),false,'Clicking expanded card collapses it');
  console.log('PASS About → Coach Nate story link and four expandable personal essays');

  // Blinnergy: link to the actual Google reviews-list view without republishing reviewer content.
  await page.setViewportSize({width:390,height:900});
  await page.goto(new URL('coaching.html',base).href,{waitUntil:'networkidle'});
  const reviewSection=page.locator('.blinnergy-reviews');
  const reviewLink=reviewSection.locator('a.blinnergy-review-source-link');
  assert.equal(await reviewLink.count(),1,'One discreet review-source link, not a bulky CTA');
  assert.equal((await reviewLink.textContent()).trim(),'Blinnergy reviews on Google','No hidden or visible filler in the link label');
  assert.equal(await reviewLink.getAttribute('href'),"https://www.google.com/search?hl=en-US&gl=us&q=Blinnergy+Woodinville+WA#lrd=0x549006e72bbb6539:0x1f73ce46e1cb9651,1,,,");
  assert.equal((await reviewSection.locator('.blinnergy-review-summary strong').textContent()).trim(),'Coach Nate');
  assert.equal((await reviewSection.locator('.blinnergy-review-summary .blinnergy-review-stars').textContent()).trim(),'★★★★★');
  assert.equal((await reviewSection.locator('.blinnergy-review-count').textContent()).trim(),'(10+ reviews)');
  assert.equal(await reviewSection.locator('p,.button').count(),0,'No filler or duplicate CTA');
  assert.equal(await reviewSection.locator('blockquote,.blinnergy-review-slide').count(),0,'No unauthorized review transcriptions or reviewer names in public site');
  assert.equal(await page.locator('a').filter({hasText:'Get the Blinnergy App'}).count(),1);
  assert.equal(await page.locator('.blinnergy-rating').count(),0,'No second link to same review list');
  console.log('PASS Google reviews-list deep link, no reproduced third-party review text, original Blinnergy booking');

  // Standard motion exercises the animation; accessibility audits above use reduced motion.
  await page.emulateMedia({reducedMotion:'no-preference'});
  // The EXOS joke is off until clicked, drops the real card words under gravity,
  // and restores the original copy exactly 11 seconds later.
  const exosCard=page.locator('[data-exos-card]');
  const joke=exosCard.locator('[data-exos-trigger]');
  assert.equal(await joke.count(),1);
  assert.ok(await joke.evaluate(el=>Boolean(el.compareDocumentPosition(document.querySelector('.exos-gfit-label')) & Node.DOCUMENT_POSITION_FOLLOWING)),'Button comes before affiliation label');
  assert.equal(await page.locator('.exos-falling-word').count(),0);
  const originalExosText=await exosCard.locator('[data-exos-fall]').allTextContents();
  await joke.click();
  assert.equal(await joke.textContent(),'Reset in 11s');
  await page.locator('.exos-falling-word').first().waitFor({state:'visible'});
  assert.ok(await page.locator('.exos-falling-word').count()>=20,'Visible text must split into falling words');
  assert.ok(await joke.isDisabled(),'Prevent retriggering while chaos is active');
  assert.equal(await page.locator('.exos-blast-layer').count(),1,'Explosion animation shown');
  assert.ok(await exosCard.evaluate(el=>el.classList.contains('exos-in-chaos')));
  await page.waitForTimeout(1800);
  assert.equal(await page.locator('.exos-blast-layer').count(),0,'Explosion overlay ends promptly');
  assert.equal(await page.locator('body.exos-screen-shaking').count(),0,'Screen shake ends in about a second');
  assert.ok(await page.locator('.exos-falling-word').first().evaluate(el=>getComputedStyle(el).transform!=='none'),'Words really move');
  assert.match(await joke.textContent(),/Reset in (9|10)s/);
  const word=page.locator('.exos-falling-word').last();
  const wordBox=await word.boundingBox();
  await page.mouse.move(wordBox.x-20,wordBox.y);
  await page.mouse.move(wordBox.x+20,wordBox.y+5,{steps:5});
  assert.equal(await exosCard.evaluate(el=>getComputedStyle(el).overflow),'hidden');
  await page.waitForTimeout(9700);
  assert.equal(await page.locator('.exos-falling-word').count(),0,'Words restore after eleven seconds');
  assert.ok(await joke.isEnabled(),'Button is usable after reset');
  assert.deepEqual(await exosCard.locator('[data-exos-fall]').allTextContents(),originalExosText);
  assert.equal(await joke.textContent(),'this button does nothing');
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.clock.install({time:new Date('2026-01-01T00:00:00Z')});
  await page.clock.pauseAt(new Date('2026-01-01T00:00:01Z'));
  await joke.click();
  assert.equal(await joke.textContent(),'Reset in 11s');
  assert.equal(await page.locator('.exos-falling-word,.exos-blast-layer').count(),0);
  await page.clock.runFor(10000);
  assert.equal(await joke.textContent(),'Reset in 1s');
  assert.ok(await joke.isDisabled());
  await page.clock.runFor(999);
  assert.ok(await joke.isDisabled());
  await page.clock.runFor(1);
  assert.ok(await joke.isEnabled());
  assert.equal(await joke.textContent(),'this button does nothing');
  assert.equal(await exosCard.locator('[data-exos-status]').textContent(),'');
  await page.emulateMedia({reducedMotion:'no-preference'});
  const trajectories=[];
  const startingTrajectories=[];
  for (const interact of [false,true]) {
    await page.clock.runFor(16 - await page.evaluate(()=>performance.now()%16));
    await page.evaluate(() => {
      window.originalRandom = Math.random;
      let seed=42;
      Math.random=()=>((seed=(seed*1664525+1013904223)>>>0)/4294967296);
    });
    await joke.click();
    await page.evaluate(()=>{Math.random=window.originalRandom;});
    await page.clock.runFor(3000);
    const pile=await exosCard.evaluate(card=>{
      const box=card.getBoundingClientRect();
      const words=[...card.querySelectorAll('.exos-falling-word')];
      const labelWords=words.slice(-5);
      return {bottom:box.bottom,lowest:Math.max(...words.map(w=>w.getBoundingClientRect().bottom)),
        label:labelWords.map(w=>w.textContent),
        labelLowest:Math.max(...labelWords.map(w=>w.getBoundingClientRect().bottom))};
    });
    assert.deepEqual(pile.label,['Exos','@','Google','\u00b7','gFit'],'Affiliation label joins the falling words');
    assert.ok(pile.lowest>pile.bottom-35,'Words reach the bottom of the white card');
    assert.ok(pile.labelLowest>pile.bottom-100,'Affiliation label joins the pile at the bottom');
    startingTrajectories.push(await exosCard.locator('.exos-falling-word').evaluateAll(words=>words.map(w=>w.style.transform)));
    if(interact){
      const rect=await page.locator('.exos-falling-word').last().boundingBox();
      await exosCard.dispatchEvent('pointermove',{clientX:rect.x+rect.width/2-15,clientY:rect.y+rect.height/2});
      await exosCard.dispatchEvent('pointermove',{clientX:rect.x+rect.width/2,clientY:rect.y+rect.height/2});
    }
    await page.clock.runFor(160);
    trajectories.push(await exosCard.locator('.exos-falling-word').evaluateAll(words=>words.map(w=>w.style.transform)));
    await page.clock.runFor(7839);
    assert.ok(await joke.isDisabled(),'Animated mode remains active at 10,999ms');
    await page.clock.runFor(1);
    assert.ok(await joke.isEnabled(),'Animated mode resets at 11,000ms');
    assert.equal(await page.locator('.exos-falling-word,.exos-blast-layer').count(),0);
    assert.deepEqual(await exosCard.locator('[data-exos-fall]').allTextContents(),originalExosText);
  }
  assert.deepEqual(startingTrajectories[0],startingTrajectories[1],'Seeded runs match before pointer interaction');
  assert.notDeepEqual(trajectories[0],trajectories[1],'Pointer impulses change seeded word trajectories');
  await page.clock.resume();
  console.log('PASS EXOS explosion, pointer input, countdown, exact deadline, reduced motion and restoration');

  // Reduced motion disables the blast, shake and falling words; the button remains usable.
  await page.emulateMedia({reducedMotion:'reduce'});
  await joke.click();
  assert.equal(await page.locator('.exos-falling-word,.exos-blast-layer').count(),0,'Reduced-motion preference suppresses effects');
  assert.equal(await exosCard.evaluate(el=>el.classList.contains('exos-in-chaos')),false);
  assert.match(await exosCard.locator('[data-exos-status]').textContent(),/reset in 11 seconds/);
  await page.goto(new URL('coaching.html',base).href,{waitUntil:'networkidle'});
  console.log('PASS EXOS reduced-motion mode: no screen shake or moving words');

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
    'products.html','privacy.html','research.html','resources.html',
    'science.html','terms.html','classroom/'];
  for(const width of [390,1440]){
    await page.setViewportSize({width,height:1000});
    for(const route of publicCopyRoutes){
      const response=await page.goto(new URL(route,base).href,{waitUntil:'domcontentloaded'});
      assert.ok(response.ok(),route+' must render');
      const visible=await page.evaluate(()=>{
        // Expand page disclosures; navigation is exercised separately above.
        // Forcing every navigation menu open together creates an artificial layout.
        for(const el of document.querySelectorAll('main details'))el.open=true;
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

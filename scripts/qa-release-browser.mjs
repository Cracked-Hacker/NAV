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
      if(route.startsWith('account/auth'))await page.locator(route.includes('mode=reset')?'#reset-form a.button':'form:not([hidden]) button').waitFor({state:'visible'});
      await page.evaluate(async()=>{for(const img of document.images)img.loading='eager';await Promise.all([...document.images].map(img=>img.decode().catch(()=>{})));});
      const metrics=await page.evaluate(()=>({width:innerWidth,scrollWidth:document.documentElement.scrollWidth,h1:document.querySelectorAll('h1').length,
        cardWidth:document.querySelector('.account-wrap--auth .account-card')?.getBoundingClientRect().width,
        columns:document.querySelector('.account-auth-layout')?getComputedStyle(document.querySelector('.account-auth-layout')).gridTemplateColumns.split(' ').length:null,
        brokenImages:[...document.images].filter(i=>!i.naturalWidth).map(i=>i.getAttribute('src'))}));
      assert.equal(metrics.width,width);
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
  await page.locator('#reset-form a.button').click();
  await page.getByRole('heading',{name:"We'll send you a reset link.",exact:true}).waitFor({state:'visible'});
  await page.goto(new URL('account/',base).href);await page.waitForURL(/account\/auth(?:\.html)?\?mode=login/);
  // Classroom P0 competency-truth regression: legacy single-answer passes never qualify.
  await page.goto(new URL('classroom/quizzes.html',base).href);
  await page.evaluate(() => window.localStorage.setItem('nav-classroom-full-course-v1',
    JSON.stringify({completed:{assignments:[],labs:[],quizzes:['quiz-1']},drafts:{},quizAttempts:{}})));
  await page.reload({waitUntil:'networkidle'});
  assert.equal(await page.locator('.full-quiz-card').count(),10,'10 weekly assessment cards');
  const firstQuiz=page.locator('.full-quiz-card').first();
  assert.equal(await firstQuiz.locator('fieldset.quiz-question').count(),8,'8 questions per week, not one');
  assert.match(await firstQuiz.locator('.work-status').textContent(),/Practice target not met/,'old one-question status invalidated');
  assert.equal(await firstQuiz.locator('fieldset.quiz-question').first().locator('input[type=radio]').count(),4,'four accessible answer choices');
  await firstQuiz.locator('fieldset.quiz-question').first().locator('label').first().click();
  await firstQuiz.locator('button[type=submit]').click();
  assert.match(await firstQuiz.locator('.quiz-feedback').textContent(),/Answer all eight questions/,'cannot score incomplete quiz');
  const correctLabels=await page.evaluate(()=>{
    const week=window.NAV_CLASSROOM.weeks[0].quiz;
    const rows=window.NAV_CLASSROOM_WEEKLY_BANK.rows[1];
    return [week.options[week.correct],...rows.map(item=>item[3][item[4]])];
  });
  for(let i=0;i<8;i++){
    const question=firstQuiz.locator('fieldset.quiz-question').nth(i);
    const options=question.locator('label');
    const labels=await options.allTextContents();
    const index=labels.findIndex(value=>value.trim()===correctLabels[i]);
    assert.ok(index>=0,`correct option text exists in displayed item ${i+1}`);
    await options.nth(index).click();
  }
  await firstQuiz.locator('button[type=submit]').click();
  assert.match(await firstQuiz.locator('.quiz-feedback').textContent(),/8\/8 \(100%\)/,'practice scored on all eight items');
  assert.match(await firstQuiz.locator('.work-status').textContent(),/8-question practice target met/,'updated practice status');
  assert.equal(await firstQuiz.locator('.quiz-item-feedback:not([hidden])').count(),8,'all item explanations revealed');
  await page.goto(new URL('classroom/progress.html',base).href);
  assert.match(await page.locator('[data-progress-dashboard]').textContent(),/1\/10/,'valid practice completion reflected in progress');
  await page.goto(new URL('classroom/labs.html',base).href);
  const firstLab=page.locator('.coursework-card').first();
  await firstLab.locator('summary').click();
  await firstLab.locator('.work-complete-button').click();
  assert.match(await firstLab.locator('.saved-copy').textContent(),/at least 150 characters/,'empty lab cannot be self-marked');
  assert.match(await firstLab.locator('.work-status').textContent(),/Not self-marked/);
  await firstLab.locator('textarea.work-draft').fill('Question and safety: choose a familiar low-risk submaximal exercise. Record a stable protocol, measurements and units, and the equipment used. Interpretation: identify measurement error and fatigue confounders. Next step: adjust the task if the findings warrant it, and refer symptoms outside coaching scope.');
  await firstLab.locator('.practice-rubric-checklist input[type=checkbox]').check({force:true}).catch(()=>{});
  const rubricChecks=firstLab.locator('.practice-rubric-checklist input[type=checkbox]');
  for(let i=0;i<4;i++)await rubricChecks.nth(i).check();
  await firstLab.locator('.work-complete-button').click();
  assert.match(await firstLab.locator('.work-status').textContent(),/Self-reported complete/,'complete means self-reported, not graded');
  console.log('PASS 8-item weekly practice, legacy migration, scoring, explanatory feedback, and lab self-review');
  const poster=await context.request.get(new URL('assets/coach-nate-research-poster.pdf',base).href);
  assert.equal(poster.status(),200);assert.ok((await poster.body()).subarray(0,5).toString().startsWith('%PDF-'));
  assert.deepEqual(errors,[],'Browser script exceptions');assert.deepEqual(missing,[],'Missing public assets');
  writeFileSync(`${out}/report.json`,JSON.stringify({base,checkedAt:new Date().toISOString(),results,accessibility,errors,missing,
    journeys:['mobile menu → Create Account','keyboard skip link','native empty-login validation','website recovery → canonical app reset form','signed-out My NAV guard','poster PDF bytes'],
    notVerified:['new-user email confirmation','authenticated website/app round trip','real client/coach/dual-role production sessions','password recovery email and expiry']},null,2));
  const violations=accessibility.flatMap(a=>a.violations.map(v=>({...v,route:a.route,width:a.width})));
  assert.deepEqual(violations,[],'Automated WCAG A/AA violations; see report.json');
  console.log(`PASS ${results.length} viewport/page checks, ${accessibility.length} accessibility audits and critical public journeys`);
}finally{await browser.close();if(server)await new Promise(resolve=>server.close(resolve));}

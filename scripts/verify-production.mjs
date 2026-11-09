// Read-only smoke checks for the canonical Netlify host, never a Pages mirror.
import assert from 'node:assert/strict';
const base='https://coach-nate.netlify.app/';
const checks=[];
for(const route of ['', 'coaching.html','nav-coach.html','coach-nate.html','resume.html','research.html','classroom/','account/auth.html?mode=login','account/auth.html?mode=signup','account/auth.html?mode=reset','assets/coach-nate-research-poster.pdf','sitemap.xml','robots.txt']){
  const r=await fetch(new URL(route,base));assert.ok(r.ok(),`${route}: ${r.status}`);
  if(route.includes('account/auth')){
    assert.match(r.headers.get('cache-control')||'',/no-store/);
    assert.equal(r.headers.get('x-frame-options'),'DENY');
    assert.match(r.headers.get('content-security-policy')||'',/frame-ancestors 'none'/);
  }
  checks.push({route,status:r.status});
}
const old=await fetch(new URL('account.html',base),{redirect:'manual'});
assert.equal(old.status,301,'Former account gateway redirects to the single My NAV hub');
const release=await fetch(new URL('release.json',base)).then(r=>{assert.ok(r.ok(),'Published release manifest');return r.json()});
assert.equal(release.repository,'Cracked-Hacker/NAV');assert.equal(release.dirty,false);
assert.match(release.commit,/^[a-f0-9]{40}$/);
if(process.env.NAV_EXPECTED_SHA)assert.equal(release.commit,process.env.NAV_EXPECTED_SHA,'Production artifact SHA');
console.log(JSON.stringify({base,checkedAt:new Date().toISOString(),release,checks},null,2));

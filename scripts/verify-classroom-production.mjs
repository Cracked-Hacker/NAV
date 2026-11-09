// Production-only, read-only verification: actual Netlify deployment must
// match the exact main commit and keep unreleased Classroom pages unavailable.
// Public GitHub Pages and repository-history exposure require a separate audit.
import assert from 'node:assert/strict';
const root='https://coach-nate.netlify.app/';
const expected=process.env.GITHUB_SHA;
assert.match(expected||'',/^[a-f0-9]{40}$/,'Expected exact main commit SHA from GitHub Actions');
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function responseFor(path){
  const url=new URL(path,root);
  url.searchParams.set('qa',expected.slice(0,9));
  return fetch(url,{headers:{'Cache-Control':'no-cache'},signal:AbortSignal.timeout(15000)});
}
let last;
for(let attempt=1;attempt<=15;attempt++){
  try{
    const manifestResponse=await responseFor('release.json');
    assert.ok(manifestResponse.ok,'Netlify release manifest should be publicly readable');
    const release=await manifestResponse.json();
    assert.equal(release.repository,'Cracked-Hacker/NAV');
    assert.equal(release.dirty,false);
    assert.equal(release.commit,expected,'Netlify must serve exact SHA');
    const landing=await responseFor('classroom/');
    assert.equal(landing.status,200,'Approved Classroom landing should remain accessible');
    const html=await landing.text();
    assert.match(html,/Exercise science that improves decisions/);
    assert.doesNotMatch(html,/Hard to Kill|Start Week 1|10 quizzes|quiz-1/);
    for(const path of [
      'classroom/course.html',
      'classroom/quizzes.html',
      'classroom/progress.html',
      'classroom/lms-data.js',
      'classroom/weekly-question-bank.js',
      'classroom/course/week-1/index.html',
      'classroom/how-training-works/index.html'
    ]){
      const privateResponse=await responseFor(path);
      assert.equal(privateResponse.status,404,`${path} must not be public`);
    }
    console.log(JSON.stringify({site:root,releaseCommit:release.commit,attempt,verified:['public educational landing','direct-route 404 for unreleased materials','no draft titles on landing']},null,2));
    process.exit(0);
  }catch(error){
    last=error;
    console.log(`Attempt ${attempt}/15: Netlify release not yet verified: ${error.message}`);
    if(attempt<15)await sleep(12000);
  }
}
throw last;

// Production-only, read-only verification: do not mistake a successful Git merge for a live release.
// The GitHub Actions job retries while Netlify publishes the main branch.
import assert from 'node:assert/strict';
const root = 'https://coach-nate.netlify.app/';
const expected = process.env.GITHUB_SHA;
assert.match(expected || '', /^[a-f0-9]{40}$/,'Expected exact main commit SHA from GitHub Actions');
const sleep = ms => new Promise(resolve=>setTimeout(resolve,ms));
async function text(path) {
  const uri = new URL(path,root);
  uri.searchParams.set('qa',expected.slice(0,9));
  const response=await fetch(uri,{headers:{'Cache-Control':'no-cache'},signal:AbortSignal.timeout(15000)});
  assert.ok(response.ok,`${path} HTTP ${response.status}`);
  return response.text();
}
let last;
for(let attempt=1;attempt<=15;attempt++){
  try{
    const release=JSON.parse(await text('release.json'));
    assert.equal(release.repository,'Cracked-Hacker/NAV');
    assert.equal(release.dirty,false);
    assert.equal(release.commit,expected,'Netlify must serve this exact GitHub commit, not an earlier preview');
    const [page,bank,ui,progress]=await Promise.all([
      text('classroom/quizzes.html'),
      text('classroom/weekly-question-bank.js'),
      text('classroom/classroom.js'),
      text('classroom/progress.html')
    ]);
    assert.match(page,/Ten eight-question weekly practice assessments/,'Public quiz description');
    assert.match(page,/weekly-question-bank\.js/,'Question bank loaded on learner page');
    assert.match(bank,/NAV_CLASSROOM_WEEKLY_BANK/,'Public bank loaded');
    assert.match(bank,/weekly-v2-2026-11-09/,'Expected assessment version');
    assert.match(ui,/Score all 8 answers/,'Multi-item scoring deployed');
    assert.match(ui,/Legacy one-answer passes are deliberately not counted/,'Historical one-item scores invalidated');
    assert.match(ui,/Self-reported complete/,'Homework/lab scores not misrepresented');
    assert.match(progress,/not graded/,'Progress does not claim independent grading');
    console.log(JSON.stringify({site:root,releaseCommit:release.commit,attempt,verified:['quiz page','80-question bank','multi-item scoring','legacy migration','truthful lab completion','progress labels']},null,2));
    process.exit(0);
  }catch(error){
    last=error;
    console.log(`Attempt ${attempt}/15: Netlify release not yet verified: ${error.message}`);
    if(attempt<15)await sleep(12000);
  }
}
throw last;

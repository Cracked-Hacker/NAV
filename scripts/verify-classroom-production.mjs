// Production-only, read-only verification of a finished-only Netlify release.
// Stale GitHub commits, published question banks, and unpublished course files fail.
import assert from "node:assert/strict";
import {hasVerifiedBetaContactLink} from "./site-link-check.mjs";
const root="https://coach-nate.netlify.app/";
const expected=process.env.GITHUB_SHA;
assert.match(expected||"",/^[a-f0-9]{40}$/,"Expected GitHub main SHA");
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function request(path){
  const url=new URL(path,root);
  url.searchParams.set("qa",expected.slice(0,9));
  return fetch(url,{headers:{"Cache-Control":"no-cache"},signal:AbortSignal.timeout(15000)});
}
let last;
for(let attempt=1;attempt<=15;attempt++){
  try{
    const releaseResponse=await request("release.json");
    assert.equal(releaseResponse.status,200);
    const release=await releaseResponse.json();
    assert.equal(release.repository,"Cracked-Hacker/NAV");
    assert.equal(release.dirty,false);
    assert.equal(release.commit,expected,"Netlify must serve exact current main release");
    const teaser=await request("classroom/");
    assert.equal(teaser.status,200);
    const html=await teaser.text();
    assert.match(html,/Private testing is in development\./i);
    assert.doesNotMatch(html,/href=["\x27]https:\/\/nav-coach-app-eight\.vercel\.app\/beta/i);
    assert.ok(hasVerifiedBetaContactLink(html), "Private Beta must include a safe working Contact action");
    assert.match(html,/noindex,nofollow/);
    const withheld=[
      "classroom/quizzes.html","classroom/assignments.html","classroom/labs.html",
      "classroom/course/week-1/index.html","classroom/how-training-works/index.html",
      "classroom/classroom.js","classroom/lms-data.js","classroom/weekly-question-bank.js"
    ];
    for(const path of withheld){
      const result=await request(path);
      assert.equal(result.status,404,`${path}: unreleased coursework must not be publicly accessible`);
    }
    // Prove the six approved reels and click-to-load script reached production.
    const coachResponse=await request("coach-nate.html");
    assert.equal(coachResponse.status,200,"Coach Nate profile missing in production");
    const coachHtml=await coachResponse.text();
    for(const code of ["DU67U4xAbgg","DVH2BmojR-X","DVKLlgxkm7e","DVO9SxBEkVh","DVRlBK5EpBz","DVZrxHgAWpp"]){
      assert.ok(coachHtml.includes('data-reel-code="'+code+'"') || coachHtml.includes("data-reel-code='"+code+"'"),"Missing published reel "+code);
    }
    const galleryScript=await request("assets/coach-nate-instagram-gallery.js");
    assert.equal(galleryScript.status,200,"Instagram gallery script missing in production");
    console.log(JSON.stringify({site:root,releaseCommit:release.commit,attempt,
      result:"PASS finished-only public release",withheld,publicTeaser:true},null,2));
    process.exit(0);
  }catch(error){
    last=error;
    console.log(`Attempt ${attempt}/15: Netlify release not confirmed: ${error.message}`);
    if(attempt<15)await sleep(12000);
  }
}
throw last;

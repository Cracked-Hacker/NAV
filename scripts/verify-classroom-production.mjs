// Production-only, read-only verification of a finished-only Netlify release.
// Stale GitHub commits, published question banks, and unpublished course files fail.
import assert from "node:assert/strict";
import {createHash} from "node:crypto";
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
    // Verify the actual public download bytes, not merely a GitHub PR, a preview or link text.
    const productResponse=await request("products.html");
    assert.equal(productResponse.status,200,"Public Products page missing");
    const productHtml=await productResponse.text();
    assert.ok(productHtml.includes('id="muscle-card-options"'),"View Options menu not deployed");
    assert.ok(productHtml.includes(">Download</a>"),"Full bundle direct download not advertised");
    assert.ok(productHtml.includes("<code>nate</code>"),"Quizlet password missing from production");
    assert.ok(productHtml.includes('href="https://venmo.com/u/Nate-Holochwost"'),"Venmo link missing");
    assert.ok(!productHtml.includes("Request files by email"),"Superseded email fulfillment is still live");
    const downloads=[
      ["downloads/NAV_Ultimate_Muscle_All_Formats_2026-11.zip","a617bad0df90209670072aa409e493eec62ce78687f896d63c21cdaccfb1d0bc",335260],
      ["downloads/NAV_Ultimate_Muscle_Card_Set.apkg","227c98775fc3381f69ee84d833e14423753d0e9e5d113bc4a7cc59c927521549",69883],
      ["downloads/NAV_Muscle_Cards_Print.pdf","3da61d0b3e5f9f90d69369763cf383ac100308a179d8414c5ea1bba9a52d1ef8",255256],
      ["downloads/NAV_Muscle_Cards.csv","afff4922d83f76aafd97a49f441d5728c44015f648d7c47d4f1c568c8219e74c",92145],
      ["downloads/NAV_Muscle_Cards_Offline.html","56c325c4ee040b2799503d86d7a83e66cbfe368545d173e91f3ee0a74bde4c58",134582]
    ];
    for(const [path,sha,size] of downloads){
      assert.ok(productHtml.includes('href="'+path+'"'),"Missing public download link: "+path);
      const response=await request(path);
      assert.equal(response.status,200,"Public download unavailable: "+path);
      assert.match(response.headers.get("content-disposition")||"",/attachment/i,"Download not served as attachment: "+path);
      const bytes=Buffer.from(await response.arrayBuffer());
      assert.equal(bytes.length,size,"Public download byte count changed: "+path);
      assert.equal(createHash("sha256").update(bytes).digest("hex"),sha,"Public download file differs from verified original: "+path);
    }

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

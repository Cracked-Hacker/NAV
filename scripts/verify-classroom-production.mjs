// Production-only, read-only verification of a finished-only Netlify release.
// Stale GitHub commits, published question banks, and unpublished course files fail.
import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {readFileSync} from "node:fs";
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
    const resumePdf="assets/pdf/Nathan_Holochwost_Resume_2026-11.pdf";
    assert.ok(coachHtml.includes('href="'+resumePdf+'" target="_blank" rel="noopener noreferrer" type="application/pdf">View Resume</a>'),"Approved Coach Nate résumé button did not reach production");
    const pdfResponse=await request(resumePdf);
    assert.equal(pdfResponse.status,200,"Published résumé PDF unavailable");
    assert.equal(Buffer.from(await pdfResponse.arrayBuffer()).subarray(0,5).toString(),"%PDF-","Published résumé is not a valid PDF");
    const oldResumeUrl=new URL("resume.html",root);
    oldResumeUrl.searchParams.set("qa",expected.slice(0,9));
    const retiredResponse=await fetch(oldResumeUrl,{redirect:"manual",headers:{"Cache-Control":"no-cache"},signal:AbortSignal.timeout(15000)});
    assert.equal(retiredResponse.status,301,"Retired résumé page must redirect");
    assert.equal(new URL(retiredResponse.headers.get("location"),root).pathname,"/"+resumePdf,"Retired résumé redirect points to wrong target");
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
    // Ground every production digest in the exact checked-out commit, not stale fixed hashes.
    const downloads=[
      "downloads/NAV_Ultimate_Muscle_All_Formats_2026-11.zip",
      "downloads/NAV_Ultimate_Muscle_Card_Set.apkg",
      "downloads/NAV_Muscle_Cards_Print.pdf",
      "downloads/NAV_Muscle_Cards.csv",
      "downloads/NAV_Muscle_Cards_Offline.bin",
      "downloads/Human_Sciences_Atlas_2026.pdf",
      "downloads/NAV_Performance_Nutrition_The_Simple_Guide_v1-1.pdf"
    ];
    assert.match(productHtml,/<h2>Learning Resources<\/h2>/);
    assert.doesNotMatch(productHtml,/position[\s–-]+pattern[\s–-]+power|\bEXOS\b|Pillar Prep/i);
    for(const path of downloads){
      const acceptableLinks=path.endsWith(".html") ? [path,path.slice(0,-5),path.slice(0,-5)+"/"] : [path];
      const foundLink=acceptableLinks.some(link=>
        productHtml.includes('href="'+link+'"') ||
        productHtml.includes("href='"+link+"'") ||
        productHtml.includes('href='+link+' '));
      const actualDownloadLinks=[...productHtml.matchAll(/href=["']?([^"' >]*downloads\/[^"' >]+)/gi)].map(m=>m[1]);
      assert.ok(foundLink,"Missing public download link: "+path+"; observed "+actualDownloadLinks.join(" | "));
      const response=await request(path);
      assert.equal(response.status,200,"Public download unavailable: "+path);
      assert.match(response.headers.get("content-disposition")||"",/attachment/i,"Download not served as attachment: "+path);
      const bytes=Buffer.from(await response.arrayBuffer());
      const original=readFileSync(new URL("../"+path,import.meta.url));
      assert.equal(bytes.length,original.length,"Public download size differs from this GitHub commit: "+path);
      assert.equal(createHash("sha256").update(bytes).digest("hex"),
                   createHash("sha256").update(original).digest("hex"),
                   "Public download differs from the verified GitHub release: "+path);
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

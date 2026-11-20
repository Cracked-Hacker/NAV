// Production-only, read-only verification of a finished-only Netlify release.
// Stale GitHub commits, published question banks, and unpublished course files fail.
import assert from "node:assert/strict";
import {execFileSync} from "node:child_process";
import {PUBLIC_RELEASE_FILES} from "./public-release-manifest.mjs";
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
    // Discover all tracked, unpublished Classroom paths in this exact release source.
    const approved=new Set(PUBLIC_RELEASE_FILES);
    const tracked=execFileSync("git",["ls-files","-z","--","classroom/"],{encoding:"utf8"})
      .split("\0").filter(Boolean);
    const withheld=tracked.filter(path=>!approved.has(path));
    assert.ok(withheld.length>0,"Unexpected empty withheld Classroom inventory");
    const failures=[];
    for(const path of withheld){
      try{
        const result=await request(path);
        if(result.status!==404) failures.push({path,status:result.status});
      }catch(error){failures.push({path,error:error.message});}
    }
    assert.deepEqual(failures,[],`Anonymous Classroom exposure: ${JSON.stringify(failures)}`);
    // Prove the six approved reels and click-to-load script reached production.
    const coachResponse=await request("coach-nate.html");
    assert.equal(coachResponse.status,200,"Coach Nate profile missing in production");
    const coachHtml=await coachResponse.text();
    for(const code of ["DU67U4xAbgg","DVH2BmojR-X","DVKLlgxkm7e","DVO9SxBEkVh","DVRlBK5EpBz","DVZrxHgAWpp"]){
      assert.ok(coachHtml.includes('data-reel-code="'+code+'"') || coachHtml.includes("data-reel-code='"+code+"'"),"Missing published reel "+code);
    }
    for(const id of ["l6mn8OVIhiM","qKc7Pgy0_I4","WyrwYLIxhvc","50DcRryZoTM","Lt7uXl7eL4o","LFA-6Gnm7wA"]){
      assert.ok(coachHtml.includes('data-youtube-id="'+id+'"'),"Missing published educational video "+id);
    }
    const galleryScript=await request("assets/coach-nate-instagram-gallery.js");
    assert.equal(galleryScript.status,200,"Instagram gallery script missing in production");
    console.log(JSON.stringify({site:root,releaseCommit:release.commit,attempt,
      result:"PASS finished-only public release",withheldCount:withheld.length,withheld,publicTeaser:true},null,2));
    process.exit(0);
  }catch(error){
    last=error;
    console.log(`Attempt ${attempt}/15: Netlify release not confirmed: ${error.message}`);
    if(attempt<15)await sleep(12000);
  }
}
throw last;

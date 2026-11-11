import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { resolve, dirname, normalize, join, sep, extname } from "node:path";
import "./validate-classroom-assessments.mjs";
import {PUBLIC_RELEASE_FILES} from "./public-release-manifest.mjs";

// This validates the FINISHED-ONLY public artifact, not that every file in
// GitHub (including development source) is public or release-ready.
const failures = [];
const required = [
 "index.html","nav-coach.html","coaching.html","coach-nate.html",
 "resume.html","research.html","science.html","resources.html","about.html",
 "contact.html","terms.html","privacy.html","disclaimer.html",
 "accessibility.html","404.html","account/auth.html","account/index.html",
 "classroom/index.html","style.css","robots.txt","sitemap.xml"
];
const mustExist = path => {if (!existsSync(path)) failures.push(path+": missing public artifact source");};
for (const p of required) mustExist(p);
const root = process.cwd();
const publishable = new Set(PUBLIC_RELEASE_FILES);
if(publishable.size!==PUBLIC_RELEASE_FILES.length)failures.push("public-release-manifest: duplicate entries");
if(!publishable.has("classroom/index.html"))failures.push("public-release-manifest: missing beta information entry");
if([...publishable].some(p=>p.startsWith("classroom/")&&p!=="classroom/index.html"))
 failures.push("public-release-manifest: unpublished Classroom lessons must never ship");
for(const file of publishable)mustExist(file);
const visibleHtml=[...publishable].filter(p=>p.endsWith(".html"));
const absoluteLinks=/<a\b[^>]*\bhref\s*=\s*["']([^"']+)["']/gi;
const blockedCopy=[
 [/scientifically proven/gi,"unsupported scientific proof claim"],
 [/HIPAA compliant/gi,"unsupported HIPAA claim"],
 [/FDA approved/gi,"unsupported FDA approval"],
 [/guaranteed results/gi,"guaranteed results"],
 [/Client Testimonial \(Placeholder\)/gi,"placeholder testimonial"]
];
for(const p of visibleHtml){
 const html=readFileSync(p,"utf8");
 if(!/<meta\s+name=["']viewport["']/i.test(html))failures.push(p+": viewport missing");
 if(!/<title>[^<]+<\/title>/i.test(html))failures.push(p+": title missing");
 const h1=(html.match(/<h1(?:\s|>)/gi)||[]).length;
 if(h1!==1)failures.push(p+": expected one h1, got "+h1);
 for(const [regex,message] of blockedCopy){regex.lastIndex=0;if(regex.test(html))failures.push(p+": "+message);}
 for(const match of html.matchAll(absoluteLinks)){
  const raw=match[1].trim();
  if(!raw||/^(https?:|mailto:|tel:|data:|#)/i.test(raw))continue;
  const clean=raw.split("#")[0].split("?")[0];
  if(!clean)continue;
  if(clean.startsWith("/")){failures.push(p+": absolute internal path "+clean);continue;}
  let target=normalize(resolve(dirname(resolve(p)),clean));
  if(clean.endsWith("/")||(existsSync(target)&&statSync(target).isDirectory()))target=join(target,"index.html");
  if(!target.startsWith(root+sep)){failures.push(p+": path escapes root "+clean);continue;}
  const rel=target.slice(root.length+1).replaceAll("\\","/");
  if(!publishable.has(rel))failures.push(p+": link points to unpublished/missing artifact "+raw);
 }
}
const hub=readFileSync("classroom/index.html","utf8");
if(!/Private beta access/i.test(hub)||!/noindex,nofollow/i.test(hub)||!/nav-coach-app-eight\.vercel\.app\/beta/.test(hub))
 failures.push("classroom/index.html: invitation-only authenticated entry is missing");
if(/(?:href|src)=["'][^"']*(?:quizzes\.html|labs\.html|weekly-question-bank\.js)/i.test(hub))
 failures.push("classroom/index.html: direct public course material link");
if(!/PUBLIC_RELEASE_FILES/.test(readFileSync("scripts/package-site.mjs","utf8")))
 failures.push("package-site.mjs: release packaging must obey the explicit public manifest");
for(const asset of ["assets/coach-nate-lab-portrait.webp","assets/coach-nate-acs-conference.webp","assets/coach-nate-lab-bench.webp","assets/coach-nate-research-poster.webp","assets/coach-nate-research-poster.pdf"]){
 if(!existsSync(asset)||statSync(asset).size<1000)failures.push("Missing real research asset: "+asset);
}
for(const media of ["assets/coach-nate-strength-showcase-muted.mp4","assets/coach-nate-strength-showcase-poster.webp"]){
 if(!publishable.has(media)||!existsSync(media)||statSync(media).size<1000)failures.push("Approved Coach Nate showcase media missing: "+media);
}
// Every approved public squat set must have a packaged, real video and poster.
for(const media of ["assets/coach-nate-squat-9099-silent.mp4","assets/coach-nate-squat-9099-poster.webp","assets/coach-nate-squat-9078-silent.mp4","assets/coach-nate-squat-9078-poster.webp","assets/coach-nate-squat-8279-silent.mp4","assets/coach-nate-squat-8279-poster.webp","assets/coach-nate-training-gallery.js"]){
 if(!publishable.has(media)||!existsSync(media)||statSync(media).size<1000)
  failures.push("Approved Coach Nate gallery asset missing: "+media);
}
const coach=readFileSync("coach-nate.html","utf8");
if(!coach.includes('src="assets/coach-nate-strength-showcase-muted.mp4"')||!coach.includes('poster="assets/coach-nate-strength-showcase-poster.webp"')||!coach.includes('controls muted playsinline'))
 failures.push("Coach Nate silent video source, poster, or muted playback missing");
for(const proof of ["Cycling of Ethanol and Acetaldehyde in Estuarine Waters","B.S. Kinesiology","B.A. Biology","10.1007/s10560-024-01000-y"])
 if(!coach.includes(proof))failures.push("Coach Nate research evidence missing: "+proof);
for(const media of ["assets/coach-nate-squat-9099-silent.mp4","assets/coach-nate-squat-9099-poster.webp","assets/coach-nate-squat-9078-silent.mp4","assets/coach-nate-squat-9078-poster.webp","assets/coach-nate-squat-8279-silent.mp4","assets/coach-nate-squat-8279-poster.webp"]){
 if(!coach.includes('assets/'+media.split('/').pop())) failures.push("Coach Nate gallery missing reference: "+media);
}
if(!coach.includes('data-training-gallery')||!coach.includes('data-training-track')||!coach.includes('data-gallery-next')||!coach.includes('data-gallery-prev')) failures.push("Coach Nate gallery navigation missing");
if(!coach.includes('src="assets/coach-nate-training-gallery.js"'))failures.push("Coach Nate gallery script not loaded");
if((coach.match(/<video controls muted playsinline preload="none"/g)||[]).length!==4)failures.push("Expected 4 silent, on-demand video players in Coach Nate gallery");
if(failures.length){
 console.error("NAV finished-only public release gate FAILED:",failures.join("\n- "));
 process.exit(1);
}
console.log(`NAV finished-only public release gate PASS (${visibleHtml.length} public HTML pages, unpublished coursework excluded, verified source bank audited)`);

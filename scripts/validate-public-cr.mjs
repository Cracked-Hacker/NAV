import { existsSync, readFileSync } from "node:fs";
import process from "node:process";

const failures = [];
const root = process.cwd();
const keyPages = ["index.html", "nav-coach.html", "coaching.html", "science.html", "resources.html", "about.html", "contact.html", "coach-nate.html", "research.html"];
const canonicalBase = "https://coach-nate.netlify.app/";
const appUrl = "https://nav-coach-app-eight.vercel.app/auth?mode=login";

function text(path) {
  if (!existsSync(path)) {
    failures.push(`${path}: missing`);
    return "";
  }
  return readFileSync(path, "utf8");
}
function requireMatch(path, html, pattern, message) {
  if (!pattern.test(html)) failures.push(`${path}: ${message}`);
}

for (const page of keyPages) {
  const html = text(page);
  requireMatch(page, html, /<meta\s+name=["']description["'][^>]+content=["'][^"']{40,}["']/i, "missing useful meta description");
  requireMatch(page, html, /<link\s+rel=["']canonical["'][^>]+href=["']https:\/\/coach-nate\.netlify\.app\//i, "missing canonical URL");
  requireMatch(page, html, /<meta\s+property=["']og:title["']/i, "missing Open Graph title");
  requireMatch(page, html, /<meta\s+property=["']og:description["']/i, "missing Open Graph description");
  requireMatch(page, html, /<meta\s+property=["']og:url["']/i, "missing Open Graph URL");
  requireMatch(page, html, /class=["'][^"']*desktop-nav/i, "missing desktop primary navigation");
  requireMatch(page, html, /class=["'][^"']*mobile-nav/i, "missing mobile navigation");
  requireMatch(page, html, /href=["']nav-coach\.html["']/i, "missing NAV Coach navigation route");
  requireMatch(page, html, /href=["']science\.html["']/i, "missing Science navigation or footer route");
  requireMatch(page, html, /href=["']coach-nate\.html["']/i, "missing Coach Nate navigation or footer route");
  requireMatch(page, html, /href=["']account\//i, "missing My NAV account navigation or footer route");
  requireMatch(page, html, /Create Account/i, "missing public account creation action");
  requireMatch(page, html, new RegExp(appUrl.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"), "missing canonical NAV Coach sign-in route");
}

// Long-form About essays must remain intact and collapsed until requested.
const aboutEssays = text("about.html");
const essayDetails = [...aboutEssays.matchAll(/<details class="essay-disclosure"(?:\s[^>]*)?>([\s\S]*?)<\/details>/g)];
if (essayDetails.length !== 4) failures.push("about.html: expected four collapsed long-form essays");
for (const [index, match] of essayDetails.entries()) {
  if (!/<summary>.*Read more.*Read less.*<\/summary>/s.test(match[1]))
    failures.push(`about.html: essay ${index + 1} lacks a functional Read more/Read less summary`);
  if ((match[1].match(/<p>/g) || []).length < 10)
    failures.push(`about.html: essay ${index + 1} appears truncated`);
}
for (const phrase of ["There is one day I will never forget", "my father and sister", "… but it’s still really cool to lift a lot of weight", "I derived a pixel-based conversion factor", "American Chemical Society National Meeting", "Child and Adolescent Social Work Journal", "I will never forget the tears of joy I shed", "I\u0027m not a drill sergeant. I\u0027m a teacher."]) {
  if (!aboutEssays.includes(phrase))
    failures.push("about.html: approved patient-care story text missing: " + phrase);
}

const home = text("index.html");
requireMatch("index.html", home, /human coaching|personal coaching|I want coaching/i, "homepage must offer human coaching");
requireMatch("index.html", home, /I’m a coach/i, "homepage must offer a coach path");
requireMatch("index.html", home, /href="products.html#study-tools"/i, "homepage must retain public learning resources");
if ((home.match(/class="nav-home-action"/g) || []).length !== 3) failures.push("index.html: exactly three primary action cards are required");
for (const route of ["coaching.html","nav-coach.html#coach-flow","contact.html#testing"]) {
  if (!home.includes('href="'+route+'"')) failures.push("index.html: missing primary journey "+route);
}
if (!/Prescription ≠ performance/i.test(home) && !/Prescription ≠ performance/i.test(text("nav-coach.html")) && !/Prescription ≠ performance/i.test(text("science.html")) && !/Prescription ≠ performance/i.test(text("resources.html"))) {
  failures.push("NAV public copy: prescribed and performed records must remain distinguished");
}

requireMatch("contact.html", text("contact.html"), /id="testing"/i, "software tester path needs a genuine contact destination");
const product = text("nav-coach.html");
requireMatch("nav-coach.html", product, /human coach in control/i, "missing human-coach-control positioning");
requireMatch("nav-coach.html", product, /Open NAV Coach/i, "working app access must remain visible");
if (/Status:\s*In development|Spreadsheet program import is not released yet/i.test(product)) failures.push("nav-coach.html: unfinished features must not be advertised publicly");
requireMatch("nav-coach.html", product, /private coaching information.{0,180}(?:authenticated|private).{0,40}app/i, "missing public/private boundary");

const science = text("science.html");
requireMatch("science.html", science, /Systematic reviews/i, "missing evidence hierarchy");
requireMatch("science.html", science, /A finding is not the same thing as a prescription/i, "missing evidence-to-decision distinction");
requireMatch("science.html", science, /not medical care/i, "missing scope boundary");

const resources = text("resources.html");
for (const question of ["What is NAV?", "Does NAV replace a coach?", "How do I access NAV beta features?", "What happens to private client data?", "Is NAV medical care?", "How do I sign in?"]) {
  if (!resources.includes(question)) failures.push(`resources.html: missing FAQ question: ${question}`);
}
requireMatch("resources.html", resources, /"@type":"FAQPage"/, "missing FAQPage structured data");

const privateBeta = text("classroom/index.html");
requireMatch("classroom/index.html", privateBeta, /Private beta access/i, "unfinished Classroom must show invitation-only introduction");
requireMatch("classroom/index.html", privateBeta, /noindex,nofollow/i, "unreleased learning entry must not be indexed");
requireMatch("classroom/index.html", privateBeta, /Private testing is in development\./i, "beta entry must accurately state unreleased status");
requireMatch("classroom/index.html", privateBeta, /href="\.\.\/contact\.html"/, "beta entry must offer a truthful inquiry path");
if (/Enter your tester code|href=["\x27]https:\/\/nav-coach-app-eight\.vercel\.app\/beta/i.test(privateBeta)) failures.push("classroom/index.html: unsupported live beta redemption must not be advertised");
if (/Redeem a private tester code|Invited testers can access approved beta areas with a code/i.test(home)) failures.push("index.html: unsupported live beta access must not be advertised");
if (/href="(?:quizzes|labs|course)\.html"/i.test(privateBeta)) failures.push("classroom/index.html: unreleased activities linked publicly");
const packaging = text("scripts/package-site.mjs");
requireMatch("scripts/package-site.mjs", packaging, /PUBLIC_RELEASE_FILES/, "site build must use an explicit approved public manifest");
const manifest = text("scripts/public-release-manifest.mjs");
if(!manifest.includes('"classroom/index.html"')) failures.push("release manifest: beta landing omitted");
for (const privateFile of ["classroom/quizzes.html","classroom/labs.html","classroom/weekly-question-bank.js","classroom/course.html"]) {
 if(manifest.includes('"'+privateFile+'"'))failures.push("release manifest: unpublished course asset "+privateFile);
}

const accountEntry = text("account/auth.html");
for (const id of ["login-form", "signup-form", "reset-form"]) {
  if (!accountEntry.includes('id="' + id + '"')) failures.push("account/auth.html: missing canonical " + id);
}
if (!/noindex,nofollow/.test(accountEntry)) failures.push("account/auth.html: private account entry must be noindex");

const coachProfile = text("coach-nate.html");
const resumePdf = "assets/pdf/Nathan_Holochwost_Resume_2026-11.pdf";
for(const detail of ["B.S. in Kinesiology","B.A. in Biology","10.1007/s10560-024-01000-y"]){
 if(!coachProfile.includes(detail))failures.push("coach-nate.html: professional background evidence missing: "+detail);
}
if(!coachProfile.includes('href="'+resumePdf+'" target="_blank" rel="noopener noreferrer" type="application/pdf">View Resume</a>'))failures.push("coach-nate.html: missing direct PDF View Resume button");
if(!existsSync(resumePdf))failures.push("Public PDF résumé asset missing");
if(existsSync("resume.html"))failures.push("Retired résumé HTML page remains in source");

const prohibitedClaims = [
  [/scientifically proven/gi, "unsupported 'scientifically proven' claim"],
  [/HIPAA compliant/gi, "unsupported HIPAA compliance claim"],
  [/SOC 2/gi, "unsupported SOC 2 claim"],
  [/FDA approved/gi, "unsupported FDA approval claim"],
  [/guaranteed results/gi, "guaranteed-results claim"]
];
for (const page of keyPages) {
  const html = text(page);
  for (const [pattern, message] of prohibitedClaims) {
    pattern.lastIndex = 0;
    if (pattern.test(html)) failures.push(`${page}: ${message}`);
  }
}

const robots = text("robots.txt");
if (!robots.includes(`Sitemap: ${canonicalBase}sitemap.xml`)) failures.push("robots.txt: sitemap declaration missing or wrong");
// Permit crawlers to see the explicit noindex on the beta landing; robots blocking it would hide that directive.
const sitemap = text("sitemap.xml");
if (sitemap.includes(`${canonicalBase}classroom/`)) failures.push("sitemap.xml: unreleased Classroom must not be indexed");
for (const route of ["nav-coach.html", "coach-nate.html", "research.html", "coaching.html", "science.html", "resources.html", "about.html", "contact.html", "terms.html", "privacy.html", "disclaimer.html"]) {
  if (!sitemap.includes(`<loc>${canonicalBase}${route}</loc>`)) failures.push(`sitemap.xml: missing ${route}`);
}

if (failures.length) {
  console.error("NAV public website CR gate failed:\n" + failures.map((f) => `- ${f}`).join("\n"));
  process.exit(1);
}
console.log(`NAV public website CR gate passed (${keyPages.length} key pages + sitemap/claims/app-routing checks).`);

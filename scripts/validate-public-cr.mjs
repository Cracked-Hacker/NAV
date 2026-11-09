import { existsSync, readFileSync } from "node:fs";
import process from "node:process";

const failures = [];
const root = process.cwd();
const keyPages = ["index.html", "nav-coach.html", "coaching.html", "science.html", "resources.html", "about.html", "contact.html", "coach-nate.html", "resume.html", "research.html"];
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

const home = text("index.html");
requireMatch("index.html", home, /Human coaching/i, "hero does not identify human coaching");
requireMatch("index.html", home, /Explore NAV Coach/i, "missing primary NAV Coach path");
requireMatch("index.html", home, /Prescription ≠ performance/i, "missing core data-truth principle");

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
requireMatch("classroom/index.html", privateBeta, /https:\/\/nav-coach-app-eight\.vercel\.app\/beta/, "redemption must occur in authenticated app");
if (/href="(?:quizzes|labs|course)\.html"/i.test(privateBeta)) failures.push("classroom/index.html: unreleased activities linked publicly");
const packaging = text("scripts/package-site.mjs");
requireMatch("scripts/package-site.mjs", packaging, /cpSync\('classroom\/index\.html'/, "site build must ship only the public beta intro, not course files");

const accountEntry = text("account/auth.html");
for (const id of ["login-form", "signup-form", "reset-form"]) {
  if (!accountEntry.includes('id="' + id + '"')) failures.push("account/auth.html: missing canonical " + id);
}
if (!/noindex,nofollow/.test(accountEntry)) failures.push("account/auth.html: private account entry must be noindex");

const resume = text("resume.html");
if (!resume.includes("B.S. Kinesiology") || !resume.includes("B.A. Biology") || !resume.includes("10.1007/s10560-024-01000-y")) failures.push("resume.html: November 2026 résumé facts missing");

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
for (const route of ["nav-coach.html", "coach-nate.html", "resume.html", "research.html", "coaching.html", "science.html", "resources.html", "about.html", "contact.html", "terms.html", "privacy.html", "disclaimer.html"]) {
  if (!sitemap.includes(`<loc>${canonicalBase}${route}</loc>`)) failures.push(`sitemap.xml: missing ${route}`);
}

if (failures.length) {
  console.error("NAV public website CR gate failed:\n" + failures.map((f) => `- ${f}`).join("\n"));
  process.exit(1);
}
console.log(`NAV public website CR gate passed (${keyPages.length} key pages + sitemap/claims/app-routing checks).`);

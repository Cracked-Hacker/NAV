import { existsSync, readFileSync } from "node:fs";
import process from "node:process";

const failures = [];
const root = process.cwd();
const keyPages = ["index.html", "nav-coach.html", "coaching.html", "science.html", "resources.html", "about.html", "contact.html"];
const canonicalBase = "https://cracked-hacker.github.io/NAV/";
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
  requireMatch(page, html, /<link\s+rel=["']canonical["'][^>]+href=["']https:\/\/cracked-hacker\.github\.io\/NAV\//i, "missing canonical URL");
  requireMatch(page, html, /<meta\s+property=["']og:title["']/i, "missing Open Graph title");
  requireMatch(page, html, /<meta\s+property=["']og:description["']/i, "missing Open Graph description");
  requireMatch(page, html, /<meta\s+property=["']og:url["']/i, "missing Open Graph URL");
  requireMatch(page, html, /class=["'][^"']*desktop-nav/i, "missing desktop primary navigation");
  requireMatch(page, html, /class=["'][^"']*mobile-nav/i, "missing mobile navigation");
  requireMatch(page, html, /href=["']nav-coach\.html["']/i, "missing NAV Coach navigation route");
  requireMatch(page, html, /href=["']science\.html["']/i, "missing Science navigation route");
  requireMatch(page, html, new RegExp(appUrl.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"), "missing canonical NAV Coach sign-in route");
}

const home = text("index.html");
requireMatch("index.html", home, /Human coaching/i, "hero does not identify human coaching");
requireMatch("index.html", home, /Explore NAV Coach/i, "missing primary NAV Coach path");
requireMatch("index.html", home, /Prescription ≠ performance/i, "missing core data-truth principle");

const product = text("nav-coach.html");
requireMatch("nav-coach.html", product, /human coach in control/i, "missing human-coach-control positioning");
requireMatch("nav-coach.html", product, /Status:\s*In development/i, "spreadsheet migration must be visibly labeled in development");
requireMatch("nav-coach.html", product, /Spreadsheet import is not presented here as a currently released production feature/i, "missing explicit migration availability boundary");
requireMatch("nav-coach.html", product, /private coaching information.{0,180}(?:authenticated|private).{0,40}app/i, "missing public/private boundary");

const science = text("science.html");
requireMatch("science.html", science, /Systematic reviews/i, "missing evidence hierarchy");
requireMatch("science.html", science, /A finding is not the same thing as a prescription/i, "missing evidence-to-decision distinction");
requireMatch("science.html", science, /not medical care/i, "missing scope boundary");

const resources = text("resources.html");
for (const question of ["What is NAV?", "Does NAV replace a coach?", "Can coaches bring existing spreadsheet programs into NAV?", "What happens to private client data?", "Is NAV medical care?", "How do I sign in?"]) {
  if (!resources.includes(question)) failures.push(`resources.html: missing FAQ question: ${question}`);
}
requireMatch("resources.html", resources, /"@type":"FAQPage"/, "missing FAQPage structured data");

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
const sitemap = text("sitemap.xml");
for (const route of ["nav-coach.html", "coaching.html", "classroom/", "science.html", "resources.html", "about.html", "contact.html", "terms.html", "privacy.html", "disclaimer.html"]) {
  if (!sitemap.includes(`<loc>${canonicalBase}${route}</loc>`)) failures.push(`sitemap.xml: missing ${route}`);
}

if (failures.length) {
  console.error("NAV public website CR gate failed:\n" + failures.map((f) => `- ${f}`).join("\n"));
  process.exit(1);
}
console.log(`NAV public website CR gate passed (${keyPages.length} key pages + sitemap/claims/app-routing checks).`);

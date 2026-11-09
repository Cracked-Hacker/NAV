import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, extname, join, normalize, relative, resolve, sep } from "node:path";
import process from "node:process";

const root = process.cwd();
const failures = [];

const classroomModules = [
  "classroom/how-training-works/index.html",
  "classroom/building-muscle/index.html",
  "classroom/getting-strong/index.html",
  "classroom/rir-rpe/index.html",
  "classroom/choosing-exercises/index.html",
  "classroom/programming-a-workout/index.html",
  "classroom/recovery/index.html",
  "classroom/build-your-system/index.html"
];

const courseWeekPages = Array.from({ length: 10 }, (_, index) => `classroom/course/week-${index + 1}/index.html`);

const lmsPages = [
  "classroom/index.html",
  "classroom/course.html",
  "classroom/syllabus.html",
  "classroom/assignments.html",
  "classroom/labs.html",
  "classroom/quizzes.html",
  "classroom/materials.html",
  "classroom/progress.html"
];

const requiredFiles = [
  "index.html",
  "account.html",
  "coach-nate.html",
  "resume.html",
  "research.html",
  "coaching.html",
  "about.html",
  "resources.html",
  "contact.html",
  "terms.html",
  "privacy.html",
  "disclaimer.html",
  "accessibility.html",
  "404.html",
  "style.css",
  "robots.txt",
  "classroom/classroom.css",
  "classroom/classroom.js",
  "classroom/lms-data.js",
  "classroom/workspace-sync.js",
  "classroom/week.css",
  "classroom/week.js",
  "classroom/week-data.js",
  "classroom/week-links.js",
  ...lmsPages,
  ...courseWeekPages,
  ...classroomModules
];

function walk(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    if ([".git", "node_modules"].includes(entry.name)) return [];
    const full = join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}

function sitePath(path) {
  return relative(root, path).split(sep).join("/");
}

function fail(file, message) {
  failures.push(`${file}: ${message}`);
}

for (const file of requiredFiles) {
  if (!existsSync(resolve(root, file))) fail(file, "required public route/file is missing");
}

const htmlFiles = walk(root).filter((file) => extname(file) === ".html");
if (htmlFiles.length < 37) failures.push(`site: expected at least 37 HTML pages, found ${htmlFiles.length}`);

const forbidden = [
  [/localhost/gi, "contains localhost"],
  [/127\.0\.0\.1/g, "contains 127.0.0.1"],
  [/\$XXX\b/g, "contains placeholder pricing"],
  [/yourusername/gi, "contains template username"],
  [/\[Your certifications here/gi, "contains placeholder credentials"],
  [/Client Testimonial \(Placeholder\)/gi, "contains placeholder testimonial"]
];

const hrefPattern = /href\s*=\s*["']([^"']+)["']/gi;

for (const file of htmlFiles) {
  const rel = sitePath(file);
  const html = readFileSync(file, "utf8");
  if (!/<meta\s+name=["']viewport["']/i.test(html)) fail(rel, "missing viewport metadata");
  if (!/<title>[^<]+<\/title>/i.test(html)) fail(rel, "missing non-empty title");
  const h1Count = (html.match(/<h1(?:\s|>)/gi) || []).length;
  if (h1Count !== 1) fail(rel, `expected exactly one h1, found ${h1Count}`);
  for (const [pattern, message] of forbidden) {
    pattern.lastIndex = 0;
    if (pattern.test(html)) fail(rel, message);
  }
  for (const match of html.matchAll(hrefPattern)) {
    const rawHref = match[1].trim();
    if (!rawHref || rawHref.startsWith("#") || rawHref.startsWith("mailto:") || rawHref.startsWith("tel:") || rawHref.startsWith("http://") || rawHref.startsWith("https://") || rawHref.startsWith("data:")) continue;
    const href = rawHref.split("#", 1)[0].split("?", 1)[0];
    if (!href) continue;
    if (href.startsWith("/")) { fail(rel, `root-absolute internal link is disallowed by the site-relative link convention: ${rawHref}`); continue; }
    let target = normalize(resolve(dirname(file), href));
    if (href.endsWith("/")) target = join(target, "index.html");
    if (existsSync(target) && statSync(target).isDirectory()) target = join(target, "index.html");
    if (!target.startsWith(root + sep) && target !== root) { fail(rel, `link escapes repository root: ${rawHref}`); continue; }
    if (!existsSync(target)) fail(rel, `broken internal link: ${rawHref}`);
  }
}

// Conversion and accessibility regression checks for the public NAV entry points.
const homeHtml = readFileSync(resolve(root, "index.html"), "utf8");
for (const [route, label] of [
  ["coaching.html", "coaching"],
  ["nav-coach.html", "software"],
  ["classroom/index.html", "learning"],
  ["contact.html", "undecided visitor"]
]) {
  if (!homeHtml.includes('href="' + route + '"')) fail("index.html", "missing " + label + " journey");
}
if (!homeHtml.includes('id="choose-path-heading"')) fail("index.html", "missing audience choice anchor");
if (!homeHtml.includes('href="#choose-path-heading"')) fail("index.html", "primary action does not lead to audience choices");
if (!/Not sure where to start\?/i.test(homeHtml)) fail("index.html", "no path for undecided visitors");
if (/B\.S\. in Kinesiology, a B\.A\. in Biology/.test(homeHtml)) fail("index.html", "potentially reversed degree credentials");
for (const route of ["index.html", "coaching.html", "nav-coach.html", "classroom/index.html", "contact.html"]) {
  const html = readFileSync(resolve(root, route), "utf8");
  const active = (html.match(/aria-current=["']page["']/g) || []).length;
  if (active > 2) fail(route, "more than one active navigation item per desktop/mobile navigation");
}

// Account and customer-action guardrails: do not mistake a gateway for a deployed member portal.
const accountHtml = readFileSync(resolve(root, "account.html"), "utf8");
for (const mode of ["login", "signup", "reset"]) {
  if (!accountHtml.includes("auth?mode=" + mode)) fail("account.html", "missing " + mode + " route to NAV Coach authentication");
}
if (!/not yet released/i.test(accountHtml)) fail("account.html", "must disclose unreleased website member dashboard");
if (/<form[^>]*(password|login|signup)/i.test(accountHtml)) fail("account.html", "public gateway must not collect authentication credentials");
const coachingHtml = readFileSync(resolve(root, "coaching.html"), "utf8");
if (!/docs\\.google\\.com\\/forms\\//.test(coachingHtml)) fail("coaching.html", "missing working coaching inquiry destination");
const appHtml = readFileSync(resolve(root, "nav-coach.html"), "utf8");
if (!appHtml.includes('href="account.html"')) fail("nav-coach.html", "missing account gateway for new visitors");
if (!appHtml.includes("auth?mode=login")) fail("nav-coach.html", "missing existing-user sign-in");
const firstCoaching = homeHtml.indexOf('class="path-card coaching-path"');
const firstApp = homeHtml.indexOf('class="path-card app-path"');
if (firstCoaching < 0 || firstApp < 0 || firstCoaching > firstApp) fail("index.html", "coaching customer path must precede software path");
const heroBlock = homeHtml.match(/<section class="hero hero-home">([\\s\\S]*?)<\\/section>/)?.[1] || "";
if ((heroBlock.match(/class="button lime"/g) || []).length !== 1) fail("index.html", "hero must have one clear primary action");

const classroomHub = readFileSync(resolve(root, "classroom/index.html"), "utf8");
if (!/data-classroom-hub/.test(classroomHub)) fail("classroom/index.html", "missing Classroom hub enhancement hook");
if (!/data-course-progress/.test(classroomHub)) fail("classroom/index.html", "missing Starter Kit progress control");
if (!/data-classroom-search/.test(classroomHub)) fail("classroom/index.html", "missing module search control");
if (!/data-lms-summary/.test(classroomHub)) fail("classroom/index.html", "missing full-course dashboard summary");

for (const page of lmsPages) {
  const html = readFileSync(resolve(root, page), "utf8");
  if (!/classroom\.css/.test(html)) fail(page, "missing Classroom stylesheet");
  if (!/classroom\.js/.test(html)) fail(page, "missing Classroom behavior script");
  if (!/lms-data\.js/.test(html)) fail(page, "missing shared LMS course data");
  if (!/classroom-subnav/.test(html)) fail(page, "missing Classroom LMS navigation");
}

const fullCoursePage = readFileSync(resolve(root, "classroom/course.html"), "utf8");
if (!/week-links\.js/.test(fullCoursePage)) fail("classroom/course.html", "missing detailed week-link enhancer");
if (!/course\/week-1\/index\.html/.test(fullCoursePage)) fail("classroom/course.html", "missing direct Week 1 entry point");
if (!/syllabus\.html/.test(fullCoursePage)) fail("classroom/course.html", "missing course syllabus entry point");

for (const [index, page] of courseWeekPages.entries()) {
  const weekNumber = index + 1;
  const html = readFileSync(resolve(root, page), "utf8");
  if (!new RegExp(`data-classroom-week=["']${weekNumber}["']`).test(html)) fail(page, `missing Week ${weekNumber} identity hook`);
  if (!/week\.css/.test(html)) fail(page, "missing detailed week stylesheet");
  if (!/lms-data\.js/.test(html) || !/week-data\.js/.test(html) || !/week\.js/.test(html)) fail(page, "missing shared course/week data or renderer");
  if (!/data-week-title/.test(html)) fail(page, "missing stable week page h1 hook");
  if (!/data-week-objectives/.test(html)) fail(page, "missing learning-objective container");
  if (!/data-week-lessons/.test(html)) fail(page, "missing core-lesson container");
  if (!/data-week-evidence/.test(html)) fail(page, "missing evidence-layer container");
  if (!/data-week-deliverables/.test(html)) fail(page, "missing quiz/lab/assignment container");
  if (!/data-week-pager/.test(html)) fail(page, "missing previous/next week navigation container");
  if (!/classroom-subnav/.test(html)) fail(page, "missing Classroom navigation");
}

const syllabus = readFileSync(resolve(root, "classroom/syllabus.html"), "utf8");
if (!/Course learning outcomes/i.test(syllabus)) fail("classroom/syllabus.html", "missing course learning outcomes");
if (!/40%/.test(syllabus) || !/25%/.test(syllabus) || !/15%/.test(syllabus)) fail("classroom/syllabus.html", "missing assessment weighting contract");
if (!/120–126/.test(syllabus)) fail("classroom/syllabus.html", "missing university-format workload target");
if (!/not a claim of institutional approval/i.test(syllabus)) fail("classroom/syllabus.html", "must not imply institutional approval");
if (!/analytically equivalent non-physical alternative/i.test(syllabus)) fail("classroom/syllabus.html", "missing lab accessibility alternative");

for (const workspacePage of ["classroom/assignments.html", "classroom/labs.html"]) {
  const html = readFileSync(resolve(root, workspacePage), "utf8");
  if (!/workspace-sync\.js/.test(html)) fail(workspacePage, "missing workspace completion-state synchronization");
}

for (const moduleFile of classroomModules) {
  const html = readFileSync(resolve(root, moduleFile), "utf8");
  if (!/classroom\.css/.test(html)) fail(moduleFile, "missing shared Classroom stylesheet");
  if (!/classroom\.js/.test(html)) fail(moduleFile, "missing shared Classroom behavior script");
  if (!/<form[^>]*data-quiz[^>]*data-correct=["'][0-9]+["']/i.test(html)) fail(moduleFile, "missing interactive quiz answer key hook");
  if (!/class=["'][^"']*lesson-nav/.test(html)) fail(moduleFile, "missing module navigation container");
  if (!/class=["'][^"']*lesson-content/.test(html)) fail(moduleFile, "missing lesson content container");
}

const css = readFileSync(resolve(root, "style.css"), "utf8");
if (!/@media\(prefers-reduced-motion:reduce\)/.test(css)) fail("style.css", "missing reduced-motion handling");
if (!/:focus-visible/.test(css)) fail("style.css", "missing visible focus treatment");
if (!/env\(safe-area-inset-bottom\)/.test(css)) fail("style.css", "missing mobile safe-area handling");

const classroomCss = readFileSync(resolve(root, "classroom/classroom.css"), "utf8");
if (!/@media\(prefers-reduced-motion:reduce\)/.test(classroomCss)) fail("classroom/classroom.css", "missing reduced-motion handling for Classroom interactions");
if (!/min-height:48px/.test(classroomCss)) fail("classroom/classroom.css", "missing 48px minimum target protection for Classroom controls");
if (!/classroom-subnav/.test(classroomCss)) fail("classroom/classroom.css", "missing LMS sub-navigation styles");
if (!/work-draft/.test(classroomCss)) fail("classroom/classroom.css", "missing assignment/lab workspace styles");

const weekCss = readFileSync(resolve(root, "classroom/week.css"), "utf8");
if (!/@media\(prefers-reduced-motion:reduce\)/.test(weekCss)) fail("classroom/week.css", "missing reduced-motion handling for detailed course weeks");
if (!/@media\(max-width:900px\)/.test(weekCss)) fail("classroom/week.css", "missing responsive week layout");

const classroomJs = readFileSync(resolve(root, "classroom/classroom.js"), "utf8");
if (!/localStorage/.test(classroomJs)) fail("classroom/classroom.js", "missing browser-local progress persistence");
if (!/data-classroom-filter/.test(classroomJs)) fail("classroom/classroom.js", "missing module filtering behavior");
if (!/data-quiz/.test(classroomJs)) fail("classroom/classroom.js", "missing Starter Kit quiz enhancement behavior");
if (!/nav-classroom-full-course-v1/.test(classroomJs)) fail("classroom/classroom.js", "missing full-course local workspace state");
if (!/data-assignment-list/.test(classroomJs)) fail("classroom/classroom.js", "missing assignment workspace renderer");
if (!/data-lab-list/.test(classroomJs)) fail("classroom/classroom.js", "missing lab workspace renderer");
if (!/data-quiz-list/.test(classroomJs)) fail("classroom/classroom.js", "missing full-course quiz renderer");
if (!/data-progress-dashboard/.test(classroomJs)) fail("classroom/classroom.js", "missing progress dashboard renderer");

const weekJs = readFileSync(resolve(root, "classroom/week.js"), "utf8");
if (!/nav-classroom-full-course-v1/.test(weekJs)) fail("classroom/week.js", "detailed weeks must reuse canonical full-course progress state");
if (!/data-week-lessons/.test(weekJs) || !/data-week-deliverables/.test(weekJs)) fail("classroom/week.js", "missing detailed lesson/deliverable renderer");
if (!/Reading a page does not mark mastery/.test(weekJs)) fail("classroom/week.js", "must keep completion distinct from mastery");
if (!/mobile-nav/.test(weekJs)) fail("classroom/week.js", "missing mobile navigation protection for week pages");

const weekData = readFileSync(resolve(root, "classroom/week-data.js"), "utf8");
const detailWeekCount = (weekData.match(/\n\s{2}\d+:\s*\{/g) || []).length;
const lessonSetCount = (weekData.match(/\n\s{4}lessons:\s*\[/g) || []).length;
const workedExampleCount = (weekData.match(/\n\s{4}workedExample:/g) || []).length;
const spacedReturnCount = (weekData.match(/\n\s{4}spacedReturn:/g) || []).length;
const cloMapCount = (weekData.match(/\n\s{4}primaryCLOs:/g) || []).length;
if (detailWeekCount !== 10) fail("classroom/week-data.js", `expected 10 detailed course weeks, found ${detailWeekCount}`);
if (lessonSetCount !== 10) fail("classroom/week-data.js", `expected lesson clusters for all 10 weeks, found ${lessonSetCount}`);
if (workedExampleCount !== 10) fail("classroom/week-data.js", `expected worked examples for all 10 weeks, found ${workedExampleCount}`);
if (spacedReturnCount !== 10) fail("classroom/week-data.js", `expected spaced-return prompts for all 10 weeks, found ${spacedReturnCount}`);
if (cloMapCount !== 10) fail("classroom/week-data.js", `expected CLO mappings for all 10 weeks, found ${cloMapCount}`);

const workspaceSync = readFileSync(resolve(root, "classroom/workspace-sync.js"), "utf8");
if (!/work-complete-button/.test(workspaceSync) || !/work-status/.test(workspaceSync)) fail("classroom/workspace-sync.js", "missing work completion badge synchronization logic");
if (!/requestAnimationFrame/.test(workspaceSync)) fail("classroom/workspace-sync.js", "completion synchronization must run after the primary state update");

const lmsData = readFileSync(resolve(root, "classroom/lms-data.js"), "utf8");
const weekCount = (lmsData.match(/\n\s*week:\s*\d+/g) || []).length;
const quizCount = (lmsData.match(/id:\s*["']quiz-\d+["']/g) || []).length;
const assignmentCount = (lmsData.match(/id:\s*["']assignment-\d+["']/g) || []).length;
const labCount = (lmsData.match(/id:\s*["']lab-[^"']+["']/g) || []).length;
if (weekCount !== 10) fail("classroom/lms-data.js", `expected 10 course weeks, found ${weekCount}`);
if (quizCount !== 10) fail("classroom/lms-data.js", `expected 10 weekly quizzes, found ${quizCount}`);
if (assignmentCount !== 10) fail("classroom/lms-data.js", `expected 10 applied assignments, found ${assignmentCount}`);
if (labCount !== 12) fail("classroom/lms-data.js", `expected 12 solo gym labs, found ${labCount}`);
if (!/Hard to Kill/.test(lmsData)) fail("classroom/lms-data.js", "missing full-course NAV title");


/* Coach Nate proof-of-work: real media, academic attribution, and honest CV claims. */
const coachPage = readFileSync(resolve(root, "coach-nate.html"), "utf8");
const researchAssets = [
  "assets/coach-nate-lab-portrait.webp",
  "assets/coach-nate-acs-conference.webp",
  "assets/coach-nate-lab-bench.webp",
  "assets/coach-nate-research-poster.webp",
  "assets/coach-nate-research-poster.pdf"
];
for (const asset of researchAssets) {
  const fullPath = resolve(root, asset);
  if (!existsSync(fullPath) || !statSync(fullPath).isFile() || statSync(fullPath).size < 1000) {
    fail("coach-nate.html", `missing or empty original research media: ${asset}`);
  }
  if (!coachPage.includes(asset)) fail("coach-nate.html", `media not linked in page: ${asset}`);
}
for (const required of [
  "Cycling of Ethanol and Acetaldehyde in Estuarine Waters",
  "Jefferson Crosland",
  "Nate Holochwost",
  "Warren de Bruyn",
  "Catherine Clark",
  "B.S. Kinesiology",
  "B.A. Biology",
  "10.1007/s10560-024-01000-y",
  "2,000+",
  "https://coach-nate.netlify.app/coach-nate.html",
  "class=\"mobile-nav",
  "class=\"desktop-nav"
]) if (!coachPage.includes(required)) fail("coach-nate.html", `missing research / credibility evidence: ${required}`);
if (/holochn@yahoo\.com|\(313\)[ -]*300|principal investigator|fake testimonial|AI-generated portrait/i.test(coachPage)) {
  fail("coach-nate.html", "private contact, invented appointment, or disallowed fabricated imagery claim");
}
if (!/<img[^>]+alt=["'][^"']{12,}["']/i.test(coachPage)) fail("coach-nate.html", "research images need descriptive alt text");

if (failures.length) {
  console.error(`NAV public-site release gate failed with ${failures.length} problem(s):`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`NAV public-site release gate passed (${htmlFiles.length} HTML pages checked).`);
console.log(`Required routes/assets: ${requiredFiles.length}; Starter modules: ${classroomModules.length}; LMS pages: ${lmsPages.length}; detailed course weeks: ${courseWeekPages.length}; weeks: ${weekCount}; quizzes: ${quizCount}; labs: ${labCount}; assignments: ${assignmentCount}; broken internal links: 0.`);
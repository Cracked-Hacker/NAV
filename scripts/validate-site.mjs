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

const lmsPages = [
  "classroom/index.html",
  "classroom/course.html",
  "classroom/syllabus.html",
  "classroom/week.html",
  "classroom/assignments.html",
  "classroom/labs.html",
  "classroom/quizzes.html",
  "classroom/materials.html",
  "classroom/progress.html"
];

const requiredFiles = [
  "index.html",
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
  "classroom/curriculum-detail.js",
  "classroom/curriculum-ui.js",
  "classroom/curriculum.css",
  ...lmsPages,
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
if (htmlFiles.length < 28) failures.push(`site: expected at least 28 HTML pages, found ${htmlFiles.length}`);

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
    if (href.startsWith("/")) { fail(rel, `root-absolute internal link is unsafe for the current /NAV/ Pages base: ${rawHref}`); continue; }
    let target = normalize(resolve(dirname(file), href));
    if (href.endsWith("/")) target = join(target, "index.html");
    if (existsSync(target) && statSync(target).isDirectory()) target = join(target, "index.html");
    if (!target.startsWith(root + sep) && target !== root) { fail(rel, `link escapes repository root: ${rawHref}`); continue; }
    if (!existsSync(target)) fail(rel, `broken internal link: ${rawHref}`);
  }
}

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
  if (!/href=["']syllabus\.html["']/.test(html)) fail(page, "missing Course Guide / Syllabus navigation");
}

for (const workspacePage of ["classroom/assignments.html", "classroom/labs.html"]) {
  const html = readFileSync(resolve(root, workspacePage), "utf8");
  if (!/workspace-sync\.js/.test(html)) fail(workspacePage, "missing workspace completion-state synchronization");
}

for (const curriculumPage of ["classroom/course.html", "classroom/syllabus.html", "classroom/week.html", "classroom/progress.html"]) {
  const html = readFileSync(resolve(root, curriculumPage), "utf8");
  if (!/curriculum-detail\.js/.test(html)) fail(curriculumPage, "missing detailed Class Builder curriculum data");
  if (!/curriculum-ui\.js/.test(html)) fail(curriculumPage, "missing detailed Class Builder curriculum behavior");
  if (!/curriculum\.css/.test(html)) fail(curriculumPage, "missing detailed Class Builder curriculum styles");
}

const syllabusPage = readFileSync(resolve(root, "classroom/syllabus.html"), "utf8");
if (!/data-syllabus/.test(syllabusPage)) fail("classroom/syllabus.html", "missing course guide renderer hook");
if (!/not university-approved/i.test(syllabusPage)) fail("classroom/syllabus.html", "must clearly distinguish university-ready design from university approval");

const weekPage = readFileSync(resolve(root, "classroom/week.html"), "utf8");
if (!/data-week-view/.test(weekPage)) fail("classroom/week.html", "missing detailed week renderer hook");
if (!/data-week-title/.test(weekPage)) fail("classroom/week.html", "missing dynamic week title hook");

const coursePage = readFileSync(resolve(root, "classroom/course.html"), "utf8");
if (!/data-course-map/.test(coursePage)) fail("classroom/course.html", "missing full-course map renderer hook");
if (!/Quick answer → learn → apply → inspect evidence → master/i.test(coursePage)) fail("classroom/course.html", "missing Class Builder learning-depth explanation");

const progressPage = readFileSync(resolve(root, "classroom/progress.html"), "utf8");
if (!/data-mastery-dashboard/.test(progressPage)) fail("classroom/progress.html", "missing mastery dashboard separate from completion");

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

const curriculumCss = readFileSync(resolve(root, "classroom/curriculum.css"), "utf8");
if (!/@media \(prefers-reduced-motion: reduce\)/.test(curriculumCss)) fail("classroom/curriculum.css", "missing reduced-motion handling for detailed curriculum interactions");
if (!/min-height: 48px/.test(curriculumCss)) fail("classroom/curriculum.css", "missing minimum touch-target protection for detailed curriculum controls");
if (!/mastery-chip/.test(curriculumCss)) fail("classroom/curriculum.css", "missing mastery-state styles");

const classroomJs = readFileSync(resolve(root, "classroom/classroom.js"), "utf8");
if (!/localStorage/.test(classroomJs)) fail("classroom/classroom.js", "missing browser-local progress persistence");
if (!/data-classroom-filter/.test(classroomJs)) fail("classroom/classroom.js", "missing module filtering behavior");
if (!/data-quiz/.test(classroomJs)) fail("classroom/classroom.js", "missing Starter Kit quiz enhancement behavior");
if (!/nav-classroom-full-course-v1/.test(classroomJs)) fail("classroom/classroom.js", "missing full-course local workspace state");
if (!/data-assignment-list/.test(classroomJs)) fail("classroom/classroom.js", "missing assignment workspace renderer");
if (!/data-lab-list/.test(classroomJs)) fail("classroom/classroom.js", "missing lab workspace renderer");
if (!/data-quiz-list/.test(classroomJs)) fail("classroom/classroom.js", "missing full-course quiz renderer");
if (!/data-progress-dashboard/.test(classroomJs)) fail("classroom/classroom.js", "missing progress dashboard renderer");

const curriculumUi = readFileSync(resolve(root, "classroom/curriculum-ui.js"), "utf8");
if (!/nav-classroom-mastery-v1/.test(curriculumUi)) fail("classroom/curriculum-ui.js", "missing mastery state distinct from activity completion");
if (!/masteryCheck/.test(curriculumUi)) fail("classroom/curriculum-ui.js", "missing separate mastery retrieval checks");
if (!/week\.html\?week=/.test(curriculumUi)) fail("classroom/curriculum-ui.js", "missing course-map links into detailed weekly learning units");
if (!/Quick Answer|quickAnswer/.test(curriculumUi)) fail("classroom/curriculum-ui.js", "missing Quick Answer learning depth");
if (!/Deep Dive|deepDive/.test(curriculumUi)) fail("classroom/curriculum-ui.js", "missing Deep Dive learning depth");

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

const curriculumDetail = readFileSync(resolve(root, "classroom/curriculum-detail.js"), "utf8");
const cloCount = (curriculumDetail.match(/["']CLO\d+\./g) || []).length;
const masteryCheckCount = (curriculumDetail.match(/masteryCheck:\s*\{/g) || []).length;
const evidenceAnchorCount = (curriculumDetail.match(/id:\s*["']E-\d+["']/g) || []).length;
if (cloCount !== 14) fail("classroom/curriculum-detail.js", `expected 14 course learning outcomes, found ${cloCount}`);
if (masteryCheckCount !== 10) fail("classroom/curriculum-detail.js", `expected 10 weekly mastery checks, found ${masteryCheckCount}`);
if (evidenceAnchorCount < 5) fail("classroom/curriculum-detail.js", `expected at least 5 public evidence-ledger anchors, found ${evidenceAnchorCount}`);
if (!/4 quarter credits/.test(curriculumDetail)) fail("classroom/curriculum-detail.js", "missing four-quarter-credit course record");
if (!/No capstone|no capstone/i.test(`${syllabusPage}\n${coursePage}`)) fail("classroom", "missing explicit no-capstone requirement");
if (!/learningSequence/.test(curriculumDetail)) fail("classroom/curriculum-detail.js", "missing ten-step learning sequence");
if (!/masteryLevels/.test(curriculumDetail)) fail("classroom/curriculum-detail.js", "missing mastery progression states");

if (failures.length) {
  console.error(`NAV public-site release gate failed with ${failures.length} problem(s):`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`NAV public-site release gate passed (${htmlFiles.length} HTML pages checked).`);
console.log(`Required routes/assets: ${requiredFiles.length}; Starter modules: ${classroomModules.length}; LMS pages: ${lmsPages.length}; weeks: ${weekCount}; quizzes: ${quizCount}; labs: ${labCount}; assignments: ${assignmentCount}; CLOs: ${cloCount}; mastery checks: ${masteryCheckCount}; evidence anchors: ${evidenceAnchorCount}; broken internal links: 0.`);
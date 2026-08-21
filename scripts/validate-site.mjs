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
  "classroom/index.html",
  "classroom/classroom.css",
  "classroom/classroom.js",
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

if (htmlFiles.length < 20) {
  failures.push(`site: expected at least 20 HTML pages, found ${htmlFiles.length}`);
}

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
    if (
      !rawHref ||
      rawHref.startsWith("#") ||
      rawHref.startsWith("mailto:") ||
      rawHref.startsWith("tel:") ||
      rawHref.startsWith("http://") ||
      rawHref.startsWith("https://") ||
      rawHref.startsWith("data:")
    ) continue;

    const href = rawHref.split("#", 1)[0].split("?", 1)[0];
    if (!href) continue;

    if (href.startsWith("/")) {
      fail(rel, `root-absolute internal link is unsafe for the current /NAV/ Pages base: ${rawHref}`);
      continue;
    }

    let target = normalize(resolve(dirname(file), href));
    if (href.endsWith("/")) target = join(target, "index.html");
    if (existsSync(target) && statSync(target).isDirectory()) target = join(target, "index.html");

    if (!target.startsWith(root + sep) && target !== root) {
      fail(rel, `link escapes repository root: ${rawHref}`);
      continue;
    }

    if (!existsSync(target)) fail(rel, `broken internal link: ${rawHref}`);
  }
}

const classroomHub = readFileSync(resolve(root, "classroom/index.html"), "utf8");
if (!/data-classroom-hub/.test(classroomHub)) fail("classroom/index.html", "missing Classroom hub enhancement hook");
if (!/classroom\.css/.test(classroomHub)) fail("classroom/index.html", "missing Classroom stylesheet");
if (!/classroom\.js/.test(classroomHub)) fail("classroom/index.html", "missing Classroom behavior script");
if (!/data-course-progress/.test(classroomHub)) fail("classroom/index.html", "missing Starter Kit progress control");
if (!/data-classroom-search/.test(classroomHub)) fail("classroom/index.html", "missing module search control");

for (const moduleFile of classroomModules) {
  const html = readFileSync(resolve(root, moduleFile), "utf8");
  if (!/classroom\.css/.test(html)) fail(moduleFile, "missing shared Classroom stylesheet");
  if (!/classroom\.js/.test(html)) fail(moduleFile, "missing shared Classroom behavior script");
  if (!/<form[^>]*data-quiz[^>]*data-correct=["'][0-9]+["']/i.test(html)) {
    fail(moduleFile, "missing interactive quiz answer key hook");
  }
  if (!/class=["'][^"']*lesson-nav/.test(html)) fail(moduleFile, "missing module navigation container");
  if (!/class=["'][^"']*lesson-content/.test(html)) fail(moduleFile, "missing lesson content container");
}

const css = readFileSync(resolve(root, "style.css"), "utf8");
if (!/@media\(prefers-reduced-motion:reduce\)/.test(css)) {
  fail("style.css", "missing reduced-motion handling");
}
if (!/:focus-visible/.test(css)) fail("style.css", "missing visible focus treatment");
if (!/env\(safe-area-inset-bottom\)/.test(css)) fail("style.css", "missing mobile safe-area handling");

const classroomCss = readFileSync(resolve(root, "classroom/classroom.css"), "utf8");
if (!/@media\(prefers-reduced-motion:reduce\)/.test(classroomCss)) {
  fail("classroom/classroom.css", "missing reduced-motion handling for Classroom interactions");
}
if (!/min-height:48px/.test(classroomCss)) {
  fail("classroom/classroom.css", "missing 48px minimum target protection for Classroom controls");
}

const classroomJs = readFileSync(resolve(root, "classroom/classroom.js"), "utf8");
if (!/localStorage/.test(classroomJs)) fail("classroom/classroom.js", "missing browser-local progress persistence");
if (!/data-classroom-filter/.test(classroomJs)) fail("classroom/classroom.js", "missing module filtering behavior");
if (!/data-quiz/.test(classroomJs)) fail("classroom/classroom.js", "missing quiz enhancement behavior");

if (failures.length) {
  console.error(`NAV public-site release gate failed with ${failures.length} problem(s):`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`NAV public-site release gate passed (${htmlFiles.length} HTML pages checked).`);
console.log(`Required routes/assets: ${requiredFiles.length}; Classroom modules protected: ${classroomModules.length}; broken internal links: 0; prohibited production placeholders/origins: 0.`);

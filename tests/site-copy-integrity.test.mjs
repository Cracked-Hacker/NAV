import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import test from "node:test";

const read = path => readFileSync(new URL("../" + path, import.meta.url), "utf8");

test("Coach Nate's publicly approved background stays correct", () => {
  const coach = read("coach-nate.html");
  const about = read("about.html");
  assert.match(coach, /Before college, I lost 65 pounds/);
  assert.match(coach, /B\.S\. in Kinesiology, a B\.A\. in Biology, and a minor in Chemistry/);
  assert.match(about, /B\.S\. in Kinesiology/);
  assert.match(about, /B\.A\. in Biology/);
  assert.match(coach, /co-presented our research poster at the <strong>American Chemical Society National Meeting/);
  assert.match(coach, /I derived a pixel-based conversion factor/);
  assert.match(coach, /2023/);
});

test("public product copy identifies actual downloads and unfinished offerings", () => {
  const products = read("products.html");
  assert.match(products, /NAV_Ultimate_Muscle_All_Formats_2026-11\.zip/);
  assert.match(products, /Human_Sciences_Atlas_2026\.pdf/);
  assert.match(products, /NAV_Performance_Nutrition_The_Simple_Guide_v1-1\.pdf/);
  assert.match(products, /Free at \$0/);
  assert.doesNotMatch(products, /<article id="classroom"/);
  assert.doesNotMatch(products, /guaranteed results|scientifically proven|owner-provided certificate/i);
});

test("research statements preserve source links and distinguish contribution", () => {
  const research = read("research.html");
  assert.match(research, /coach-nate-research-poster\.pdf/);
  assert.match(research, /10\.1007\/s10560-024-01000-y/);
  assert.match(research, /I conducted literature reviews on contraceptive types, effectiveness, prescription frequency and use, and assisted in table development, manuscript writing and revision/);
  const interests = research.slice(research.indexOf('<h2 id="research-interests">'), research.indexOf('</main>'));
  assert.match(interests, /I aim to contribute to the development of accessible, minimally invasive/);
  assert.match(interests, /I am interested in optimizing strength development in adults/);
  assert.match(interests, /I am also interested in strength development and muscle hypertrophy/);
  assert.doesNotMatch(interests, /35756986|From evidence to practice/);
});

test("online NAV pricing is separate from employer booking and proposed partnerships", () => {
  const coaching = read("coaching.html");
  assert.match(coaching, /\$80–\$300 per week/);
  assert.match(coaching, /Book sessions, check availability, and view pricing directly through Blinnergy/);
  assert.match(coaching, /Scheduling and availability are handled through EXOS, separately from NAV/);
  assert.doesNotMatch(coaching, /Rain City Fit|\$100 base price per session/);
});

test("every public page uses the same five navigation headings before JavaScript runs", () => {
  const pages = [
    "404.html", "about.html", "accessibility.html", "coach-nate.html",
    "coaching.html", "contact.html", "disclaimer.html", "index.html",
    "nav-coach.html", "products.html", "privacy.html", "research.html",
    "resources.html", "science.html", "terms.html",
    "account/auth.html", "account/index.html", "classroom/index.html"
  ];
  const expected = ["Home", "Services", "Products", "About", "Account"];
  for (const path of pages) {
    const html = read(path);
    const start = html.indexOf('<nav class="desktop-nav');
    const mobileStart = html.indexOf('<nav aria-label="Mobile primary">');
    assert.ok(start >= 0 && mobileStart >= 0, "navigation missing in " + path);
    const desktop = html.slice(start, html.indexOf("</nav>", start));
    const mobile = html.slice(mobileStart, html.indexOf("</nav>", mobileStart));
    const labels = fragment => [...fragment.matchAll(/<(?:a|summary)\b[^>]*>([^<]+)<\/(?:a|summary)>/g)]
      .map(x => x[1].trim()).filter(x => expected.includes(x));
    assert.deepEqual(labels(desktop), expected, path + " desktop");
    assert.deepEqual(labels(mobile), expected, path + " mobile");
  }
});

test("EXOS Easter egg stays optional, local, and restores its text after 11 seconds", () => {
  const page=read("coaching.html");
  const code=read("assets/exos-easter-egg.js");
  const css=read("style.css");
  const manifest=read("scripts/public-release-manifest.mjs");
  assert.doesNotMatch(page, /opens Google Maps in a new tab/i);
  assert.match(page, /data-exos-card/);
  assert.match(page, /data-exos-trigger>this button does nothing<\/button>/);
  assert.equal((page.match(/data-exos-fall/g)||[]).length,4);
  assert.match(page, /assets\/exos-easter-egg\.js/);
  assert.match(manifest, /assets\/exos-easter-egg\.js/);
  assert.match(code, /const RESET_MS = 11000/);
  assert.match(code, /new AudioEngine\(\)/);
  assert.match(code, /requestAnimationFrame/);
  assert.match(code, /getBoundingClientRect/);
  assert.match(code, /Math\.min\(a\.x \+ a\.w, b\.x \+ b\.w\)/);
  assert.match(code, /window\.matchMedia\('\(prefers-reduced-motion: reduce\)'\)/);
  assert.match(css, /exos-blast-core/);
  assert.match(css, /exos-falling-word/);
  assert.doesNotMatch(code, /\bfetch\(|XMLHttpRequest|new Audio\(|localStorage|sendBeacon/);
});

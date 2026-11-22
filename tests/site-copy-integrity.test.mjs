import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import test from "node:test";

const read = path => readFileSync(new URL("../" + path, import.meta.url), "utf8");

test("Coach Nate's publicly approved background stays correct", () => {
  const coach = read("coach-nate.html");
  const about = read("about.html");
  assert.match(coach, /After losing 65 pounds/);
  assert.match(coach, /B\.S\. in Kinesiology, a B\.A\. in Biology, and a minor in Chemistry/);
  assert.match(about, /B\.S\. in Kinesiology/);
  assert.match(about, /B\.A\. in Biology/);
  assert.match(about, /I co-presented our work/);
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
  assert.match(research, /I did not conduct the team's full statistical analysis/);
  assert.match(research, /not yet conducted experimental research in cartilage regeneration/);
});

test("online NAV pricing is separate from employer booking and proposed partnerships", () => {
  const coaching = read("coaching.html");
  assert.match(coaching, /\$80–\$300 per week/);
  assert.match(coaching, /Blinnergy manages its own bookings/);
  assert.match(coaching, /EXOS manages these sessions separately from NAV/);
  assert.doesNotMatch(coaching, /Rain City Fit|\$100 base price per session/);
});

test("every public page uses the same five navigation headings before JavaScript runs", () => {
  const pages = [
    "404.html", "about.html", "accessibility.html", "coach-nate.html",
    "coaching.html", "contact.html", "disclaimer.html", "index.html",
    "nav-coach.html", "products.html", "privacy.html", "research.html",
    "resources.html", "resume.html", "science.html", "terms.html",
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

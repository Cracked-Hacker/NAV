import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { CHANNEL_HANDLE, EDUCATIONAL_LONGFORM_VIDEOS, getApprovedEducationalVideos, isApprovedEducationalLongform } from "../assets/nav-youtube-education-catalog.mjs";

const read = path => readFileSync(new URL("../" + path, import.meta.url), "utf8");
const sample = {
  channelHandle: "NAV-nate", videoId: "Ab1Cd2Ef3Gh",
  watchUrl: "https://www.youtube.com/watch?v=Ab1Cd2Ef3Gh",
  title: "Training science and squat mechanics explained",
  summary: "An educational explanation of force, joint moments and coaching decisions.",
  durationSeconds: 780, category: "exercise-education",
  format: "long-form", editorialApproved: true, reviewedOn: "2026-11-19"
};

test("YouTube channel matches owner and direct video selection is opt-in", () => {
  assert.equal(CHANNEL_HANDLE, "NAV-nate");
  assert.ok(isApprovedEducationalLongform(sample));
  assert.ok(EDUCATIONAL_LONGFORM_VIDEOS.every(isApprovedEducationalLongform));
  assert.deepEqual(getApprovedEducationalVideos().length, new Set(getApprovedEducationalVideos().map(v => v.videoId)).size);
});
test("reject gaming, Shorts, unreviewed uploads, wrong channel and fabricated durations", () => {
  for (const patch of [
    { title:"Fallout gaming and squat mechanics" },
    { summary:"A review of Fortnite gameplay and strategy videos." },
    { format:"shorts" },
    { format:"live" },
    { durationSeconds:179 },
    { channelHandle:"not-NAV-nate" },
    { editorialApproved:false },
    { reviewedOn:"" },
    { videoId:"fake" },
    { watchUrl:"https://www.youtube.com/shorts/Ab1Cd2Ef3Gh" }
  ]) assert.equal(isApprovedEducationalLongform({ ...sample, ...patch }), false, JSON.stringify(patch));
});
test("real homepage and Coach Nate showcase share only reviewed catalog", () => {
  for (const page of ["index.html", "coach-nate.html"]) {
    const html = read(page);
    assert.match(html, /data-youtube-showcase/);
    assert.match(html, /data-youtube-grid/);
    assert.match(html, /data-youtube-empty/);
    assert.match(html, /assets\/nav-youtube-education\.js/);
    assert.match(html, /https:\/\/www\.youtube\.com\/@NAV-nate\/videos/);
    assert.doesNotMatch(html, /youtube\.com\/embed\//);
  }
  assert.match(read("resources.html"), /index\.html#educational-videos/);
  const js = read("assets/nav-youtube-education.js");
  assert.match(js, /getApprovedEducationalVideos\(\)/);
  assert.match(js, /addEventListener\("click"/);
  assert.match(js, /youtube-nocookie\.com\/embed/);
  assert.match(js, /iframe\.src/);
  const manifest = read("scripts/public-release-manifest.mjs");
  for (const file of ["assets/nav-youtube-education.js", "assets/nav-youtube-education-catalog.mjs"]) {
    assert.ok(manifest.includes('"' + file + '"'), file + " absent from approved release manifest");
  }
});

import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

// Source may contain unpublished authoring work. Only the exact packaged
// artifact is a public release. This test runs the same packager as Netlify.
test("Netlify public artifact never includes an unapproved Classroom product", () => {
  execFileSync(process.execPath, ["scripts/package-site.mjs"], { cwd: process.cwd(), stdio: "pipe" });
  const root = ".site-build";
  assert.ok(existsSync(root + "/index.html"), "public marketing remains available");
  assert.ok(existsSync(root + "/account/auth.html"), "NAV sign-in remains available");
  const landing = readFileSync(root + "/classroom/index.html", "utf8");
  assert.match(landing, /Exercise science that improves decisions/);
  assert.match(landing, /Sign in to NAV/);
  assert.doesNotMatch(landing, /Hard to Kill|Start Week 1|10 quizzes|Starter Kit|quiz-1/i);
  for (const path of [
    "classroom/course.html",
    "classroom/syllabus.html",
    "classroom/quizzes.html",
    "classroom/labs.html",
    "classroom/assignments.html",
    "classroom/progress.html",
    "classroom/lms-data.js",
    "classroom/weekly-question-bank.js",
    "classroom/week-data.js",
    "classroom/course/week-1/index.html",
    "classroom/how-training-works/index.html"
  ]) {
    assert.equal(existsSync(root + "/" + path), false, path + " must not be publicly deployable");
  }
});

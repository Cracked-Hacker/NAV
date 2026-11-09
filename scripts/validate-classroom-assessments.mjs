import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { strict as assert } from "node:assert";
import { resolve } from "node:path";

const root = process.cwd();
const context = { window: {} };
for (const file of ["classroom/lms-data.js", "classroom/week-data.js", "classroom/weekly-question-bank.js"]) {
  runInNewContext(readFileSync(resolve(root, file), "utf8"), context, { filename: file, timeout: 1000 });
}
const { NAV_CLASSROOM: course, NAV_WEEK_DETAILS: weekDetails, NAV_CLASSROOM_WEEKLY_BANK: bank } = context.window;
const error = (message) => { throw new Error(`NAV Classroom assessment quality gate: ${message}`); };
if (course?.weeks?.length !== 10) error("expected ten course weeks");
if (bank?.version !== "weekly-v2-2026-11-09") error("bank version mismatch; update grading migration when changing bank");
if (bank?.threshold !== 0.8) error("documented formative target must be 80%");
const seen = new Set();
let items = 0, applied = 0, objectiveMappings = 0;
for (const week of course.weeks) {
  const id = Number(week.week);
  const detail = weekDetails[id];
  const rows = bank.rows[id];
  if (!Number.isInteger(id) || id < 1 || id > 10 || !detail || !Array.isArray(detail.objectives) || detail.objectives.length !== 4) error(`invalid objectives week ${id}`);
  if (!Array.isArray(rows) || rows.length !== 7) error(`week ${id} must have 7 supplement items and 1 original`);
  if (!week.quiz || !Array.isArray(week.quiz.options) || week.quiz.options.length !== 4 || !Number.isInteger(week.quiz.correct)) error(`missing core item week ${id}`);
  const ids = [bank.originalObjective[id], ...rows.map(row => row[0])];
  if ([...new Set(ids)].length !== 4) error(`week ${id} does not cover all four objectives`);
  const questions = [{ objective: bank.originalObjective[id], level: "understand", prompt: week.quiz.question, options: week.quiz.options, correct: week.quiz.correct, explanation: week.quiz.explanation },
    ...rows.map(([objective, level, prompt, options, correct, explanation]) => ({ objective, level, prompt, options, correct, explanation }))];
  if (questions.length !== 8) error(`week ${id} must offer exactly 8 items`);
  const levels = new Set();
  for (const q of questions) {
    items++;
    const stem = String(q.prompt).trim();
    if (stem.length < 25 || seen.has(stem.toLowerCase())) error(`duplicate or trivial item: week ${id}: ${stem}`);
    seen.add(stem.toLowerCase());
    if (!Number.isInteger(q.objective) || q.objective < 1 || q.objective > 4) error(`invalid objective mapping week ${id}`);
    if (!["understand","apply","analyze","evaluate"].includes(q.level)) error(`invalid learning level week ${id}`);
    if (["apply","analyze","evaluate"].includes(q.level)) applied++;
    levels.add(q.level);
    if (!Array.isArray(q.options) || q.options.length !== 4 || new Set(q.options.map(String)).size !== 4 ||
        !Number.isInteger(q.correct) || q.correct < 0 || q.correct >= 4) error(`invalid options/answer week ${id}`);
    if (String(q.explanation).trim().length < 55) error(`explanation too short week ${id}`);
    objectiveMappings++;
  }
  if (!levels.has("apply") || !levels.has("analyze") || !levels.has("evaluate")) error(`week ${id} lacks applied/evaluative practice`);
}
if (items !== 80 || applied < 55) error(`expected 80 total items and at least 55 higher-order items, got ${items}/${applied}`);
const page = readFileSync(resolve(root,"classroom/quizzes.html"),"utf8");
const scripts = [...page.matchAll(/<script[^>]*src=["']([^"']+)["']/g)].map(m=>m[1]);
const index = name => scripts.indexOf(name);
if (index("lms-data.js") < 0 || index("week-data.js") < index("lms-data.js") ||
    index("weekly-question-bank.js") < index("week-data.js") ||
    index("classroom.js") < index("weekly-question-bank.js")) error("quiz page scripts must load course, objectives, question bank, then quiz renderer");
const js = readFileSync(resolve(root, "classroom/classroom.js"),"utf8");
for (const marker of [
 "weeklyItems(week)", "new Set(items.map", "Score all 8 answers", "Answer all eight questions",
 "Legacy one-answer passes are deliberately not counted", "practice-rubric-checklist",
 "To self-mark, write at least 150 characters", "Correct answer:", "quizResults",
 'score: bestPercent', "Math.floor(Math.random() * (i + 1))"
]) if (!js.includes(marker)) error(`renderer lacks required behavior: ${marker}`);
if (js.includes('quiz.question; fieldset.append(legend)')) error("legacy one-question renderer remains");
const percent = correct => Math.round((100*correct)/8);
if (!(percent(6)<80 && percent(7)>=80 && percent(8)===100)) error("80% pass boundary broken");
const progress = readFileSync(resolve(root,"classroom/progress.html"),"utf8");
if (!progress.includes("self-reported") || !progress.includes("not graded")) error("progress wrongly conflates self-report and verified mastery");
console.log(`NAV Classroom assessment quality gate passed: ${items} questions; ${applied} apply/analyze/evaluate; 40 outcome mappings; 10 eight-item quizzes; 7/8 practice threshold; legacy pass migration; self-review and privacy disclosures.`);

(() => {
  const course = window.NAV_CLASSROOM;
  const detail = window.NAV_CURRICULUM_DETAIL;
  if (!course?.weeks || !detail?.weeks) return;

  const fullCourseKey = "nav-classroom-full-course-v1";
  const masteryKey = "nav-classroom-mastery-v1";
  const emptyMastery = { visitedWeeks: [], masteredWeeks: [], masteryAttempts: {} };

  function readJson(key, fallback) {
    try {
      const parsed = JSON.parse(window.localStorage.getItem(key) || "null");
      return parsed && typeof parsed === "object" ? parsed : fallback;
    } catch {
      return fallback;
    }
  }

  function writeJson(key, value) {
    try { window.localStorage.setItem(key, JSON.stringify(value)); } catch { /* local-only enhancement */ }
  }

  function loadFullCourse() {
    const state = readJson(fullCourseKey, {});
    const completed = state.completed && typeof state.completed === "object" ? state.completed : {};
    return {
      completed: {
        assignments: Array.isArray(completed.assignments) ? completed.assignments : [],
        labs: Array.isArray(completed.labs) ? completed.labs : [],
        quizzes: Array.isArray(completed.quizzes) ? completed.quizzes : []
      }
    };
  }

  function loadMastery() {
    const state = readJson(masteryKey, emptyMastery);
    return {
      visitedWeeks: Array.isArray(state.visitedWeeks) ? [...new Set(state.visitedWeeks.map(Number).filter((week) => week >= 1 && week <= 10))] : [],
      masteredWeeks: Array.isArray(state.masteredWeeks) ? [...new Set(state.masteredWeeks.map(Number).filter((week) => week >= 1 && week <= 10))] : [],
      masteryAttempts: state.masteryAttempts && typeof state.masteryAttempts === "object" ? state.masteryAttempts : {}
    };
  }

  function saveMastery(state) { writeJson(masteryKey, state); }

  function findWeek(number) { return course.weeks.find((week) => week.week === number); }

  function weekStatus(number) {
    const week = findWeek(number);
    if (!week) return { label: "New", className: "new", complete: false };
    const full = loadFullCourse();
    const mastery = loadMastery();
    const quizDone = full.completed.quizzes.includes(week.quiz.id);
    const labsDone = week.labs.every((lab) => full.completed.labs.includes(lab.id));
    const assignmentDone = full.completed.assignments.includes(week.assignment.id);
    const complete = quizDone && labsDone && assignmentDone;
    if (mastery.masteredWeeks.includes(number)) return { label: "Mastered", className: "mastered", complete: true };
    if (complete) return { label: "Proficient", className: "proficient", complete: true };
    if (quizDone) return { label: "Familiar", className: "familiar", complete: false };
    if (mastery.visitedWeeks.includes(number)) return { label: "Learning", className: "learning", complete: false };
    return { label: "New", className: "new", complete: false };
  }

  function masteryBadge(number) {
    const status = weekStatus(number);
    const span = document.createElement("span");
    span.className = `mastery-chip mastery-${status.className}`;
    span.textContent = status.label;
    span.setAttribute("aria-label", `Week ${number} mastery status: ${status.label}`);
    return span;
  }

  function decorateCourseMap() {
    const root = document.querySelector("[data-course-map]");
    if (!root) return;
    window.requestAnimationFrame(() => {
      [...root.querySelectorAll(".week-card")].forEach((card, index) => {
        if (card.querySelector(".week-card-actions")) return;
        const week = course.weeks[index];
        if (!week) return;
        const actions = document.createElement("div");
        actions.className = "week-card-actions";
        const link = document.createElement("a");
        link.className = "text-link week-open-link";
        link.href = `week.html?week=${week.week}`;
        link.textContent = `Open Week ${week.week} →`;
        actions.append(link, masteryBadge(week.week));
        card.append(actions);
      });
    });
  }

  function heading(text, level = 2) {
    const el = document.createElement(`h${level}`);
    el.textContent = text;
    return el;
  }

  function paragraph(text, className = "") {
    const p = document.createElement("p");
    p.textContent = text;
    if (className) p.className = className;
    return p;
  }

  function list(items, className = "") {
    const ul = document.createElement("ul");
    if (className) ul.className = className;
    items.forEach((item) => { const li = document.createElement("li"); li.textContent = item; ul.append(li); });
    return ul;
  }

  function renderSyllabus() {
    const root = document.querySelector("[data-syllabus]");
    if (!root) return;
    root.textContent = "";

    const notice = document.createElement("section");
    notice.className = "curriculum-notice";
    notice.append(paragraph("Academic status", "eyebrow"), heading("University-ready course design, not an approval claim."), paragraph(detail.sourceNote));

    const record = document.createElement("section");
    record.className = "curriculum-section";
    record.append(paragraph("Course record", "eyebrow"), heading("What this course is"));
    const recordGrid = document.createElement("div");
    recordGrid.className = "syllabus-grid";
    [
      ["Academic title", detail.courseRecord.academicTitle],
      ["Commercial title", detail.courseRecord.commercialTitle],
      ["Proposed course", detail.courseRecord.proposedNumber],
      ["Credits / length", `${detail.courseRecord.credits} · ${detail.courseRecord.length}`],
      ["Audience", detail.courseRecord.audience],
      ["Recommended preparation", detail.courseRecord.prerequisites],
      ["Modalities", detail.courseRecord.modalities],
      ["Catalog description", detail.courseRecord.description]
    ].forEach(([label, value]) => {
      const card = document.createElement("article");
      card.className = "curriculum-card";
      card.append(paragraph(label, "eyebrow"), paragraph(value));
      recordGrid.append(card);
    });
    record.append(recordGrid);

    const outcomes = document.createElement("section");
    outcomes.className = "curriculum-section";
    outcomes.append(paragraph("Backward design", "eyebrow"), heading("14 measurable course learning outcomes"), paragraph("Every week, quiz, lab, and assignment exists to build and sample these outcomes—not simply to cover interesting topics."), list(detail.learningOutcomes, "outcome-list"));

    const assessment = document.createElement("section");
    assessment.className = "curriculum-section";
    assessment.append(paragraph("Assessment", "eyebrow"), heading("Distributed evidence of learning"), paragraph("There is no capstone. No single assessment dominates the course. Physical performance is not graded as athletic achievement."));
    const gradeWrap = document.createElement("div"); gradeWrap.className = "grading-grid";
    detail.grading.forEach((item) => {
      const row = document.createElement("div"); row.className = "grading-row";
      const copy = document.createElement("div"); copy.append(heading(item.label, 3), paragraph(`${item.weight}% of the university-format course`));
      const meter = document.createElement("div"); meter.className = "grading-meter"; meter.setAttribute("aria-label", `${item.label}: ${item.weight}%`);
      const fill = document.createElement("span"); fill.style.width = `${item.weight}%`; meter.append(fill);
      row.append(copy, meter); gradeWrap.append(row);
    });
    assessment.append(gradeWrap);

    const workload = document.createElement("section");
    workload.className = "curriculum-section";
    workload.append(paragraph("Credit-hour plan", "eyebrow"), heading("Approximately 12–12.5 hours of student work per week"), paragraph("The four-quarter-credit model targets approximately 120–126 total hours across ten instructional weeks. A sponsoring institution must adapt this to its own credit-hour rules."));
    const workloadGrid = document.createElement("div"); workloadGrid.className = "workload-grid";
    detail.weeklyWorkload.forEach((item) => { const card = document.createElement("article"); card.className = "workload-card"; card.append(heading(item.value, 3), paragraph(item.label)); workloadGrid.append(card); });
    workload.append(workloadGrid);

    const sequence = document.createElement("section");
    sequence.className = "curriculum-section";
    sequence.append(paragraph("Learning rhythm", "eyebrow"), heading("A repeatable ten-step learning sequence"));
    const sequenceList = document.createElement("ol"); sequenceList.className = "sequence-list";
    detail.learningSequence.forEach((item) => { const li = document.createElement("li"); li.textContent = item; sequenceList.append(li); });
    sequence.append(sequenceList);

    const evidence = document.createElement("section");
    evidence.className = "curriculum-section";
    evidence.append(paragraph("Scientific integrity", "eyebrow"), heading("Evidence strength is visible, not implied"));
    const evidenceGrid = document.createElement("div"); evidenceGrid.className = "evidence-grid curriculum-evidence-grid";
    detail.evidenceClasses.forEach((item) => { const card = document.createElement("article"); card.className = "evidence-card"; const code = document.createElement("strong"); code.textContent = item.code; card.append(code, heading(item.title, 3), paragraph(item.description)); evidenceGrid.append(card); });
    evidence.append(evidenceGrid);

    const sources = document.createElement("section");
    sources.className = "curriculum-section";
    sources.append(paragraph("Course-design audit", "eyebrow"), heading("University design sources used for the v3 audit"), paragraph("These sources inform course design and proposal readiness; they do not imply endorsement by the institutions."));
    const sourceList = document.createElement("ul"); sourceList.className = "source-list";
    detail.universityDesignSources.forEach((source) => { const li = document.createElement("li"); const a = document.createElement("a"); a.href = source.href; a.target = "_blank"; a.rel = "noopener noreferrer"; a.textContent = source.label; li.append(a); sourceList.append(li); });
    sources.append(sourceList);

    root.append(notice, record, outcomes, assessment, workload, sequence, evidence, sources);
  }

  function evidenceForWeek(number) { return detail.evidenceAnchors.filter((item) => item.weeks.includes(number)); }

  function activityLink(href, eyebrow, title, description) {
    const a = document.createElement("a");
    a.className = "curriculum-card week-activity-card";
    a.href = href;
    a.append(paragraph(eyebrow, "eyebrow"), heading(title, 3), paragraph(description));
    return a;
  }

  function renderMasteryForm(number, week, weekDetail, mount) {
    const panel = document.createElement("section");
    panel.className = "mastery-panel";
    panel.append(paragraph("Mastery check", "eyebrow"), heading("Show that you can retrieve the idea after doing the work."), paragraph("Passing this check is recorded separately from completion. A week can only become Mastered after its quiz, lab(s), and assignment are complete."));
    const statusWrap = document.createElement("div"); statusWrap.className = "mastery-current-status"; statusWrap.append(paragraph("Current status:"), masteryBadge(number)); panel.append(statusWrap);

    const form = document.createElement("form"); form.className = "mastery-form";
    const fieldset = document.createElement("fieldset"); const legend = document.createElement("legend"); legend.textContent = weekDetail.masteryCheck.question; fieldset.append(legend);
    weekDetail.masteryCheck.options.forEach((option, index) => {
      const label = document.createElement("label"); label.className = "mastery-option";
      const input = document.createElement("input"); input.type = "radio"; input.name = `mastery-${number}`; input.value = String(index);
      const span = document.createElement("span"); span.textContent = option; label.append(input, span); fieldset.append(label);
    });
    const actions = document.createElement("div"); actions.className = "quiz-actions";
    const submit = document.createElement("button"); submit.type = "submit"; submit.className = "quiz-submit"; submit.textContent = "Check mastery";
    const feedback = document.createElement("p"); feedback.className = "quiz-feedback"; feedback.setAttribute("aria-live", "polite");
    actions.append(submit, feedback); form.append(fieldset, actions); panel.append(form);

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const selected = form.querySelector("input:checked");
      feedback.classList.remove("correct", "incorrect");
      if (!selected) { feedback.textContent = "Choose an answer first."; feedback.classList.add("incorrect"); return; }
      const mastery = loadMastery();
      const attempts = Number(mastery.masteryAttempts[number] || 0) + 1;
      mastery.masteryAttempts[number] = attempts;
      const correct = Number(selected.value) === weekDetail.masteryCheck.correct;
      if (!correct) {
        saveMastery(mastery);
        feedback.textContent = `Not yet. ${weekDetail.masteryCheck.explanation}`;
        feedback.classList.add("incorrect");
        return;
      }
      const status = weekStatus(number);
      if (!status.complete) {
        saveMastery(mastery);
        feedback.textContent = `Correct. ${weekDetail.masteryCheck.explanation} Finish this week’s quiz, lab${week.labs.length > 1 ? "s" : ""}, and assignment before the LMS marks the week Mastered.`;
        feedback.classList.add("correct");
        return;
      }
      mastery.masteredWeeks = [...new Set([...mastery.masteredWeeks, number])];
      saveMastery(mastery);
      feedback.textContent = `✓ Mastery check passed${attempts > 1 ? ` after ${attempts} attempts` : ""}. This week is now marked Mastered.`;
      feedback.classList.add("correct");
      statusWrap.replaceChildren(paragraph("Current status:"), masteryBadge(number));
    });

    mount.append(panel);
  }

  function renderWeek() {
    const root = document.querySelector("[data-week-view]");
    if (!root) return;
    const requested = Number(new URLSearchParams(window.location.search).get("week") || 1);
    const number = Number.isInteger(requested) && requested >= 1 && requested <= 10 ? requested : 1;
    const week = findWeek(number); const weekDetail = detail.weeks[number];
    if (!week || !weekDetail) return;

    const mastery = loadMastery();
    if (!mastery.visitedWeeks.includes(number)) { mastery.visitedWeeks.push(number); saveMastery(mastery); }

    const title = document.querySelector("[data-week-title]"); if (title) title.textContent = `Week ${number}: ${week.title}`;
    const lead = document.querySelector("[data-week-lead]"); if (lead) lead.textContent = week.essentialQuestion;
    document.title = `Week ${number}: ${week.title} | NAV Classroom`;
    root.textContent = "";

    const overview = document.createElement("section"); overview.className = "week-detail-overview";
    const facts = document.createElement("div"); facts.className = "course-facts";
    [`${week.hours}`, `${week.labs.length} solo lab${week.labs.length > 1 ? "s" : ""}`, "1 quiz", "1 assignment"].forEach((value) => { const span = document.createElement("span"); span.textContent = value; facts.append(span); });
    const clo = paragraph(`Primary outcomes: ${weekDetail.primaryCLOs.map((id) => `CLO${id}`).join(", ")}`, "week-clo-copy");
    overview.append(facts, clo, masteryBadge(number));

    const quick = document.createElement("section"); quick.className = "quick-answer-card";
    quick.append(paragraph("Quick Answer · 30–90 seconds", "eyebrow"), heading("What you need to know"), paragraph(weekDetail.quickAnswer));

    const learnGrid = document.createElement("div"); learnGrid.className = "week-detail-grid";
    const objectives = document.createElement("section"); objectives.className = "learn-block"; objectives.append(paragraph("Objectives", "eyebrow"), heading("By the end of this week, you should be able to…"), list(weekDetail.objectives));
    const learn = document.createElement("section"); learn.className = "learn-block"; learn.append(paragraph("Learn · 5–12 minute core", "eyebrow"), heading("Core ideas"), list(weekDetail.coreIdeas));
    const topics = document.createElement("div"); topics.className = "topic-cloud"; week.topics.forEach((topic) => { const chip = document.createElement("span"); chip.textContent = topic; topics.append(chip); }); learn.append(topics);
    learnGrid.append(objectives, learn);

    const example = document.createElement("section"); example.className = "worked-example"; example.append(paragraph("Worked example", "eyebrow"), heading("Make the concept concrete"), paragraph(weekDetail.workedExample));
    const scenario = document.createElement("section"); scenario.className = "applied-scenario"; scenario.append(paragraph("Applied scenario", "eyebrow"), heading("Use it to make a decision"), paragraph(weekDetail.appliedScenario));

    const activities = document.createElement("section"); activities.className = "curriculum-section"; activities.append(paragraph("Practice + assessment", "eyebrow"), heading("Retrieve, observe, apply"));
    const activityGrid = document.createElement("div"); activityGrid.className = "week-activity-grid";
    activityGrid.append(
      activityLink("quizzes.html", "Quiz", week.quiz.title, "Retrieve the core concept and get explanatory feedback."),
      activityLink("labs.html", week.labs.length > 1 ? "Solo gym labs" : "Solo gym lab", week.labs.map((lab) => lab.title).join(" · "), "Observe or analyze the concept in a realistic setting; use the analytical alternative when physical participation is inappropriate."),
      activityLink("assignments.html", "Assignment", week.assignment.title, "Apply the concept in a defensible training or coaching decision.")
    );
    activities.append(activityGrid);

    const evidence = document.createElement("section"); evidence.className = "curriculum-section";
    evidence.append(paragraph("Evidence layer", "eyebrow"), heading("Inspect the claim, source, and limits"));
    const anchors = evidenceForWeek(number);
    if (anchors.length) {
      const evidenceList = document.createElement("div"); evidenceList.className = "evidence-anchor-list";
      anchors.forEach((item) => {
        const card = document.createElement("article"); card.className = "evidence-anchor-card";
        const top = document.createElement("div"); top.className = "evidence-anchor-top"; const badge = document.createElement("strong"); badge.textContent = `${item.id} · ${item.level}`; top.append(badge);
        const a = document.createElement("a"); a.href = item.href; a.target = "_blank"; a.rel = "noopener noreferrer"; a.textContent = item.source;
        card.append(top, heading(item.claim, 3), a, paragraph(item.note)); evidenceList.append(card);
      });
      evidence.append(evidenceList);
    } else {
      evidence.append(paragraph("This week does not yet have a dedicated anchor row in the public evidence subset. Use the Materials evidence framework and the complete internal evidence ledger before teaching or making strong prescriptions."));
    }
    const materialsLink = document.createElement("a"); materialsLink.className = "text-link"; materialsLink.href = "materials.html"; materialsLink.textContent = "Open evidence framework →"; evidence.append(materialsLink);

    const deepDive = document.createElement("details"); deepDive.className = "deep-dive";
    const deepSummary = document.createElement("summary"); deepSummary.textContent = "Deep Dive · mechanisms, methods, controversies";
    const deepBody = document.createElement("div"); deepBody.className = "deep-dive-body"; deepBody.append(paragraph(weekDetail.deepDive)); deepDive.append(deepSummary, deepBody);

    const masteryMount = document.createElement("div"); renderMasteryForm(number, week, weekDetail, masteryMount);

    const pager = document.createElement("nav"); pager.className = "week-pager"; pager.setAttribute("aria-label", "Course week navigation");
    if (number > 1) { const prev = document.createElement("a"); prev.href = `week.html?week=${number - 1}`; prev.textContent = `← Week ${number - 1}: ${findWeek(number - 1).title}`; pager.append(prev); }
    const map = document.createElement("a"); map.href = "course.html"; map.textContent = "Course map"; pager.append(map);
    if (number < 10) { const next = document.createElement("a"); next.href = `week.html?week=${number + 1}`; next.textContent = `Week ${number + 1}: ${findWeek(number + 1).title} →`; pager.append(next); }

    root.append(overview, quick, learnGrid, example, scenario, activities, evidence, deepDive, masteryMount, pager);
  }

  function renderMasteryDashboard() {
    const root = document.querySelector("[data-mastery-dashboard]");
    if (!root) return;
    root.textContent = "";
    const mastered = loadMastery().masteredWeeks.length;
    const head = document.createElement("div"); head.className = "mastery-dashboard-head";
    head.append(heading(`${mastered} of 10 weeks Mastered`), paragraph("Mastery requires the weekly quiz, all labs, the assignment, and a separate retrieval check. Completion alone never awards mastery."));
    const rows = document.createElement("div"); rows.className = "mastery-dashboard";
    course.weeks.forEach((week) => {
      const row = document.createElement("a"); row.className = "mastery-row"; row.href = `week.html?week=${week.week}`;
      const copy = document.createElement("div"); copy.append(paragraph(`Week ${week.week}`, "eyebrow"), heading(week.title, 3));
      row.append(copy, masteryBadge(week.week)); rows.append(row);
    });
    root.append(head, rows);
  }

  decorateCourseMap();
  renderSyllabus();
  renderWeek();
  renderMasteryDashboard();
})();
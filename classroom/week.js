(() => {
  const course = window.NAV_CLASSROOM;
  const details = window.NAV_WEEK_DETAILS;
  const number = Number(document.body?.dataset.classroomWeek || 0);
  const week = course?.weeks?.find((item) => item.week === number);
  const detail = details?.[number];
  if (!week || !detail) return;

  const storageKey = "nav-classroom-full-course-v1";
  function loadProgress() {
    try {
      const raw = JSON.parse(localStorage.getItem(storageKey) || "{}");
      const completed = raw?.completed || {};
      return {
        assignments: Array.isArray(completed.assignments) ? completed.assignments : [],
        labs: Array.isArray(completed.labs) ? completed.labs : [],
        quizzes: Array.isArray(completed.quizzes) ? completed.quizzes : []
      };
    } catch {
      return { assignments: [], labs: [], quizzes: [] };
    }
  }

  function text(tag, value, className) {
    const node = document.createElement(tag);
    node.textContent = value;
    if (className) node.className = className;
    return node;
  }

  function addStatus(container, label, done, detailText) {
    const row = document.createElement("div");
    row.className = `week-activity-status${done ? " is-complete" : ""}`;
    row.append(text("span", done ? "✓" : "○", "week-status-icon"), text("strong", label), text("small", detailText));
    container.append(row);
  }

  function renderHero() {
    const root = document.querySelector("[data-week-hero]");
    if (!root) return;
    root.append(
      text("p", `Hard to Kill · Week ${week.week} · ${week.hours}`, "eyebrow"),
      text("h1", week.title),
      text("p", week.essentialQuestion, "lead"),
      text("p", detail.why, "week-why")
    );
    const facts = document.createElement("div");
    facts.className = "course-facts";
    [
      `${week.topics.length} topic areas`,
      `${week.labs.length} ${week.labs.length === 1 ? "lab" : "labs"}`,
      "1 quiz",
      "1 applied assignment"
    ].forEach((value) => facts.append(text("span", value)));
    root.append(facts);
  }

  function renderStatus() {
    const root = document.querySelector("[data-week-status]");
    if (!root) return;
    const state = loadProgress();
    const quizDone = state.quizzes.includes(week.quiz.id);
    const labsDone = week.labs.filter((lab) => state.labs.includes(lab.id)).length;
    const assignmentDone = state.assignments.includes(week.assignment.id);
    const done = (quizDone ? 1 : 0) + labsDone + (assignmentDone ? 1 : 0);
    const total = week.labs.length + 2;
    const heading = document.createElement("div");
    heading.className = "week-status-heading";
    heading.append(text("div", "Activity progress", "eyebrow"), text("strong", `${done}/${total} complete on this device`));
    root.append(heading);
    addStatus(root, week.quiz.title, quizDone, quizDone ? "Quiz passed" : "Quiz not yet passed");
    week.labs.forEach((lab) => addStatus(root, lab.title, state.labs.includes(lab.id), state.labs.includes(lab.id) ? "Lab marked complete" : "Lab not complete"));
    addStatus(root, week.assignment.title, assignmentDone, assignmentDone ? "Assignment marked complete" : "Assignment not complete");
    const note = text("p", "Reading a page does not mark mastery. Activity completion and quiz performance are tracked separately from simply opening the lesson.", "storage-note");
    root.append(note);
  }

  function renderObjectives() {
    const root = document.querySelector("[data-week-objectives]");
    if (!root) return;
    detail.objectives.forEach((objective) => {
      const li = document.createElement("li");
      li.textContent = objective;
      root.append(li);
    });
  }

  function renderTopics() {
    const root = document.querySelector("[data-week-topics]");
    if (!root) return;
    week.topics.forEach((topic) => root.append(text("span", topic)));
  }

  function renderLessons() {
    const root = document.querySelector("[data-week-lessons]");
    if (!root) return;
    detail.lessons.forEach((lesson, index) => {
      const article = document.createElement("article");
      article.className = "week-lesson-card";
      article.append(
        text("p", `Core lesson ${index + 1}`, "eyebrow"),
        text("h2", lesson.title),
        text("p", lesson.quick, "lesson-quick"),
        text("p", lesson.body)
      );
      const apply = document.createElement("div");
      apply.className = "lesson-apply";
      apply.append(text("strong", "Apply it"), text("p", lesson.apply));
      article.append(apply);
      root.append(article);
    });
  }

  function renderCallout(selector, data, eyebrow) {
    const root = document.querySelector(selector);
    if (!root) return;
    root.append(text("p", eyebrow, "eyebrow"), text("h2", data.title), text("p", data.body));
  }

  function renderScenario() {
    const root = document.querySelector("[data-week-scenario]");
    if (!root) return;
    root.append(text("p", "Applied scenario", "eyebrow"), text("h2", "Make the decision"), text("p", detail.scenario));
  }

  function renderEvidence() {
    const root = document.querySelector("[data-week-evidence]");
    if (!root) return;
    root.append(text("p", "Evidence lens", "eyebrow"), text("h2", "How certain should the claim be?"), text("p", detail.evidence));
    const clos = text("p", `Primary course outcomes: CLO ${detail.primaryCLOs.join(", CLO ")}.`, "week-clo-copy");
    root.append(clos);
  }

  function renderDeliverables() {
    const root = document.querySelector("[data-week-deliverables]");
    if (!root) return;
    const items = [
      { label: "Quiz", title: week.quiz.title, summary: week.quiz.question, href: "../../quizzes.html" },
      ...week.labs.map((lab) => ({ label: "Solo gym lab", title: lab.title, summary: lab.summary, href: "../../labs.html" })),
      { label: "Assignment", title: week.assignment.title, summary: week.assignment.summary, href: "../../assignments.html" }
    ];
    items.forEach((item) => {
      const card = document.createElement("a");
      card.className = "card-link week-deliverable-card";
      card.href = item.href;
      card.append(text("p", item.label, "eyebrow"), text("h3", item.title), text("p", item.summary), text("span", "Open workspace →", "text-link"));
      root.append(card);
    });
  }

  function renderReturn() {
    const root = document.querySelector("[data-week-return]");
    if (!root) return;
    root.append(text("p", "Spaced return", "eyebrow"), text("h2", "Carry this forward"), text("p", detail.spacedReturn));
  }

  function renderPager() {
    const root = document.querySelector("[data-week-pager]");
    if (!root) return;
    const previous = course.weeks.find((item) => item.week === number - 1);
    const next = course.weeks.find((item) => item.week === number + 1);
    if (previous) {
      const link = document.createElement("a");
      link.href = `../week-${previous.week}/index.html`;
      link.append(text("small", "← Previous week"), text("strong", `Week ${previous.week}: ${previous.title}`));
      root.append(link);
    } else {
      const link = document.createElement("a");
      link.href = "../../course.html";
      link.append(text("small", "← Course map"), text("strong", "Hard to Kill overview"));
      root.append(link);
    }
    if (next) {
      const link = document.createElement("a");
      link.href = `../week-${next.week}/index.html`;
      link.append(text("small", "Next week →"), text("strong", `Week ${next.week}: ${next.title}`));
      root.append(link);
    } else {
      const link = document.createElement("a");
      link.href = "../../progress.html";
      link.append(text("small", "Course progress →"), text("strong", "Review your activity progress"));
      root.append(link);
    }
  }

  document.title = `Week ${week.week}: ${week.title} | NAV Classroom`;
  renderHero();
  renderStatus();
  renderObjectives();
  renderTopics();
  renderLessons();
  renderCallout("[data-week-example]", detail.workedExample, "Worked example");
  renderScenario();
  renderEvidence();
  renderDeliverables();
  renderReturn();
  renderPager();
})();
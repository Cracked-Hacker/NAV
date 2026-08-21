(() => {
  const fallbackModules = [
    { id: "how-training-works", title: "How Training Actually Works", href: "how-training-works/index.html" },
    { id: "building-muscle", title: "Building Muscle", href: "building-muscle/index.html" },
    { id: "getting-strong", title: "Getting Strong", href: "getting-strong/index.html" },
    { id: "rir-rpe", title: "Sets, Reps, RIR & RPE", href: "rir-rpe/index.html" },
    { id: "choosing-exercises", title: "Choosing Good Exercises", href: "choosing-exercises/index.html" },
    { id: "programming-a-workout", title: "Programming a Workout", href: "programming-a-workout/index.html" },
    { id: "recovery", title: "Recovery Is Training Too", href: "recovery/index.html" },
    { id: "build-your-system", title: "Build Your Training System", href: "build-your-system/index.html" }
  ];
  const modules = window.NAV_CLASSROOM?.starterModules || fallbackModules;
  const storageKey = "nav-classroom-starter-v1";
  let memoryState = { completed: [], quiz: {}, visited: [] };
  let storageAvailable = true;

  function normalizeState(value) {
    const completed = Array.isArray(value?.completed) ? value.completed.filter((id) => modules.some((module) => module.id === id)) : [];
    const visited = Array.isArray(value?.visited) ? value.visited.filter((id) => modules.some((module) => module.id === id)) : [];
    const quiz = value?.quiz && typeof value.quiz === "object" ? value.quiz : {};
    return { completed: [...new Set(completed)], quiz, visited: [...new Set(visited)] };
  }

  function loadState() {
    try {
      const raw = window.localStorage.getItem(storageKey);
      memoryState = normalizeState(raw ? JSON.parse(raw) : memoryState);
    } catch {
      storageAvailable = false;
    }
    return memoryState;
  }

  function saveState(state) {
    memoryState = normalizeState(state);
    if (!storageAvailable) return;
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(memoryState));
    } catch {
      storageAvailable = false;
    }
  }

  function isComplete(state, id) { return state.completed.includes(id); }

  function setComplete(id, complete) {
    const state = loadState();
    const completed = new Set(state.completed);
    if (complete) completed.add(id); else completed.delete(id);
    saveState({ ...state, completed: [...completed] });
    return loadState();
  }

  function currentModuleId() {
    const parts = window.location.pathname.split("/").filter(Boolean);
    const classroomIndex = parts.lastIndexOf("classroom");
    if (classroomIndex < 0) return null;
    const possible = parts[classroomIndex + 1];
    return modules.some((module) => module.id === possible) ? possible : null;
  }

  function updateHub() {
    const state = loadState();
    const count = state.completed.length;
    const progressBar = document.querySelector("[data-course-progress]");
    const progressFill = document.querySelector("[data-progress-fill]");
    const progressCopy = document.querySelector("[data-progress-copy]");
    const continueLink = document.querySelector("[data-continue-learning]");
    const completionBanner = document.querySelector("[data-course-complete]");
    if (progressBar) progressBar.setAttribute("aria-valuenow", String(count));
    if (progressFill) progressFill.style.width = `${(count / modules.length) * 100}%`;
    if (progressCopy) progressCopy.textContent = `${count} of ${modules.length} modules complete`;
    const nextModule = modules.find((module) => !isComplete(state, module.id));
    if (continueLink) {
      if (nextModule) {
        continueLink.href = nextModule.href;
        continueLink.textContent = count === 0 ? "Start Module 1" : `Continue: ${nextModule.title}`;
      } else {
        continueLink.href = modules[0].href;
        continueLink.textContent = "Review the Starter Kit";
      }
    }
    document.querySelectorAll("[data-module-id]").forEach((card) => {
      const complete = isComplete(state, card.dataset.moduleId);
      card.classList.toggle("is-complete", complete);
      const status = card.querySelector("[data-module-status]");
      if (status) status.textContent = complete ? "✓ Complete" : state.visited.includes(card.dataset.moduleId) ? "In progress" : "Not started";
    });
    if (completionBanner) completionBanner.hidden = count !== modules.length;
  }

  function initHubFilters() {
    const search = document.querySelector("[data-classroom-search]");
    const buttons = [...document.querySelectorAll("[data-classroom-filter]")];
    const cards = [...document.querySelectorAll("[data-module-id]")];
    const status = document.querySelector("[data-filter-status]");
    let activeFilter = "all";
    function applyFilters() {
      const query = (search?.value || "").trim().toLowerCase();
      let visible = 0;
      cards.forEach((card) => {
        const categoryMatch = activeFilter === "all" || card.dataset.category?.split(" ").includes(activeFilter);
        const haystack = `${card.textContent} ${card.dataset.keywords || ""}`.toLowerCase();
        const searchMatch = !query || haystack.includes(query);
        const show = categoryMatch && searchMatch;
        card.hidden = !show;
        if (show) visible += 1;
      });
      if (status) status.textContent = `${visible} module${visible === 1 ? "" : "s"} shown`;
    }
    search?.addEventListener("input", applyFilters);
    buttons.forEach((button) => button.addEventListener("click", () => {
      activeFilter = button.dataset.classroomFilter || "all";
      buttons.forEach((item) => item.setAttribute("aria-pressed", item === button ? "true" : "false"));
      applyFilters();
    }));
    applyFilters();
  }

  function initHub() {
    updateHub();
    initHubFilters();
    const reset = document.querySelector("[data-reset-progress]");
    const storageNote = document.querySelector("[data-storage-note]");
    if (storageNote && !storageAvailable) storageNote.textContent = "This browser is blocking local storage, so Classroom progress will last only for this page session.";
    reset?.addEventListener("click", () => {
      if (!window.confirm("Reset all Starter Kit completion and quiz progress saved in this browser?")) return;
      saveState({ completed: [], quiz: {}, visited: [] });
      updateHub();
    });
  }

  function enhanceQuiz(moduleId) {
    const form = document.querySelector("form[data-quiz]");
    if (!form) return;
    const correctValue = form.dataset.correct;
    if (typeof correctValue !== "string") return;
    const actions = document.createElement("div");
    actions.className = "quiz-actions";
    const submit = document.createElement("button");
    submit.type = "submit";
    submit.className = "quiz-submit";
    submit.textContent = "Check answer";
    const feedback = document.createElement("p");
    feedback.className = "quiz-feedback";
    feedback.setAttribute("aria-live", "polite");
    actions.append(submit, feedback);
    form.append(actions);
    const saved = loadState().quiz[moduleId];
    if (saved === "passed") {
      feedback.textContent = "✓ You previously answered this check correctly.";
      feedback.classList.add("correct");
    }
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      form.querySelectorAll("label").forEach((label) => label.classList.remove("quiz-correct", "quiz-incorrect"));
      feedback.classList.remove("correct", "incorrect");
      const selected = form.querySelector("input[type=radio]:checked");
      if (!selected) {
        feedback.textContent = "Choose an answer first.";
        feedback.classList.add("incorrect");
        return;
      }
      const label = selected.closest("label");
      const correct = selected.value === correctValue;
      label?.classList.add(correct ? "quiz-correct" : "quiz-incorrect");
      feedback.textContent = correct ? "✓ Correct. Keep going." : "Not quite. Review the explanation below and try again.";
      feedback.classList.add(correct ? "correct" : "incorrect");
      if (correct) {
        const state = loadState();
        saveState({ ...state, quiz: { ...state.quiz, [moduleId]: "passed" } });
      } else {
        const answer = document.querySelector(".answer");
        if (answer) answer.open = true;
      }
    });
  }

  function addModuleProgress(moduleId) {
    const nav = document.querySelector(".lesson-nav");
    if (!nav) return;
    const panel = document.createElement("div");
    panel.className = "module-progress-panel";
    const copy = document.createElement("p");
    copy.textContent = "Progress is saved only in this browser.";
    const button = document.createElement("button");
    button.type = "button";
    button.className = "module-complete-button";
    function render() {
      const complete = isComplete(loadState(), moduleId);
      button.classList.toggle("is-complete", complete);
      button.textContent = complete ? "✓ Module complete" : "Mark module complete";
      button.setAttribute("aria-pressed", complete ? "true" : "false");
    }
    button.addEventListener("click", () => {
      const complete = isComplete(loadState(), moduleId);
      setComplete(moduleId, !complete);
      render();
    });
    panel.append(copy, button);
    nav.append(panel);
    render();
  }

  function addModulePager(moduleId) {
    const article = document.querySelector(".lesson-content");
    if (!article) return;
    const index = modules.findIndex((module) => module.id === moduleId);
    if (index < 0) return;
    const previous = modules[index - 1];
    const next = modules[index + 1];
    const pager = document.createElement("nav");
    pager.className = "module-pager";
    pager.setAttribute("aria-label", "Starter Kit module navigation");
    function linkFor(module, label, direction) {
      const link = document.createElement("a");
      if (!module) { link.className = "is-disabled"; link.setAttribute("aria-hidden", "true"); return link; }
      link.href = `../${module.id}/index.html`;
      const small = document.createElement("small");
      small.textContent = direction === "previous" ? `← ${label}` : `${label} →`;
      const strong = document.createElement("strong");
      strong.textContent = module.title;
      link.append(small, strong);
      return link;
    }
    pager.append(linkFor(previous, "Previous module", "previous"), linkFor(next, "Next module", "next"));
    article.append(pager);
  }

  function initModule(moduleId) {
    const state = loadState();
    if (!state.visited.includes(moduleId)) saveState({ ...state, visited: [...state.visited, moduleId] });
    enhanceQuiz(moduleId);
    addModuleProgress(moduleId);
    addModulePager(moduleId);
  }

  const moduleId = currentModuleId();
  if (moduleId) initModule(moduleId);
  else if (document.querySelector("[data-classroom-hub]")) initHub();
})();

(() => {
  const data = window.NAV_CLASSROOM;
  if (!data?.weeks) return;
  const key = "nav-classroom-full-course-v1";
  let storageOK = true;
  let memory = { completed: { assignments: [], labs: [], quizzes: [] }, drafts: {}, quizAttempts: {} };

  function normalize(value) {
    const base = value && typeof value === "object" ? value : {};
    const completed = base.completed && typeof base.completed === "object" ? base.completed : {};
    return {
      completed: {
        assignments: Array.isArray(completed.assignments) ? [...new Set(completed.assignments)] : [],
        labs: Array.isArray(completed.labs) ? [...new Set(completed.labs)] : [],
        quizzes: Array.isArray(completed.quizzes) ? [...new Set(completed.quizzes)] : []
      },
      drafts: base.drafts && typeof base.drafts === "object" ? base.drafts : {},
      quizAttempts: base.quizAttempts && typeof base.quizAttempts === "object" ? base.quizAttempts : {}
    };
  }

  function load() {
    try {
      const raw = localStorage.getItem(key);
      memory = normalize(raw ? JSON.parse(raw) : memory);
    } catch { storageOK = false; }
    return memory;
  }

  function save(next) {
    memory = normalize(next);
    if (!storageOK) return;
    try { localStorage.setItem(key, JSON.stringify(memory)); } catch { storageOK = false; }
  }

  function complete(type, id, value = true) {
    const state = load();
    const set = new Set(state.completed[type] || []);
    if (value) set.add(id); else set.delete(id);
    save({ ...state, completed: { ...state.completed, [type]: [...set] } });
  }

  function activityTotals() {
    const labs = data.weeks.reduce((sum, week) => sum + week.labs.length, 0);
    return { assignments: data.weeks.length, labs, quizzes: data.weeks.length, total: data.weeks.length * 2 + labs };
  }

  function statusPill(type, id) {
    const done = load().completed[type].includes(id);
    const span = document.createElement("span");
    span.className = `work-status${done ? " is-complete" : ""}`;
    span.textContent = done ? "✓ Complete" : "Not complete";
    return span;
  }

  function completionButton(type, id, onChange) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "work-complete-button";
    function render() {
      const done = load().completed[type].includes(id);
      button.classList.toggle("is-complete", done);
      button.setAttribute("aria-pressed", done ? "true" : "false");
      button.textContent = done ? "✓ Complete" : "Mark complete";
    }
    button.addEventListener("click", () => {
      const done = load().completed[type].includes(id);
      complete(type, id, !done);
      render();
      onChange?.();
    });
    render();
    return button;
  }

  function weekHeader(week, typeLabel) {
    const wrap = document.createElement("div");
    wrap.className = "coursework-head";
    const left = document.createElement("div");
    const eyebrow = document.createElement("p");
    eyebrow.className = "eyebrow";
    eyebrow.textContent = `Week ${week.week} · ${typeLabel}`;
    const title = document.createElement("h2");
    title.textContent = week.title;
    left.append(eyebrow, title);
    const meta = document.createElement("span");
    meta.className = "coursework-week-meta";
    meta.textContent = week.hours;
    wrap.append(left, meta);
    return wrap;
  }

  function renderCourseMap() {
    const root = document.querySelector("[data-course-map]");
    if (!root) return;
    data.weeks.forEach((week) => {
      const card = document.createElement("article");
      card.className = "week-card";
      const top = document.createElement("div");
      top.className = "week-card-top";
      const number = document.createElement("span");
      number.className = "week-number";
      number.textContent = String(week.week).padStart(2, "0");
      const heading = document.createElement("div");
      const eye = document.createElement("p"); eye.className = "eyebrow"; eye.textContent = `Week ${week.week} · ${week.hours}`;
      const h2 = document.createElement("h2"); h2.textContent = week.title;
      heading.append(eye, h2);
      top.append(number, heading);
      const question = document.createElement("p"); question.className = "essential-question"; question.textContent = week.essentialQuestion;
      const topics = document.createElement("div"); topics.className = "topic-cloud";
      week.topics.forEach((topic) => { const chip = document.createElement("span"); chip.textContent = topic; topics.append(chip); });
      const items = document.createElement("div"); items.className = "week-deliverables";
      const deliverables = [
        ["Quiz", week.quiz.title],
        [week.labs.length > 1 ? "Labs" : "Lab", week.labs.map((lab) => lab.title).join(" · ")],
        ["Assignment", week.assignment.title]
      ];
      deliverables.forEach(([label, text]) => { const row = document.createElement("div"); row.innerHTML = `<span>${label}</span><strong>${text}</strong>`; items.append(row); });
      card.append(top, question, topics, items);
      root.append(card);
    });
  }

  function workspaceCard(week, type, item, label) {
    const article = document.createElement("article");
    article.className = "coursework-card";
    article.dataset.workId = item.id;
    const head = weekHeader(week, label);
    const status = statusPill(type, item.id);
    head.append(status);
    const title = document.createElement("h3"); title.textContent = item.title;
    const summary = document.createElement("p"); summary.className = "coursework-summary"; summary.textContent = item.summary;
    const details = document.createElement("details"); details.className = "work-panel";
    const summaryEl = document.createElement("summary"); summaryEl.textContent = type === "assignments" ? "Open assignment workspace" : "Open lab notes";
    const body = document.createElement("div"); body.className = "work-panel-body";
    const note = document.createElement("p"); note.className = "storage-note"; note.textContent = "Private browser-local draft. Nothing here is uploaded or sent to an instructor.";
    const textarea = document.createElement("textarea"); textarea.className = "work-draft"; textarea.rows = 7; textarea.placeholder = type === "assignments" ? "Draft your reasoning, outline, or response here…" : "Record observations, data, limitations, and interpretation here…"; textarea.value = load().drafts[item.id] || "";
    const controls = document.createElement("div"); controls.className = "work-controls";
    const saveButton = document.createElement("button"); saveButton.type = "button"; saveButton.className = "work-save-button"; saveButton.textContent = "Save draft";
    const saved = document.createElement("span"); saved.className = "saved-copy"; saved.setAttribute("aria-live", "polite");
    saveButton.addEventListener("click", () => { const state = load(); save({ ...state, drafts: { ...state.drafts, [item.id]: textarea.value } }); saved.textContent = "Saved on this device."; });
    const doneButton = completionButton(type, item.id, () => { const fresh = statusPill(type, item.id); status.replaceWith(fresh); });
    controls.append(saveButton, doneButton, saved);
    body.append(note, textarea, controls);
    details.append(summaryEl, body);
    article.append(head, title, summary, details);
    return article;
  }

  function renderAssignments() {
    const root = document.querySelector("[data-assignment-list]");
    if (!root) return;
    data.weeks.forEach((week) => root.append(workspaceCard(week, "assignments", week.assignment, "Assignment")));
  }

  function renderLabs() {
    const root = document.querySelector("[data-lab-list]");
    if (!root) return;
    data.weeks.forEach((week) => week.labs.forEach((lab) => root.append(workspaceCard(week, "labs", lab, "Solo gym lab"))));
  }

  function renderQuizzes() {
    const root = document.querySelector("[data-quiz-list]");
    if (!root) return;
    data.weeks.forEach((week) => {
      const quiz = week.quiz;
      const card = document.createElement("article");
      card.className = "full-quiz-card";
      card.append(weekHeader(week, "Quiz"));
      const status = statusPill("quizzes", quiz.id); card.querySelector(".coursework-head")?.append(status);
      const h2 = document.createElement("h2"); h2.textContent = quiz.title;
      const form = document.createElement("form"); form.className = "full-quiz-form";
      const fieldset = document.createElement("fieldset"); const legend = document.createElement("legend"); legend.textContent = quiz.question; fieldset.append(legend);
      quiz.options.forEach((option, index) => { const label = document.createElement("label"); const input = document.createElement("input"); input.type = "radio"; input.name = quiz.id; input.value = String(index); const span = document.createElement("span"); span.textContent = option; label.append(input, span); fieldset.append(label); });
      const actions = document.createElement("div"); actions.className = "quiz-actions";
      const button = document.createElement("button"); button.type = "submit"; button.className = "quiz-submit"; button.textContent = "Check answer";
      const feedback = document.createElement("p"); feedback.className = "quiz-feedback"; feedback.setAttribute("aria-live", "polite");
      actions.append(button, feedback); form.append(fieldset, actions);
      const explanation = document.createElement("div"); explanation.className = "quiz-explanation"; explanation.hidden = true;
      const p = document.createElement("p"); p.textContent = quiz.explanation; explanation.append(p);
      if (load().completed.quizzes.includes(quiz.id)) { feedback.textContent = "✓ Passed on this device."; feedback.classList.add("correct"); explanation.hidden = false; }
      form.addEventListener("submit", (event) => {
        event.preventDefault();
        form.querySelectorAll("label").forEach((label) => label.classList.remove("quiz-correct", "quiz-incorrect"));
        feedback.classList.remove("correct", "incorrect");
        const selected = form.querySelector("input:checked");
        if (!selected) { feedback.textContent = "Choose an answer first."; feedback.classList.add("incorrect"); return; }
        const selectedIndex = Number(selected.value);
        const correct = selectedIndex === quiz.correct;
        selected.closest("label")?.classList.add(correct ? "quiz-correct" : "quiz-incorrect");
        const state = load();
        const attempts = (state.quizAttempts[quiz.id] || 0) + 1;
        save({ ...state, quizAttempts: { ...state.quizAttempts, [quiz.id]: attempts } });
        explanation.hidden = false;
        if (correct) { complete("quizzes", quiz.id, true); feedback.textContent = `✓ Correct${attempts > 1 ? ` after ${attempts} attempts` : ""}.`; feedback.classList.add("correct"); const fresh = statusPill("quizzes", quiz.id); status.replaceWith(fresh); }
        else { feedback.textContent = "Not quite. Read the explanation, then try again."; feedback.classList.add("incorrect"); }
      });
      card.append(h2, form, explanation);
      root.append(card);
    });
  }

  function renderProgress() {
    const root = document.querySelector("[data-progress-dashboard]");
    if (!root) return;
    const starterRaw = (() => { try { return JSON.parse(localStorage.getItem("nav-classroom-starter-v1") || "{}"); } catch { return {}; } })();
    const starterCompleted = Array.isArray(starterRaw.completed) ? starterRaw.completed.length : 0;
    const starterQuizPassed = starterRaw.quiz && typeof starterRaw.quiz === "object" ? Object.values(starterRaw.quiz).filter((value) => value === "passed").length : 0;
    const state = load();
    const totals = activityTotals();
    const done = state.completed.assignments.length + state.completed.labs.length + state.completed.quizzes.length;
    const percent = Math.round((done / totals.total) * 100);
    root.innerHTML = `
      <div class="progress-overview-grid">
        <section class="progress-hero-card"><p class="eyebrow">Full course activity progress</p><strong>${percent}%</strong><p>${done} of ${totals.total} quizzes, labs, and assignments complete on this device.</p><div class="progress-track" role="progressbar" aria-label="Full course activity progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${percent}"><span class="progress-fill" style="width:${percent}%"></span></div></section>
        <section class="progress-stat-card"><span>${starterCompleted}/8</span><strong>Starter modules complete</strong><small>${starterQuizPassed} quick checks passed</small></section>
        <section class="progress-stat-card"><span>${state.completed.quizzes.length}/10</span><strong>Weekly quizzes passed</strong><small>${Object.values(state.quizAttempts).reduce((sum, value) => sum + Number(value || 0), 0)} total attempts</small></section>
        <section class="progress-stat-card"><span>${state.completed.labs.length}/${totals.labs}</span><strong>Solo labs complete</strong><small>Physical or analytical alternative</small></section>
        <section class="progress-stat-card"><span>${state.completed.assignments.length}/10</span><strong>Assignments complete</strong><small>Local completion only</small></section>
      </div>
      <div class="week-progress-list" data-week-progress></div>
      <div class="progress-actions"><button type="button" class="course-reset" data-reset-full-course>Reset full-course local progress</button></div>`;
    const weekRoot = root.querySelector("[data-week-progress]");
    data.weeks.forEach((week) => {
      const ids = { assignments: [week.assignment.id], labs: week.labs.map((lab) => lab.id), quizzes: [week.quiz.id] };
      const weekTotal = ids.assignments.length + ids.labs.length + ids.quizzes.length;
      const weekDone = ids.assignments.filter((id) => state.completed.assignments.includes(id)).length + ids.labs.filter((id) => state.completed.labs.includes(id)).length + ids.quizzes.filter((id) => state.completed.quizzes.includes(id)).length;
      const row = document.createElement("div"); row.className = "week-progress-row"; row.innerHTML = `<span>Week ${week.week}</span><strong>${week.title}</strong><small>${weekDone}/${weekTotal} activities</small>`; weekRoot.append(row);
    });
    root.querySelector("[data-reset-full-course]")?.addEventListener("click", () => { if (!confirm("Reset all full-course quiz, lab, assignment, and draft progress stored in this browser?")) return; save({ completed: { assignments: [], labs: [], quizzes: [] }, drafts: {}, quizAttempts: {} }); renderProgress(); });
  }

  function renderDashboardSummary() {
    const root = document.querySelector("[data-lms-summary]");
    if (!root) return;
    const state = load();
    const totals = activityTotals();
    const done = state.completed.assignments.length + state.completed.labs.length + state.completed.quizzes.length;
    const firstWeek = data.weeks.find((week) => !state.completed.quizzes.includes(week.quiz.id) || week.labs.some((lab) => !state.completed.labs.includes(lab.id)) || !state.completed.assignments.includes(week.assignment.id));
    const nextText = firstWeek ? `Week ${firstWeek.week}: ${firstWeek.title}` : "Full course activity set complete";
    root.innerHTML = `<div class="lms-summary-copy"><p class="eyebrow">Full course</p><h2>${data.course.title}</h2><p>${data.course.subtitle}</p><div class="course-facts"><span>${data.course.length}</span><span>${done}/${totals.total} activities complete</span><span>${nextText}</span></div></div><div class="lms-summary-actions"><a class="button lime" href="course.html">Open course</a><a class="button secondary" href="progress.html">View progress</a></div>`;
  }

  renderCourseMap();
  renderAssignments();
  renderLabs();
  renderQuizzes();
  renderProgress();
  renderDashboardSummary();
})();

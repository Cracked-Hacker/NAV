(() => {
  const modules = [
    { id: "how-training-works", title: "How Training Actually Works", href: "how-training-works/index.html" },
    { id: "building-muscle", title: "Building Muscle", href: "building-muscle/index.html" },
    { id: "getting-strong", title: "Getting Strong", href: "getting-strong/index.html" },
    { id: "rir-rpe", title: "Sets, Reps, RIR & RPE", href: "rir-rpe/index.html" },
    { id: "choosing-exercises", title: "Choosing Good Exercises", href: "choosing-exercises/index.html" },
    { id: "programming-a-workout", title: "Programming a Workout", href: "programming-a-workout/index.html" },
    { id: "recovery", title: "Recovery Is Training Too", href: "recovery/index.html" },
    { id: "build-your-system", title: "Build Your Training System", href: "build-your-system/index.html" }
  ];

  const storageKey = "nav-classroom-starter-v1";
  let memoryState = { completed: [], quiz: {} };
  let storageAvailable = true;

  function normalizeState(value) {
    const completed = Array.isArray(value?.completed)
      ? value.completed.filter((id) => modules.some((module) => module.id === id))
      : [];
    const quiz = value?.quiz && typeof value.quiz === "object" ? value.quiz : {};
    return { completed: [...new Set(completed)], quiz };
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

  function isComplete(state, id) {
    return state.completed.includes(id);
  }

  function setComplete(id, complete) {
    const state = loadState();
    const completed = new Set(state.completed);
    if (complete) completed.add(id);
    else completed.delete(id);
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
      if (status) status.textContent = complete ? "✓ Complete" : "Not started";
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
    buttons.forEach((button) => {
      button.addEventListener("click", () => {
        activeFilter = button.dataset.classroomFilter || "all";
        buttons.forEach((item) => item.setAttribute("aria-pressed", item === button ? "true" : "false"));
        applyFilters();
      });
    });
    applyFilters();
  }

  function initHub() {
    updateHub();
    initHubFilters();
    const reset = document.querySelector("[data-reset-progress]");
    const storageNote = document.querySelector("[data-storage-note]");
    if (storageNote && !storageAvailable) {
      storageNote.textContent = "This browser is blocking local storage, so Classroom progress will last only for this page session.";
    }
    reset?.addEventListener("click", () => {
      const confirmed = window.confirm("Reset all Starter Kit completion and quiz progress saved in this browser?");
      if (!confirmed) return;
      saveState({ completed: [], quiz: {} });
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
    const module = modules.find((item) => item.id === moduleId);
    if (!module) return;
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
      if (!module) {
        link.className = "is-disabled";
        link.setAttribute("aria-hidden", "true");
        return link;
      }
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
    enhanceQuiz(moduleId);
    addModuleProgress(moduleId);
    addModulePager(moduleId);
  }

  const moduleId = currentModuleId();
  if (moduleId) initModule(moduleId);
  else if (document.querySelector("[data-classroom-hub]")) initHub();
})();

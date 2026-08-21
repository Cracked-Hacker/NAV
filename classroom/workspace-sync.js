(() => {
  const storageKey = "nav-classroom-full-course-v1";

  function readCompleted(type, id) {
    try {
      const state = JSON.parse(window.localStorage.getItem(storageKey) || "{}");
      return Array.isArray(state?.completed?.[type]) && state.completed[type].includes(id);
    } catch {
      return false;
    }
  }

  document.addEventListener("click", (event) => {
    const button = event.target.closest(".work-complete-button");
    if (!button) return;
    const card = button.closest(".coursework-card");
    const id = card?.dataset.workId;
    const type = document.body.dataset.classroomView;
    if (!id || !["assignments", "labs"].includes(type)) return;

    window.requestAnimationFrame(() => {
      const badge = card.querySelector(".work-status");
      if (!badge) return;
      const done = readCompleted(type, id);
      badge.classList.toggle("is-complete", done);
      badge.textContent = done ? "✓ Complete" : "Not complete";
    });
  });
})();

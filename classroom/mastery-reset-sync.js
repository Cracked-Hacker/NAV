(() => {
  const button = document.querySelector("[data-reset-full-course]");
  if (!button) return;

  button.addEventListener("click", () => {
    window.setTimeout(() => {
      let state = {};
      try { state = JSON.parse(window.localStorage.getItem("nav-classroom-full-course-v1") || "{}"); } catch { state = {}; }
      const completed = state?.completed || {};
      const activityCount = ["assignments", "labs", "quizzes"].reduce((sum, type) => sum + (Array.isArray(completed[type]) ? completed[type].length : 0), 0);
      if (activityCount !== 0) return;
      try { window.localStorage.removeItem("nav-classroom-mastery-v1"); } catch { /* local-only enhancement */ }
      window.location.reload();
    }, 0);
  });
})();
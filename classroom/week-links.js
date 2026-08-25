(() => {
  const data = window.NAV_CLASSROOM;
  const root = document.querySelector("[data-course-map]");
  if (!data?.weeks || !root) return;
  requestAnimationFrame(() => {
    const cards = [...root.querySelectorAll(".week-card")];
    cards.forEach((card, index) => {
      const week = data.weeks[index];
      if (!week || card.querySelector("[data-open-week]")) return;
      const actions = document.createElement("div");
      actions.className = "course-progress-actions";
      const link = document.createElement("a");
      link.className = "button secondary";
      link.dataset.openWeek = String(week.week);
      link.href = `course/week-${week.week}/index.html`;
      link.textContent = `Open Week ${week.week}`;
      actions.append(link);
      card.append(actions);
    });
  });
})();
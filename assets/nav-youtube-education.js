import { CHANNEL_HANDLE, getApprovedEducationalVideos } from "./nav-youtube-education-catalog.mjs";

const videos = getApprovedEducationalVideos();
const formatDuration = seconds => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

for (const showcase of document.querySelectorAll("[data-youtube-showcase]")) {
  const grid = showcase.querySelector("[data-youtube-grid]");
  const empty = showcase.querySelector("[data-youtube-empty]");
  if (!grid || !empty || videos.length === 0) continue;
  const cards = new Set();
  for (const video of videos) {
    const article = element("article", "nav-youtube-card");
    const player = element("div", "nav-youtube-player");
    const play = element("button", "nav-youtube-play");
    play.type = "button";
    play.setAttribute("aria-label", `Play ${video.title} from YouTube`);
    play.append(element("span", "nav-youtube-play-icon", "▶"), element("span", "nav-youtube-play-note", "Load video from YouTube"));
    player.append(play);
    cards.add({ player, play, video });

    const body = element("div", "nav-youtube-card-body");
    const meta = element("div", "nav-youtube-card-meta");
    meta.append(element("span", "", `${formatDuration(video.durationSeconds)} · Full lesson`), element("span", "", CHANNEL_HANDLE));
    const title = element("h3", "", video.title);
    const summary = element("p", "", video.summary);
    const direct = element("a", "", "Watch on YouTube ↗");
    direct.href = video.watchUrl;
    direct.target = "_blank";
    direct.rel = "noopener noreferrer";
    body.append(meta, title, summary, direct);
    article.append(player, body);
    grid.append(article);

    play.addEventListener("click", () => {
      for (const other of cards) {
        if (other.player === player || !other.player.querySelector("iframe")) continue;
        other.player.replaceChildren(other.play);
      }
      const iframe = document.createElement("iframe");
      iframe.title = `${video.title} — YouTube player`;
      iframe.src = `https://www.youtube-nocookie.com/embed/${video.videoId}?autoplay=1&rel=0`;
      iframe.allow = "accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; web-share";
      iframe.allowFullscreen = true;
      iframe.referrerPolicy = "strict-origin-when-cross-origin";
      player.replaceChildren(iframe);
    });
  }
  grid.hidden = false;
  empty.hidden = true;
}

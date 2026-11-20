/** NAV-nate long-form education showcase.
 *
 * This is a deliberately reviewed ALLOWLIST, never a channel uploads feed.
 * Never insert arbitrary videos from YouTube search, RSS, auto-playlists,
 * recommendations, or the channel's mixed-content uploads. Gaming, Shorts,
 * livestreams, sponsorship-only clips and unverified ownership are excluded.
 *
 * To feature a video, verify the exact watch URL on @NAV-nate, review the
 * full video's subject, confirm a long-form upload (at least 4 minutes),
 * record the duration and date reviewed, then add its entry below.
 * Do not guess titles, lengths, video IDs, ownership, or educational claims.
 */
export const CHANNEL_HANDLE = "NAV-nate";
export const EDUCATIONAL_LONGFORM_VIDEOS = Object.freeze([
  // No confirmed individual long-form educational watch URLs available yet.
]);

const GAME_CONTENT = /\b(?:gaming|gameplay|fallout|minecraft|fortnite|roblox|elden\s*ring|call\s*of\s*duty|baldur'?s\s*gate|valorant|overwatch|league\s*of\s*legends|stream\s*highlights?)\b/i;

export function isApprovedEducationalLongform(video) {
  if (!video || typeof video !== "object") return false;
  if (video.channelHandle?.toLowerCase() !== CHANNEL_HANDLE.toLowerCase()) return false;
  if (video.format !== "long-form" || video.category !== "exercise-education" || video.editorialApproved !== true) return false;
  if (!Number.isInteger(video.durationSeconds) || video.durationSeconds < 240) return false;
  if (typeof video.videoId !== "string" || !/^[A-Za-z0-9_-]{11}$/.test(video.videoId)) return false;
  if (typeof video.title !== "string" || video.title.trim().length < 8) return false;
  if (typeof video.summary !== "string" || video.summary.trim().length < 20) return false;
  if (GAME_CONTENT.test(video.title + " " + video.summary)) return false;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(video.reviewedOn ?? "")) return false;
  if (video.watchUrl !== `https://www.youtube.com/watch?v=${video.videoId}`) return false;
  return true;
}

export function getApprovedEducationalVideos() {
  const approved = EDUCATIONAL_LONGFORM_VIDEOS.filter(isApprovedEducationalLongform);
  return approved.filter((video, index) => approved.findIndex(other => other.videoId === video.videoId) === index);
}

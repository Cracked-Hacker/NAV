// Detect the finished-only Classroom contact action in both source HTML and
// Netlify's production HTML, which rewrites clean links and quote styles.
export function hasVerifiedBetaContactLink(html) {
  const match = html.match(/<a\b[^>]*\bhref\s*=\s*(["'])([^"']+)\1[^>]*>\s*Ask about future testing\s*<\/a>/i);
  if (!match) return false;
  try {
    const url = new URL(match[2], 'https://coach-nate.netlify.app/classroom/');
    return url.origin === 'https://coach-nate.netlify.app' &&
      ['/contact', '/contact/', '/contact.html'].includes(url.pathname) &&
      !url.search && !url.hash;
  } catch {
    return false;
  }
}

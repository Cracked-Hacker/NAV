import {ACCOUNT_CONFIG} from './config.js';
import {accountClient} from './client.js';

const root = new URL('../', import.meta.url);
let generation = 0;

function ensureCoachNateLinks() {
  const coachUrl = new URL('coach-nate.html', root);
  const normalizedPath = value => value.replace(/\.html$/, '').replace(/\/+$/, '');
  const currentPath = normalizedPath(window.location.pathname);
  const coachPath = normalizedPath(coachUrl.pathname);

  document.querySelectorAll('.desktop-nav, .mobile-nav nav[aria-label="Mobile primary"]').forEach(nav => {
    if ([...nav.querySelectorAll('a')].some(link => normalizedPath(new URL(link.href).pathname) === coachPath)) return;
    const link = document.createElement('a');
    link.dataset.coachNateLink = '';
    link.href = coachUrl.href;
    link.textContent = 'Coach Nate';
    if (currentPath === coachPath) link.setAttribute('aria-current', 'page');
    const accountEntry = nav.querySelector('[data-nav-login]');
    if (accountEntry) nav.insertBefore(link, accountEntry);
    else nav.append(link);
  });
}

function apply(signedIn) {
  ensureCoachNateLinks();
  document.querySelectorAll('[data-nav-login]').forEach(link => {
    link.textContent = signedIn ? 'My NAV' : 'Sign In';
    link.href = new URL(signedIn ? 'account/' : 'account/auth.html?mode=login', root).href;
  });
  document.querySelectorAll('[data-nav-signup]').forEach(link => { link.hidden = signedIn; });
}

async function refresh() {
  const current = ++generation;
  try {
    ensureCoachNateLinks();
    if (!localStorage.getItem(ACCOUNT_CONFIG.storageKey)) { apply(false); return; }
    const client = await accountClient();
    const {data, error} = await client.auth.getUser();
    if (current !== generation) return;
    if (!error) apply(Boolean(data.user));
    // A temporary network failure is not proof that the user signed out.
  } catch {
    // Public browsing stays available if account recovery is needed.
    ensureCoachNateLinks();
  }
}

ensureCoachNateLinks();
refresh();
window.addEventListener('storage', event => { if (event.key === ACCOUNT_CONFIG.storageKey) refresh(); });
window.addEventListener('pageshow', refresh);

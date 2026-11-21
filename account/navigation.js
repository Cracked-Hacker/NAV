import {ACCOUNT_CONFIG} from './config.js';
import {accountClient} from './client.js';

const root = new URL('../', import.meta.url);
let generation = 0;

function ensurePublicNavigation() {
  const targets = [
    ['coaching.html','Coaching'],
    ['nav-coach.html','NAV Coach'],
    ['resources.html','Learn'],
    ['research.html','Research'],
    ['coach-nate.html','Coach Nate']
  ];
  const activePath = window.location.pathname.replace(/\\.html$/, '').replace(/\\/+$/, '');
  const normalizedPath = value => value.replace(/\\.html$/, '').replace(/\\/+$/, '');
  document.querySelectorAll('.desktop-nav, .mobile-nav nav[aria-label="Mobile primary"]').forEach(nav => {
    // The brand already links home; beta information has its own homepage path.
    [...nav.querySelectorAll('a')].forEach(link => {
      const label = link.textContent.trim();
      if (label === 'Home' || label === 'Private Beta') link.remove();
    });
    const login = nav.querySelector('[data-nav-login]');
    for (const [path,label] of targets) {
      const url = new URL(path,root);
      let link = [...nav.querySelectorAll('a')].find(a => normalizedPath(new URL(a.href).pathname) === normalizedPath(url.pathname));
      if (!link) link = document.createElement('a');
      link.href = url.href;
      link.textContent = label;
      if (activePath === normalizedPath(url.pathname)) link.setAttribute('aria-current','page');
      else link.removeAttribute('aria-current');
      if (login) nav.insertBefore(link,login);
      else nav.appendChild(link);
    }
  });
}

function apply(signedIn) {
  ensurePublicNavigation();
  document.querySelectorAll('[data-nav-login]').forEach(link => {
    link.textContent = signedIn ? 'My NAV' : 'Sign In';
    link.href = new URL(signedIn ? 'account/' : 'account/auth.html?mode=login', root).href;
  });
  document.querySelectorAll('[data-nav-signup]').forEach(link => { link.hidden = signedIn; });
}

async function refresh() {
  const current = ++generation;
  try {
    ensurePublicNavigation();
    if (!localStorage.getItem(ACCOUNT_CONFIG.storageKey)) { apply(false); return; }
    const client = await accountClient();
    const {data, error} = await client.auth.getUser();
    if (current !== generation) return;
    if (!error) apply(Boolean(data.user));
    // A temporary network failure is not proof that the user signed out.
  } catch {
    // Public browsing stays available if account recovery is needed.
    ensurePublicNavigation();
  }
}

ensurePublicNavigation();
refresh();
window.addEventListener('storage', event => { if (event.key === ACCOUNT_CONFIG.storageKey) refresh(); });
window.addEventListener('pageshow', refresh);

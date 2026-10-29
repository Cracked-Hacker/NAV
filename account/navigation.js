import {ACCOUNT_CONFIG} from './config.js';
import {accountClient} from './client.js';

const root = new URL('../', import.meta.url);
let generation = 0;

function apply(signedIn) {
  document.querySelectorAll('[data-nav-login]').forEach(link => {
    link.textContent = signedIn ? 'My NAV' : 'Log In';
    link.href = new URL(signedIn ? 'account/' : 'account/auth.html?mode=login', root).href;
  });
  document.querySelectorAll('[data-nav-signup]').forEach(link => { link.hidden = signedIn; });
}

async function refresh() {
  const current = ++generation;
  try {
    if (!localStorage.getItem(ACCOUNT_CONFIG.storageKey)) { apply(false); return; }
    const client = await accountClient();
    const {data, error} = await client.auth.getUser();
    if (current !== generation) return;
    if (!error) apply(Boolean(data.user));
    // A temporary network failure is not proof that the user signed out.
  } catch { /* Public browsing stays available if account recovery is needed. */ }
}

refresh();
window.addEventListener('storage', event => { if (event.key === ACCOUNT_CONFIG.storageKey) refresh(); });
window.addEventListener('pageshow', refresh);

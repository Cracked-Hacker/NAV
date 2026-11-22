import {ACCOUNT_CONFIG} from './config.js';
import {accountClient} from './client.js';
const root = new URL('../', import.meta.url);
let generation = 0;
const href = path => new URL(path,root).href;
const a = (label,path) => {
  const target = new URL(path,root);
  const here = window.location.pathname;
  const isHome = target.pathname === new URL('index.html',root).pathname && here === root.pathname;
  const active = !path.includes('#') && (here === target.pathname || isHome);
  return '<a href="'+target.href+'"'+(active?' aria-current="page"':'')+'>'+label+'</a>';
};
const menu = (label,items) => '<details class="nav-dropdown"><summary>'+label+'</summary><div class="nav-dropdown-panel">'+items.join('')+'</div></details>';
function render(signedIn) {
  const entries = [
    a('Home','index.html'),
    a('Services','coaching.html'),
    menu('Products',[
      a('All Products','products.html'),
      a('NAV Coach app','nav-coach.html'),
      a('NAV Classroom','classroom/index.html'),
      a('Study tools','products.html#study-tools'),
      a('Merch','products.html#merch')
    ]),
    menu('About',[
      a('About NAV','about.html'),
      a('Coach Nate','coach-nate.html'),
      a('Research','research.html'),
      a('Contact','contact.html')
    ]),
    signedIn === true ? a('My NAV','account/') : signedIn === null ? a('Account','account/') : menu('Account',[
      a('Sign In','account/auth.html?mode=login'),
      a('Create Account','account/auth.html?mode=signup')
    ])
  ].join('');
  document.querySelectorAll('.desktop-nav, .mobile-nav nav[aria-label="Mobile primary"], header .topbar > nav').forEach(nav => {
    const state = signedIn === true ? 'signed-in' : signedIn === null ? 'checking' : 'guest';
    if(nav.dataset.navState === state) return;
    nav.innerHTML = entries;
    nav.dataset.navState = state;
  });
}
async function refresh() {
  const seq=++generation;
  try {
    if (!hasSession()) {render(false);return;}
    if (!document.querySelector('.desktop-nav[data-nav-state="signed-in"]')) render(null);
    const client=await accountClient();
    const {data,error}=await client.auth.getUser();
    if(seq!==generation)return;
    if(!error)render(Boolean(data.user));
  } catch { /* Do not mistake temporary failure for logout. */ }
}
function hasSession() {
  try { return Boolean(localStorage.getItem(ACCOUNT_CONFIG.storageKey)); }
  catch { return false; }
}
render(hasSession() ? null : false);
refresh();
window.addEventListener('storage',event=>{if(event.key===ACCOUNT_CONFIG.storageKey)refresh();});
window.addEventListener('pageshow',refresh);

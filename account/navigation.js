import {ACCOUNT_CONFIG} from './config.js';
import {accountClient} from './client.js';
const root = new URL('../', import.meta.url);
let generation = 0;
const href = path => new URL(path,root).href;
const a = (label,path) => '<a href="'+href(path)+'">'+label+'</a>';
const menu = (label,items) => '<details class="nav-dropdown"><summary>'+label+'</summary><div class="nav-dropdown-panel">'+items.join('')+'</div></details>';
function render(signedIn) {
  const entries = [
    a('Home','index.html'),
    a('Services','coaching.html'),
    menu('Products',[
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
    signedIn ? a('My NAV','account/') : menu('Account',[
      a('Sign In','account/auth.html?mode=login'),
      a('Create Account','account/auth.html?mode=signup')
    ])
  ].join('');
  document.querySelectorAll('.desktop-nav, .mobile-nav nav[aria-label="Mobile primary"], header .topbar > nav').forEach(nav => {
    const state = signedIn ? 'signed-in' : 'guest';
    if(nav.dataset.navState === state) return;
    nav.innerHTML = entries;
    nav.dataset.navState = state;
  });
}
async function refresh() {
  const seq=++generation;
  try {
    if (!localStorage.getItem(ACCOUNT_CONFIG.storageKey)) {render(false);return;}
    const client=await accountClient();
    const {data,error}=await client.auth.getUser();
    if(seq!==generation)return;
    if(!error)render(Boolean(data.user));
  } catch { /* Do not mistake temporary failure for logout. */ }
}
render(false);
refresh();
window.addEventListener('storage',event=>{if(event.key===ACCOUNT_CONFIG.storageKey)refresh();});
window.addEventListener('pageshow',refresh);

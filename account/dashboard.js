import {ACCOUNT_CONFIG as config} from './config.js';
import {accountClient} from './client.js';
import {activeRoleLabels, cleanEmail, hasConfirmedSignOut, money} from './security.mjs';

let client, currentUser, generation = 0, loading, reloadPending = false;
const dashboard = document.querySelector('#account-dashboard');
const loader = document.querySelector('#account-loading');
const status = document.querySelector('#dashboard-status');
const profileForm = document.querySelector('#profile-form');

function message(text, kind = 'info') { status.textContent = text; status.dataset.kind = kind; if (text) status.focus(); }
function clearPrivateView() {
  generation++;
  currentUser = null;
  dashboard.hidden = true;
  document.querySelector('#account-greeting').textContent = 'Welcome.';
  dashboard.querySelectorAll('input').forEach(input => { input.value = ''; });
  for (const id of ['account-email', 'account-id', 'account-roles', 'coach-connections', 'account-subscriptions', 'invoice-list']) document.getElementById(id).replaceChildren();
  status.textContent = '';
}
function recovery(text) {
  clearPrivateView();
  loader.hidden = false;
  loader.querySelector('p').textContent = text;
  document.querySelector('#account-retry').hidden = false;
}
function textElement(tag, text) { const element = document.createElement(tag); element.textContent = text; return element; }

async function requireCurrentIdentity() {
  const {data, error} = await client.auth.getUser();
  if (error || !data.user || data.user.id !== currentUser?.id) throw new Error('identity_changed');
  return data.user;
}

function wire(form, action) {
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (form.dataset.pending === 'true' || !form.reportValidity()) return;
    form.dataset.pending = 'true';
    const button = form.querySelector('button');
    button.disabled = true;
    form.setAttribute('aria-busy', 'true');
    const view = generation;
    try { await action(new FormData(form), view); }
    catch { if (view === generation) message('NAV could not confirm the change. Your entries are still here. Please retry.', 'error'); }
    finally { form.dataset.pending = 'false'; button.disabled = false; form.removeAttribute('aria-busy'); }
  });
}

async function load() {
  if (loading) { reloadPending = true; return loading; }
  loading = loadAccount().finally(() => {
    loading = null;
    if (reloadPending) { reloadPending = false; queueMicrotask(load); }
  });
  return loading;
}

async function loadAccount() {
  const view = ++generation;
  try {
    client ??= await accountClient();
    const {data, error} = await client.auth.getUser();
    if (view !== generation) return;
    if (hasConfirmedSignOut(error) || (!error && !data.user)) {
      clearPrivateView();
      location.replace(new URL('auth.html?mode=login', import.meta.url).href);
      return;
    }
    if (error || !data.user) { recovery('Your session could not be checked. Retry when connected; your account has not been reset.'); return; }
    if (!data.user.email_confirmed_at) { recovery('Please confirm your email before opening My NAV.'); return; }
    currentUser = data.user;
    const id = currentUser.id;
    const results = await Promise.all([
      client.from('profiles').select('id,full_name,phone').eq('id', id).maybeSingle(),
      client.from('platform_user_roles').select('role,status').eq('user_id', id),
      client.rpc('get_my_coach_connections'),
      client.from('subscriptions').select('id,status,current_period_end').eq('user_id', id).limit(10),
      client.from('billing_invoices').select('id,invoice_number,status,total_due_cents,amount_remaining_cents,currency,due_date').eq('client_id', id).neq('status', 'draft').order('issue_date', {ascending:false}).limit(10)
    ]);
    if (view !== generation) return;
    const [profile, roles, connections, subscriptions, invoices] = results;
    if (profile.error || !profile.data || profile.data.id !== id) { recovery('Your profile could not load. Retry to recover your account view.'); return; }
    // Revalidate after the reads so a replaced/revoked session cannot publish stale results.
    await requireCurrentIdentity();
    if (view !== generation) return;
    document.querySelector('#account-greeting').textContent = profile.data.full_name ? `Hi, ${profile.data.full_name}.` : 'Welcome to My NAV.';
    document.querySelector('#account-email').textContent = currentUser.email ?? 'Email unavailable';
    document.querySelector('#account-id').textContent = id;
    profileForm.elements.fullName.value = profile.data.full_name ?? '';
    profileForm.elements.phone.value = profile.data.phone ?? '';
    const labels = document.querySelector('#account-roles');
    labels.replaceChildren();
    if (roles.error) labels.append(textElement('span', 'Account capabilities unavailable'));
    else for (const label of activeRoleLabels(roles.data ?? [])) {
      const chip = textElement('span', label); chip.className = 'account-label'; labels.append(chip);
    }
    document.querySelector('#coach-workspace').hidden = Boolean(roles.error) || !(roles.data ?? []).some(row => row.role === 'coach' && row.status === 'active');
    const coachArea = document.querySelector('#coach-connections');
    coachArea.replaceChildren();
    if (connections.error) coachArea.append(textElement('p', 'Coaching connections could not load. Retry or open NAV Coach.'));
    else if (!connections.data?.length) coachArea.append(textElement('p', 'No coaching connection is linked to this account yet. Explore coaching or open NAV Coach to get started.'));
    else for (const relationship of connections.data) {
      coachArea.append(textElement('p', `${relationship.coach_name || 'NAV coach'} · ${String(relationship.relationship_status).replaceAll('_', ' ')}`));
    }
    const subscriptionArea = document.querySelector('#account-subscriptions');
    subscriptionArea.replaceChildren();
    if (!subscriptions.error && subscriptions.data?.length) {
      subscriptionArea.append(textElement('h3', 'Subscription records'));
      for (const record of subscriptions.data) subscriptionArea.append(textElement('p', `Status: ${record.status || 'unavailable'}`));
      subscriptionArea.append(textElement('p', 'Billing status does not automatically restrict your coaching access.'));
    }
    const invoiceList = document.querySelector('#invoice-list');
    invoiceList.replaceChildren();
    const hasInvoices = !invoices.error && Boolean(invoices.data?.length);
    document.querySelector('#billing').hidden = !hasInvoices;
    document.querySelector('#billing-nav').hidden = !hasInvoices;
    if (hasInvoices) for (const invoice of invoices.data) {
      const item = document.createElement('li');
      const link = document.createElement('a');
      link.href = `${config.appUrl}/account/billing/${encodeURIComponent(invoice.id)}`;
      link.append(textElement('span', invoice.invoice_number || 'View invoice'));
      link.append(textElement('span', `${invoice.status || 'Status unavailable'} · ${money(invoice.amount_remaining_cents, invoice.currency)} remaining`));
      item.append(link); invoiceList.append(item);
    }
    loader.hidden = true;
    dashboard.hidden = false;
    if ([roles,connections,subscriptions,invoices].some(result => result.error)) message('Some account details could not load. Your profile is available; retry to refresh the rest.', 'error');
    else message('');
  } catch { if (view === generation) recovery('Your account connection was interrupted. Retry to reload securely.'); }
}

wire(profileForm, async (data, view) => {
  const user = await requireCurrentIdentity();
  const fullName = String(data.get('fullName')).trim().replace(/\s+/g, ' ');
  const phone = String(data.get('phone')).trim();
  if (!fullName || fullName.length > 120 || phone.length > 40) { message('Enter a name of up to 120 characters and an optional phone of up to 40 characters.', 'error'); return; }
  message('Saving your profile…');
  const {data: saved, error} = await client.from('profiles').update({full_name:fullName,phone:phone || null}).eq('id', user.id).select('id,full_name,phone').single();
  if (view !== generation) return;
  if (error || saved?.id !== user.id || saved.full_name !== fullName || (saved.phone ?? '') !== phone) throw new Error('profile_not_confirmed');
  document.querySelector('#account-greeting').textContent = `Hi, ${saved.full_name}.`;
  message('Profile saved to your NAV account.', 'success');
});

wire(document.querySelector('#email-form'), async (data, view) => {
  const user = await requireCurrentIdentity();
  const email = cleanEmail(data.get('email'));
  if (!email) { message('Enter a valid new email address.', 'error'); return; }
  const {data: reauthenticated, error} = await client.auth.signInWithPassword({email:user.email,password:String(data.get('password'))});
  if (view !== generation) return;
  if (error || reauthenticated.user?.id !== user.id) { message('Your password could not be confirmed. Please retry.', 'error'); return; }
  const result = await client.auth.updateUser({email}, {emailRedirectTo:`${config.appUrl}/auth/callback?next=/auth/confirmed`});
  if (view !== generation) return;
  if (result.error) { message('The email change could not be requested. Please retry or contact NAV support.', 'error'); return; }
  document.querySelector('#email-form').elements.password.value = '';
  message('Email change requested. Follow the confirmation messages in your inboxes. Your account ID and records stay the same.', 'success');
});

document.querySelector('#account-retry').addEventListener('click', load);
document.querySelector('#logout').addEventListener('click', async event => {
  event.currentTarget.disabled = true;
  try {
    const {error} = await client.auth.signOut({scope:'local'});
    if (error) { message('Log out could not be confirmed. Please retry.', 'error'); return; }
    clearPrivateView();
    location.replace(new URL('auth.html?mode=login', import.meta.url).href);
  } catch { message('Log out could not be confirmed. Please retry.', 'error'); }
  finally { event.target.disabled = false; }
});

window.addEventListener('storage', event => {
  if (event.key === config.storageKey) { clearPrivateView(); load(); }
});
window.addEventListener('pagehide', clearPrivateView);
window.addEventListener('pageshow', event => { if (event.persisted) load(); });
load().then(() => {
  client?.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_OUT' || (currentUser && session?.user.id && session.user.id !== currentUser.id)) {
      clearPrivateView();
      queueMicrotask(load);
    }
  });
});

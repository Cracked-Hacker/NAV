import {ACCOUNT_CONFIG as config} from './config.js';
import {accountClient} from './client.js';
import {accountMode, cleanEmail, passwordProblem} from './security.mjs';

const mode = accountMode(location.search);
const status = document.querySelector('#account-status');
let client;

function message(text, kind = 'info') {
  status.textContent = text;
  status.dataset.kind = kind;
  if (text) status.focus();
}

function wire(form, handler) {
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (form.dataset.pending === 'true' || !form.reportValidity()) return;
    const button = form.querySelector('button');
    form.dataset.pending = 'true';
    button.disabled = true;
    form.setAttribute('aria-busy', 'true');
    message('Working securely…');
    try { await handler(new FormData(form), form); }
    catch { message('NAV could not connect securely. Your entries are still here. Please try again.', 'error'); }
    finally { form.dataset.pending = 'false'; button.disabled = false; form.removeAttribute('aria-busy'); }
  });
}

async function start() {
  document.querySelectorAll('[data-mode-link]').forEach(link => {
    if (link.dataset.modeLink === mode) link.setAttribute('aria-current', 'page');
  });
  const form = document.querySelector(`#${mode}-form`);
  form.hidden = false;
  try { client = await accountClient(); }
  catch { message('Secure account tools could not load. Refresh to retry, or keep browsing NAV.', 'error'); return; }
  form.querySelector('button').disabled = false;
  message('');

  wire(document.querySelector('#login-form'), async data => {
    const email = cleanEmail(data.get('email'));
    if (!email) { message('Enter a valid email address.', 'error'); return; }
    const {data: result, error} = await client.auth.signInWithPassword({email, password: String(data.get('password'))});
    if (error || !result.user) {
      message(error?.code === 'email_not_confirmed' ? 'Confirm your email using the NAV message in your inbox, then log in.' : 'We could not log you in. Check your email and password, or request a reset link.', 'error');
      return;
    }
    if (!result.user.email_confirmed_at) {
      await client.auth.signOut({scope: 'local'});
      message('Confirm your email before logging in.', 'error');
      return;
    }
    location.assign(new URL('./', location.href).href);
  });

  wire(document.querySelector('#signup-form'), async (data, form) => {
    const password = String(data.get('password'));
    const problem = passwordProblem(password);
    if (problem) { message(problem, 'error'); return; }
    if (password !== data.get('confirmation')) { message('The passwords do not match. Please check them.', 'error'); return; }
    const email = cleanEmail(data.get('email'));
    if (!email) { message('Enter a valid email address.', 'error'); return; }
    const {data: result, error} = await client.functions.invoke('nav-account-entry', {body: {
      email, password,
      firstName: String(data.get('firstName')).trim(),
      lastName: String(data.get('lastName')).trim(),
      acceptedTerms: data.get('terms') === 'on', acceptedPrivacy: data.get('privacy') === 'on',
      acceptedDisclaimer: data.get('disclaimer') === 'on', acceptedHealthData: data.get('health') === 'on'
    }});
    if (error || result?.accepted !== true) {
      const messages = {
        password_breached: 'Choose another password. This one appears in known breach data.',
        weak_password: 'Use 12–200 characters and at least three of: lowercase, uppercase, numbers, and symbols.',
        password_check_unavailable: 'The password safety check is temporarily unavailable. Please retry.',
        agreements_missing: 'Review and accept each account agreement to continue.'
      };
      message(messages[result?.reason] ?? 'NAV could not securely finish signup. Your entries are still here. Please retry.', 'error');
      return;
    }
    form.querySelectorAll('input[type=password]').forEach(input => { input.value = ''; });
    message('If signup can proceed, NAV will send an email confirmation. Check your inbox and spam folder, verify through the secure link, then return here to log in. If you already have an account, use Log In or reset your password.', 'success');
  });

  wire(document.querySelector('#reset-form'), async data => {
    const email = cleanEmail(data.get('email'));
    if (!email) { message('Enter a valid email address.', 'error'); return; }
    const {error} = await client.auth.resetPasswordForEmail(email, {
      redirectTo: `${config.appUrl}/auth/callback?next=/reset-password`
    });
    if (error && !['over_email_send_rate_limit', 'email_address_not_authorized'].includes(error.code)) {
      message('The reset request could not be completed. Please retry shortly.', 'error');
      return;
    }
    message('If an eligible NAV account exists, a reset message will be sent. Open its secure link, change your password in NAV Coach, then return here to log in. An expired link can be replaced with a new request.', 'success');
  });
}

start();

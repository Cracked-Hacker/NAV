export const ROLE_LABELS = Object.freeze({client: 'Client', coach: 'Coach', platform_admin: 'Mega Admin', owner_admin: 'Admin'});

export function passwordProblem(value) {
  if (typeof value !== 'string' || value.length < 12 || value.length > 200) return 'Use 12–200 characters.';
  if ([/[a-z]/, /[A-Z]/, /[0-9]/, /[^A-Za-z0-9]/].filter(pattern => pattern.test(value)).length < 3) {
    return 'Include at least three of: lowercase letters, uppercase letters, numbers, and symbols.';
  }
  return '';
}

export function cleanEmail(value) {
  const email = String(value ?? '').trim().toLowerCase();
  return email.length <= 320 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : '';
}

export function activeRoleLabels(rows) {
  return [...new Set(rows.filter(row => row.status === 'active').map(row => ROLE_LABELS[row.role] ?? 'NAV member'))];
}

// User-controlled return URLs are never accepted. Product destinations are fixed.
export function accountMode(search) {
  const mode = new URLSearchParams(search).get('mode');
  return ['login', 'signup', 'reset'].includes(mode) ? mode : 'login';
}

export function money(cents, currency) {
  if (!Number.isSafeInteger(cents) || !/^[A-Z]{3}$/.test(currency ?? '')) return 'Amount unavailable';
  try { return new Intl.NumberFormat(undefined, {style: 'currency', currency}).format(cents / 100); }
  catch { return 'Amount unavailable'; }
}

export function hasConfirmedSignOut(error) {
  return error?.name === 'AuthSessionMissingError' || ['session_not_found', 'refresh_token_not_found', 'bad_jwt'].includes(error?.code);
}

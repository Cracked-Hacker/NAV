// Progressive enhancement only: resource PDFs remain downloadable without JavaScript or payment.
// Optional contributions are fulfilled entirely by Venmo; this site stores no payment information.
const resources = [
  {id: 'atlas', note: 'Human Sciences Study Atlas'},
  {id: 'nutrition', note: 'NAV Performance Nutrition Guide'}
];
for (const {id, note} of resources) {
  const slider = document.getElementById(id + '-contribution');
  const custom = document.getElementById(id + '-contribution-custom');
  const status = document.getElementById(id + '-amount-status');
  const copy = document.getElementById(id + '-copy-amount');
  const venmo = document.getElementById(id + '-venmo');
  if (!slider || !custom || !status || !copy || !venmo) continue;

  const baseHref = venmo.href;
  const amount = () => {
    const raw = custom.value.trim();
    if (!/^[0-9]+(?:\.[0-9]{1,2})?$/.test(raw) || !custom.validity.valid) return null;
    const value = Number(raw);
    return Number.isFinite(value) ? value : null;
  };
  const display = value => value.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2});
  const update = () => {
    const value = amount();
    if (value === null || value === 0) { venmo.href = baseHref; return value; }
    const url = new URL('https://venmo.com/Nate-Holochwost');
    url.searchParams.set('txn', 'pay');
    url.searchParams.set('amount', value.toFixed(2));
    url.searchParams.set('note', note);
    venmo.href = url.toString();
    return value;
  };
  const copyAmount = async () => {
    const value = update();
    if (value === null) { status.textContent = 'Enter a valid amount of $0 or more.'; return; }
    if (value === 0) { status.textContent = 'Free at $0. Download does not require payment.'; return; }
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard not available');
      await navigator.clipboard.writeText(value.toFixed(2));
      status.textContent = 'Copied $' + display(value) + '. Paste in Venmo if needed.';
    } catch {
      status.textContent = 'Copy unavailable. Enter $' + display(value) + ' in Venmo.';
    }
  };
  slider.addEventListener('input', () => {
    custom.value = slider.value;
    update();
    status.textContent = 'Release to copy $' + display(Number(slider.value)) + '.';
  });
  slider.addEventListener('change', () => { void copyAmount(); });
  custom.addEventListener('input', () => {
    const value = update();
    if (value === null) { status.textContent = 'Enter a valid amount of $0 or more.'; return; }
    slider.value = String(Math.min(100, value));
    status.textContent = value === 0
      ? 'Free at $0. Download does not require payment.'
      : 'Optional contribution. Copy this amount or open Venmo.';
  });
  custom.addEventListener('change', () => { void copyAmount(); });
  copy.addEventListener('click', () => { void copyAmount(); });
  venmo.addEventListener('click', () => { void copyAmount(); });
  update();
}

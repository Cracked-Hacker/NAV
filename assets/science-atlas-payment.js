// Progressive enhancement only: the atlas PDF is available without payment or JavaScript.
// Venmo owns the transaction; no payment data is handled by the website.
const slider = document.querySelector('#atlas-contribution');
const custom = document.querySelector('#atlas-contribution-custom');
const status = document.querySelector('#atlas-amount-status');
const copy = document.querySelector('#atlas-copy-amount');
const venmo = document.querySelector('#atlas-venmo');
if (slider && custom && status && copy && venmo) {
  const baseHref = venmo.href;
  const amount = () => {
    const raw = custom.value.trim();
    if (!/^[0-9]+(?:\.[0-9]{1,2})?$/.test(raw) || !custom.validity.valid) return null;
    const value = Number(raw);
    return Number.isFinite(value) ? value : null;
  };
  const display = value => value.toLocaleString('en-US', {minimumFractionDigits:2,maximumFractionDigits:2});
  const update = () => {
    const value = amount();
    if (value === null || value === 0) { venmo.href = baseHref; return value; }
    const url = new URL('https://venmo.com/Nate-Holochwost');
    url.searchParams.set('txn','pay');
    url.searchParams.set('amount',value.toFixed(2));
    url.searchParams.set('note','Human Sciences Study Atlas');
    venmo.href = url.toString();
    return value;
  };
  const copyAmount = async () => {
    const value = update();
    if (value === null) { status.textContent = 'Enter a valid amount of $0 or more.'; return; }
    if (value === 0) { status.textContent = 'Download free at $0. Payment is optional.'; return; }
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard not available');
      await navigator.clipboard.writeText(value.toFixed(2));
      status.textContent = 'Copied $'+display(value)+'. Paste into Venmo if needed.';
    } catch {
      status.textContent = 'Copy unavailable. Enter $'+display(value)+' in Venmo.';
    }
  };
  slider.addEventListener('input', () => {
    custom.value = slider.value; update();
    status.textContent = 'Release to copy $'+display(Number(slider.value))+'.';
  });
  slider.addEventListener('change', () => { void copyAmount(); });
  custom.addEventListener('input', () => {
    const value = update();
    if(value === null){status.textContent='Enter a valid amount of $0 or more.';return;}
    slider.value=String(Math.min(100,value));
    status.textContent=value===0?'Download free at $0. Payment is optional.':'Contribution optional. Copy the amount or open Venmo.';
  });
  custom.addEventListener('change', () => { void copyAmount(); });
  copy.addEventListener('click', () => { void copyAmount(); });
  venmo.addEventListener('click', () => { void copyAmount(); });
  update();
}

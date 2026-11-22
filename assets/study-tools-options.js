// Progressive enhancement: Venmo may prefill the amount, but payments finish in Venmo.
// This page collects no payments; clipboard copy is a reliable fallback where supported.
const slider = document.querySelector('#muscle-contribution');
const custom = document.querySelector('#muscle-contribution-custom');
const explanation = document.querySelector('#muscle-amount-explanation');
const copyButton = document.querySelector('#muscle-copy-amount');
const venmo = document.querySelector('.study-download-actions a[href^="https://venmo.com/"]');
if (slider && custom && explanation && copyButton && venmo) {
  const profileUrl = venmo.href; // No-JS link remains the original Venmo profile.
  const amount = () => {
    const raw = custom.value.trim();
    if (!/^[0-9]+(?:\.[0-9]{1,2})?$/.test(raw) || !custom.validity.valid) return null;
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  };
  const formatted = n => n.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2});
  const syncPaymentLink = () => {
    const n = amount();
    if (n === null || n === 0) {
      venmo.href = profileUrl;
    } else {
      const link = new URL('https://venmo.com/Nate-Holochwost');
      link.searchParams.set('txn', 'pay');
      link.searchParams.set('amount', n.toFixed(2));
      link.searchParams.set('note', 'NAV Ultimate Muscle Card Set');
      venmo.href = link.toString();
    }
    return n;
  };
  const copyAmount = async () => {
    const n = syncPaymentLink();
    if (n === null) {
      explanation.textContent = 'Enter a valid amount of $0 or more.';
      return;
    }
    if (n === 0) {
      explanation.textContent = 'Free at $0. Download does not require payment.';
      return;
    }
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(n.toFixed(2));
      explanation.textContent = 'Copied $' + formatted(n) + '. Paste in Venmo if needed.';
    } catch {
      explanation.textContent = 'Copy unavailable. Enter $' + formatted(n) + ' in Venmo.';
    }
  };
  slider.addEventListener('input', () => {
    custom.value = slider.value;
    syncPaymentLink();
    explanation.textContent = 'Release to copy $' + formatted(Number(slider.value)) + '.';
  });
  slider.addEventListener('change', () => { void copyAmount(); });
  custom.addEventListener('input', () => {
    const n = syncPaymentLink();
    if (n === null) {
      explanation.textContent = 'Enter a valid amount of $0 or more.';
    } else {
      slider.value = String(Math.min(100, n)); // Slider is quick select; manual amount is uncapped.
      explanation.textContent = n === 0
        ? 'Free at $0. Download does not require payment.'
        : 'Any amount accepted. Tap Copy or open Venmo.';
    }
  });
  custom.addEventListener('change', () => { void copyAmount(); });
  copyButton.addEventListener('click', () => { void copyAmount(); });
  venmo.addEventListener('click', () => { void copyAmount(); });
  syncPaymentLink();
}

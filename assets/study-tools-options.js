// Contribution preview only; payments are handled in Venmo, never on this website.
const input = document.querySelector('#muscle-contribution');
const explanation = document.querySelector('#muscle-amount-explanation');
if (input && explanation) {
  const refresh = () => {
    const raw = input.value.trim();
    const dollars = Number(raw);
    if (!raw) {
      explanation.textContent = 'Choose any amount in Venmo. NAV sets no upper limit; downloading is free.';
    } else if (!Number.isFinite(dollars) || dollars < 0 || !input.validity.valid) {
      explanation.textContent = 'Enter a valid contribution of $0 or more.';
    } else if (dollars === 0) {
      explanation.textContent = 'Free at $0. No payment is required to download.';
    } else {
      const formatted = dollars.toLocaleString('en-US', {maximumFractionDigits: 2});
      explanation.textContent = 'Enter $' + formatted + ' in Venmo. NAV sets no upper limit; download remains free.';
    }
  };
  input.addEventListener('input', refresh);
  refresh();
}

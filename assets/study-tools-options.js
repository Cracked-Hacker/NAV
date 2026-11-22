// Study Tools price preview. No checkout, account lookup, or payment processing.
const slider = document.querySelector('#muscle-contribution');
const amount = document.querySelector('#muscle-contribution-value');
const explanation = document.querySelector('#muscle-amount-explanation');
if (slider && amount && explanation) {
  const refresh = () => {
    const dollars = Math.min(100, Math.max(0, Number.parseInt(slider.value, 10) || 0));
    amount.value = '$' + dollars;
    explanation.textContent = dollars === 0
      ? 'Selected: $0. Download all formats now — no payment or email required.'
      : 'Selected: ;
  };
  slider.addEventListener('input', refresh);
  slider.addEventListener('change', refresh);
  refresh();
}
 + dollars + ' as voluntary support. All download links work without payment. No payment is collected on this page.';
  };
  slider.addEventListener('input', refresh);
  slider.addEventListener('change', refresh);
  refresh();
}

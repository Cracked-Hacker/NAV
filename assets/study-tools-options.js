// Optional contribution preview only. No payment is collected on this website.
const slider=document.querySelector('#muscle-contribution');
const amount=document.querySelector('#muscle-contribution-value');
const explanation=document.querySelector('#muscle-amount-explanation');
if(slider&&amount&&explanation){
  const refresh=()=>{
    const dollars=Math.min(100,Math.max(0,Number.parseInt(slider.value,10)||0));
    amount.value='$'+dollars;
    explanation.textContent=dollars===0
      ? 'Free at $0. Download does not require payment.'
      : 'Optional support: $'+dollars+'. Enter the amount in Venmo. Download remains free.';
  };
  slider.addEventListener('input',refresh);
  slider.addEventListener('change',refresh);
  refresh();
}

// Progressive enhancement only. Free downloads never depend on payment or JavaScript.
// Venmo transaction submission happens off-site; no payment details are collected here.
const slider=document.querySelector('#nutrition-contribution');
const custom=document.querySelector('#nutrition-contribution-custom');
const copy=document.querySelector('#nutrition-copy-amount');
const status=document.querySelector('#nutrition-amount-status');
const venmo=document.querySelector('#nutrition-support-venmo');
if(slider&&custom&&copy&&status&&venmo){
  const profile=venmo.href;
  const getAmount=()=>{
    const raw=custom.value.trim();
    if(!/^[0-9]+(?:\\.[0-9]{1,2})?$/.test(raw)||!custom.validity.valid)return null;
    const n=Number(raw);
    return Number.isFinite(n)&&n>=0?n:null;
  };
  const money=n=>'$'+n.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});
  const sync=()=>{
    const n=getAmount();
    if(n===null||n===0){venmo.href=profile;return n;}
    const url=new URL(profile);
    url.searchParams.set('txn','pay');
    url.searchParams.set('amount',n.toFixed(2));
    url.searchParams.set('note','NAV Performance Nutrition Guide - optional support');
    venmo.href=url.toString();
    return n;
  };
  const copyAmount=async()=>{
    const n=sync();
    if(n===null){status.textContent='Enter an amount of $0 or more, with at most two decimals.';return;}
    if(n===0){status.textContent='The download is free. No payment is required.';return;}
    try{
      if(!navigator.clipboard?.writeText)throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(n.toFixed(2));
      status.textContent='Copied '+money(n)+'. Paste into Venmo if needed.';
    }catch{
      status.textContent='Copy unavailable. Enter '+money(n)+' in Venmo manually.';
    }
  };
  slider.addEventListener('input',()=>{custom.value=slider.value;sync();status.textContent='Release to copy '+money(Number(slider.value))+'.';});
  slider.addEventListener('change',()=>{void copyAmount();});
  custom.addEventListener('input',()=>{
    const n=sync();
    if(n===null){status.textContent='Enter a valid nonnegative amount.';return;}
    slider.value=String(Math.min(100,n));
    status.textContent=n===0?'The download is free. No payment is required.':'Optional amount '+money(n)+'. Tap Copy or open Venmo.';
  });
  copy.addEventListener('click',()=>{void copyAmount();});
  venmo.addEventListener('click',()=>{void copyAmount();});
  sync();
}

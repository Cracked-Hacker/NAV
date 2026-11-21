import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Window} from 'happy-dom';

const source=readFileSync(new URL('../account/navigation.js',import.meta.url),'utf8')
  .replace(/^import .*;\r?\n/gm,'')
  .replaceAll('import.meta.url',JSON.stringify('https://preview.example.invalid/account/navigation.js'));

function view(href) {
  const window=new Window({url:'https://preview.example.invalid/'+href});
  window.document.write('<nav class="desktop-nav" aria-label="Primary"></nav><details class="mobile-nav"><summary>Menu</summary><nav aria-label="Mobile primary"></nav></details>');
  Object.assign(window,{ACCOUNT_CONFIG:{storageKey:'test-only'},accountClient:async()=>{throw new Error('SDK should not load without stored session')}});
  window.eval(source);
  return window;
}
for(const path of ['account/auth.html?mode=login','coach-nate.html','index.html']){
  test('five navigation entries, no duplicate destinations: '+path,()=>{
    const window=view(path);
    for(const nav of window.document.querySelectorAll('.desktop-nav,.mobile-nav nav')){
      assert.equal(nav.children.length,5);
      assert.deepEqual([...nav.children].map(el=>el.tagName==='DETAILS' ? el.querySelector('summary').textContent.trim() : el.textContent.trim()),['Home','Services','Products','About','Account']);
      assert.equal([...nav.querySelectorAll('a')].filter(a=>a.textContent==='Coach Nate').length,1);
      assert.equal([...nav.querySelectorAll('a')].filter(a=>a.textContent==='Create Account').length,1);
      for(const label of ['NAV Coach app','NAV Classroom','Study tools','Merch','Sign In']) assert.equal([...nav.querySelectorAll('a')].filter(a=>a.textContent===label).length,1);
    }
    window.happyDOM.abort();
  });
}

test('authenticated sessions display only My NAV; signup disappears',async()=>{
  const window=new Window({url:'https://preview.example.invalid/account/'});
  window.document.write('<nav class="desktop-nav" aria-label="Primary"></nav><details class="mobile-nav"><summary>Menu</summary><nav aria-label="Mobile primary"></nav></details>');
  window.localStorage.setItem('test-only','present');
  Object.assign(window,{
    ACCOUNT_CONFIG:{storageKey:'test-only'},
    accountClient:async()=>({auth:{getUser:async()=>({data:{user:{id:'test-user'}},error:null})}})
  });
  window.eval(source);
  await new Promise(resolve=>setImmediate(resolve));
  for(const nav of window.document.querySelectorAll('.desktop-nav,.mobile-nav nav')){
    assert.equal(nav.children.length,5);
    assert.equal([...nav.querySelectorAll('a')].filter(a=>a.textContent==='My NAV').length,1);
    assert.equal([...nav.querySelectorAll('a')].filter(a=>a.textContent==='Create Account').length,0);
    assert.equal([...nav.querySelectorAll('a')].filter(a=>a.textContent==='Sign In').length,0);
  }
  window.happyDOM.abort();
});

test('unverified stored session shows safe Account entry until identity is confirmed',async()=>{
  const window=new Window({url:'https://preview.example.invalid/products.html'});
  window.document.write('<nav class="desktop-nav"></nav><details class="mobile-nav"><summary>Menu</summary><nav aria-label="Mobile primary"></nav></details>');
  window.localStorage.setItem('test-only','session-present');
  Object.assign(window,{ACCOUNT_CONFIG:{storageKey:'test-only'},accountClient:async()=>{throw new Error('Synthetic auth outage')}});
  window.eval(source);
  await new Promise(resolve=>setImmediate(resolve));
  for(const nav of window.document.querySelectorAll('.desktop-nav,.mobile-nav nav')){
    assert.equal([...nav.querySelectorAll('a')].filter(a=>a.textContent==='Account').length,1);
    assert.equal([...nav.querySelectorAll('a')].filter(a=>a.textContent==='Create Account').length,0);
    assert.equal([...nav.querySelectorAll('a')].filter(a=>a.textContent==='My NAV').length,0);
    assert.equal([...nav.querySelectorAll('a')].filter(a=>a.textContent==='All Products').length,1);
  }
  window.happyDOM.abort();
});

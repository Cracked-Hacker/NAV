import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Window} from 'happy-dom';

const source=readFileSync(new URL('../account/navigation.js',import.meta.url),'utf8')
  .replace(/^import .*;\r?\n/gm,'')
  .replaceAll('import.meta.url',JSON.stringify('https://preview.example.invalid/account/navigation.js'));
for(const href of ['../coach-nate.html','../coach-nate']){
  test(`Netlify navigation preserves one Coach Nate destination for ${href}`,async()=>{
    const window=new Window({url:'https://preview.example.invalid/account/auth?mode=login'});
    window.document.write(`<nav class="desktop-nav"><a href="${href}">Coach Nate</a><a data-nav-login href="auth?mode=login">Sign In</a><a data-nav-signup href="auth?mode=signup">Create Account</a></nav>`);
    Object.assign(window,{ACCOUNT_CONFIG:{storageKey:'test-only'},accountClient:async()=>{throw new Error('No session: SDK should stay unloaded')}});
    window.eval(source);
    await new Promise(resolve=>setImmediate(resolve));
    assert.equal([...window.document.querySelectorAll('.desktop-nav a')].filter(a=>a.textContent==='Coach Nate').length,1);
    assert.match(window.document.querySelector('[data-nav-login]').href,/\/account\/auth\.html\?mode=login$/);
    window.happyDOM.abort();
  });
}

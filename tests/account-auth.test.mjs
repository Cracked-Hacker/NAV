import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Window} from 'happy-dom';
import * as security from '../account/security.mjs';

const html=readFileSync(new URL('../account/auth.html',import.meta.url),'utf8');
const source=readFileSync(new URL('../account/auth.js',import.meta.url),'utf8').replace(/^import .*;\r?\n/gm,'').replaceAll('import.meta.url', JSON.stringify('https://preview.example.invalid/account/auth.js'));
async function flush(){for(let i=0;i<12;i++)await new Promise(resolve=>setImmediate(resolve));}
async function mount(mode,client){
  const window=new Window({url:`https://preview.example.invalid/account/auth.html?mode=${mode}`,settings:{disableJavaScriptFileLoading:true,disableCSSFileLoading:true}});
  window.document.write(html);
  Object.assign(window,{...security,config:{appUrl:'https://nav-coach-app-eight.vercel.app'},accountClient:async()=>client});
  window.eval(source);await flush();return window;
}
test('incorrect password preserves input and uses a non-enumerating error',async()=>{
  const window=await mount('login',{auth:{signInWithPassword:async()=>({data:{},error:{code:'invalid_credentials'}})}});
  const form=window.document.querySelector('#login-form');form.elements.email.value='synthetic@example.invalid';form.elements.password.value='Synthetic-Test-Only-123!';
  form.dispatchEvent(new window.Event('submit',{cancelable:true}));await flush();
  assert.equal(form.elements.password.value,'Synthetic-Test-Only-123!');
  assert.match(window.document.querySelector('#account-status').textContent,/Check your email and password/);
  assert.equal(form.querySelector('button').disabled,false);
  await window.happyDOM.close();
});
test('signup keeps capabilities out of the form and blocks double submission while pending',async()=>{
  let resolve;let count=0;let sent;
  const window=await mount('signup',{functions:{invoke:async(name,{body})=>{count++;sent={name,body};return new Promise(done=>{resolve=done;});}}});
  const form=window.document.querySelector('#signup-form');
  for(const [key,value]of Object.entries({firstName:'Synthetic',lastName:'Member',email:'synthetic@example.invalid',password:'Synthetic-Test-Only-123!',confirmation:'Synthetic-Test-Only-123!'}))form.elements[key].value=value;
  for(const key of ['terms','privacy','disclaimer','health'])form.elements[key].checked=true;
  form.dispatchEvent(new window.Event('submit',{cancelable:true}));
  form.dispatchEvent(new window.Event('submit',{cancelable:true}));await flush();
  assert.equal(count,1);assert.equal(sent.name,'nav-account-entry');
  assert.equal('role'in sent.body,false);assert.equal('accountIntent'in sent.body,false);assert.equal('user_id'in sent.body,false);
  resolve({data:{accepted:true},error:null});await flush();
  assert.match(window.document.querySelector('#account-status').textContent,/If signup can proceed/);
  assert.equal(form.elements.password.value,'');assert.equal(form.elements.email.value,'synthetic@example.invalid');
  await window.happyDOM.close();
});
test('password mismatch and upstream failure preserve recoverable signup input',async()=>{
  let count=0;const window=await mount('signup',{functions:{invoke:async()=>{count++;throw new Error('network');}}});
  const form=window.document.querySelector('#signup-form');
  for(const [key,value]of Object.entries({firstName:'Synthetic',lastName:'Member',email:'synthetic@example.invalid',password:'Synthetic-Test-Only-123!',confirmation:'Different-Test-Only-123!'}))form.elements[key].value=value;
  for(const key of ['terms','privacy','disclaimer','health'])form.elements[key].checked=true;
  form.dispatchEvent(new window.Event('submit',{cancelable:true}));await flush();
  assert.equal(count,0);assert.match(window.document.querySelector('#account-status').textContent,/do not match/);
  form.elements.confirmation.value=form.elements.password.value;
  form.dispatchEvent(new window.Event('submit',{cancelable:true}));await flush();
  assert.equal(count,1);assert.equal(form.elements.password.value,'Synthetic-Test-Only-123!');
  assert.match(window.document.querySelector('#account-status').textContent,/entries are still here/);
  await window.happyDOM.close();
});
test('recovery uses the existing app flow without creating cross-origin verification state',async()=>{
  const window=await mount('reset',{});
  const panel=window.document.querySelector('#reset-form');
  assert.equal(panel.hidden,false);
  assert.equal(panel.querySelector('a.button').href,'https://nav-coach-app-eight.vercel.app/auth?mode=reset');
  assert.equal(panel.querySelector('input'),null);
  await window.happyDOM.close();
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Window} from 'happy-dom';
import * as security from '../account/security.mjs';

const html=readFileSync(new URL('../account/index.html',import.meta.url),'utf8');
const source=readFileSync(new URL('../account/dashboard.js',import.meta.url),'utf8').replace(/^import .*;\n/gm,'').replaceAll('import.meta.url', JSON.stringify('https://preview.example.invalid/account/dashboard.js'));
const tick=()=>new Promise(resolve=>setImmediate(resolve));
async function flush(){for(let i=0;i<12;i++)await tick();}

function fakeClient(options={}) {
  const calls=[];
  const state={user:{id:'synthetic-account-one',email:'synthetic@example.invalid',email_confirmed_at:'2026-10-01'},profile:{id:'synthetic-account-one',full_name:'Synthetic Member',phone:null},...options};
  const client={
    auth:{
      getUser:async()=>({data:{user:state.user},error:state.authError??null}),
      onAuthStateChange:callback=>{state.onAuth=callback;return {data:{subscription:{unsubscribe(){}}}};},
      signOut:async()=>{calls.push({type:'signOut'});return {error:state.logoutError??null};}
    },
    rpc:async name=>{calls.push({rpc:name});return {data:name==='has_accepted_current_user_policies' ? state.policiesAccepted!==false : [],error:null};},
    from(table){
      const call={table,filters:[]};calls.push(call);
      const result=()=>{
        if(table==='profiles'){
          if(state.profileError)return {data:null,error:{code:'42501'}};
          if(call.update){
            if(state.writeError)return {data:null,error:{code:'42501'}};
            Object.assign(state.profile,call.update);
          }
          return {data:{...state.profile},error:null};
        }
        if(table==='platform_user_roles')return {data:[{role:'client',status:'active'},{role:'coach',status:'active'},{role:'platform_admin',status:'pending'}],error:null};
        return {data:[],error:null};
      };
      const builder={select(){return builder;},eq(key,value){call.filters.push([key,value]);return builder;},neq(){return builder;},order(){return builder;},limit(){return builder;},update(values){call.update=values;return builder;},maybeSingle:async()=>result(),single:async()=>result(),then(resolve,reject){return Promise.resolve(result()).then(resolve,reject);}};
      return builder;
    }
  };
  return {client,state,calls};
}
async function mount(fake) {
  const window=new Window({url:'https://preview.example.invalid/account/',settings:{disableJavaScriptFileLoading:true,disableCSSFileLoading:true,disableComputedStyleRendering:true}});
  window.document.write(html);
  Object.assign(window,{...security,config:{appUrl:'https://nav-coach-app-eight.vercel.app',storageKey:'test-only'},accountClient:async()=>fake.client});
  window.eval(source);
  await flush();
  return window;
}
test('dual-role account renders from canonical profile and every owned query uses immutable ID',async()=>{
  const fake=fakeClient();const window=await mount(fake);
  assert.equal(window.document.querySelector('#account-dashboard').hidden,false);
  assert.equal(window.document.querySelector('#account-id').textContent,fake.state.user.id);
  assert.deepEqual([...window.document.querySelectorAll('.account-label')].map(x=>x.textContent),['Client','Coach']);
  assert.equal(window.document.querySelector('#billing').hidden,true);
  for(const call of fake.calls.filter(c=>c.table))assert.ok(call.filters.some(([key,value])=>['id','user_id','client_id'].includes(key)&&value===fake.state.user.id),call.table);
  assert.equal(window.document.querySelector('#coach-workspace').hidden,false);
  await window.happyDOM.close();
});
test('profile save confirms returned database row and survives a new view using same account',async()=>{
  const fake=fakeClient();const window=await mount(fake);
  const form=window.document.querySelector('#profile-form');
  form.elements.fullName.value='Updated Synthetic Name';
  form.elements.phone.value='';
  form.dispatchEvent(new window.Event('submit',{cancelable:true}));await flush();
  assert.match(window.document.querySelector('#dashboard-status').textContent,/Profile saved/);
  assert.equal(fake.state.profile.full_name,'Updated Synthetic Name');
  const writes=fake.calls.filter(c=>c.update);assert.equal(writes.length,1);
  assert.deepEqual(Object.keys(writes[0].update).sort(),['full_name','phone']);
  await window.happyDOM.close();
  const reloaded=await mount(fake);
  assert.equal(reloaded.document.querySelector('#profile-form').elements.fullName.value,'Updated Synthetic Name');
  assert.equal(reloaded.document.querySelector('#account-id').textContent,'synthetic-account-one');
  await reloaded.happyDOM.close();
});
test('denied write preserves typed values and never announces saved success',async()=>{
  const fake=fakeClient({writeError:true});const window=await mount(fake);
  const form=window.document.querySelector('#profile-form');form.elements.fullName.value='Unsaved Synthetic Name';
  form.dispatchEvent(new window.Event('submit',{cancelable:true}));await flush();
  assert.equal(form.elements.fullName.value,'Unsaved Synthetic Name');
  assert.match(window.document.querySelector('#dashboard-status').textContent,/could not confirm/);
  assert.equal(fake.state.profile.full_name,'Synthetic Member');
  await window.happyDOM.close();
});
test('a missing or unauthorized profile cannot render another person’s account',async()=>{
  for(const options of [{profileError:true},{profile:{id:'another-account',full_name:'Must not render'}}]){
    const window=await mount(fakeClient(options));
    assert.equal(window.document.querySelector('#account-dashboard').hidden,true);
    assert.equal(window.document.querySelector('#account-email').textContent,'');
    assert.equal(window.document.querySelector('#account-retry').hidden,false);
    await window.happyDOM.close();
  }
});
test('missing versioned consent prevents protected service reads without fabricating empty records',async()=>{
  const fake=fakeClient({policiesAccepted:false});const window=await mount(fake);
  assert.equal(window.document.querySelector('#account-dashboard').hidden,false);
  assert.match(window.document.querySelector('#coach-connections').textContent,/Review the current NAV account agreements/);
  assert.equal(fake.calls.some(call=>call.rpc==='get_my_coach_connections'),false);
  assert.equal(fake.calls.some(call=>['subscriptions','billing_invoices'].includes(call.table)),false);
  assert.equal(window.document.querySelector('#billing').hidden,true);
  await window.happyDOM.close();
});
test('transient session check and failed logout do not destroy a valid session',async()=>{
  const unavailable=fakeClient({authError:{name:'AuthRetryableFetchError',status:503}});
  const interrupted=await mount(unavailable);
  assert.equal(interrupted.document.querySelector('#account-dashboard').hidden,true);
  assert.equal(unavailable.calls.some(c=>c.type==='signOut'),false);
  assert.match(interrupted.document.querySelector('#account-loading').textContent,/Retry when connected/);
  await interrupted.happyDOM.close();
  const fake=fakeClient({logoutError:{message:'network'}});const window=await mount(fake);
  window.document.querySelector('#logout').click();await flush();
  assert.equal(window.document.querySelector('#account-dashboard').hidden,false);
  assert.match(window.document.querySelector('#dashboard-status').textContent,/Log out could not be confirmed/);
  await window.happyDOM.close();
});
test('logout/auth changes immediately remove private view and form data',async()=>{
  const fake=fakeClient();const window=await mount(fake);
  fake.state.user=null;fake.state.authError={name:'AuthSessionMissingError'};
  fake.state.onAuth('SIGNED_OUT',null);await flush();
  assert.equal(window.document.querySelector('#account-dashboard').hidden,true);
  assert.equal(window.document.querySelector('#account-email').textContent,'');
  assert.equal(window.document.querySelector('#profile-form').elements.fullName.value,'');
  await window.happyDOM.close();
});

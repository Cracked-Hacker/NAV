import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {stripTypeScriptTypes} from 'node:module';

const raw = readFileSync(new URL('../supabase/functions/nav-account-entry/index.ts',import.meta.url),'utf8');
function setup(outcome = {accepted:true}, options = {}) {
  const calls=[];
  let handler;
  const source=stripTypeScriptTypes(raw.replace('export async function','async function'));
  const context=vm.createContext({Request,Response,TextDecoder,Uint8Array,AbortSignal,JSON,Error,
    Deno:{env:{get:key=>({SUPABASE_URL:'https://ljvusfrnrlcurzwxnlya.supabase.co',SUPABASE_ANON_KEY:'test-public-anon-key',...options.env}[key])},serve:fn=>{handler=fn;}},
    fetch:async(url,init)=>{calls.push({url,init});if(options.fail)throw new Error('network');return new Response(JSON.stringify(outcome),{status:options.status??200});}
  });
  vm.runInContext(source,context);
  return {handler,calls};
}
const body={email:'synthetic@example.invalid',password:'Synthetic-Test-Only-123!',firstName:'Synthetic',lastName:'Member',acceptedTerms:true,acceptedPrivacy:true,acceptedDisclaimer:true,acceptedHealthData:true};
function request(data=body,origin='https://cracked-hacker.github.io',method='POST') {
  return new Request('https://ljvusfrnrlcurzwxnlya.supabase.co/functions/v1/nav-account-entry',{method,headers:{Origin:origin,'Content-Type':'application/json'},...(method==='POST'?{body:JSON.stringify(data)}:{})});
}
test('only the exact website origin is allowed and preflight never signs up', async()=>{
  const {handler,calls}=setup();
  assert.equal((await handler(request(body,'https://cracked-hacker.github.io.evil.invalid'))).status,403);
  const preflight=await handler(request(body,'https://cracked-hacker.github.io','OPTIONS'));
  assert.equal(preflight.status,204);
  assert.equal(preflight.headers.get('access-control-allow-origin'),'https://cracked-hacker.github.io');
  for(const origin of ['https://coach-nate.netlify.app','https://deploy-preview-15--coach-nate.netlify.app']){
    const allowed=await handler(request(body,origin,'OPTIONS'));
    assert.equal(allowed.status,204);assert.equal(allowed.headers.get('access-control-allow-origin'),origin);
  }
  assert.equal((await handler(request(body,'https://deploy-preview-99--coach-nate.netlify.app'))).status,403);
  assert.equal(calls.length,0);
});
test('signup forwards only approved data into the existing canonical gate',async()=>{
  const {handler,calls}=setup({accepted:true,session:{accessToken:'must-never-leak',refreshToken:'must-never-leak'}});
  const result=await handler(request({...body,accountIntent:'coach',role:'platform_admin',redirectTo:'https://evil.invalid',user_id:'fake'}));
  assert.equal(calls[0].url,'https://ljvusfrnrlcurzwxnlya.supabase.co/functions/v1/secure-signup');
  const forwarded=JSON.parse(calls[0].init.body);
  assert.equal(forwarded.accountIntent,'client');
  assert.equal(forwarded.fullName,'Synthetic Member');
  for(const key of ['role','redirectTo','user_id'])assert.equal(key in forwarded,false);
  assert.deepEqual(await result.json(),{accepted:true,confirmationRequired:true});
});
test('malformed, oversized, and missing-name requests never reach canonical signup',async()=>{
  const {handler,calls}=setup();
  assert.equal((await handler(request({...body,firstName:''}))).status,400);
  assert.equal((await handler(request({...body,padding:'x'.repeat(9000)}))).status,413);
  assert.equal((await handler(new Request('https://example.invalid',{method:'POST',headers:{Origin:'https://cracked-hacker.github.io','Content-Type':'application/json'},body:'{'}))).status,400);
  assert.equal(calls.length,0);
});
test('network and deployment errors fail closed without leaking upstream details',async()=>{
  const failed=setup({}, {fail:true});
  assert.deepEqual(await (await failed.handler(request())).json(),{accepted:false,reason:'temporarily_unavailable'});
  const wrong=setup({}, {env:{SUPABASE_URL:'https://wrong-project.supabase.co'}});
  assert.equal((await wrong.handler(request())).status,503);
  assert.equal(wrong.calls.length,0);
  const unsafe=setup({accepted:false,reason:'user_already_exists',email:'private@example.invalid'});
  assert.deepEqual(await(await unsafe.handler(request())).json(),{accepted:false,reason:'temporarily_unavailable'});
});

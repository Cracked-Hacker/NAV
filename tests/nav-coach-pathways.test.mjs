import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const html=readFileSync(new URL("../nav-coach.html",import.meta.url),"utf8");
const css=readFileSync(new URL("../style.css",import.meta.url),"utf8");
const choices=[...html.matchAll(/<article class="card product-choice">([\s\S]*?)<\/article>/g)].map(m=>m[1]);
const appLogin="https://nav-coach-app-eight.vercel.app/auth?mode=login";

test("NAV Coach offers separate, meaningful coach and athlete paths",()=>{
  assert.equal(choices.length,2,"exactly two audience choices");
  assert.match(choices[0],/I coach clients/);
  assert.match(choices[1],/I am an athlete/);
  assert.match(choices[0],/Coach sign-in/);
  assert.match(choices[1],/Athlete sign-in/);
  assert.ok(choices.every(card=>card.includes('href="'+appLogin+'"')),"both paths use the existing private app");
  assert.match(choices[1],/href="coaching.html"/,"nonclients can find a real coaching inquiry");
});

test("NAV Coach page does not misrepresent account creation or access",()=>{
  assert.match(html,/Creating an account does not automatically grant coach permissions/);
  assert.match(html,/An account alone does not create a coaching relationship/);
  assert.match(html,/may ask you to sign in separately/);
  assert.match(html,/href="account\/auth.html\?mode=signup"/);
  assert.doesNotMatch(html,/redeem (?:a |your )?tester code|guaranteed results/i);
});

test("landing retains public release and accessible-page conventions",()=>{
  assert.equal((html.match(/<main\b/g)||[]).length,1);
  assert.equal((html.match(/<h1\b/g)||[]).length,1);
  assert.match(html,/aria-labelledby="product-paths"/);
  assert.match(html,/aria-labelledby="product-workflow"/);
  assert.match(html,/class="skip-link" href="#main"/);
  assert.match(css,/\.product-choice-grid \.product-choice\{/);
  assert.match(css,/clamp\(24px,3vw,40px\)/);
});

import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const css = readFileSync(new URL("../account/account.css", import.meta.url), "utf8");
const html = readFileSync(new URL("../account/auth.html", import.meta.url), "utf8");
function has(s) { assert.ok(css.includes(s), "Missing responsive account rule: " + s); }
test("desktop website login uses the full desktop canvas, not a 470px phone column", () => {
  assert.match(html, /class="account-wrap account-wrap--auth"/);
  has(".account-wrap--auth .account-auth-layout {");
  has("grid-template-columns: minmax(0, 0.78fr) minmax(0, 1.22fr);");
  has("width: min(calc(100% - clamp(32px, 6vw, 96px)), 1460px);");
  has(".account-wrap--auth .account-card {");
  has("max-width: none;");
  assert.doesNotMatch(html, /<iframe\b/i);
});
test("tablet and phone breakpoints retain readable fields and no forced horizontal overflow", () => {
  has("@media (max-width: 1100px) {");
  has("@media (max-width: 600px) {");
  has("grid-template-columns: minmax(0, 1fr);");
  has("width: min(calc(100% - 28px), 560px);");
  has("min-width: 0;");
  has("min-height: 52px;");
  has("grid-template-columns: repeat(2, minmax(0, 1fr));");
});
test("existing shared-identity signup, sign-in, reset and consent forms remain intact", () => {
  for (const form of ["login-form","signup-form","reset-form"]) assert.ok(html.includes('id="' + form + '"'));
  for (const checkbox of ["terms","privacy","disclaimer","health"]) assert.ok(html.includes('name="' + checkbox + '" required'));
  assert.match(html, /autocomplete="current-password"/);
  assert.match(html, /autocomplete="new-password"/);
  assert.match(html, /src="auth\.js"/);
  assert.match(html, /data-mode-link="signup"/);
  assert.match(html, /data-mode-link="login"/);
});

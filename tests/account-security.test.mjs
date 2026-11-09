import test from 'node:test';
import assert from 'node:assert/strict';
import {activeRoleLabels,accountMode,cleanEmail,passwordProblem,money,hasConfirmedSignOut} from '../account/security.mjs';

test('one person retains simultaneous active capabilities without elevating pending roles', () => {
  assert.deepEqual(activeRoleLabels([{role:'client',status:'active'},{role:'coach',status:'active'},{role:'platform_admin',status:'pending'}]), ['Client','Coach']);
});
test('unknown financial amounts cannot become zero', () => {
  assert.equal(money(null,'USD'),'Amount unavailable');
  assert.equal(money(undefined,'USD'),'Amount unavailable');
  assert.match(money(0,'USD'),/0\.00/);
});
test('arbitrary auth modes and external return destinations are ignored', () => {
  assert.equal(accountMode('?mode=admin&next=https://attacker.invalid'),'login');
  assert.equal(accountMode('?mode=signup&next=//attacker.invalid'),'signup');
});
test('email normalization and new password requirements preserve canonical signup bounds', () => {
  assert.equal(cleanEmail('  User@Example.com  '),'user@example.com');
  assert.equal(cleanEmail('invalid'),'');
  assert.ok(passwordProblem('short'));
  assert.ok(passwordProblem('a'.repeat(16)));
  assert.equal(passwordProblem('Example-Not-A-Real-Password-123!'),'');
});
test('transient errors are recovery, not confirmed logout', () => {
  assert.equal(hasConfirmedSignOut({name:'AuthRetryableFetchError',status:503}),false);
  assert.equal(hasConfirmedSignOut({code:'refresh_token_already_used'}),false);
  assert.equal(hasConfirmedSignOut({name:'AuthSessionMissingError'}),true);
});

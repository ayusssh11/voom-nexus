import test from 'node:test';
import assert from 'node:assert/strict';
import { redactSecrets, OWASP_TOP_10_2021, DEFAULT_EXCLUDES } from '../dist/index.js';

test('redactSecrets() masks AWS access keys', () => {
  const input = 'const awsKey = "AKIA1234567890ABCDEF";';
  const result = redactSecrets(input);
  assert.ok(!result.includes('AKIA1234567890ABCDEF'));
  assert.ok(result.includes('AKIA****************'));
});

test('redactSecrets() masks generic apiKey assignments', () => {
  const input = 'const apiKey = "super_secret_token_value_xyz";';
  const result = redactSecrets(input);
  assert.ok(!result.includes('super_secret_token_value_xyz'));
  assert.ok(result.includes('****'));
});

test('constants export all 10 OWASP categories', () => {
  assert.strictEqual(Object.keys(OWASP_TOP_10_2021).length, 10);
  assert.ok(OWASP_TOP_10_2021.A01.includes('Broken Access Control'));
  assert.ok(OWASP_TOP_10_2021.A03.includes('Injection'));
});

test('DEFAULT_EXCLUDES contains node_modules and .git', () => {
  assert.ok(DEFAULT_EXCLUDES.includes('**/node_modules/**'));
  assert.ok(DEFAULT_EXCLUDES.includes('**/.git/**'));
});

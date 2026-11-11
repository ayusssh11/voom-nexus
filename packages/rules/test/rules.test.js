import test from 'node:test';
import assert from 'node:assert/strict';
import { defaultRuleRegistry, INITIAL_RULES } from '../dist/index.js';

test('RuleRegistry loads initial sample rules', () => {
  assert.ok(defaultRuleRegistry.count() >= 5);
  const sqli = defaultRuleRegistry.get('SEC-JS-001');
  assert.ok(sqli);
  assert.strictEqual(sqli.severity, 'CRITICAL');
  assert.strictEqual(sqli.cwe, 'CWE-89');
});

test('RuleRegistry filters rules by severity', () => {
  const criticalRules = defaultRuleRegistry.getFiltered({ severity: ['CRITICAL'] });
  assert.ok(criticalRules.length > 0);
  for (const r of criticalRules) {
    assert.strictEqual(r.severity, 'CRITICAL');
  }
});

test('RuleRegistry respects disabledRules', () => {
  const filtered = defaultRuleRegistry.getFiltered({ disabledRules: ['SEC-JS-001'] });
  assert.ok(!filtered.some((r) => r.id === 'SEC-JS-001'));
});


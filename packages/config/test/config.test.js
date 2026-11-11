import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_CONFIG, mergeWithDefaults } from '../dist/index.js';

test('DEFAULT_CONFIG defaults to threshold HIGH', () => {
  assert.strictEqual(DEFAULT_CONFIG.scan.threshold, 'HIGH');
  assert.strictEqual(DEFAULT_CONFIG.reporting.redactSecrets, true);
});

test('mergeWithDefaults merges partial user configuration correctly', () => {
  const custom = {
    scan: {
      threshold: 'CRITICAL'
    }
  };
  const merged = mergeWithDefaults(custom);
  assert.strictEqual(merged.scan.threshold, 'CRITICAL');
  assert.strictEqual(merged.reporting.format, 'text');
});


import test from 'node:test';
import assert from 'node:assert/strict';
import { ScanOrchestrator } from '../dist/index.js';
import { resolve } from 'node:path';

test('ScanOrchestrator instantiates with default config', () => {
  const orchestrator = new ScanOrchestrator();
  assert.ok(orchestrator);
});

test('ScanOrchestrator scans test fixtures and returns metrics', async () => {
  const orchestrator = new ScanOrchestrator();
  const result = await orchestrator.scanPath(resolve('test'));
  assert.ok(result.scanId);
  assert.ok(result.metrics);
  assert.strictEqual(typeof result.metrics.durationMs, 'number');
});


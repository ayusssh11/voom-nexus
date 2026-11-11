import test from 'node:test';
import assert from 'node:assert/strict';
import { webPlatformService } from '../dist/index.js';

test('WebPlatformService exposes valid status', () => {
  const status = webPlatformService.getStatus();
  assert.strictEqual(status.version, '0.1.0-alpha.0');
  assert.strictEqual(status.status, 'INITIALIZING');
});

test('WebPlatformService holds reference to shared engine', () => {
  const orchestrator = webPlatformService.getOrchestrator();
  assert.ok(orchestrator);
});

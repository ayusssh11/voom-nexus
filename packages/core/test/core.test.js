import test from 'node:test';
import assert from 'node:assert/strict';
import { ScanOrchestrator } from '../dist/index.js';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { writeFile, unlink } from 'node:fs/promises';

const currentDir = dirname(fileURLToPath(import.meta.url));
const srcDir = join(currentDir, '../src');

test('ScanOrchestrator instantiates with default config', () => {
  const orchestrator = new ScanOrchestrator();
  assert.ok(orchestrator);
});

test('ScanOrchestrator scans directory and returns metrics', async () => {
  const orchestrator = new ScanOrchestrator();
  const result = await orchestrator.scanPath(srcDir);
  assert.ok(result.scanId);
  assert.ok(result.metrics);
  assert.strictEqual(typeof result.metrics.durationMs, 'number');
  assert.ok(result.metrics.scannedFiles >= 3);
});

test('ScanOrchestrator detects command injection and weak hash', async () => {
  const tempTestFile = join(currentDir, 'test_vuln_sample.ts');
  const code = `
    import { exec } from 'child_process';
    import crypto from 'crypto';

    function run(cmd) {
      exec(\`tar -czf \${cmd}\`);
    }

    function hash(pass) {
      return crypto.createHash("md5").digest();
    }
  `;

  await writeFile(tempTestFile, code);

  try {
    const orchestrator = new ScanOrchestrator();
    const result = await orchestrator.scanPath(tempTestFile);
    assert.strictEqual(result.issues.length, 2);
    const ruleIds = result.issues.map((i) => i.ruleId);
    assert.ok(ruleIds.includes('SEC-JS-003'));
    assert.ok(ruleIds.includes('SEC-JS-004'));
  } finally {
    await unlink(tempTestFile);
  }
});

test('ScanOrchestrator honors inline suppression comments', async () => {
  const tempTestFile = join(currentDir, 'test_suppressed.ts');
  const code = `
    import { exec } from 'child_process';

    // voomsec-ignore-next-line SEC-JS-003
    exec(\`tar -czf \${safeParam}\`);
  `;

  await writeFile(tempTestFile, code);

  try {
    const orchestrator = new ScanOrchestrator();
    const result = await orchestrator.scanPath(tempTestFile);
    assert.strictEqual(result.issues.length, 0);
  } finally {
    await unlink(tempTestFile);
  }
});

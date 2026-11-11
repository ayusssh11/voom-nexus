import test from 'node:test';
import assert from 'node:assert/strict';
import { runCli } from '../dist/index.js';

test('runCli --version returns exit code 0', async () => {
  const code = await runCli(['--version']);
  assert.strictEqual(code, 0);
});

test('runCli rules returns exit code 0', async () => {
  const code = await runCli(['rules']);
  assert.strictEqual(code, 0);
});

test('runCli help returns exit code 0', async () => {
  const code = await runCli(['help']);
  assert.strictEqual(code, 0);
});


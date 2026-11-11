import test from 'node:test';
import assert from 'node:assert/strict';
import { runCli } from '../dist/index.js';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { readFile, unlink, rm } from 'node:fs/promises';

const currentDir = dirname(fileURLToPath(import.meta.url));
const testOutputDir = join(currentDir, 'test_cli_output');

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

test('runCli scan writes report to output file', async () => {
  const outputFile = join(testOutputDir, 'report.json');
  const code = await runCli(['scan', currentDir, '--format', 'json', '--output', outputFile]);
  // Returns 0 or 1 depending on whether test dir has issues, but output file must exist
  const content = await readFile(outputFile, 'utf-8');
  assert.ok(content);
  const parsed = JSON.parse(content);
  assert.ok(parsed.scanId);
  assert.ok(parsed.metrics);
  await rm(testOutputDir, { recursive: true, force: true });
});

test('runCli init generates configuration and AI rules', async () => {
  const targetInitDir = join(currentDir, 'test_init_env');
  const code = await runCli(['init', targetInitDir, '--ai', 'cursor,claude', '--force']);
  assert.strictEqual(code, 0);
  const configFile = await readFile(join(targetInitDir, '.voomsecrc.json'), 'utf-8');
  assert.ok(configFile.includes('voom-nexus.local'));
  const cursorRules = await readFile(join(targetInitDir, '.cursorrules'), 'utf-8');
  assert.ok(cursorRules.includes('Voom Nexus — Security Rules for Cursor AI'));
  const claudeMd = await readFile(join(targetInitDir, 'CLAUDE.md'), 'utf-8');
  assert.ok(claudeMd.includes('Security Guidelines for Claude Code'));
  await rm(targetInitDir, { recursive: true, force: true });
});

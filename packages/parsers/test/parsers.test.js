import test from 'node:test';
import assert from 'node:assert/strict';
import { defaultAdapterRegistry } from '../dist/index.js';

test('LanguageAdapterRegistry resolves .js and .ts to javascript adapter', () => {
  const jsAdapter = defaultAdapterRegistry.getAdapterForFile('src/index.js');
  assert.ok(jsAdapter);
  assert.strictEqual(jsAdapter.name, 'javascript');
  assert.strictEqual(jsAdapter.supportsAST, true);

  const tsAdapter = defaultAdapterRegistry.getAdapterForFile('src/types.ts');
  assert.ok(tsAdapter);
  assert.strictEqual(tsAdapter.name, 'javascript');
});

test('LanguageAdapterRegistry resolves .env to generic adapter', () => {
  const genericAdapter = defaultAdapterRegistry.getAdapterForFile('.env');
  assert.ok(genericAdapter);
  assert.strictEqual(genericAdapter.name, 'generic');
  assert.strictEqual(genericAdapter.supportsAST, false);
});


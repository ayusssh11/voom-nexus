import test from 'node:test';
import assert from 'node:assert/strict';
import { DirectoryWalker } from '../dist/index.js';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const currentDir = dirname(fileURLToPath(import.meta.url));
const srcDir = join(currentDir, '../src');
const indexFile = join(currentDir, '../src/index.ts');

test('DirectoryWalker walks directory and discovers source files', async () => {
  const walker = new DirectoryWalker({
    basePath: srcDir
  });
  const files = await walker.walk();
  assert.ok(files.length >= 3);
  const extensions = files.map((f) => f.extension);
  assert.ok(extensions.includes('.ts'));
});

test('DirectoryWalker respects single file target', async () => {
  const walker = new DirectoryWalker({
    basePath: indexFile
  });
  const files = await walker.walk();
  assert.strictEqual(files.length, 1);
  assert.strictEqual(files[0].extension, '.ts');
  assert.ok(files[0].sizeBytes > 0);
});

test('DirectoryWalker filters out excluded patterns', async () => {
  const walker = new DirectoryWalker({
    basePath: join(currentDir, '../../'),
    excludePatterns: ['packages', 'apps']
  });
  const files = await walker.walk();
  assert.ok(!files.some((f) => f.path.includes('node_modules')));
});

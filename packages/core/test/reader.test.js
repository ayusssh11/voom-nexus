import test from 'node:test';
import assert from 'node:assert/strict';
import { SafeFileReader } from '../dist/index.js';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { writeFile, unlink } from 'node:fs/promises';

const currentDir = dirname(fileURLToPath(import.meta.url));
const indexFile = join(currentDir, '../src/index.ts');

test('SafeFileReader reads valid UTF-8 text file', async () => {
  const result = await SafeFileReader.readTextFile(indexFile);
  assert.strictEqual(result.success, true);
  assert.strictEqual(result.isBinary, false);
  assert.ok(result.content.includes('export * from'));
});

test('SafeFileReader detects binary files with null bytes', async () => {
  const tempBinaryPath = join(currentDir, 'test_binary.tmp');
  const binaryBuffer = Buffer.from([0x48, 0x65, 0x6c, 0x6c, 0x6f, 0x00, 0x57, 0x6f, 0x72, 0x6c, 0x64]);
  await writeFile(tempBinaryPath, binaryBuffer);

  try {
    const result = await SafeFileReader.readTextFile(tempBinaryPath);
    assert.strictEqual(result.success, false);
    assert.strictEqual(result.isBinary, true);
    assert.ok(result.errorMessage?.includes('Binary file detected'));
  } finally {
    await unlink(tempBinaryPath);
  }
});

test('SafeFileReader handles non-existent file gracefully', async () => {
  const result = await SafeFileReader.readTextFile(join(currentDir, 'non_existent_file.xyz'));
  assert.strictEqual(result.success, false);
  assert.strictEqual(result.isBinary, false);
  assert.ok(result.errorMessage);
});

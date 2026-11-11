import test from 'node:test';
import assert from 'node:assert/strict';
import { SafeArchiveExtractor } from '../dist/index.js';

test('SafeArchiveExtractor allows safe relative paths within limits', () => {
  const extractor = new SafeArchiveExtractor({
    maxTotalBytes: 1024 * 1024,
    maxFileCount: 10
  });

  const entries = [
    { path: 'src/index.js', sizeBytes: 150, content: 'console.log("hello");' },
    { path: 'package.json', sizeBytes: 80, content: '{"name":"demo"}' }
  ];

  const result = extractor.validateEntries('/tmp/sandbox_test_dest', entries);
  assert.strictEqual(result.safeEntries.length, 2);
  assert.strictEqual(result.totalBytes, 230);
  assert.ok(result.safeEntries[0].path.endsWith('src/index.js'));
});

test('SafeArchiveExtractor detects and blocks Zip Slip (CWE-22) directory traversal', () => {
  const extractor = new SafeArchiveExtractor();

  const maliciousEntries = [
    { path: 'safe.txt', sizeBytes: 10, content: 'safe' },
    { path: '../../../../etc/shadow', sizeBytes: 20, content: 'root:x:0:0' }
  ];

  assert.throws(
    () => {
      extractor.validateEntries('/tmp/sandbox_test_dest', maliciousEntries);
    },
    {
      name: 'Error',
      message: /Zip Slip path traversal detected/
    }
  );
});

test('SafeArchiveExtractor detects and blocks absolute path entries', () => {
  const extractor = new SafeArchiveExtractor();

  const absoluteEntries = [
    { path: '/etc/passwd', sizeBytes: 50, content: 'root:x:0:0' }
  ];

  assert.throws(
    () => {
      extractor.validateEntries('/tmp/sandbox_test_dest', absoluteEntries);
    },
    {
      name: 'Error',
      message: /Zip Slip path traversal detected/
    }
  );
});

test('SafeArchiveExtractor blocks decompression bombs exceeding total byte threshold', () => {
  const extractor = new SafeArchiveExtractor({
    maxTotalBytes: 500
  });

  const bombEntries = [
    { path: 'huge.txt', sizeBytes: 1000, content: 'bomb' }
  ];

  assert.throws(
    () => {
      extractor.validateEntries('/tmp/sandbox_test_dest', bombEntries);
    },
    {
      name: 'Error',
      message: /Decompression bomb limit exceeded/
    }
  );
});

test('SafeArchiveExtractor blocks archives exceeding maximum file count', () => {
  const extractor = new SafeArchiveExtractor({
    maxFileCount: 2
  });

  const entries = [
    { path: 'f1.txt', sizeBytes: 1, content: '1' },
    { path: 'f2.txt', sizeBytes: 1, content: '2' },
    { path: 'f3.txt', sizeBytes: 1, content: '3' }
  ];

  assert.throws(
    () => {
      extractor.validateEntries('/tmp/sandbox_test_dest', entries);
    },
    {
      name: 'Error',
      message: /Archive exceeds maximum file count limit/
    }
  );
});


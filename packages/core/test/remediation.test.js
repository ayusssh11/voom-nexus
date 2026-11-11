import test from 'node:test';
import assert from 'node:assert/strict';
import { AutoFixer } from '../dist/index.js';
import { writeFile, readFile, mkdir, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

test('AutoFixer identifies fixable vs non-fixable security issues', () => {
  const fixer = new AutoFixer();

  assert.strictEqual(
    fixer.canFix({
      id: 'f1',
      ruleId: 'SEC-JS-004',
      title: 'Weak Hash',
      severity: 'HIGH',
      confidence: 'CERTAIN',
      cwe: 'CWE-327',
      owasp: 'A02',
      file: 'test.js',
      line: 1,
      snippet: "const hash = crypto.createHash('md5');",
      remediation: 'Use SHA-256'
    }),
    true
  );

  assert.strictEqual(
    fixer.canFix({
      id: 'f2',
      ruleId: 'SEC-JS-001',
      title: 'SQL Injection',
      severity: 'CRITICAL',
      confidence: 'CERTAIN',
      cwe: 'CWE-89',
      owasp: 'A03',
      file: 'test.js',
      line: 1,
      snippet: 'SELECT * FROM users WHERE id = ' + 1,
      remediation: 'Use parameterized queries'
    }),
    false
  );
});

test('AutoFixer dryRun returns simulated patches without altering file content', async () => {
  const testDir = join(tmpdir(), `voom_remed_dry_${Date.now()}`);
  await mkdir(testDir, { recursive: true });
  const testFile = join(testDir, 'sample.js');

  const initialContent = "const hash = crypto.createHash('md5');\nconsole.log(hash);\n";
  await writeFile(testFile, initialContent, 'utf-8');

  const fixer = new AutoFixer();
  const issue = {
    id: 'f_md5',
    ruleId: 'SEC-JS-004',
    title: 'Weak Hash',
    severity: 'HIGH',
    confidence: 'CERTAIN',
    cwe: 'CWE-327',
    owasp: 'A02',
    file: testFile,
    line: 1,
    snippet: "const hash = crypto.createHash('md5');",
    remediation: 'Use SHA-256'
  };

  const result = await fixer.applyFixes([issue], true); // dryRun = true
  assert.strictEqual(result.appliedCount, 1);
  assert.strictEqual(result.patches.length, 1);
  assert.strictEqual(result.patches[0].applied, false);
  assert.strictEqual(result.patches[0].replacementText, "const hash = crypto.createHash('sha256');");

  // File should NOT have changed on disk
  const diskContent = await readFile(testFile, 'utf-8');
  assert.strictEqual(diskContent, initialContent);

  await rm(testDir, { recursive: true, force: true });
});

test('AutoFixer applies live code fixes and updates file on disk', async () => {
  const testDir = join(tmpdir(), `voom_remed_live_${Date.now()}`);
  await mkdir(testDir, { recursive: true });
  const testFile = join(testDir, 'vuln.js');

  const initialContent = [
    "const hash = crypto.createHash('md5');",
    'function checkPassword(pass) {',
    '  if (pass.length < 6) return false;',
    '  return true;',
    '}'
  ].join('\n');

  await writeFile(testFile, initialContent, 'utf-8');

  const fixer = new AutoFixer();
  const issues = [
    {
      id: 'f_hash',
      ruleId: 'SEC-JS-004',
      title: 'Weak Hash',
      severity: 'HIGH',
      confidence: 'CERTAIN',
      cwe: 'CWE-327',
      owasp: 'A02',
      file: testFile,
      line: 1,
      snippet: "const hash = crypto.createHash('md5');",
      remediation: 'Use SHA-256'
    },
    {
      id: 'f_pass',
      ruleId: 'SEC-JS-012',
      title: 'Weak Password Policy',
      severity: 'HIGH',
      confidence: 'CERTAIN',
      cwe: 'CWE-521',
      owasp: 'A07',
      file: testFile,
      line: 3,
      snippet: 'if (pass.length < 6) return false;',
      remediation: 'Enforce >= 12 chars'
    }
  ];

  const result = await fixer.applyFixes(issues, false); // dryRun = false
  assert.strictEqual(result.appliedCount, 2);
  assert.strictEqual(result.patches.every((p) => p.applied), true);

  const updatedContent = await readFile(testFile, 'utf-8');
  assert.ok(updatedContent.includes("createHash('sha256')"));
  assert.ok(updatedContent.includes('pass.length < 12'));

  await rm(testDir, { recursive: true, force: true });
});

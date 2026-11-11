import test from 'node:test';
import assert from 'node:assert/strict';
import { DependencyAuditor } from '../dist/index.js';
import { writeFile, mkdir, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

test('DependencyAuditor detects vulnerable dependencies in package-lock.json', async () => {
  const testDir = join(tmpdir(), `voom_audit_vuln_${Date.now()}`);
  await mkdir(testDir, { recursive: true });

  const mockLock = {
    name: 'test-project',
    version: '1.0.0',
    lockfileVersion: 2,
    packages: {
      '': { name: 'test-project', version: '1.0.0' },
      'node_modules/lodash': {
        version: '4.17.15' // Known vulnerable prototype pollution
      },
      'node_modules/axios': {
        version: '0.20.0' // Known vulnerable SSRF
      },
      'node_modules/safe-pkg': {
        version: '2.0.0'
      }
    }
  };

  await writeFile(join(testDir, 'package-lock.json'), JSON.stringify(mockLock), 'utf-8');

  const auditor = new DependencyAuditor();
  const report = await auditor.auditDirectory(testDir);

  assert.strictEqual(report.vulnerableCount, 2);
  assert.strictEqual(report.issues.length, 2);

  const lodashIssue = report.issues.find((i) => i.title.includes('lodash'));
  assert.ok(lodashIssue);
  assert.strictEqual(lodashIssue.severity, 'HIGH');
  assert.strictEqual(lodashIssue.cwe, 'CWE-1321');
  assert.strictEqual(lodashIssue.ruleId, 'SEC-DEP-001');

  const axiosIssue = report.issues.find((i) => i.title.includes('axios'));
  assert.ok(axiosIssue);
  assert.strictEqual(axiosIssue.cwe, 'CWE-918');

  await rm(testDir, { recursive: true, force: true });
});

test('DependencyAuditor reports 0 issues for up-to-date dependencies', async () => {
  const testDir = join(tmpdir(), `voom_audit_clean_${Date.now()}`);
  await mkdir(testDir, { recursive: true });

  const cleanLock = {
    name: 'clean-project',
    packages: {
      'node_modules/lodash': { version: '4.17.21' },
      'node_modules/axios': { version: '1.6.8' }
    }
  };

  await writeFile(join(testDir, 'package-lock.json'), JSON.stringify(cleanLock), 'utf-8');

  const auditor = new DependencyAuditor();
  const report = await auditor.auditDirectory(testDir);

  assert.strictEqual(report.vulnerableCount, 0);
  assert.strictEqual(report.issues.length, 0);

  await rm(testDir, { recursive: true, force: true });
});

test('DependencyAuditor falls back to package.json when lockfile is absent', async () => {
  const testDir = join(tmpdir(), `voom_audit_pkg_${Date.now()}`);
  await mkdir(testDir, { recursive: true });

  const mockPkg = {
    dependencies: {
      'event-stream': '3.3.6'
    }
  };

  await writeFile(join(testDir, 'package.json'), JSON.stringify(mockPkg), 'utf-8');

  const auditor = new DependencyAuditor();
  const report = await auditor.auditDirectory(testDir);

  assert.strictEqual(report.vulnerableCount, 1);
  assert.strictEqual(report.issues[0].severity, 'CRITICAL');
  assert.ok(report.issues[0].title.includes('event-stream'));

  await rm(testDir, { recursive: true, force: true });
});

test('DependencyAuditor handles directories without manifest gracefully', async () => {
  const testDir = join(tmpdir(), `voom_audit_empty_${Date.now()}`);
  await mkdir(testDir, { recursive: true });

  const auditor = new DependencyAuditor();
  const report = await auditor.auditDirectory(testDir);

  assert.strictEqual(report.scannedDependencies, 0);
  assert.strictEqual(report.vulnerableCount, 0);

  await rm(testDir, { recursive: true, force: true });
});

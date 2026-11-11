import test from 'node:test';
import assert from 'node:assert/strict';
import {
  JsonReportFormatter,
  SarifReportFormatter,
  TerminalReportFormatter,
  MarkdownReportFormatter
} from '../dist/index.js';

const mockScanResult = {
  scanId: 'test-scan-123',
  targetPath: './src',
  timestamp: '2026-11-11T20:00:00Z',
  metrics: {
    totalFiles: 10,
    scannedFiles: 10,
    skippedFiles: 0,
    totalIssues: 1,
    criticalCount: 1,
    highCount: 0,
    mediumCount: 0,
    lowCount: 0,
    infoCount: 0,
    durationMs: 120
  },
  issues: [
    {
      id: 'issue-1',
      ruleId: 'SEC-JS-001',
      title: 'SQL Injection',
      severity: 'CRITICAL',
      confidence: 'CERTAIN',
      cwe: 'CWE-89',
      owasp: 'A03:2021-Injection',
      file: 'src/user.ts',
      line: 42,
      snippet: 'db.query(`SELECT * FROM users WHERE id = ${id}`)',
      remediation: 'Use parameterized queries instead.'
    }
  ]
};

test('JsonReportFormatter outputs valid JSON', () => {
  const formatter = new JsonReportFormatter();
  const output = formatter.format(mockScanResult);
  const parsed = JSON.parse(output);
  assert.strictEqual(parsed.scanId, 'test-scan-123');
  assert.strictEqual(parsed.issues.length, 1);
});

test('SarifReportFormatter outputs valid SARIF 2.1.0', () => {
  const formatter = new SarifReportFormatter();
  const output = formatter.format(mockScanResult);
  const parsed = JSON.parse(output);
  assert.strictEqual(parsed.version, '2.1.0');
  assert.strictEqual(parsed.runs[0].results.length, 1);
  assert.strictEqual(parsed.runs[0].results[0].ruleId, 'SEC-JS-001');
  assert.strictEqual(parsed.runs[0].results[0].level, 'error');
});

test('TerminalReportFormatter includes severity and rule ID', () => {
  const formatter = new TerminalReportFormatter();
  const output = formatter.format(mockScanResult);
  assert.ok(output.includes('VOOM NEXUS'));
  assert.ok(output.includes('[CRITICAL] SQL Injection (SEC-JS-001)'));
});

test('MarkdownReportFormatter outputs GFM table and code block', () => {
  const formatter = new MarkdownReportFormatter();
  const output = formatter.format(mockScanResult);
  assert.ok(output.includes('# Voom Nexus Security Scan Report'));
  assert.ok(output.includes('| **CRITICAL** | `SEC-JS-001` |'));
  assert.ok(output.includes('```javascript'));
});

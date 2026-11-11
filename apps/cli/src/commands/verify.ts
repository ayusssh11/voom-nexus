import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { ScanOrchestrator } from '@voom-nexus/core';
import { ScanResult, SecurityIssue } from '@voom-nexus/shared';

export interface VerifyOptions {
  path?: string;
  baselinePath?: string;
  strict?: boolean;
}

export async function runVerify(options: VerifyOptions = {}): Promise<number> {
  const targetPath = resolve(options.path || '.');
  const baselineFile = resolve(options.baselinePath || '.voomsec/baseline.json');

  console.log('====================================================');
  console.log('       VOOM NEXUS — BASELINE VERIFICATION           ');
  console.log('====================================================');
  console.log(`Target:   ${targetPath}`);
  console.log(`Baseline: ${baselineFile}\n`);

  let baseline: ScanResult;
  try {
    const raw = await readFile(baselineFile, 'utf-8');
    baseline = JSON.parse(raw);
  } catch {
    console.error(`[ERROR] Baseline file not found: ${baselineFile}`);
    console.log('Create a baseline first by running:');
    console.log('  vibesec scan --baseline .voomsec/baseline.json\n');
    return 1;
  }

  // Run fresh scan
  const orchestrator = new ScanOrchestrator();
  const current = await orchestrator.scanPath(targetPath);

  // Compare baseline issues with current issues
  // Unique signature: ruleId + file + snippet
  const baselineMap = new Map<string, SecurityIssue>();
  for (const issue of baseline.issues) {
    const key = `${issue.ruleId}:${issue.file}:${issue.snippet}`;
    baselineMap.set(key, issue);
  }

  const currentMap = new Map<string, SecurityIssue>();
  for (const issue of current.issues) {
    const key = `${issue.ruleId}:${issue.file}:${issue.snippet}`;
    currentMap.set(key, issue);
  }

  const newIssues: SecurityIssue[] = [];
  const persistentIssues: SecurityIssue[] = [];
  const resolvedIssues: SecurityIssue[] = [];

  for (const [key, issue] of currentMap.entries()) {
    if (baselineMap.has(key)) {
      persistentIssues.push(issue);
    } else {
      newIssues.push(issue);
    }
  }

  for (const [key, issue] of baselineMap.entries()) {
    if (!currentMap.has(key)) {
      resolvedIssues.push(issue);
    }
  }

  // Print Verification Results
  console.log('----------------------------------------------------');
  console.log('VERIFICATION SUMMARY');
  console.log('----------------------------------------------------');
  console.log(`- Resolved Issues:    ${resolvedIssues.length} (fixed since baseline)`);
  console.log(`- Persistent Issues:  ${persistentIssues.length} (still present)`);
  console.log(`- New Issues:         ${newIssues.length} (introduced since baseline)`);
  console.log('----------------------------------------------------\n');

  if (resolvedIssues.length > 0) {
    console.log('🎉 RESOLVED VULNERABILITIES:');
    for (const res of resolvedIssues) {
      console.log(`  ✓ [RESOLVED] ${res.title} (${res.ruleId}) in ${res.file}`);
    }
    console.log();
  }

  if (newIssues.length > 0) {
    console.log('🚨 NEW VULNERABILITIES INTRODUCED:');
    for (const n of newIssues) {
      console.log(`  ✗ [NEW - ${n.severity}] ${n.title} (${n.ruleId}) at ${n.file}:${n.line}`);
    }
    console.log();
    console.error('Verification failed: New vulnerabilities were introduced since baseline.\n');
    return 1;
  }

  if (persistentIssues.length > 0 && options.strict) {
    console.error('Verification failed: Strict mode active and persistent vulnerabilities remain.\n');
    return 1;
  }

  console.log('✓ Verification passed! No new security regressions detected.\n');
  return 0;
}


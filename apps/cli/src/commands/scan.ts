import { resolve, dirname } from 'node:path';
import { writeFile, mkdir } from 'node:fs/promises';
import { ScanOrchestrator, AutoFixer } from '@voom-nexus/core';
import {
  TerminalReportFormatter,
  JsonReportFormatter,
  SarifReportFormatter,
  MarkdownReportFormatter
} from '@voom-nexus/reporting';
import { Severity } from '@voom-nexus/shared';
import { loadConfig } from '@voom-nexus/config';

export interface CliScanOptions {
  path?: string;
  format?: 'text' | 'json' | 'sarif' | 'markdown';
  severity?: string[];
  output?: string;
  threshold?: string;
  baseline?: string;
  fix?: boolean;
  dryRun?: boolean;
}

export async function runScan(options: CliScanOptions = {}): Promise<number> {
  const targetPath = resolve(options.path || '.');
  const config = await loadConfig(targetPath);

  // Apply severity filters if provided
  if (options.severity && options.severity.length > 0) {
    const uppercaseSeverities = options.severity.map((s) => s.toUpperCase()) as Severity[];
    config.scan.severity = uppercaseSeverities;
  }

  const orchestrator = new ScanOrchestrator(config);
  const result = await orchestrator.scanPath(targetPath);

  // Automated Remediation (--fix / --dry-run)
  if (options.fix) {
    const fixer = new AutoFixer();
    const fixResult = await fixer.applyFixes(result.issues, options.dryRun);

    console.log('\n====================================================');
    console.log(`  VOOM NEXUS — AUTOMATED REMEDIATION ${options.dryRun ? '(DRY-RUN)' : ''}`);
    console.log('====================================================');
    console.log(`- Fixable Issues Detected: ${fixResult.totalFixable}`);
    console.log(`- Patches ${options.dryRun ? 'Simulated' : 'Applied'}:    ${fixResult.appliedCount}`);
    console.log(`- Skipped / Manual Review: ${fixResult.skippedCount}\n`);

    for (const patch of fixResult.patches) {
      console.log(`[${patch.ruleId}] ${patch.file}:${patch.line}`);
      console.log(`  Description: ${patch.description}`);
      console.log(`  - Original:    ${patch.originalText}`);
      console.log(`  + Replacement: ${patch.replacementText}\n`);
    }

    if (!options.dryRun && fixResult.appliedCount > 0) {
      console.log(`✓ Applied ${fixResult.appliedCount} security patches to disk.`);
      console.log('  Run "vibesec scan" again to verify remaining findings.\n');
    }
  }

  // Format selection
  const format = options.format || config.reporting.format || 'text';
  let formattedOutput = '';

  switch (format) {
    case 'json': {
      const formatter = new JsonReportFormatter();
      formattedOutput = formatter.format(result);
      break;
    }
    case 'sarif': {
      const formatter = new SarifReportFormatter();
      formattedOutput = formatter.format(result);
      break;
    }
    case 'markdown': {
      const formatter = new MarkdownReportFormatter();
      formattedOutput = formatter.format(result);
      break;
    }
    case 'text':
    default: {
      const formatter = new TerminalReportFormatter();
      formattedOutput = formatter.format(result);
      break;
    }
  }

  // Handle output destination
  if (options.output) {
    const outputPath = resolve(options.output);
    await mkdir(dirname(outputPath), { recursive: true });
    await writeFile(outputPath, formattedOutput, 'utf-8');
    console.log(`Scan report successfully written to: ${outputPath}`);
  } else {
    console.log(formattedOutput);
  }

  // Handle saving as baseline
  if (options.baseline) {
    const baselinePath = resolve(options.baseline);
    await mkdir(dirname(baselinePath), { recursive: true });
    await writeFile(baselinePath, JSON.stringify(result, null, 2), 'utf-8');
    console.log(`\nBaseline snapshot saved to: ${baselinePath}`);
  }

  // Threshold evaluation
  const threshold = (options.threshold?.toUpperCase() || config.scan.threshold || 'HIGH') as Severity;
  const shouldFail = evaluateThreshold(result, threshold);

  return shouldFail ? 1 : 0;
}

function evaluateThreshold(result: any, threshold: Severity): boolean {
  switch (threshold) {
    case 'CRITICAL':
      return result.metrics.criticalCount > 0;
    case 'HIGH':
      return result.metrics.criticalCount > 0 || result.metrics.highCount > 0;
    case 'MEDIUM':
      return (
        result.metrics.criticalCount > 0 ||
        result.metrics.highCount > 0 ||
        result.metrics.mediumCount > 0
      );
    case 'LOW':
    default:
      return result.metrics.totalIssues > 0;
  }
}


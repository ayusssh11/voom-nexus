import { resolve, dirname } from 'node:path';
import { writeFile, mkdir } from 'node:fs/promises';
import { DependencyAuditor } from '@voom-nexus/core';
import {
  TerminalReportFormatter,
  JsonReportFormatter,
  SarifReportFormatter,
  MarkdownReportFormatter
} from '@voom-nexus/reporting';
import { ScanResult, Severity } from '@voom-nexus/shared';
import { randomUUID } from 'node:crypto';

export interface CliAuditOptions {
  path?: string;
  format?: 'text' | 'json' | 'sarif' | 'markdown';
  output?: string;
  threshold?: string;
}

export async function runAudit(options: CliAuditOptions = {}): Promise<number> {
  const targetPath = resolve(options.path || '.');
  const auditor = new DependencyAuditor();

  console.log('====================================================');
  console.log('       VOOM NEXUS — SUPPLY CHAIN AUDIT              ');
  console.log('====================================================');
  console.log(`Target: ${targetPath}\n`);

  const auditReport = await auditor.auditDirectory(targetPath);

  // Convert to ScanResult format for standardized reporting
  const criticalCount = auditReport.issues.filter((i) => i.severity === 'CRITICAL').length;
  const highCount = auditReport.issues.filter((i) => i.severity === 'HIGH').length;
  const mediumCount = auditReport.issues.filter((i) => i.severity === 'MEDIUM').length;
  const lowCount = auditReport.issues.filter((i) => i.severity === 'LOW').length;

  const scanResult: ScanResult = {
    scanId: `audit_${randomUUID().slice(0, 8)}`,
    targetPath,
    timestamp: new Date().toISOString(),
    metrics: {
      totalFiles: 1,
      scannedFiles: 1,
      skippedFiles: 0,
      totalIssues: auditReport.issues.length,
      criticalCount,
      highCount,
      mediumCount,
      lowCount,
      infoCount: 0,
      durationMs: 10
    },
    issues: auditReport.issues
  };

  const format = options.format || 'text';
  let formattedOutput = '';

  switch (format) {
    case 'json': {
      const formatter = new JsonReportFormatter();
      formattedOutput = formatter.format(scanResult);
      break;
    }
    case 'sarif': {
      const formatter = new SarifReportFormatter();
      formattedOutput = formatter.format(scanResult);
      break;
    }
    case 'markdown': {
      const formatter = new MarkdownReportFormatter();
      formattedOutput = formatter.format(scanResult);
      break;
    }
    case 'text':
    default: {
      const formatter = new TerminalReportFormatter();
      formattedOutput = formatter.format(scanResult);
      break;
    }
  }

  if (options.output) {
    const outputPath = resolve(options.output);
    await mkdir(dirname(outputPath), { recursive: true });
    await writeFile(outputPath, formattedOutput, 'utf-8');
    console.log(`Audit report written to: ${outputPath}`);
  } else {
    console.log(formattedOutput);
  }

  const threshold = (options.threshold?.toUpperCase() || 'HIGH') as Severity;
  const shouldFail = evaluateAuditThreshold(scanResult, threshold);

  return shouldFail ? 1 : 0;
}

function evaluateAuditThreshold(result: ScanResult, threshold: Severity): boolean {
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


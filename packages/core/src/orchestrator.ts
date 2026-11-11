import { readdir, readFile, stat } from 'node:fs/promises';
import { join, extname, relative } from 'node:path';
import { randomUUID } from 'node:crypto';
import {
  ScanResult,
  SecurityIssue,
  ScanMetrics,
  redactSecrets,
  logger
} from '@voom-nexus/shared';
import { VoomConfig, DEFAULT_CONFIG } from '@voom-nexus/config';
import { defaultRuleRegistry } from '@voom-nexus/rules';
import { defaultAdapterRegistry } from '@voom-nexus/parsers';

export interface ScanOptions {
  path?: string;
  config?: VoomConfig;
  onProgress?: (scanned: number, total: number) => void;
}

export class ScanOrchestrator {
  private config: VoomConfig;

  constructor(config: VoomConfig = DEFAULT_CONFIG) {
    this.config = config;
  }

  async scanPath(targetPath: string): Promise<ScanResult> {
    const startTime = Date.now();
    logger.info(`Starting security scan of target: ${targetPath}`);

    const filesToScan: string[] = [];
    await this.collectFiles(targetPath, filesToScan);

    const issues: SecurityIssue[] = [];
    let scannedCount = 0;

    for (const file of filesToScan) {
      const fileIssues = await this.scanSingleFile(file, targetPath);
      issues.push(...fileIssues);
      scannedCount++;
    }

    const durationMs = Date.now() - startTime;
    const metrics = this.calculateMetrics(filesToScan.length, scannedCount, issues, durationMs);

    return {
      scanId: randomUUID(),
      targetPath,
      timestamp: new Date().toISOString(),
      metrics,
      issues
    };
  }

  private async collectFiles(targetPath: string, fileList: string[]): Promise<void> {
    try {
      const fileStat = await stat(targetPath);
      if (fileStat.isFile()) {
        fileList.push(targetPath);
        return;
      }
    } catch {
      return;
    }

    let entries;
    try {
      entries = await readdir(targetPath, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      const fullPath = join(targetPath, entry.name);

      if (entry.isDirectory()) {
        if (this.isExcluded(entry.name)) {
          continue;
        }
        await this.collectFiles(fullPath, fileList);
      } else if (entry.isFile()) {
        const adapter = defaultAdapterRegistry.getAdapterForFile(entry.name);
        if (adapter) {
          fileList.push(fullPath);
        }
      }
    }
  }

  private isExcluded(name: string): boolean {
    const defaultIgnores = ['node_modules', '.git', 'dist', 'build', 'coverage', '.next'];
    return defaultIgnores.includes(name);
  }

  private async scanSingleFile(filePath: string, rootPath: string): Promise<SecurityIssue[]> {
    const relativePath = relative(rootPath, filePath) || filePath;
    let content: string;
    try {
      content = await readFile(filePath, 'utf-8');
    } catch {
      return [];
    }

    const issues: SecurityIssue[] = [];
    const lines = content.split('\n');

    // Basic heuristic rules check for initialization
    for (let i = 0; i < lines.length; i++) {
      const lineText = lines[i];
      const lineNum = i + 1;

      // Sample check 1: SQL Injection
      if (/SELECT\s+.*\s+FROM\s+.*WHERE\s+.*['"`]\s*\+\s*|`SELECT\s+.*WHERE\s+.*\$\{/i.test(lineText)) {
        issues.push({
          id: randomUUID(),
          ruleId: 'SEC-JS-001',
          title: 'SQL Injection via String Concatenation',
          severity: 'CRITICAL',
          confidence: 'CERTAIN',
          cwe: 'CWE-89',
          owasp: 'A03:2021-Injection',
          file: relativePath,
          line: lineNum,
          snippet: redactSecrets(lineText.trim()),
          remediation: 'Use parameterized queries or prepared statements.'
        });
      }

      // Sample check 2: Hardcoded secrets
      if (/["'](?:api[_-]?key|secret|password)["']\s*[:=]\s*["'][^"']{8,}["']/i.test(lineText)) {
        issues.push({
          id: randomUUID(),
          ruleId: 'SEC-GEN-001',
          title: 'Hardcoded Secret or API Key Exposure',
          severity: 'CRITICAL',
          confidence: 'CERTAIN',
          cwe: 'CWE-798',
          owasp: 'A07:2021-Identification and Authentication Failures',
          file: relativePath,
          line: lineNum,
          snippet: redactSecrets(lineText.trim()),
          remediation: 'Extract credentials into environment variables.'
        });
      }
    }

    return issues;
  }

  private calculateMetrics(
    totalFiles: number,
    scannedFiles: number,
    issues: SecurityIssue[],
    durationMs: number
  ): ScanMetrics {
    let criticalCount = 0;
    let highCount = 0;
    let mediumCount = 0;
    let lowCount = 0;
    let infoCount = 0;

    for (const issue of issues) {
      switch (issue.severity) {
        case 'CRITICAL':
          criticalCount++;
          break;
        case 'HIGH':
          highCount++;
          break;
        case 'MEDIUM':
          mediumCount++;
          break;
        case 'LOW':
          lowCount++;
          break;
        case 'INFORMATIONAL':
          infoCount++;
          break;
      }
    }

    return {
      totalFiles,
      scannedFiles,
      skippedFiles: Math.max(0, totalFiles - scannedFiles),
      totalIssues: issues.length,
      criticalCount,
      highCount,
      mediumCount,
      lowCount,
      infoCount,
      durationMs
    };
  }
}

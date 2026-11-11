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
import { DirectoryWalker, FileEntry } from './walker.js';
import { SafeFileReader } from './reader.js';

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

    // 1. Traverse directory using DirectoryWalker
    const walker = new DirectoryWalker({
      basePath: targetPath,
      excludePatterns: this.config.scan.exclude,
      maxFileSizeBytes: 2 * 1024 * 1024 // 2 MB limit
    });

    const fileEntries: FileEntry[] = await walker.walk();
    logger.debug(`Discovered ${fileEntries.length} candidate files for scanning`);

    const issues: SecurityIssue[] = [];
    let scannedCount = 0;
    let skippedCount = 0;

    // 2. Process each file with safe reader and timeout protection
    for (const entry of fileEntries) {
      try {
        const fileIssues = await this.scanWithTimeout(entry.path, targetPath, this.config.scan.timeoutMs);
        if (fileIssues === null) {
          skippedCount++;
        } else {
          issues.push(...fileIssues);
          scannedCount++;
        }
      } catch (err) {
        logger.warn(`Scan error on file ${entry.relativePath}: ${err}`);
        skippedCount++;
      }
    }

    const durationMs = Date.now() - startTime;
    const metrics = this.calculateMetrics(fileEntries.length, scannedCount, skippedCount, issues, durationMs);

    return {
      scanId: randomUUID(),
      targetPath,
      timestamp: new Date().toISOString(),
      metrics,
      issues
    };
  }

  /**
   * Executes single file scanning with timeout protection
   */
  private async scanWithTimeout(
    filePath: string,
    rootPath: string,
    timeoutMs: number
  ): Promise<SecurityIssue[] | null> {
    return new Promise((resolve) => {
      let isSettled = false;

      const timer = setTimeout(() => {
        if (!isSettled) {
          isSettled = true;
          logger.warn(`Scan timed out for file (${timeoutMs}ms limit): ${filePath}`);
          resolve(null);
        }
      }, timeoutMs);

      this.scanSingleFile(filePath, rootPath)
        .then((result) => {
          if (!isSettled) {
            isSettled = true;
            clearTimeout(timer);
            resolve(result);
          }
        })
        .catch((err) => {
          if (!isSettled) {
            isSettled = true;
            clearTimeout(timer);
            logger.warn(`Error scanning file ${filePath}: ${err}`);
            resolve(null);
          }
        });
    });
  }

  private async scanSingleFile(filePath: string, rootPath: string): Promise<SecurityIssue[] | null> {
    // Read file safely
    const readResult = await SafeFileReader.readTextFile(filePath);
    if (!readResult.success || readResult.isBinary) {
      logger.debug(`Skipping file (binary or unreadable): ${filePath}`);
      return null;
    }

    const adapter = defaultAdapterRegistry.getAdapterForFile(filePath);
    if (!adapter) {
      return null;
    }

    const parseResult = await adapter.parse(filePath, readResult.content);
    const issues: SecurityIssue[] = [];
    const relativePath = entryRelative(rootPath, filePath);

    // Get all applicable rules for this language
    const applicableRules = defaultRuleRegistry.getFiltered({
      severity: this.config.scan.severity,
      disabledRules: this.config.rules.disable,
      languages: [adapter.name]
    });

    const context = {
      filePath,
      lines: parseResult.lines,
      content: parseResult.rawContent,
      language: adapter.name
    };

    // Execute each rule
    for (const rule of applicableRules) {
      const findings = rule.evaluate(context);

      for (const finding of findings) {
        const lineIdx = finding.line - 1;

        // Check for inline suppression: e.g. // voomsec-ignore-next-line <RULE-ID>
        if (lineIdx > 0) {
          const prevLine = parseResult.lines[lineIdx - 1];
          if (
            prevLine.includes('voomsec-ignore-next-line') &&
            (prevLine.includes(rule.id) || !prevLine.includes('SEC-'))
          ) {
            continue;
          }
        }

        issues.push({
          id: randomUUID(),
          ruleId: rule.id,
          title: rule.title,
          severity: rule.severity,
          confidence: finding.confidence || rule.confidence,
          cwe: rule.cwe,
          owasp: rule.owasp,
          file: relativePath,
          line: finding.line,
          column: finding.column,
          snippet: redactSecrets(finding.snippet),
          remediation: finding.remediation || rule.remediation
        });
      }
    }

    return issues;
  }

  private calculateMetrics(
    totalFiles: number,
    scannedFiles: number,
    skippedFiles: number,
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
      skippedFiles,
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

function entryRelative(root: string, file: string): string {
  const rel = file.startsWith(root) ? file.slice(root.length).replace(/^[/\\]+/, '') : file;
  return rel || file;
}

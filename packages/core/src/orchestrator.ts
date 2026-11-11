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

    // Evaluate rules on lines
    for (let i = 0; i < parseResult.lines.length; i++) {
      const lineText = parseResult.lines[i];
      const lineNum = i + 1;

      // Check for inline suppression: e.g. // voomsec-ignore-next-line
      if (i > 0 && parseResult.lines[i - 1].includes('voomsec-ignore-next-line')) {
        continue;
      }

      // Detection 1: SQL Injection
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

      // Detection 2: Hardcoded Secrets
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

      // Detection 3: Command Injection via child_process
      if (/\b(?:exec|execSync)\s*\(\s*`[^`]*\$\{/i.test(lineText)) {
        issues.push({
          id: randomUUID(),
          ruleId: 'SEC-JS-003',
          title: 'Command Injection via Child Process Execution',
          severity: 'CRITICAL',
          confidence: 'CERTAIN',
          cwe: 'CWE-78',
          owasp: 'A03:2021-Injection',
          file: relativePath,
          line: lineNum,
          snippet: redactSecrets(lineText.trim()),
          remediation: 'Use execFile() with discrete argument arrays instead of shell concatenation.'
        });
      }

      // Detection 4: Weak Cryptography (MD5/SHA1)
      if (/createHash\s*\(\s*["'](?:md5|sha1)["']\s*\)/i.test(lineText)) {
        issues.push({
          id: randomUUID(),
          ruleId: 'SEC-JS-004',
          title: 'Weak Cryptographic Hash Function (MD5/SHA1)',
          severity: 'HIGH',
          confidence: 'CERTAIN',
          cwe: 'CWE-327',
          owasp: 'A02:2021-Cryptographic Failures',
          file: relativePath,
          line: lineNum,
          snippet: redactSecrets(lineText.trim()),
          remediation: 'Replace MD5/SHA-1 with SHA-256 or Argon2id for password hashing.'
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

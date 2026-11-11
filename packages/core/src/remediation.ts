import { readFile, writeFile } from 'node:fs/promises';
import { SecurityIssue, logger } from '@voom-nexus/shared';

export interface FixPatch {
  ruleId: string;
  file: string;
  line: number;
  originalText: string;
  replacementText: string;
  description: string;
  applied: boolean;
  error?: string;
}

export interface FixResult {
  totalFixable: number;
  appliedCount: number;
  skippedCount: number;
  patches: FixPatch[];
}

export class AutoFixer {
  /**
   * Evaluates if a given security issue has an automated safe remediation recipe.
   */
  canFix(issue: SecurityIssue): boolean {
    return this.getFixForIssue(issue) !== null;
  }

  /**
   * Generates a patch recipe for an issue if supported.
   */
  getFixForIssue(issue: SecurityIssue): { original: string | RegExp; replacement: string; description: string } | null {
    switch (issue.ruleId) {
      case 'SEC-JS-004': // Weak MD5/SHA1
        if (/createHash\s*\(\s*['"](?:md5|sha1)['"]\s*\)/i.test(issue.snippet)) {
          return {
            original: /createHash\s*\(\s*['"](?:md5|sha1)['"]\s*\)/i,
            replacement: "createHash('sha256')",
            description: 'Upgraded weak hash algorithm to SHA-256'
          };
        }
        break;

      case 'SEC-JS-010': // Insecure Math.random for security tokens
        if (/Math\.random\s*\(\s*\)/.test(issue.snippet)) {
          return {
            original: /Math\.random\s*\(\s*\)/,
            replacement: "crypto.randomBytes(16).toString('hex')",
            description: 'Replaced insecure Math.random with cryptographically secure crypto.randomBytes'
          };
        }
        break;

      case 'SEC-JS-012': // Weak password policy length < 8
        if (/\.length\s*<\s*[4-7]\b/.test(issue.snippet)) {
          return {
            original: /\.length\s*<\s*[4-7]\b/,
            replacement: '.length < 12',
            description: 'Enforced minimum 12-character password policy requirement'
          };
        }
        break;

      case 'SEC-JS-009': // CORS wildcard
        if (/origin\s*:\s*['"]\*['"]/.test(issue.snippet)) {
          return {
            original: /origin\s*:\s*['"]\*['"]/,
            replacement: "origin: process.env.ALLOWED_ORIGINS?.split(',') || ['https://yourdomain.com']",
            description: 'Replaced permissive wildcard CORS origin with environment-configured whitelist'
          };
        }
        break;
    }
    return null;
  }

  /**
   * Applies automated fixes to target files.
   * If dryRun is true, calculates patches without modifying files on disk.
   */
  async applyFixes(issues: SecurityIssue[], dryRun = false): Promise<FixResult> {
    const patches: FixPatch[] = [];
    const fileIssuesMap = new Map<string, SecurityIssue[]>();

    for (const issue of issues) {
      if (!this.canFix(issue)) continue;
      const list = fileIssuesMap.get(issue.file) || [];
      list.push(issue);
      fileIssuesMap.set(issue.file, list);
    }

    let appliedCount = 0;
    let skippedCount = 0;

    for (const [filePath, fileIssues] of fileIssuesMap.entries()) {
      try {
        const fileContent = await readFile(filePath, 'utf-8');
        const lines = fileContent.split(/\r?\n/);
        let modified = false;

        for (const issue of fileIssues) {
          const fix = this.getFixForIssue(issue);
          if (!fix) {
            skippedCount++;
            continue;
          }

          const lineIdx = issue.line - 1;
          if (lineIdx >= 0 && lineIdx < lines.length) {
            const currentLine = lines[lineIdx];
            if (fix.original instanceof RegExp ? fix.original.test(currentLine) : currentLine.includes(fix.original)) {
              const newLine = currentLine.replace(fix.original, fix.replacement);
              lines[lineIdx] = newLine;
              modified = true;
              appliedCount++;

              patches.push({
                ruleId: issue.ruleId,
                file: filePath,
                line: issue.line,
                originalText: currentLine.trim(),
                replacementText: newLine.trim(),
                description: fix.description,
                applied: !dryRun
              });
            } else {
              skippedCount++;
            }
          } else {
            skippedCount++;
          }
        }

        if (modified && !dryRun) {
          await writeFile(filePath, lines.join('\n'), 'utf-8');
          logger.info(`Successfully applied automated security fixes to ${filePath}`);
        }
      } catch (err: any) {
        logger.error(`Failed to apply fixes to ${filePath}:`, err);
        patches.push({
          ruleId: 'REMEDIATION_ERROR',
          file: filePath,
          line: 0,
          originalText: '',
          replacementText: '',
          description: `Failed to read or write file: ${err.message}`,
          applied: false,
          error: err.message
        });
        skippedCount += fileIssues.length;
      }
    }

    return {
      totalFixable: appliedCount + skippedCount,
      appliedCount,
      skippedCount,
      patches
    };
  }
}


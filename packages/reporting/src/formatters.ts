import { ScanResult, SecurityIssue } from '@voom-nexus/shared';

export interface ReportFormatter {
  format(result: ScanResult): string;
}

export class JsonReportFormatter implements ReportFormatter {
  format(result: ScanResult): string {
    return JSON.stringify(result, null, 2);
  }
}

export class SarifReportFormatter implements ReportFormatter {
  format(result: ScanResult): string {
    const sarifOutput = {
      $schema: 'https://raw.githubusercontent.com/oasis-tcs/sarif-spec/master/Schemata/sarif-schema-2.1.0.json',
      version: '2.1.0',
      runs: [
        {
          tool: {
            driver: {
              name: 'Voom Nexus (Vibe Security)',
              version: '0.1.0-alpha.0',
              informationUri: 'https://github.com/voom-nexus/voom-nexus',
              rules: this.extractSarifRules(result.issues)
            }
          },
          results: result.issues.map((issue) => ({
            ruleId: issue.ruleId,
            level: this.mapSeverityToSarifLevel(issue.severity),
            message: {
              text: issue.title
            },
            locations: [
              {
                physicalLocation: {
                  artifactLocation: {
                    uri: issue.file
                  },
                  region: {
                    startLine: issue.line,
                    startColumn: issue.column || 1
                  }
                }
              }
            ]
          }))
        }
      ]
    };
    return JSON.stringify(sarifOutput, null, 2);
  }

  private mapSeverityToSarifLevel(severity: string): 'error' | 'warning' | 'note' {
    switch (severity) {
      case 'CRITICAL':
      case 'HIGH':
        return 'error';
      case 'MEDIUM':
        return 'warning';
      default:
        return 'note';
    }
  }

  private extractSarifRules(issues: SecurityIssue[]) {
    const seen = new Set<string>();
    const rules = [];
    for (const issue of issues) {
      if (!seen.has(issue.ruleId)) {
        seen.add(issue.ruleId);
        rules.push({
          id: issue.ruleId,
          shortDescription: { text: issue.title },
          help: { text: issue.remediation },
          properties: {
            cwe: issue.cwe,
            owasp: issue.owasp
          }
        });
      }
    }
    return rules;
  }
}

export class TerminalReportFormatter implements ReportFormatter {
  format(result: ScanResult): string {
    const lines: string[] = [];
    lines.push('====================================================');
    lines.push('       VOOM NEXUS — SECURITY SCAN REPORT           ');
    lines.push('====================================================');
    lines.push(`Target Path:   ${result.targetPath}`);
    lines.push(`Timestamp:     ${result.timestamp}`);
    lines.push(`Files Scanned: ${result.metrics.scannedFiles} of ${result.metrics.totalFiles}`);
    lines.push(`Duration:      ${result.metrics.durationMs}ms`);
    lines.push('----------------------------------------------------');
    lines.push(
      `Issues Found:  ${result.metrics.totalIssues} ` +
      `(CRITICAL: ${result.metrics.criticalCount}, HIGH: ${result.metrics.highCount}, ` +
      `MEDIUM: ${result.metrics.mediumCount}, LOW: ${result.metrics.lowCount})`
    );
    lines.push('====================================================\n');

    for (const issue of result.issues) {
      lines.push(`[${issue.severity}] ${issue.title} (${issue.ruleId})`);
      lines.push(`  Location:    ${issue.file}:${issue.line}`);
      lines.push(`  Standard:    ${issue.cwe} | ${issue.owasp}`);
      lines.push(`  Snippet:     ${issue.snippet}`);
      lines.push(`  Remediation: ${issue.remediation}\n`);
    }

    return lines.join('\n');
  }
}

#!/usr/bin/env node

import process from 'node:process';
import { resolve } from 'node:path';
import { ScanOrchestrator } from '@voom-nexus/core';
import { TerminalReportFormatter, JsonReportFormatter, SarifReportFormatter } from '@voom-nexus/reporting';
import { defaultRuleRegistry } from '@voom-nexus/rules';
import { logger } from '@voom-nexus/shared';

const VERSION = '0.1.0-alpha.0';

export async function runCli(args: string[] = process.argv.slice(2)): Promise<number> {
  const command = args[0] || 'help';

  switch (command) {
    case 'version':
    case '--version':
    case '-v': {
      console.log(`Voom Nexus (Vibe Security Tool) v${VERSION}`);
      return 0;
    }

    case 'rules': {
      console.log('Registered Voom Nexus Security Rules:\n');
      for (const rule of defaultRuleRegistry.getAll()) {
        console.log(`- [${rule.severity}] ${rule.id}: ${rule.title} (${rule.cwe} / ${rule.owasp})`);
      }
      return 0;
    }

    case 'scan': {
      const targetPath = resolve(args[1] || '.');
      const formatIdx = args.indexOf('--format');
      const format = formatIdx !== -1 && args[formatIdx + 1] ? args[formatIdx + 1] : 'text';

      const orchestrator = new ScanOrchestrator();
      const result = await orchestrator.scanPath(targetPath);

      if (format === 'json') {
        const formatter = new JsonReportFormatter();
        console.log(formatter.format(result));
      } else if (format === 'sarif') {
        const formatter = new SarifReportFormatter();
        console.log(formatter.format(result));
      } else {
        const formatter = new TerminalReportFormatter();
        console.log(formatter.format(result));
      }

      // Exit 1 if critical/high issues detected
      if (result.metrics.criticalCount > 0 || result.metrics.highCount > 0) {
        return 1;
      }
      return 0;
    }

    case 'help':
    case '--help':
    case '-h':
    default: {
      console.log(`
Voom Nexus — Vibe Security Tool (v${VERSION})

Usage:
  vibesec <command> [options]

Commands:
  scan [path]        Scan source code directory for security vulnerabilities
  rules              Display all registered security rules and taxonomy
  version            Display CLI version
  help               Show this help message

Options:
  --format <type>    Output format: text, json, sarif (default: text)
  --severity <level> Filter by severity threshold
  --output <file>    Save report to file
`);
      return 0;
    }
  }
}

// Direct execution check
const isMain = process.argv[1]?.endsWith('dist/index.js') || process.argv[1]?.endsWith('bin/vibesec');
if (isMain) {
  runCli().then((code) => {
    process.exit(code);
  }).catch((err) => {
    logger.error('Fatal CLI execution error:', err);
    process.exit(2);
  });
}

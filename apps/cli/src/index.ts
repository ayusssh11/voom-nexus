#!/usr/bin/env node

import process from 'node:process';
import { runScan, CliScanOptions } from './commands/scan.js';
import { runVerify, VerifyOptions } from './commands/verify.js';
import { runInit, InitOptions } from './commands/init.js';
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
      const options: CliScanOptions = {};
      const target = args[1] && !args[1].startsWith('-') ? args[1] : '.';
      options.path = target;

      for (let i = 1; i < args.length; i++) {
        if (args[i] === '--format' && args[i + 1]) {
          options.format = args[i + 1] as any;
          i++;
        } else if (args[i] === '--output' && args[i + 1]) {
          options.output = args[i + 1];
          i++;
        } else if (args[i] === '--threshold' && args[i + 1]) {
          options.threshold = args[i + 1];
          i++;
        } else if (args[i] === '--baseline' && args[i + 1]) {
          options.baseline = args[i + 1];
          i++;
        } else if (args[i] === '--severity' && args[i + 1]) {
          options.severity = args[i + 1].split(',').map((s) => s.trim());
          i++;
        } else if (args[i] === '--fix') {
          options.fix = true;
        } else if (args[i] === '--dry-run') {
          options.dryRun = true;
        }
      }

      return runScan(options);
    }

    case 'verify': {
      const options: VerifyOptions = {};
      const target = args[1] && !args[1].startsWith('-') ? args[1] : '.';
      options.path = target;

      for (let i = 1; i < args.length; i++) {
        if (args[i] === '--baseline' && args[i + 1]) {
          options.baselinePath = args[i + 1];
          i++;
        } else if (args[i] === '--strict') {
          options.strict = true;
        }
      }

      return runVerify(options);
    }

    case 'init': {
      const options: InitOptions = {};
      let targetDir = process.cwd();
      for (let i = 1; i < args.length; i++) {
        if (!args[i].startsWith('-')) {
          targetDir = args[i];
        } else if (args[i] === '--ai' && args[i + 1]) {
          options.ai = args[i + 1].split(',').map((s) => s.trim());
          i++;
        } else if (args[i] === '--force') {
          options.force = true;
        }
      }

      return runInit(options, targetDir);
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
  verify [path]      Verify current findings against a baseline snapshot
  init               Initialize project configuration and AI security rules
  rules              Display all registered security rules and taxonomy
  version            Display CLI version
  help               Show this help message

Options for "scan":
  --format <type>    Output format: text, json, sarif, markdown (default: text)
  --severity <list>  Filter by severity (e.g. critical,high)
  --threshold <lvl>  Exit with code 1 if issues >= threshold (default: high)
  --output <file>    Save formatted report to file
  --baseline <file>  Save scan findings as baseline snapshot JSON
  --fix              Automatically remediate high-confidence vulnerabilities
  --dry-run          Simulate remediation patches without writing to disk

Options for "verify":
  --baseline <file>  Path to baseline JSON (default: .voomsec/baseline.json)
  --strict           Fail if any persistent vulnerabilities remain

Options for "init":
  --ai <assistants>  Comma-separated list (e.g. cursor,claude,copilot,all)
  --force            Overwrite existing configuration and rules
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

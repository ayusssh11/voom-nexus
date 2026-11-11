import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { VoomConfig, DEFAULT_CONFIG } from './schema.js';
import { logger } from '@voom-nexus/shared';

const CONFIG_FILENAMES = [
  '.voomsecrc.json',
  'voom-nexus.config.json'
];

export async function loadConfig(searchDir: string = process.cwd()): Promise<VoomConfig> {
  for (const filename of CONFIG_FILENAMES) {
    const fullPath = join(searchDir, filename);
    try {
      const raw = await readFile(fullPath, 'utf-8');
      const parsed = JSON.parse(raw);
      logger.debug(`Loaded configuration from ${fullPath}`);
      return mergeWithDefaults(parsed);
    } catch {
      // Configuration file not found or invalid; continue searching
    }
  }

  logger.debug('No configuration file found; using secure defaults');
  return DEFAULT_CONFIG;
}

export function mergeWithDefaults(custom: Partial<VoomConfig>): VoomConfig {
  return {
    version: custom.version || DEFAULT_CONFIG.version,
    scan: {
      paths: custom.scan?.paths || DEFAULT_CONFIG.scan.paths,
      exclude: custom.scan?.exclude || DEFAULT_CONFIG.scan.exclude,
      severity: custom.scan?.severity || DEFAULT_CONFIG.scan.severity,
      confidence: custom.scan?.confidence || DEFAULT_CONFIG.scan.confidence,
      threshold: custom.scan?.threshold || DEFAULT_CONFIG.scan.threshold,
      timeoutMs: custom.scan?.timeoutMs || DEFAULT_CONFIG.scan.timeoutMs
    },
    rules: {
      disable: custom.rules?.disable || DEFAULT_CONFIG.rules.disable,
      overrides: custom.rules?.overrides || DEFAULT_CONFIG.rules.overrides
    },
    reporting: {
      format: custom.reporting?.format || DEFAULT_CONFIG.reporting.format,
      output: custom.reporting?.output,
      redactSecrets: custom.reporting?.redactSecrets ?? DEFAULT_CONFIG.reporting.redactSecrets,
      showRemediation: custom.reporting?.showRemediation ?? DEFAULT_CONFIG.reporting.showRemediation
    }
  };
}


import { Severity, Confidence, DEFAULT_EXCLUDES } from '@voom-nexus/shared';

export interface VoomScanConfig {
  paths: string[];
  exclude: string[];
  severity: Severity[];
  confidence: Confidence[];
  threshold: Severity;
  timeoutMs: number;
}

export interface VoomRulesConfig {
  disable: string[];
  overrides: Record<string, { severity?: Severity }>;
}

export interface VoomReportingConfig {
  format: 'text' | 'json' | 'sarif' | 'markdown';
  output?: string;
  redactSecrets: boolean;
  showRemediation: boolean;
}

export interface VoomConfig {
  version: string;
  scan: VoomScanConfig;
  rules: VoomRulesConfig;
  reporting: VoomReportingConfig;
}

export const DEFAULT_CONFIG: VoomConfig = {
  version: '1.0',
  scan: {
    paths: ['.'],
    exclude: [...DEFAULT_EXCLUDES],
    severity: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'],
    confidence: ['CERTAIN', 'FIRM'],
    threshold: 'HIGH',
    timeoutMs: 500
  },
  rules: {
    disable: [],
    overrides: {}
  },
  reporting: {
    format: 'text',
    redactSecrets: true,
    showRemediation: true
  }
};


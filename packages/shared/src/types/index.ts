export type Severity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFORMATIONAL';

export type Confidence = 'CERTAIN' | 'FIRM' | 'TENTATIVE';

export type FindingStatus = 'OPEN' | 'FIXED' | 'FALSE_POSITIVE' | 'IGNORED';

export interface SecurityIssue {
  id: string;
  ruleId: string;
  title: string;
  severity: Severity;
  confidence: Confidence;
  cwe: string;
  owasp: string;
  file: string;
  line: number;
  endLine?: number;
  column?: number;
  endColumn?: number;
  snippet: string;
  remediation: string;
  status?: FindingStatus;
}

export interface ScanMetrics {
  totalFiles: number;
  scannedFiles: number;
  skippedFiles: number;
  totalIssues: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  infoCount: number;
  durationMs: number;
}

export interface ScanResult {
  scanId: string;
  targetPath: string;
  timestamp: string;
  metrics: ScanMetrics;
  issues: SecurityIssue[];
}

export interface SecurityRule {
  id: string;
  title: string;
  description: string;
  severity: Severity;
  confidence: Confidence;
  cwe: string;
  owasp: string;
  languages: string[];
  version: string;
}


export const OWASP_TOP_10_2021 = {
  A01: 'A01:2021-Broken Access Control',
  A02: 'A02:2021-Cryptographic Failures',
  A03: 'A03:2021-Injection',
  A04: 'A04:2021-Insecure Design',
  A05: 'A05:2021-Security Misconfiguration',
  A06: 'A06:2021-Vulnerable and Outdated Components',
  A07: 'A07:2021-Identification and Authentication Failures',
  A08: 'A08:2021-Software and Data Integrity Failures',
  A09: 'A09:2021-Security Logging and Monitoring Failures',
  A10: 'A10:2021-Server-Side Request Forgery'
} as const;

export const DEFAULT_EXCLUDES = [
  '**/node_modules/**',
  '**/dist/**',
  '**/build/**',
  '**/.git/**',
  '**/coverage/**',
  '**/.next/**',
  '**/.nuxt/**',
  '**/vendor/**',
  '**/__pycache__/**',
  '**/.venv/**'
] as const;

export const SEVERITY_LEVELS = [
  'CRITICAL',
  'HIGH',
  'MEDIUM',
  'LOW',
  'INFORMATIONAL'
] as const;


import { SecurityRule, OWASP_TOP_10_2021 } from '@voom-nexus/shared';
import { defaultRuleRegistry } from './registry.js';

export const INITIAL_RULES: SecurityRule[] = [
  {
    id: 'SEC-JS-001',
    title: 'SQL Injection via String Concatenation',
    description: 'Dynamic concatenation of untrusted input into database query strings can allow attackers to execute arbitrary SQL commands.',
    severity: 'CRITICAL',
    confidence: 'CERTAIN',
    cwe: 'CWE-89',
    owasp: OWASP_TOP_10_2021.A03,
    languages: ['javascript', 'typescript'],
    version: '1.0.0'
  },
  {
    id: 'SEC-JS-002',
    title: 'Cross-Site Scripting (XSS) via Unencoded HTML Output',
    description: 'Directly rendering user-controlled inputs into HTML templates or response bodies without contextual escaping allows client-side script execution.',
    severity: 'HIGH',
    confidence: 'FIRM',
    cwe: 'CWE-79',
    owasp: OWASP_TOP_10_2021.A03,
    languages: ['javascript', 'typescript'],
    version: '1.0.0'
  },
  {
    id: 'SEC-GEN-001',
    title: 'Hardcoded Secret or API Key Exposure',
    description: 'Hardcoded credentials, API keys, or private tokens committed to source code repositories can lead to total system compromise.',
    severity: 'CRITICAL',
    confidence: 'CERTAIN',
    cwe: 'CWE-798',
    owasp: OWASP_TOP_10_2021.A07,
    languages: ['javascript', 'typescript', 'python', 'generic'],
    version: '1.0.0'
  },
  {
    id: 'SEC-JS-003',
    title: 'Command Injection via Child Process Execution',
    description: 'Passing unsanitized user input to system shell execution commands (e.g. exec, spawn) allows remote code execution.',
    severity: 'CRITICAL',
    confidence: 'CERTAIN',
    cwe: 'CWE-78',
    owasp: OWASP_TOP_10_2021.A03,
    languages: ['javascript', 'typescript'],
    version: '1.0.0'
  },
  {
    id: 'SEC-JS-004',
    title: 'Weak Cryptographic Hash Function (MD5/SHA1)',
    description: 'Using obsolete hash functions like MD5 or SHA-1 for password hashing or integrity checks exposes data to collision attacks.',
    severity: 'HIGH',
    confidence: 'CERTAIN',
    cwe: 'CWE-327',
    owasp: OWASP_TOP_10_2021.A02,
    languages: ['javascript', 'typescript'],
    version: '1.0.0'
  }
];

// Register initial rules into default registry
for (const rule of INITIAL_RULES) {
  defaultRuleRegistry.register(rule);
}

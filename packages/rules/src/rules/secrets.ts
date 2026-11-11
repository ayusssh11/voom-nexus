import { OWASP_TOP_10_2021, redactSecrets } from '@voom-nexus/shared';
import { ExecutableSecurityRule, RuleContext, RuleFinding } from '../types.js';

export const hardcodedSecretsRule: ExecutableSecurityRule = {
  id: 'SEC-GEN-001',
  title: 'Hardcoded Secret or API Key Exposure',
  description: 'Hardcoded credentials, tokens, or passwords committed to source code repositories can be extracted by attackers to gain unauthorized access.',
  severity: 'CRITICAL',
  confidence: 'CERTAIN',
  cwe: 'CWE-798',
  owasp: OWASP_TOP_10_2021.A07,
  languages: ['javascript', 'typescript', 'python', 'generic'],
  version: '1.0.0',
  remediation: 'Extract credentials into environment variables or use a dedicated secrets manager (e.g. AWS Secrets Manager, Vault).',
  evaluate(context: RuleContext): RuleFinding[] {
    const findings: RuleFinding[] = [];
    const secretAssignment = /(["']?(?:api[_-]?key|secret|password|auth[_-]?token)["']?\s*[:=]\s*["'][^"']{8,}["'])/i;
    const tokenRegexes = [
      /\b(AKIA[0-9A-Z]{16})\b/,
      /\b(gh[pous]_[0-9a-zA-Z]{36})\b/,
      /\b(xox[baprs]-[0-9a-zA-Z]{10,48})\b/
    ];

    for (let i = 0; i < context.lines.length; i++) {
      const line = context.lines[i];
      // Ignore if line seems to be an env lookup
      if (/process\.env|os\.environ/i.test(line)) continue;

      if (secretAssignment.test(line) || tokenRegexes.some((re) => re.test(line))) {
        findings.push({
          line: i + 1,
          snippet: redactSecrets(line.trim())
        });
      }
    }
    return findings;
  }
};

export const privateKeyRule: ExecutableSecurityRule = {
  id: 'SEC-GEN-002',
  title: 'Hardcoded Private Cryptographic Key',
  description: 'Private RSA, EC, or OpenSSH keys embedded in code allow attackers to forge cryptographic signatures or decrypt sensitive traffic.',
  severity: 'CRITICAL',
  confidence: 'CERTAIN',
  cwe: 'CWE-798',
  owasp: OWASP_TOP_10_2021.A07,
  languages: ['javascript', 'typescript', 'python', 'generic'],
  version: '1.0.0',
  remediation: 'Never commit private keys to version control; load private keys securely from filesystem or key management service at runtime.',
  evaluate(context: RuleContext): RuleFinding[] {
    const findings: RuleFinding[] = [];
    const keyHeaderPattern = /-----BEGIN\s+(?:RSA\s+|EC\s+|DSA\s+|OPENSSH\s+)?PRIVATE\s+KEY-----/i;

    for (let i = 0; i < context.lines.length; i++) {
      const line = context.lines[i];
      if (keyHeaderPattern.test(line)) {
        findings.push({
          line: i + 1,
          snippet: '-----BEGIN PRIVATE KEY----- [REDACTED]'
        });
      }
    }
    return findings;
  }
};


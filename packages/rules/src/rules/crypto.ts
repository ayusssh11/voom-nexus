import { OWASP_TOP_10_2021 } from '@voom-nexus/shared';
import { ExecutableSecurityRule, RuleContext, RuleFinding } from '../types.js';

export const weakHashRule: ExecutableSecurityRule = {
  id: 'SEC-JS-004',
  title: 'Weak Cryptographic Hash Function (MD5/SHA1)',
  description: 'MD5 and SHA-1 have known collision weaknesses and must not be used for cryptographic integrity or password hashing.',
  severity: 'HIGH',
  confidence: 'CERTAIN',
  cwe: 'CWE-327',
  owasp: OWASP_TOP_10_2021.A02,
  languages: ['javascript', 'typescript'],
  version: '1.0.0',
  remediation: 'Use SHA-256 / SHA-512 for checksums, or Argon2id / bcrypt for password hashing.',
  evaluate(context: RuleContext): RuleFinding[] {
    const findings: RuleFinding[] = [];
    const weakHashPattern = /createHash\s*\(\s*["'](?:md5|sha1)["']\s*\)/i;

    for (let i = 0; i < context.lines.length; i++) {
      const line = context.lines[i];
      if (weakHashPattern.test(line)) {
        findings.push({
          line: i + 1,
          snippet: line.trim()
        });
      }
    }
    return findings;
  }
};

export const insecureRandomnessRule: ExecutableSecurityRule = {
  id: 'SEC-JS-010',
  title: 'Insecure Pseudo-Random Number Generation (Math.random)',
  description: 'Math.random() produces cryptographically predictable pseudo-random values. It must not be used for security-sensitive tokens, passwords, or keys.',
  severity: 'MEDIUM',
  confidence: 'FIRM',
  cwe: 'CWE-338',
  owasp: OWASP_TOP_10_2021.A04,
  languages: ['javascript', 'typescript'],
  version: '1.0.0',
  remediation: 'Use crypto.randomBytes() or crypto.getRandomValues() for cryptographic randomness.',
  evaluate(context: RuleContext): RuleFinding[] {
    const findings: RuleFinding[] = [];
    const tokenPattern = /(?:token|session|secret|auth|nonce|csrf|key|salt|iv)\b.*Math\.random\s*\(/i;
    const directPattern = /Math\.random\s*\(\s*\).*(?:toString\s*\(\s*36\s*\)|token|secret|key)/i;

    for (let i = 0; i < context.lines.length; i++) {
      const line = context.lines[i];
      if (tokenPattern.test(line) || directPattern.test(line)) {
        findings.push({
          line: i + 1,
          snippet: line.trim()
        });
      }
    }
    return findings;
  }
};


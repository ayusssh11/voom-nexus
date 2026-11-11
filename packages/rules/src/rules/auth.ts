import { OWASP_TOP_10_2021 } from '@voom-nexus/shared';
import { ExecutableSecurityRule, RuleContext, RuleFinding } from '../types.js';

export const insecureDeserializationRule: ExecutableSecurityRule = {
  id: 'SEC-JS-008',
  title: 'Insecure Deserialization via node-serialize / unserialize',
  description: 'Deserializing untrusted data with packages like node-serialize or js-yaml (without safeLoad) can allow attackers to execute arbitrary code via object payloads with IIFE function expressions.',
  severity: 'CRITICAL',
  confidence: 'CERTAIN',
  cwe: 'CWE-502',
  owasp: OWASP_TOP_10_2021.A08,
  languages: ['javascript', 'typescript'],
  version: '1.0.0',
  remediation: 'Do not deserialize untrusted data into object instances; use standard JSON.parse() or schema-validated data formats.',
  evaluate(context: RuleContext): RuleFinding[] {
    const findings: RuleFinding[] = [];
    const desPattern = /(?:\bunserialize\s*\(|serialize\.unserialize\s*\(|\byaml\.load\s*\()/i;

    for (let i = 0; i < context.lines.length; i++) {
      const line = context.lines[i];
      if (desPattern.test(line)) {
        findings.push({
          line: i + 1,
          snippet: line.trim()
        });
      }
    }
    return findings;
  }
};

export const logExposureRule: ExecutableSecurityRule = {
  id: 'SEC-JS-011',
  title: 'Sensitive Information Exposure in Application Logs',
  description: 'Writing sensitive values like passwords, tokens, API keys, or credit cards to application logs (stdout/stderr) leads to credential harvesting and compliance violations.',
  severity: 'MEDIUM',
  confidence: 'FIRM',
  cwe: 'CWE-532',
  owasp: OWASP_TOP_10_2021.A09,
  languages: ['javascript', 'typescript'],
  version: '1.0.0',
  remediation: 'Redact or sanitize sensitive variables prior to logging; use structured loggers with automated masking.',
  evaluate(context: RuleContext): RuleFinding[] {
    const findings: RuleFinding[] = [];
    const logPattern = /(?:console\.(?:log|debug|info|warn|error)|logger\.(?:info|debug))\s*\(\s*[^)]*\b(?:password|secret|apiKey|token|credential|ssn|authHeader)\b/i;

    for (let i = 0; i < context.lines.length; i++) {
      const line = context.lines[i];
      if (logPattern.test(line)) {
        findings.push({
          line: i + 1,
          snippet: line.trim()
        });
      }
    }
    return findings;
  }
};

export const weakPasswordPolicyRule: ExecutableSecurityRule = {
  id: 'SEC-JS-012',
  title: 'Weak Password Validation Policy',
  description: 'Allowing passwords with fewer than 8 characters or lacking minimum complexity increases vulnerability to brute-force and dictionary attacks.',
  severity: 'HIGH',
  confidence: 'FIRM',
  cwe: 'CWE-521',
  owasp: OWASP_TOP_10_2021.A07,
  languages: ['javascript', 'typescript'],
  version: '1.0.0',
  remediation: 'Enforce a minimum password length of at least 8 characters (NIST recommends >= 12) along with password strength checks.',
  evaluate(context: RuleContext): RuleFinding[] {
    const findings: RuleFinding[] = [];
    const weakLengthPattern = /(?:password|pass)\.length\s*<\s*([1-7])\b/i;

    for (let i = 0; i < context.lines.length; i++) {
      const line = context.lines[i];
      if (weakLengthPattern.test(line)) {
        findings.push({
          line: i + 1,
          snippet: line.trim()
        });
      }
    }
    return findings;
  }
};

export const prototypePollutionRule: ExecutableSecurityRule = {
  id: 'SEC-JS-013',
  title: 'Prototype Pollution via Unsafe Property Assignment',
  description: 'Modifying __proto__ or constructor.prototype properties dynamically can pollute base Object prototypes and lead to denial of service or remote code execution.',
  severity: 'HIGH',
  confidence: 'FIRM',
  cwe: 'CWE-1321',
  owasp: OWASP_TOP_10_2021.A08,
  languages: ['javascript', 'typescript'],
  version: '1.0.0',
  remediation: 'Validate object keys against an allowlist, or use Object.create(null) and Map instead of plain object property mutations.',
  evaluate(context: RuleContext): RuleFinding[] {
    const findings: RuleFinding[] = [];
    const protoPattern = /(?:\[["']__proto__["']\]|\.__proto__\s*=|\.constructor\.prototype)/i;

    for (let i = 0; i < context.lines.length; i++) {
      const line = context.lines[i];
      if (protoPattern.test(line)) {
        findings.push({
          line: i + 1,
          snippet: line.trim()
        });
      }
    }
    return findings;
  }
};


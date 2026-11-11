import { OWASP_TOP_10_2021 } from '@voom-nexus/shared';
import { ExecutableSecurityRule, RuleContext, RuleFinding } from '../types.js';

export const sqlInjectionRule: ExecutableSecurityRule = {
  id: 'SEC-JS-001',
  title: 'SQL Injection via String Concatenation',
  description: 'Dynamic concatenation or template interpolation of untrusted values into database queries allows attackers to execute arbitrary SQL commands.',
  severity: 'CRITICAL',
  confidence: 'CERTAIN',
  cwe: 'CWE-89',
  owasp: OWASP_TOP_10_2021.A03,
  languages: ['javascript', 'typescript'],
  version: '1.0.0',
  remediation: 'Use parameterized queries, prepared statements, or an ORM with type-safe query binding.',
  evaluate(context: RuleContext): RuleFinding[] {
    const findings: RuleFinding[] = [];
    const sqlKeywords = /\b(?:SELECT|INSERT\s+INTO|UPDATE|DELETE\s+FROM|DROP\s+TABLE)\b/i;
    const dynamicPattern = /['"`]\s*\+\s*|`[^`]*\$\{/i;

    for (let i = 0; i < context.lines.length; i++) {
      const line = context.lines[i];
      if (sqlKeywords.test(line) && dynamicPattern.test(line)) {
        findings.push({
          line: i + 1,
          snippet: line.trim()
        });
      }
    }
    return findings;
  }
};

export const xssOutputRule: ExecutableSecurityRule = {
  id: 'SEC-JS-002',
  title: 'Cross-Site Scripting (XSS) via Unencoded HTML Output',
  description: 'Directly sending user input or interpolating variables into HTML templates or response bodies allows client-side script execution.',
  severity: 'HIGH',
  confidence: 'FIRM',
  cwe: 'CWE-79',
  owasp: OWASP_TOP_10_2021.A03,
  languages: ['javascript', 'typescript'],
  version: '1.0.0',
  remediation: 'Sanitize and HTML-encode user input or use templating engines with automatic contextual encoding.',
  evaluate(context: RuleContext): RuleFinding[] {
    const findings: RuleFinding[] = [];
    const xssPattern = /(?:res\.(?:send|write)\s*\(\s*`[^`]*<[^>]+>[^`]*\$\{|\binnerHTML\s*=\s*|\bdangerouslySetInnerHTML\s*=\s*\{)/i;

    for (let i = 0; i < context.lines.length; i++) {
      const line = context.lines[i];
      if (xssPattern.test(line)) {
        findings.push({
          line: i + 1,
          snippet: line.trim()
        });
      }
    }
    return findings;
  }
};

export const commandInjectionRule: ExecutableSecurityRule = {
  id: 'SEC-JS-003',
  title: 'Command Injection via Child Process Execution',
  description: 'Passing dynamically concatenated strings to system shell commands (e.g. exec, execSync) allows remote code execution.',
  severity: 'CRITICAL',
  confidence: 'CERTAIN',
  cwe: 'CWE-78',
  owasp: OWASP_TOP_10_2021.A03,
  languages: ['javascript', 'typescript'],
  version: '1.0.0',
  remediation: 'Use execFile() with discrete argument arrays or validate parameters against an allowlist.',
  evaluate(context: RuleContext): RuleFinding[] {
    const findings: RuleFinding[] = [];
    const cmdPattern = /\b(?:exec|execSync)\s*\(\s*(?:`[^`]*\$\{|["'][^"']*["']\s*\+)/i;

    for (let i = 0; i < context.lines.length; i++) {
      const line = context.lines[i];
      if (cmdPattern.test(line)) {
        findings.push({
          line: i + 1,
          snippet: line.trim()
        });
      }
    }
    return findings;
  }
};

export const unsafeEvalRule: ExecutableSecurityRule = {
  id: 'SEC-JS-006',
  title: 'Unsafe Code Execution via eval() or Dynamic Function',
  description: 'Executing strings as code using eval(), Function(), or setTimeout with string arguments can lead to complete server or browser compromise.',
  severity: 'CRITICAL',
  confidence: 'CERTAIN',
  cwe: 'CWE-95',
  owasp: OWASP_TOP_10_2021.A03,
  languages: ['javascript', 'typescript'],
  version: '1.0.0',
  remediation: 'Avoid eval() completely; use standard JSON.parse() or safe parsing libraries instead.',
  evaluate(context: RuleContext): RuleFinding[] {
    const findings: RuleFinding[] = [];
    const evalPattern = /(?:\beval\s*\(|\bnew\s+Function\s*\(|\bsetTimeout\s*\(\s*["'`])/i;

    for (let i = 0; i < context.lines.length; i++) {
      const line = context.lines[i];
      if (evalPattern.test(line)) {
        findings.push({
          line: i + 1,
          snippet: line.trim()
        });
      }
    }
    return findings;
  }
};

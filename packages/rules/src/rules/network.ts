import { OWASP_TOP_10_2021 } from '@voom-nexus/shared';
import { ExecutableSecurityRule, RuleContext, RuleFinding } from '../types.js';

export const ssrfRule: ExecutableSecurityRule = {
  id: 'SEC-JS-007',
  title: 'Server-Side Request Forgery (SSRF) via Dynamic HTTP Request',
  description: 'Fetching external URLs supplied directly by user input allows attackers to query internal network services or cloud metadata endpoints (e.g. 169.254.169.254).',
  severity: 'HIGH',
  confidence: 'FIRM',
  cwe: 'CWE-918',
  owasp: OWASP_TOP_10_2021.A10,
  languages: ['javascript', 'typescript'],
  version: '1.0.0',
  remediation: 'Validate target URLs against an explicit allowlist of permitted hostnames and protocols; block private and loopback IP ranges.',
  evaluate(context: RuleContext): RuleFinding[] {
    const findings: RuleFinding[] = [];
    const ssrfPattern = /(?:axios\.(?:get|post|put)|fetch|request|http\.get)\s*\(\s*(?:req\.(?:query|body|params)\.[a-zA-Z0-9_]+|`[^`]*\$\{req\.)/i;

    for (let i = 0; i < context.lines.length; i++) {
      const line = context.lines[i];
      if (ssrfPattern.test(line)) {
        findings.push({
          line: i + 1,
          snippet: line.trim()
        });
      }
    }
    return findings;
  }
};

export const corsWildcardRule: ExecutableSecurityRule = {
  id: 'SEC-JS-009',
  title: 'Permissive CORS Configuration (Wildcard Origin)',
  description: 'Allowing all external origins (origin: "*") in CORS settings can expose private API data to malicious third-party websites.',
  severity: 'MEDIUM',
  confidence: 'CERTAIN',
  cwe: 'CWE-942',
  owasp: OWASP_TOP_10_2021.A05,
  languages: ['javascript', 'typescript'],
  version: '1.0.0',
  remediation: 'Specify explicit, trusted origins rather than wildcard origins, particularly for authenticated endpoints.',
  evaluate(context: RuleContext): RuleFinding[] {
    const findings: RuleFinding[] = [];
    const corsPattern = /(?:cors\s*\(\s*\{\s*origin\s*:\s*["']\*["']|Access-Control-Allow-Origin["']\s*,\s*["']\*["'])/i;

    for (let i = 0; i < context.lines.length; i++) {
      const line = context.lines[i];
      if (corsPattern.test(line)) {
        findings.push({
          line: i + 1,
          snippet: line.trim()
        });
      }
    }
    return findings;
  }
};


import { OWASP_TOP_10_2021 } from '@voom-nexus/shared';
import { ExecutableSecurityRule, RuleContext, RuleFinding } from '../types.js';

export const pathTraversalRule: ExecutableSecurityRule = {
  id: 'SEC-JS-005',
  title: 'Path Traversal via Unsanitized File Access',
  description: 'Concatenating untrusted user input directly into file reading/writing methods without path normalization allows attackers to access arbitrary filesystem resources.',
  severity: 'CRITICAL',
  confidence: 'FIRM',
  cwe: 'CWE-22',
  owasp: OWASP_TOP_10_2021.A01,
  languages: ['javascript', 'typescript'],
  version: '1.0.0',
  remediation: 'Use path.resolve() and verify the resolved path starts with the intended root directory, or use path.basename().',
  evaluate(context: RuleContext): RuleFinding[] {
    const findings: RuleFinding[] = [];
    const pathPattern = /(?:fs\.(?:readFile|readFileSync|createReadStream|writeFile|writeFileSync)|res\.sendFile)\s*\(\s*(?:join\s*\(|`[^`]*\$\{|["'][^"']*["']\s*\+\s*(?:req\.|params|filename|filepath))/i;

    for (let i = 0; i < context.lines.length; i++) {
      const line = context.lines[i];
      if (pathPattern.test(line)) {
        findings.push({
          line: i + 1,
          snippet: line.trim()
        });
      }
    }
    return findings;
  }
};

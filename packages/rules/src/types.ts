import { SecurityRule, Confidence } from '@voom-nexus/shared';

export interface RuleContext {
  filePath: string;
  lines: string[];
  content: string;
  language: string;
}

export interface RuleFinding {
  line: number;
  column?: number;
  snippet: string;
  remediation?: string;
  confidence?: Confidence;
}

export interface ExecutableSecurityRule extends SecurityRule {
  remediation: string;
  evaluate(context: RuleContext): RuleFinding[];
}

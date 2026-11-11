import { Severity } from '@voom-nexus/shared';
import { ExecutableSecurityRule } from './types.js';
import {
  sqlInjectionRule,
  xssOutputRule,
  commandInjectionRule,
  unsafeEvalRule
} from './rules/injection.js';
import { weakHashRule, insecureRandomnessRule } from './rules/crypto.js';
import { pathTraversalRule } from './rules/filesystem.js';
import { ssrfRule, corsWildcardRule } from './rules/network.js';
import { hardcodedSecretsRule, privateKeyRule } from './rules/secrets.js';
import {
  insecureDeserializationRule,
  logExposureRule,
  weakPasswordPolicyRule,
  prototypePollutionRule
} from './rules/auth.js';

export interface RuleFilterOptions {
  severity?: Severity[];
  languages?: string[];
  disabledRules?: string[];
}

export class RuleRegistry {
  private rules: Map<string, ExecutableSecurityRule> = new Map();

  register(rule: ExecutableSecurityRule): void {
    if (this.rules.has(rule.id)) {
      throw new Error(`Rule with ID "${rule.id}" is already registered.`);
    }
    this.rules.set(rule.id, rule);
  }

  get(id: string): ExecutableSecurityRule | undefined {
    return this.rules.get(id);
  }

  getAll(): ExecutableSecurityRule[] {
    return Array.from(this.rules.values());
  }

  getFiltered(options: RuleFilterOptions = {}): ExecutableSecurityRule[] {
    return this.getAll().filter((rule) => {
      if (options.disabledRules && options.disabledRules.includes(rule.id)) {
        return false;
      }
      if (options.severity && options.severity.length > 0 && !options.severity.includes(rule.severity)) {
        return false;
      }
      if (options.languages && options.languages.length > 0) {
        const matchesLang = rule.languages.some((lang) => options.languages!.includes(lang) || lang === 'generic');
        if (!matchesLang) return false;
      }
      return true;
    });
  }

  getExecutableRulesForLanguage(language: string): ExecutableSecurityRule[] {
    return this.getAll().filter(
      (rule) => rule.languages.includes(language) || rule.languages.includes('generic')
    );
  }

  count(): number {
    return this.rules.size;
  }
}

export const defaultRuleRegistry = new RuleRegistry();

// All initial OWASP Top 10 rules
export const INITIAL_RULES: ExecutableSecurityRule[] = [
  sqlInjectionRule,
  xssOutputRule,
  commandInjectionRule,
  weakHashRule,
  pathTraversalRule,
  unsafeEvalRule,
  ssrfRule,
  insecureDeserializationRule,
  corsWildcardRule,
  insecureRandomnessRule,
  logExposureRule,
  weakPasswordPolicyRule,
  prototypePollutionRule,
  hardcodedSecretsRule,
  privateKeyRule
];

for (const rule of INITIAL_RULES) {
  defaultRuleRegistry.register(rule);
}

import { SecurityRule, Severity } from '@voom-nexus/shared';

export interface RuleFilterOptions {
  severity?: Severity[];
  languages?: string[];
  disabledRules?: string[];
}

export class RuleRegistry {
  private rules: Map<string, SecurityRule> = new Map();

  register(rule: SecurityRule): void {
    if (this.rules.has(rule.id)) {
      throw new Error(`Rule with ID "${rule.id}" is already registered.`);
    }
    this.rules.set(rule.id, rule);
  }

  get(id: string): SecurityRule | undefined {
    return this.rules.get(id);
  }

  getAll(): SecurityRule[] {
    return Array.from(this.rules.values());
  }

  getFiltered(options: RuleFilterOptions = {}): SecurityRule[] {
    return this.getAll().filter((rule) => {
      if (options.disabledRules && options.disabledRules.includes(rule.id)) {
        return false;
      }
      if (options.severity && options.severity.length > 0 && !options.severity.includes(rule.severity)) {
        return false;
      }
      if (options.languages && options.languages.length > 0) {
        const matchesLang = rule.languages.some((lang) => options.languages!.includes(lang));
        if (!matchesLang) return false;
      }
      return true;
    });
  }

  count(): number {
    return this.rules.size;
  }
}

export const defaultRuleRegistry = new RuleRegistry();


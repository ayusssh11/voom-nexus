# Security Rules Specification & Taxonomy
**Product**: Voom Nexus — Vibe Security Tool  
**Document Version**: 1.0.0  
**Status**: Specification Standard  

---

## 1. Rule Structure & Schema

All security detection rules implemented in `@voom-nexus/rules` must conform to the TypeScript interface `SecurityRule`:

```typescript
export interface SecurityRule {
  /** Unique rule identifier, formatted as SEC-<LANG>-<NUM> */
  id: string;
  
  /** Short, clear vulnerability title */
  title: string;
  
  /** Detailed technical explanation of the flaw and exploit mechanism */
  description: string;
  
  /** Default severity level */
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFORMATIONAL';
  
  /** Confidence rating of detection mechanics */
  confidence: 'CERTAIN' | 'FIRM' | 'TENTATIVE';
  
  /** Primary Common Weakness Enumeration ID */
  cwe: string; // e.g. "CWE-89"
  
  /** Primary OWASP Top 10 (2021) Category */
  owasp: string; // e.g. "A03:2021-Injection"
  
  /** Target programming languages or file types */
  languages: string[]; // e.g. ["javascript", "typescript"]
  
  /** Rule implementation version */
  version: string; // e.g. "1.0.0"
  
  /** Detection implementation: AST query or regex pattern */
  detection: RuleDetection;
  
  /** Actionable remediation guidance and code example */
  remediation: RuleRemediation;
}

export interface RuleRemediation {
  explanation: string;
  safeExample: string;
  unsafeExample: string;
  autoFixAvailable: boolean;
}
```

---

## 2. Rule ID Naming Conventions

Rule IDs must follow a standardized format:
```
SEC-<LANGUAGE_CODE>-<3_DIGIT_NUMBER>
```

### Language Codes
- `JS`: JavaScript & TypeScript
- `PY`: Python
- `JV`: Java & Kotlin
- `CS`: C# (.NET)
- `GO`: Go
- `PHP`: PHP
- `RB`: Ruby
- `RS`: Rust
- `GEN`: Generic / Polyglot (Secrets, Configs, Environment files)

*Examples*:
- `SEC-JS-001`: SQL Injection via dynamic template concatenation in JS/TS.
- `SEC-GEN-001`: Hardcoded AWS Access Key in any text file.
- `SEC-PY-002`: Unsafe `pickle.loads()` deserialization in Python.

---

## 3. Severity & Confidence Classifications

### 3.1 Severity Levels

| Severity | Criteria | Example |
| :--- | :--- | :--- |
| **`CRITICAL`** | Direct remote code execution, SQL injection, hardcoded credentials, unauthenticated privilege escalation. Immediate exploitation probable. | `eval()`, Unescaped SQL query, AWS secret key. |
| **`HIGH`** | High-impact vulnerability requiring specific conditions: Stored XSS, SSRF, Path Traversal, Broken Access Control. | Reflected user query in HTML without encoding. |
| **`MEDIUM`** | Cryptographic weakness, insecure CORS, missing rate limiting, sensitive data in logs, CSRF without defense. | Using MD5/SHA1 for password hashing, wildcard CORS. |
| **`LOW`** | Security misconfiguration, missing defense-in-depth headers, information disclosure via stack traces. | Missing `X-Content-Type-Options: nosniff`. |
| **`INFORMATIONAL`**| Code hygiene, deprecated dependencies, stylistic security recommendations. | Use of `var` instead of `const`, outdated comments. |

### 3.2 Confidence Levels

| Confidence | Description |
| :--- | :--- |
| **`CERTAIN`** | Direct, deterministic AST match with zero likelihood of false positive (e.g., direct call to `eval(variable)` or exact high-entropy regex match for GitHub token). |
| **`FIRM`** | Syntactic pattern strongly indicates vulnerability, but runtime sanitization or framework-level middleware may be present upstream. |
| **`TENTATIVE`** | Heuristic match on variable naming or generic pattern (e.g. variable named `password = "xyz"` in a test file). |

---

## 4. Detection Methodologies

1. **Abstract Syntax Tree (AST) Matching**:
   - Traverses parsed AST nodes (CallExpression, BinaryExpression, AssignmentExpression).
   - Verifies argument structures (e.g., checking if `mysql.query()` receives a `TemplateLiteral` containing expressions instead of a static string).
2. **Deterministic Regex Pattern Matching**:
   - Applied for high-entropy secrets, configuration directives, and plain-text configuration files (`.env`, `docker-compose.yml`).
   - Patterns must be linear and thoroughly audited against ReDoS attacks.

---

## 5. False-Positive Management & Suppression

Developers must be able to suppress deliberate or mitigated findings without disabling entire rules.

### Inline Suppression Comment Standards
```javascript
// voomsec-ignore-next-line SEC-JS-001
const query = `SELECT * FROM ${trustedTableName}`;

/* voomsec-ignore SEC-GEN-002: Intentional test mock token */
const MOCK_API_KEY = "test_key_abc123";
```

### File-Level Ignore
Developers can ignore entire files or paths via `.voomsecignore`:
```
# Ignore test fixtures
test/fixtures/**
*.spec.ts
```

---

## 6. Rule Testing Standards (Mandatory Fixtures)

Every rule PR must include two mandatory test fixture files under `packages/rules/test/fixtures/<RULE_ID>/`:

1. `positive.<ext>`: Must contain code snippets that **MUST trigger** the rule with expected line numbers.
2. `negative.<ext>`: Must contain equivalent safe implementations that **MUST NOT trigger** the rule, confirming false-positive resistance.

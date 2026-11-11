# Testing Strategy & Quality Assurance
**Product**: Voom Nexus — Vibe Security Tool  
**Document Version**: 1.0.0  
**Status**: Strategy Approved  

---

## 1. Testing Pyramid Overview

Quality and correctness are critical for security tooling. A flawed rule engine either produces alert fatigue (false positives) or fails to stop critical attacks (false negatives).

```
                 / \
                /   \
               / E2E \          CLI CLI/Web E2E Flows (5%)
              /-------\
             /  Integ  \        Core Pipeline & Multi-package Integration (25%)
            /-----------\
           /    Unit     \      Rule Assertions & Utility Unit Tests (70%)
          /---------------\
```

---

## 2. Test Tiers & Execution

### Tier 1: Unit Tests (Fast & Isolated)
- **Scope**: Testing individual helper functions, Zod schema validations, secret masking utilities, and isolated AST node visitor methods.
- **Tools**: Vitest / Node native test runner (`node:test`).
- **Target Execution Time**: < 1.5 seconds for complete unit suite.

### Tier 2: Rule Verification Tests (Positive & Negative Fixtures)
- **Scope**: Every single security rule is executed against both positive (vulnerable) and negative (safe) code fixtures.
- **Assertions**:
  - Positive fixture: Exact rule ID, severity, and line number must match expected metadata.
  - Negative fixture: Zero findings must be reported.
- **Coverage Requirement**: 100% of defined rules must possess positive and negative fixtures.

### Tier 3: Core Engine Integration Tests
- **Scope**: Testing `@voom-nexus/core` orchestrator end-to-end against real test directories:
  - File walker directory traversal and `.gitignore` compliance.
  - Concurrent parsing and scanning across multiple files.
  - Deduplication and severity filtering.
  - Correct formatting of JSON, SARIF, and terminal outputs.

### Tier 4: End-to-End (E2E) CLI & Web Tests
- **CLI E2E**: Spawns compiled CLI binary `vibesec` as a child process; verifies stdout, exit codes (`0` vs `1` on threshold exceedance), and flag behaviors (`--fix`, `--format json`, `--severity`).
- **Web API E2E**: Uses Supertest or Fastify `inject()` to test authentication flows, scan payload ingestion, and tenant isolation.

---

## 3. False-Positive and False-Negative Testing Standards

1. **False-Positive Prevention**:
   - Every rule test suite runs against standard production libraries (e.g. Express, React, Prisma) to confirm legitimate idiom patterns are not falsely flagged.
2. **False-Negative Auditing**:
   - Testing against benchmark vulnerable applications (e.g., OWASP Juice Shop, NodeGoat, and our internal `test-vulnerable.js`).
   - Verifying that subtle variations (e.g., intermediate variable assignments or template literals with multiple interpolated expressions) do not bypass detection.

---

## 4. Performance & Benchmark Testing

- **Benchmark Suite**: A dedicated test repository containing 1,000 synthetic JavaScript and TypeScript files.
- **Target Thresholds**:
  - Throughput: >= 200 files/sec.
  - Memory: RSS <= 256 MB.
  - Timeout: Individual file parsing timeout capped at 500ms to guarantee no process hangs on large generated files.

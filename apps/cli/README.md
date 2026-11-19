# @voom-nexus/cli (vibesec)
> AI-Aware Application Security & DevSecOps Platform CLI

[![npm version](https://img.shields.io/npm/v/@voom-nexus/cli.svg)](https://www.npmjs.com/package/@voom-nexus/cli)
[![License: Apache-2.0](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)

**Voom Nexus (`vibesec`)** is an ultra-fast, developer-first Static Application Security Testing (SAST) and AI coding guardrail platform. It detects OWASP Top 10 vulnerabilities, CWE anti-patterns, exposed secrets, and supplies automated remediation recipes.

---

## ⚡ Instant Usage (No Install Needed)

Run a security audit directly via `npx`:

```bash
# Scan current repository
npx @voom-nexus/cli scan .

# Short alias if installed globally:
# npm install -g @voom-nexus/cli
vibesec scan .
```

---

## 🚀 Key Commands

### 1. Security Scan (`scan`)
Scan source files with sub-millisecond execution speed:

```bash
# Basic scan
vibesec scan .

# Filter by severity
vibesec scan . --severity critical,high

# Output as SARIF (for GitHub Code Scanning)
vibesec scan . --format sarif --output report.sarif

# Output as Markdown (for GitHub PR comments)
vibesec scan . --format markdown --output security-summary.md

# Preview automated security fixes (dry-run)
vibesec scan . --fix --dry-run

# Apply automated security fixes directly
vibesec scan . --fix
```

### 2. Supply Chain Audit (`audit`)
Detect known CVEs and vulnerable dependencies in `package-lock.json` and `package.json`:

```bash
vibesec audit .
```

### 3. AI Coding Assistant Guardrails (`init`)
Generate framework-tailored security rules for Cursor, Claude Code, GitHub Copilot, Windsurf, and Google Antigravity:

```bash
# Detect framework and generate rules for Cursor and Claude
vibesec init --framework express --ai cursor,claude

# Generates:
# - .cursorrules
# - CLAUDE.md
# - .voomsecrc.json
```

### 4. Baseline Regression Verification (`verify`)
Ensure new code does not introduce new security regressions:

```bash
# Save baseline
vibesec scan . --baseline .voomsec/baseline.json

# Verify in CI
vibesec verify --baseline .voomsec/baseline.json --strict
```

### 5. Inspect Registered Security Rules (`rules`)
Display all 15 built-in OWASP / CWE detection rules:

```bash
vibesec rules
```

---

## 🛡️ Covered Vulnerability Taxonomies

- **SEC-JS-001**: SQL Injection via String Concatenation (`CWE-89` / `OWASP A03`)
- **SEC-JS-002**: Cross-Site Scripting (XSS) (`CWE-79` / `OWASP A03`)
- **SEC-JS-003**: Command Injection (`CWE-78` / `OWASP A03`)
- **SEC-JS-004**: Weak Cryptographic Hash MD5/SHA1 (`CWE-327` / `OWASP A02`) *(Auto-fixable)*
- **SEC-JS-005**: Path Traversal (`CWE-22` / `OWASP A01`)
- **SEC-JS-006**: Unsafe Code Execution via `eval()` (`CWE-95` / `OWASP A03`)
- **SEC-JS-007**: Server-Side Request Forgery (SSRF) (`CWE-918` / `OWASP A10`)
- **SEC-JS-008**: Insecure Deserialization (`CWE-502` / `OWASP A08`)
- **SEC-JS-009**: Permissive CORS Wildcard (`CWE-942` / `OWASP A05`) *(Auto-fixable)*
- **SEC-JS-010**: Insecure Pseudo-Random Number Generation (`CWE-338` / `OWASP A04`) *(Auto-fixable)*
- **SEC-JS-011**: Sensitive Information in Logs (`CWE-532` / `OWASP A09`)
- **SEC-JS-012**: Weak Password Policy (`CWE-521` / `OWASP A07`) *(Auto-fixable)*
- **SEC-JS-013**: Prototype Pollution (`CWE-1321` / `OWASP A08`)
- **SEC-GEN-001**: Hardcoded Secret / API Key (`CWE-798` / `OWASP A07`)
- **SEC-GEN-002**: Hardcoded Private Cryptographic Key (`CWE-798` / `OWASP A07`)
- **SEC-DEP-001**: Vulnerable Supply Chain Dependency (`CWE-1395` / `OWASP A06`)

---

## 📄 License

Licensed under the [Apache License, Version 2.0](../../LICENSE).

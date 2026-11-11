# Software Requirements Specification (SRS)
**Product**: Voom Nexus — Vibe Security Tool  
**Standard**: IEEE 830-1998 Aligned  
**Document Version**: 1.0.0  
**Status**: Initialized Foundation  

---

## 1. Introduction

### 1.1 Purpose
This Software Requirements Specification (SRS) establishes the technical, functional, performance, and interface requirements for the **Voom Nexus** security analysis platform.

### 1.2 Scope
Voom Nexus encompasses:
- Core Static Analysis Engine (`@voom-nexus/core`, `@voom-nexus/rules`, `@voom-nexus/parsers`)
- Command Line Interface (`@voom-nexus/cli`)
- Web Management Dashboard and API (`@voom-nexus/web`)
- Configuration and Reporting Modules (`@voom-nexus/config`, `@voom-nexus/reporting`)

---

## 2. User Roles and Personas

| Role ID | Role Name | Description & Permissions |
| :--- | :--- | :--- |
| **ROLE-DEV** | Developer | Executes local CLI scans, views findings, applies local fixes, generates AI rules. |
| **ROLE-LEAD** | Tech Lead / Maintainer | Manages projects on Web UI, sets severity thresholds, reviews pull request scans. |
| **ROLE-SEC** | Security Auditor | Reviews compliance checklists, audits false positive exemptions, exports SARIF/PDF reports. |
| **ROLE-ADMIN**| System Administrator | Manages users, organization memberships, API keys, and system configuration. |

---

## 3. Specific Functional Requirements

### 3.1 Core Security Engine Requirements (`REQ-ENG`)

- **REQ-ENG-001**: The engine SHALL accept a filesystem path or file stream and identify all source files matching registered language adapters.
- **REQ-ENG-002**: The engine SHALL exclude files matching `.gitignore`, `.voomsecignore`, and standard ignore directories (`node_modules`, `dist`, `.git`, `.venv`).
- **REQ-ENG-003**: The engine SHALL evaluate each file concurrently using worker pools or asynchronous non-blocking event loops.
- **REQ-ENG-004**: For each detected violation, the engine SHALL construct an immutable `SecurityIssue` object containing:
  - `id`: Unique identifier (UUIDv4)
  - `ruleId`: Unique rule code (e.g., `SEC-JS-001`)
  - `title`: Short human-readable title
  - `severity`: Enum (`CRITICAL`, `HIGH`, `MEDIUM`, `LOW`, `INFORMATIONAL`)
  - `confidence`: Enum (`CERTAIN`, `FIRM`, `TENTATIVE`)
  - `cwe`: Standard CWE identifier (e.g., `CWE-89`)
  - `owasp`: OWASP Top 10 2021 category (e.g., `A03:2021-Injection`)
  - `file`: Relative file path from scan root
  - `line`: Starting line number (1-based)
  - `column`: Starting column number (1-based)
  - `snippet`: Source code excerpt with sensitive secrets redacted
  - `remediation`: Explanation and code snippet demonstrating safe implementation
- **REQ-ENG-005**: The engine SHALL support inline rule suppression comments formatted as `// voomsec-ignore-next-line <RULE-ID>` or `/* voomsec-ignore <RULE-ID> */`.
- **REQ-ENG-006**: The engine SHALL support baseline scan comparisons (`verify`), flagging issues as `NEW`, `PERSISTENT`, or `RESOLVED`.

### 3.2 Security Rules Taxonomy (`REQ-RULE`)

- **REQ-RULE-001**: The system SHALL provide rules for all OWASP Top 10 (2021) categories:
  - A01: Broken Access Control (CWE-22 Path Traversal, CORS wildcard)
  - A02: Cryptographic Failures (CWE-327 Weak Hash MD5/SHA1, Insecure TLS)
  - A03: Injection (CWE-89 SQL Injection, CWE-78 Command Injection, CWE-79 XSS)
  - A04: Insecure Design (CWE-338 Insecure Randomness)
  - A05: Security Misconfiguration (CWE-693 Missing Security Headers)
  - A06: Vulnerable Components (Outdated dependency references)
  - A07: Identification and Authentication Failures (CWE-798 Hardcoded Secrets, CWE-521 Weak Passwords)
  - A08: Software and Data Integrity Failures (CWE-502 Unsafe Deserialization)
  - A09: Security Logging Failures (CWE-532 Sensitive Data in Logs)
  - A10: Server-Side Request Forgery (CWE-918 SSRF)
- **REQ-RULE-002**: Every rule definition SHALL be versioned and include regression test fixtures (true-positive and false-positive samples).

### 3.3 Command-Line Interface (`REQ-CLI`)

- **REQ-CLI-001**: The CLI binary SHALL be named `vibesec` (with alias `voom-sec`).
- **REQ-CLI-002**: The CLI SHALL provide the following subcommands:
  - `scan [path]`: Scans source files at the specified path (default `.`).
  - `verify [path]`: Verifies existing issues against a baseline.
  - `init`: Interactively sets up configuration and exports AI security instructions.
  - `rules`: Displays all registered security rules, CWEs, and descriptions.
  - `version`: Outputs current tool version.
- **REQ-CLI-003**: The `scan` command SHALL support:
  - `--severity <levels...>`: Filters output by minimum severity.
  - `--format <format>`: Selects output formatter (`text`, `json`, `sarif`, `markdown`).
  - `--output <file>`: Writes report to a file instead of stdout.
  - `--fix`: Interactively applies automated safe remediations.
  - `--threshold <level>`: Exits with code `1` if any issue matches or exceeds this severity level.
- **REQ-CLI-004**: The `init` command SHALL support:
  - `--ai <assistants...>`: Generates instructions for `claude`, `cursor`, `windsurf`, `copilot`, `antigravity`.

### 3.4 Web Application & API (`REQ-WEB`)

- **REQ-WEB-001**: The Web API SHALL provide JWT-authenticated RESTful endpoints under `/api/v1`.
- **REQ-WEB-002**: The Web UI SHALL render a dashboard showing:
  - Total projects and scans
  - Vulnerability distribution by severity (Donut chart)
  - Historical vulnerability resolution trend (Line graph)
  - Top 5 recurring vulnerability categories
  - Overall Security Health Score (0 - 100)
- **REQ-WEB-003**: The Web UI SHALL allow users to browse scan findings with syntax-highlighted code snippets and remediation instructions.
- **REQ-WEB-004**: The Web UI SHALL enforce role-based access control (Admin, Maintainer, Auditor, Member).

---

## 4. Non-Functional Requirements

### 4.1 Performance & Scalability (`REQ-PERF`)
- **REQ-PERF-001**: The CLI SHALL scan at a minimum throughput of 200 files per second on a modern quad-core workstation.
- **REQ-PERF-002**: Memory consumption of the CLI SHALL not exceed 256 MB RSS under standard scanning workloads.
- **REQ-PERF-003**: Web API responses SHALL respond within 150 ms (p95) for standard metadata queries.

### 4.2 Security & Safety (`REQ-SEC`)
- **REQ-SEC-001**: The engine SHALL treat all scanned code as untrusted text. Under no circumstances SHALL the engine execute `eval()`, `require()`, or spawn processes with scanned source code.
- **REQ-SEC-002**: Any discovered secret, token, or password matching secret regexes SHALL be masked with asterisks (e.g., `sk-ant-****...****`) in all outputs.
- **REQ-SEC-003**: All Web API input payloads SHALL be validated against strict Zod/JSON schemas prior to controller handling.
- **REQ-SEC-004**: All database queries SHALL use parameterized queries or type-safe ORM mappers to eliminate SQL injection risks.

### 4.3 Reliability & Maintainability (`REQ-REL`)
- **REQ-REL-001**: 100% of core scan engine and rule functions SHALL have deterministic unit tests.
- **REQ-REL-002**: System crashes or parsing errors in a single source file SHALL NOT abort the entire scan run; errors SHALL be logged as scan warnings, allowing remaining files to complete.


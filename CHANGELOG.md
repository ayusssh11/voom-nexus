# Changelog

All notable changes to the **Voom Nexus (Vibe Security Tool)** project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Planned
- **Phase 1**: Core project architecture and security engine foundation.
- **Phase 2**: Initial security rules and static analysis pipelines (OWASP Top 10).
- **Phase 3**: Functional CLI application with `scan`, `verify`, and `init` commands.
- **Phase 4**: Web application dashboard, project management, and RBAC authentication.
- **Phase 5**: Repository integration, automated ingestion, and scan orchestration.
- **Phase 6**: Vulnerability reporting, remediation tracking, and SARIF export.
- **Phase 7**: AI coding assistant security guidelines generator.
- **Phase 8**: CI/CD integration plugins and supply-chain auditing.
- **Phase 9**: Hardening, benchmarks, and production readiness.

---

## [0.1.0-alpha.0] - 2026-11-11

### Added
- **Production Hardening, Benchmarking & Packaging (Phase 9)**:
  - Multi-stage production containerization (`Dockerfile` and `docker-compose.yml`) utilizing `node:20-alpine`, non-root execution user `node`, `no-new-privileges:true`, and `/api/v1/health` container healthcheck.
  - Performance benchmarking suite (`packages/core/test/benchmark.test.js`) certifying core static scanning speed at **1.649ms per source file** (exceeding the <= 3.0ms/file requirement).
  - Production readiness and STRIDE security audit documentation (`docs/PRODUCTION_READINESS.md`).
  - Total automated test suite expanded to **74 tests passing at 100%** with zero external runtime dependencies.
- **CI/CD Integration & Supply Chain Auditing (Phase 8)**:
  - Supply chain dependency auditor (`DependencyAuditor` in `@voom-nexus/core`) detecting known CVEs across `package-lock.json` (v1/v2/v3) and `package.json` manifests (`event-stream`, `lodash`, `axios`, `minimist`, `jsonwebtoken`, `shelljs`).
  - Mapped third-party vulnerabilities to `SEC-DEP-001`, `CWE-1395`, and `OWASP A06:2021-Vulnerable and Outdated Components`.
  - CLI commands and options:
    - `vibesec audit [path]`: Dedicated supply chain scanning command with format and threshold flags.
    - `vibesec scan --audit`: Unified static code and dependency vulnerability analysis.
  - Official GitHub Action definition (`action.yml`) allowing zero-config integration (`uses: voom-nexus/action@v1`).
  - GitHub Actions CI workflow template (`.github/workflows/security-scan.yml`) with automated SARIF upload to GitHub Code Scanning.
  - GitLab CI pipeline template (`docs/ci-templates/gitlab-ci.yml`).
  - Expanded unit and integration test suite to 73 passing tests.
- **AI Coding Assistant Security Guidelines (Phase 7)**:
  - Framework-specific security rule packs and generators (`AiGuidelineGenerator` in `@voom-nexus/rules`) targeting:
    - **Next.js**: Server Component secret isolation, Server Action authorization checks, Zod validation in Route Handlers, and `dangerouslySetInnerHTML` DOMPurify guardrails.
    - **React**: DOM XSS prevention, protocol validation on `<a href>`, and token storage hygiene.
    - **Express**: Mandatory `helmet()`, strict CORS whitelists, rate limiting on authentication routes, and sanitized 500 error handlers.
    - **FastAPI / Python**: SQLAlchemy parameterization, `pydantic` request parsing, safe deserialization (avoiding `pickle`/raw YAML), and cryptographically secure tokens.
    - **Generic**: Universal negative constraints and secure implementation patterns.
  - Automatic framework detection from `package.json` dependencies.
  - Multi-assistant exporters targeting:
    - Cursor AI (`.cursorrules`)
    - Claude Code (`CLAUDE.md`)
    - Windsurf Cascade (`.windsurfrules`)
    - GitHub Copilot (`.github/copilot-instructions.md`)
    - Google Antigravity / Gemini (`.agent/security-rules.md`)
  - CLI enhancement: `vibesec init --framework <name> --ai <assistants>`.
  - Web REST API endpoint: `GET /api/v1/ai/guidelines?framework=...&ai=...` for dynamic guideline retrieval.
  - Unit and integration tests expanded to 67 passing tests.
- **Vulnerability Reporting & Remediation Workflows (Phase 6)**:
  - Automated safe remediation engine (`AutoFixer` in `@voom-nexus/core`) providing recipes for high-confidence rules:
    - `SEC-JS-004`: Automatic cryptographic upgrade from MD5/SHA1 to SHA-256.
    - `SEC-JS-010`: Insecure `Math.random()` token replacement with `crypto.randomBytes(16)`.
    - `SEC-JS-012`: Password length enforcement upgrade to >= 12 characters.
    - `SEC-JS-009`: CORS wildcard `*` replacement with environment whitelist.
  - CLI commands updated with `--fix` and `--dry-run`:
    - `vibesec scan --fix`: Evaluates and applies verified security patches directly to source files.
    - `vibesec scan --fix --dry-run`: Simulates patch application and displays diffs without touching disk.
  - Remediation tracking and finding triage in REST API:
    - `GET /api/v1/findings`: Filter findings by status (`OPEN`, `RESOLVED`, `FALSE_POSITIVE`) or project.
    - `PATCH /api/v1/findings/:id/status`: Updates finding status and automatically recalculates project Health Score.
    - `GET /api/v1/audit-logs`: Immutable audit trails for all triage events.
  - Comprehensive unit and integration test suites (59 passing tests across all packages).
- **Repository Integration & Asynchronous Scan Queue (Phase 5)**:
  - `SafeArchiveExtractor` in `@voom-nexus/core` defending against Zip Slip (CWE-22 path traversal) and Decompression Bombs with strict byte thresholds (100MB limit) and max file counts (2,000 files).
  - Background asynchronous scanning queue (`ScanJobQueue` in `@voom-nexus/web`) with non-blocking job state transitions (`QUEUED` -> `RUNNING` -> `COMPLETED` / `FAILED`).
  - Web API endpoints for async scans:
    - `POST /api/v1/projects/:id/queue-scan`: Enqueue background scan job, returning `202 Accepted` with `jobId`.
    - `GET /api/v1/jobs/:jobId`: Query real-time background job progress and scan metrics.
    - `GET /api/v1/jobs`: List all active and completed queue tasks.
  - Automated unit and integration tests for archive security guards and background queue lifecycles (54 passing tests across monorepo).
- **Web Application & RESTful API Platform (Phase 4)**:
  - In-memory data store (`MemoryDataStore`) managing projects, scans, findings, and immutable audit logs conforming to `DATABASE_SCHEMA.md`.
  - Security Health Score engine automatically calculating project ratings (0 - 100) based on severity weights.
  - Native HTTP RESTful API server (`VoomWebServer`) implementing endpoints with standard envelopes:
    - `GET /` and `GET /dashboard`: Responsive HTML/CSS security management dashboard.
    - `GET /api/v1/health`: System health and engine status.
    - `POST /api/v1/auth/login`: Authentication and token generation.
    - `GET /api/v1/projects` & `POST /api/v1/projects`: Multi-project management.
    - `POST /api/v1/projects/:id/scans`: Scan result ingestion and real-time health score updates.
    - `GET /api/v1/scans/:id`: Scan details and vulnerability lists.
    - `GET /api/v1/scans/:id/export?format=sarif|json`: Standardized export formats.
    - `PATCH /api/v1/findings/:id/status`: Finding triage and status updates (False Positive, Fixed, Open).
  - Integration test suite using in-memory request injection (48 passing tests).
- **Functional CLI Application (Phase 3)**:
  - Subcommands implemented:
    - `vibesec scan [path]`: Supports `--format <text|json|sarif|markdown>`, `--severity <list>`, `--output <file>`, `--threshold <level>`, `--baseline <file>`.
    - `vibesec verify [path]`: Compares scan against a saved baseline (`.voomsec/baseline.json`), reporting `NEW`, `PERSISTENT`, and `RESOLVED` vulnerabilities.
    - `vibesec init`: Generates `.voomsecrc.json` configuration and exports tailored AI coding assistant security guidelines (`.cursorrules`, `CLAUDE.md`, `.windsurfrules`, `.github/copilot-instructions.md`, `.agent/security-rules.md`).
    - `vibesec rules`: Displays all 15 registered security rules with CWE and OWASP mappings.
    - `vibesec version`: Prints CLI version.
  - Added `MarkdownReportFormatter` in `@voom-nexus/reporting` for GitHub-flavored markdown PR summaries.
  - Test suite expanded to 44 automated tests.
- **Initial Security Rules & Static Analysis (Phase 2)**:
  - Implemented 15 executable security detection rules covering OWASP Top 10 (2021) and CWE taxonomy:
    - `SEC-JS-001`: SQL Injection via dynamic string concatenation (CWE-89, OWASP A03)
    - `SEC-JS-002`: Cross-Site Scripting (XSS) via unencoded HTML output (CWE-79, OWASP A03)
    - `SEC-JS-003`: Command Injection via child_process execution (CWE-78, OWASP A03)
    - `SEC-JS-004`: Weak Cryptographic Hash Function MD5/SHA1 (CWE-327, OWASP A02)
    - `SEC-JS-005`: Path Traversal via unsanitized file access (CWE-22, OWASP A01)
    - `SEC-JS-006`: Unsafe Code Execution via `eval()` or dynamic Function (CWE-95, OWASP A03)
    - `SEC-JS-007`: Server-Side Request Forgery (SSRF) via dynamic requests (CWE-918, OWASP A10)
    - `SEC-JS-008`: Insecure Deserialization via node-serialize / unserialize (CWE-502, OWASP A08)
    - `SEC-JS-009`: Permissive CORS Configuration with wildcard origin (CWE-942, OWASP A05)
    - `SEC-JS-010`: Insecure Pseudo-Random Number Generation via Math.random (CWE-338, OWASP A04)
    - `SEC-JS-011`: Sensitive Information Exposure in Application Logs (CWE-532, OWASP A09)
    - `SEC-JS-012`: Weak Password Validation Policy (CWE-521, OWASP A07)
    - `SEC-JS-013`: Prototype Pollution via unsafe property assignment (CWE-1321, OWASP A08)
    - `SEC-GEN-001`: Hardcoded Secret or API Key Exposure (CWE-798, OWASP A07)
    - `SEC-GEN-002`: Hardcoded Private Cryptographic Key (CWE-798, OWASP A07)
  - Integrated rule evaluation into `ScanOrchestrator` across files and line streams.
  - Expanded test suite to 41 passing automated tests.
- **Core Security Engine Foundation (Phase 1)**:
  - Streaming, asynchronous `DirectoryWalker` with `.gitignore` and `.voomsecignore` evaluation.
  - Cycle and symlink recursion loop defense via inode tracking (`${dev}:${ino}`).
  - File size cap guards (`maxFileSizeBytes`, default 2MB) to prevent Denial of Service on massive bundle outputs.
  - Safe text file reader `SafeFileReader` with 8KB buffer inspection to detect binary files (presence of null bytes `\0`).
  - Line-indexing parser adapters for JavaScript, TypeScript, Python, and Generic files.
  - Per-file timeout protection in `ScanOrchestrator` (`config.scan.timeoutMs`).
  - Inline rule suppression support (`// voomsec-ignore-next-line <RULE-ID>`).
  - Unit test suites for walker, safe reader, adapters, and orchestrator (29 passing tests across packages).
- **Project Foundation (Phase 0)**:
  - Initialized unified monorepo architecture using native npm workspaces.
  - Configured root and package-level TypeScript configurations (`tsconfig.json`).
  - Added ESLint, Prettier, and Vitest/Node testing harnesses.
  - Setup core package boundaries:
    - `@voom-nexus/shared`: Universal domain types, severity enums, logger, constants.
    - `@voom-nexus/config`: Zod-validated configuration loader and schema definitions.
    - `@voom-nexus/core`: Scan orchestrator interface and pipeline contracts.
    - `@voom-nexus/rules`: Security rule definitions, metadata, and severity specifications.
    - `@voom-nexus/parsers`: Language adapter and AST parser interfaces.
    - `@voom-nexus/reporting`: Console, JSON, SARIF, and Markdown report formatters.
    - `@voom-nexus/cli`: Command-line interface application scaffold.
    - `@voom-nexus/web`: Web dashboard and API scaffold.
  - Created complete architectural documentation suite in `/docs`:
    - `PROJECT_OVERVIEW.md`
    - `PRD.md` (Product Requirements Document)
    - `SRS.md` (Software Requirements Specification)
    - `SYSTEM_ARCHITECTURE.md` (with Mermaid diagrams)
    - `DATABASE_SCHEMA.md` (PostgreSQL schema & ERD)
    - `API_SPECIFICATION.md` (REST API documentation)
    - `THREAT_MODEL.md` (STRIDE analysis and mitigations)
    - `SECURITY_RULES_SPECIFICATION.md` (Rule definitions & taxonomy)
    - `TESTING_STRATEGY.md` (Multi-tiered testing plan)
    - `DEVELOPMENT_ROADMAP.md` (Phased milestone roadmap)
    - `TECH_STACK.md` (Technology evaluations & decisions)
    - `PROJECT_STRUCTURE.md` (Codebase layout & guidelines)
    - `CONFIGURATION_SPECIFICATION.md` (Configuration options & schemas)
    - `ADR/ARCHITECTURE_DECISIONS.md` (Architecture Decision Records)
  - Established community and operational files:
    - `README.md`
    - `SECURITY_CHECKLIST.md`
    - `CONTRIBUTING.md`
    - `SECURITY.md`
    - `OPEN_QUESTIONS.md`
    - `LICENSE` (Recommended Apache-2.0, status pending)
    - `.gitignore`, `.editorconfig`, `.env.example`
    - GitHub Actions CI workflow for linting, typechecking, and testing.


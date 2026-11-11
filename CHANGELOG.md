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

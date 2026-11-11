# Open Architectural Questions & Unresolved Decisions

This document records architectural, product, and technical questions currently under review. As decisions are reached, they will be migrated to formal Architecture Decision Records in `docs/ADR/ARCHITECTURE_DECISIONS.md`.

---

## 1. Static Analysis Parser Selection: Tree-sitter vs. Language-Specific AST Parsers
- **Question**: Should Voom Nexus adopt Tree-sitter (via `web-tree-sitter` WebAssembly bindings) as a universal multi-language parser, or use dedicated ecosystem parsers (e.g., `@babel/parser` / `@typescript-eslint/parser` for JS/TS, Python AST via sub-process/wasm)?
- **Options**:
  1. *Universal Tree-sitter via WASM*: Single unified AST interface across all 9+ languages; high performance; no native C++ rebuild requirements.
  2. *Hybrid Approach (Recommended for Phase 1)*: Use Babel/TypeScript parsers for JS/TS (richest semantic queries for modern front-end/Node), regex heuristics for fast multi-language scanning, and introduce Tree-sitter in Phase 2 for Python, Go, and Java.
- **Status**: Under evaluation in ADR-003.

---

## 2. Web Application Framework: Next.js Fullstack vs. Fastify API + Vite React SPA
- **Question**: Should the Web Dashboard be a monolithic Next.js (App Router) full-stack application, or separated into a dedicated Fastify Node API service and a Vite/React SPA?
- **Options**:
  1. *Next.js (App Router)*: Faster initial scaffolding, SSR support, integrated server actions.
  2. *Fastify API + React SPA (Recommended for security tools)*: Fastify provides superior throughput for high-volume scan result ingestion, clear API separation for CLI clients, and strict isolation between backend scanning workers and frontend presentation.
- **Status**: Under evaluation in ADR-004.

---

## 3. Database Choice for Scan Findings & Reports: PostgreSQL with JSONB vs. Relational Normalization
- **Question**: Should scan findings be fully normalized (each finding in a relational table) or semi-structured using PostgreSQL `JSONB` for finding details?
- **Options**:
  1. *Hybrid PostgreSQL (Recommended)*: Relational tables for `projects`, `scans`, and aggregated `vulnerabilities` metrics, with `JSONB` for detailed AST node contexts, code snippets, and remediation options.
- **Status**: Under evaluation in `docs/DATABASE_SCHEMA.md` and ADR-005.

---

## 4. Local CLI Scanning vs. Remote Cloud Scanning Privacy Boundary
- **Question**: When users run `vibesec scan`, under what circumstances (if any) should source code or AST tokens leave the developer's workstation?
- **Decision**: **Default is 100% Local**. Code never leaves the local machine. If cloud dashboard sync is enabled (`--sync`), only anonymized vulnerability metadata (rule ID, severity, line numbers, redacted snippets) is transmitted—never the raw source code repository.
- **Status**: Confirmed in Security & Trust Principles.

---

## 5. Automated Remediation Safety Guardrails
- **Question**: What validation criteria must be met before `vibesec scan --fix` modifies user source code?
- **Decision**:
  1. Code modifications must require explicit terminal confirmation (interactive prompt) or `--fix --yes`.
  2. A local backup or git working tree check must verify no uncommitted changes exist before applying fixes.
  3. Re-run verification scan immediately after applying fix to ensure no syntax corruption or secondary vulnerability was introduced.
- **Status**: Scheduled for design in Phase 6.

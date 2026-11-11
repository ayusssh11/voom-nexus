# Architecture Decision Records (ADR)
**Product**: Voom Nexus — Vibe Security Tool  
**Standard**: Michael Nygard ADR Template Aligned  

---

## Index of Decisions

- **ADR-001**: Adoption of a Unified TypeScript Monorepo Architecture
- **ADR-002**: Pure Static Read-Only Analysis without Runtime Code Execution
- **ADR-003**: Selection of AST Parsing Engine (Babel Parser + Planned Tree-sitter WASM)
- **ADR-004**: Separation of Web API Service (Fastify) and Web Dashboard (Next.js/React)
- **ADR-005**: Hybrid Relational and Document Storage in PostgreSQL
- **ADR-006**: In-Memory Secret Redaction Prior to Logging & Serialization
- **ADR-007**: AI Coding Assistant Security Guideline Ingestion Format

---

## ADR-001: Adoption of a Unified TypeScript Monorepo Architecture

### Context
Voom Nexus needs to power both a lightweight, local developer CLI and a scalable web dashboard. The vulnerability detection logic, security rule definitions, AST parser visitors, and reporting formatters must remain 100% identical between the two interfaces to prevent split-brain detection behavior.

### Alternatives Considered
1. **Separate Repositories**: A separate Go or Rust repository for the CLI scanner and a TypeScript repo for the Web dashboard.
2. **Polyglot Monorepo**: Rust core engine exposed via FFI / WASM to Node.js.
3. **Unified TypeScript Monorepo**: Single codebase using TypeScript across all packages with native npm workspaces.

### Decision
Adopt a **Unified TypeScript Monorepo** using native npm workspaces.

### Reasoning
- **Direct Code Sharing**: Both CLI (`apps/cli`) and Web (`apps/web`) import `@voom-nexus/core` and `@voom-nexus/rules` directly.
- **Single Source of Truth**: Writing a rule once automatically makes it available in both the CLI and Web interfaces.
- **Lower Maintenance Overhead**: No need to maintain cross-language bindings or complex FFI compilation matrices across Windows, macOS, and Linux.

### Status: ACCEPTED

---

## ADR-002: Pure Static Read-Only Analysis without Runtime Code Execution

### Context
Dynamic Application Security Testing (DAST) or instrumentation-based analysis often executes application code or dynamically evaluates modules (`require()`, `import()`) to observe runtime behaviors.

### Alternatives Considered
1. **Dynamic Execution / Runtime Sandboxing**: Load and run user code inside an isolated VM.
2. **Pure Static Analysis**: Parse code as static text/tokens and build an Abstract Syntax Tree without evaluating or running any part of the user codebase.

### Decision
Enforce **Pure Static Read-Only Analysis** with an absolute prohibition on code execution.

### Reasoning
- **Host Security**: Running arbitrary user code on developer workstations or CI runners presents a severe Remote Code Execution (RCE) vulnerability if an attacker crafts a malicious repository.
- **Zero Side Effects**: Pure static scanning guarantees that scanning a project will never alter files, trigger database migrations, make outbound network requests, or execute malicious lifecycle scripts.

### Status: ACCEPTED

---

## ADR-003: Selection of AST Parsing Engine

### Context
Accurate detection of vulnerabilities such as SQL Injection or XSS requires inspecting the structural Abstract Syntax Tree (AST) rather than relying exclusively on superficial regex matches.

### Alternatives Considered
1. **Pure Regular Expressions**: Fast but plagued by false positives and unable to detect intermediate variable assignments or nested function arguments.
2. **Tree-sitter Native Bindings (`node-tree-sitter`)**: High performance across languages, but requires native C++ compilation (`node-gyp`), frequently breaking across different OS environments.
3. **Hybrid Architecture (Babel AST Parser for JS/TS + Tree-sitter WASM for Polyglot)**: Use `@babel/parser` for JavaScript/TypeScript and WebAssembly-based Tree-sitter for subsequent languages.

### Decision
Adopt the **Hybrid AST Architecture**:
- Phase 1 & 2: Use `@babel/parser` for JavaScript and TypeScript AST analysis, complemented by regex heuristics for non-AST languages.
- Subsequent Phases: Introduce `web-tree-sitter` (WebAssembly) for Python, Go, and Java to avoid native C++ compilation requirements.

### Status: ACCEPTED

---

## ADR-004: Separation of Web API Service and Web Dashboard

### Context
The Web platform must support both high-throughput API ingestion from thousands of automated CI/CD runners and a responsive user dashboard for engineering teams.

### Alternatives Considered
1. **Monolithic Next.js Server Actions**: Single Next.js full-stack app handling both UI and high-volume CI ingestion.
2. **Separated Fastify Backend API + Next.js / React Dashboard**: Fastify provides dedicated, ultra-low-latency REST endpoints for CLI/CI ingestion, while Next.js handles server-side rendered UI.

### Decision
Adopt **Separated Service Architecture** within `apps/web`:
- Dedicated Fastify API router for high-throughput scan ingestion and SARIF exports.
- Next.js / React frontend for user dashboards and project analytics.

### Status: ACCEPTED

---

## ADR-005: Hybrid Relational and Document Storage in PostgreSQL

### Context
Security projects and teams require strict relational consistency (users, projects, roles), while scan findings vary widely in structure depending on the vulnerability type and language context.

### Alternatives Considered
1. **Pure NoSQL (MongoDB)**: Flexible for scan findings, but weak on relational multi-tenancy and transactional consistency.
2. **Pure Normalized Relational**: Rigid tables requiring complex schema migrations whenever a rule introduces new metadata.
3. **Hybrid PostgreSQL**: Relational tables for accounts, projects, and scans; `JSONB` columns for finding AST node contexts and remediation metadata.

### Decision
Adopt **Hybrid PostgreSQL (Relational + JSONB)**.

### Reasoning
PostgreSQL provides ACID guarantees, powerful relational foreign keys for tenant scoping, and native JSON querying capabilities for AST snippets and custom rule metadata.

### Status: ACCEPTED

---

## ADR-006: In-Memory Secret Redaction Prior to Logging & Serialization

### Context
Hardcoded credentials (AWS keys, GitHub tokens, database passwords) detected in source code must be reported to the developer without leaking the actual secret into terminal screen shares, logs, or shared databases.

### Decision
Enforce **In-Memory Secret Redaction**:
The `@voom-nexus/shared/redact` module masks sensitive credential substrings with asterisks (`sk-ant-****...****`) immediately upon detection, before any object serialization, logging, or reporting.

### Status: ACCEPTED

---

## ADR-007: AI Coding Assistant Security Guideline Ingestion Format

### Context
To prevent AI coding assistants from generating vulnerable patterns, Voom Nexus must generate configuration files compatible with different AI tools (Claude, Cursor, Windsurf, Copilot, Antigravity).

### Decision
Generate **Assistant-Native Security Rule Files**:
The `vibesec init` command reads centralized rule definitions from `@voom-nexus/rules` and formats them into assistant-specific configuration files:
- Claude: `CLAUDE.md`
- Cursor: `.cursorrules`
- Windsurf: `.windsurfrules`
- Copilot: `.github/copilot-instructions.md`
- Antigravity: `.agent/security-rules.md`

### Status: ACCEPTED


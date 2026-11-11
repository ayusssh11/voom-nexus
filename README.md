# Voom Nexus — Vibe Security Tool
**AI-Aware Application Security & DevSecOps Platform**

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen)](#)
[![TypeScript](https://img.shields.io/badge/language-TypeScript%205.x-blue)](#)
[![License: Pending Evaluation](https://img.shields.io/badge/License-Pending%20(Recommended%20Apache--2.0)-lightgrey)](#)
[![Security Standard](https://img.shields.io/badge/OWASP-Top%2010%20(2021)-orange)](#)
[![CWE Compatible](https://img.shields.io/badge/CWE-Compatible-blueviolet)](#)

---

## 1. Project Vision & Overview

**Voom Nexus (Vibe Security Tool)** is a developer-centric application security platform engineered to detect security vulnerabilities, dangerous programming anti-patterns, secret exposures, and configuration flaws in modern software applications.

Modern rapid prototyping and "vibe coding" (authoring production features iteratively using AI code generators like Claude, Cursor, Windsurf, GitHub Copilot, and Google Antigravity) dramatically accelerates feature delivery. However, it frequently introduces subtle, critical security vulnerabilities into production codebases: raw database concatenations, unprotected routes, hardcoded mock keys, missing input sanitization, and insecure third-party packages.

Voom Nexus bridges this gap by acting as an automated, AI-aware security guardian that works seamlessly for both **AI-assisted codebases** and **traditionally engineered software**.

### Core Mission
Instead of generating overwhelming, opaque lists of warnings, Voom Nexus focuses on educational and actionable remediation:
- **What**: Precise categorization and naming of the vulnerability.
- **Where**: File location, line numbers, and impacted code span.
- **Why**: Deep contextual explanation of why the pattern is dangerous and how it can be exploited.
- **How to Fix**: Exact remediation code snippets and defense-in-depth guidance.
- **AI Rule Ingestion**: Automated generation of assistant-specific instructions (`.cursorrules`, `CLAUDE.md`, `.agent/`, `.github/copilot-instructions.md`) to instruct AI models *never* to generate those vulnerable patterns again.
- **Verification**: Post-remediation verification scanning to confirm whether a vulnerability has truly been eliminated.

---

## 2. Platform Architecture & Interfaces

Voom Nexus is architected around a unified monorepo with a single shared analysis engine powering two primary user interfaces:

```
                  ┌────────────────────────────────────────┐
                  │       Voom Nexus Unified Monorepo      │
                  └───────────────────┬────────────────────┘
                                      │
             ┌────────────────────────┴────────────────────────┐
             ▼                                                 ▼
   ┌───────────────────┐                             ┌───────────────────┐
   │     apps/cli      │                             │     apps/web      │
   │  Local CLI Tool   │                             │   Web Dashboard   │
   │   (vibesec CLI)   │                             │  & Analytics API  │
   └─────────┬─────────┘                             └─────────┬─────────┘
             │                                                 │
             └────────────────────────┬────────────────────────┘
                                      │ (Consumes Shared Engine)
                                      ▼
                        ┌───────────────────────────┐
                        │      packages/core        │
                        │ (Scan Engine Orchestrator)│
                        └──────┬──────┬──────┬──────┘
                               │      │      │
            ┌──────────────────┘      │      └──────────────────┐
            ▼                         ▼                         ▼
  ┌───────────────────┐     ┌───────────────────┐     ┌───────────────────┐
  │  packages/rules   │     │ packages/parsers  │     │packages/reporting │
  │(Security Rulesets)│     │(AST/Regex Adapters│     │ (Console/SARIF/   │
  └───────────────────┘     └───────────────────┘     │    JSON Output)   │
                                                      └───────────────────┘
```

1. **Local CLI (`apps/cli`)**: Lightweight, zero-dependency installation executed locally or in CI pipelines (`vibesec scan`, `vibesec verify`, `vibesec init`).
2. **Web Application & Dashboard (`apps/web`)**: Web dashboard for continuous project tracking, scan histories, compliance reporting, and organizational security posture visualization.
3. **Shared Security Engine (`packages/core` & satellite packages)**: Deterministic, read-only static analysis engine powered by language AST parsers and regex heuristic analyzers.

---

## 3. Technology Stack

- **Runtime & Language**: Node.js `>=20.19.0`, TypeScript `^5.7.0`
- **Monorepo Architecture**: Native npm workspaces (with support for Turborepo)
- **CLI Framework**: Commander.js, Chalk, Ora, Prompts
- **Web Interface (Planned)**: React / Next.js, Tailwind CSS, Fastify / Express API
- **Static Analysis & Parsing**: Tree-sitter AST bindings, Babel parser (`@babel/parser`), regex heuristics
- **Testing & Quality**: Node test runner / Vitest, ESLint, Prettier

For an in-depth evaluation and architectural justification, see [docs/TECH_STACK.md](docs/TECH_STACK.md).

---

## 4. Planned Capabilities vs. Current Status

> **Important**: This project is in **Phase 0: Foundation & Initialization**. Features marked as *Planned* are specified in the architecture documentation and roadmap, but are not yet implemented.

| Feature Category | Capability | Status |
| :--- | :--- | :--- |
| **Foundation** | Documentation (PRD, SRS, Threat Model, Architecture, ADRs) | ✅ **Completed** |
| **Foundation** | Monorepo Setup (Workspaces, TypeScript, Linting, Testing) | ✅ **Completed** |
| **Foundation** | Core Engine Interfaces & Type Definitions | ✅ **Completed** |
| **Static Analysis** | Multi-language AST & Regex Scanning Engine | 🔄 Planned (Phase 1 & 2) |
| **Ruleset** | OWASP Top 10 & CWE Detection Rules (30+ rules) | 🔄 Planned (Phase 2) |
| **CLI** | `vibesec scan`, `vibesec verify`, `vibesec init` | 🔄 Planned (Phase 3) |
| **AI Integration** | Export rules for Claude, Cursor, Copilot, Antigravity | 🔄 Planned (Phase 7) |
| **Web Dashboard** | Multi-project dashboard, historical trends, team reports | 🔄 Planned (Phase 4) |
| **CI/CD** | GitHub Actions, GitLab CI, SARIF output generation | 🔄 Planned (Phase 8) |

---

## 5. Getting Started (Development Setup)

### Prerequisites
- Node.js version `20.19.0` or higher
- npm version `10.0.0` or higher

### Installation
Clone the repository and install workspace dependencies:
```bash
# Clone the repository
git clone <repository-url> voom-nexus
cd voom-nexus

# Install all workspace dependencies
npm install
```

### Build & Verification Commands
```bash
# Run type checking across all workspace packages
npm run typecheck

# Run linting across the monorepo
npm run lint

# Run the test suite
npm test

# Build all packages and applications
npm run build
```

---

## 6. Planned CLI Usage (Preview)

Once Phase 3 is completed, developers will interact with Voom Nexus via the CLI:

```bash
# 1. Initialize security guidelines in your project (for Cursor, Claude, Antigravity, etc.)
vibesec init --ai cursor --ai claude

# 2. Run a full security scan on your current directory
vibesec scan .

# 3. Filter findings by severity and output to SARIF for CI/CD
vibesec scan . --severity critical,high --format sarif --output report.sarif

# 4. Verify whether previously remediated issues remain resolved
vibesec verify --baseline .voomsec/baseline.json
```

---

## 7. Project Structure

```
voom-nexus/
├── .github/
│   └── workflows/              # CI/CD workflows (lint, typecheck, test)
├── apps/
│   ├── cli/                    # Command-line interface package (bin: vibesec)
│   └── web/                    # Web dashboard frontend and API server
├── packages/
│   ├── config/                 # Configuration loader and schema validation
│   ├── core/                   # Scan orchestration, pipeline execution
│   ├── parsers/                # Language adapters and AST extraction
│   ├── reporting/              # Console, JSON, SARIF, Markdown formatters
│   ├── rules/                  # Security rule definitions and metadata
│   └── shared/                 # Universal types, constants, logger utilities
├── docs/                       # Comprehensive specifications and ADRs
│   ├── ADR/                    # Architecture Decision Records
│   ├── PRD.md                  # Product Requirements Document
│   ├── SRS.md                  # Software Requirements Specification
│   ├── SYSTEM_ARCHITECTURE.md  # Detailed architecture & Mermaid diagrams
│   ├── DATABASE_SCHEMA.md      # Database entities, indexes, and ERDs
│   ├── API_SPECIFICATION.md    # REST API endpoints & schemas
│   ├── THREAT_MODEL.md         # STRIDE threat model & mitigations
│   ├── SECURITY_RULES_SPECIFICATION.md # Rule engine design standards
│   ├── TESTING_STRATEGY.md     # Test automation & benchmark plans
│   ├── DEVELOPMENT_ROADMAP.md  # Multi-phase milestone breakdown
│   ├── TECH_STACK.md           # Technology evaluations & decisions
│   ├── PROJECT_STRUCTURE.md    # Detailed codebase layout & guidelines
│   └── CONFIGURATION_SPECIFICATION.md # Config schemas and options
├── CHANGELOG.md                # Project versioning and history
├── CONTRIBUTING.md             # Development standards and PR workflow
├── LICENSE                     # Licensing terms and attribution policy
├── OPEN_QUESTIONS.md           # Unresolved architectural queries
├── README.md                   # Project overview (this document)
├── SECURITY.md                 # Vulnerability disclosure policy
└── SECURITY_CHECKLIST.md       # Secure development & compliance checklist
```

---

## 8. Security & Trust Principles

1. **Read-Only Code Analysis**: The core scanner never modifies project files unless the user explicitly executes `--fix` with interactive confirmation.
2. **Zero Code Execution**: Untrusted source code analyzed by the engine is parsed as data structures (AST/tokens/strings). It is **never** evaluated, executed, or imported.
3. **Secret Redaction**: Any credentials, tokens, or private keys detected in files are immediately masked in memory, logs, terminal output, and saved reports.
4. **Local Privacy**: Source code is analyzed locally by default and is never transmitted to external APIs or third-party cloud services without explicit user opt-in.
5. **Safe Archive Decompression**: File upload handlers enforce strict directory containment and path normalization to prevent Zip Slip (CWE-22) attacks.

---

## 9. Contributing & Policies

- **Contribution Guidelines**: Please review [CONTRIBUTING.md](CONTRIBUTING.md) for branch naming conventions, commit formats, and pull request procedures.
- **Reporting Vulnerabilities**: See [SECURITY.md](SECURITY.md) for our responsible vulnerability disclosure guidelines.
- **Architecture Log**: Detailed decisions are logged in [docs/ADR/ARCHITECTURE_DECISIONS.md](docs/ADR/ARCHITECTURE_DECISIONS.md).

---

## 10. License

License decision is currently pending architectural evaluation. Apache License 2.0 or MIT is recommended to foster open-source developer adoption while offering patent protections. See [LICENSE](LICENSE) for details.

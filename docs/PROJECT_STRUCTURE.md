# Project Structure & Directory Layout
**Product**: Voom Nexus — Vibe Security Tool  
**Architecture**: Monorepo with Native npm Workspaces  
**Document Version**: 1.0.0  

---

## 1. Monorepo Root Layout

```
voom-nexus/
├── .github/
│   └── workflows/
│       └── ci.yml               # Automated CI pipeline (lint, typecheck, test, build)
├── apps/
│   ├── cli/                     # Developer CLI application (binary: vibesec)
│   └── web/                     # Web dashboard frontend and API backend
├── packages/
│   ├── config/                  # Configuration loader and Zod schema validator
│   ├── core/                    # Scanning engine orchestrator & file walker
│   ├── parsers/                 # Language adapters and AST extraction
│   ├── reporting/               # Report formatters: Terminal, JSON, SARIF, Markdown
│   ├── rules/                   # Security detection rules and taxonomy definitions
│   └── shared/                  # Common domain models, types, constants, logger
├── docs/                        # Complete technical and architectural specifications
│   ├── ADR/                     # Architecture Decision Records
│   ├── API_SPECIFICATION.md
│   ├── CONFIGURATION_SPECIFICATION.md
│   ├── DATABASE_SCHEMA.md
│   ├── DEVELOPMENT_ROADMAP.md
│   ├── PRD.md
│   ├── PROJECT_OVERVIEW.md
│   ├── PROJECT_STRUCTURE.md
│   ├── SECURITY_RULES_SPECIFICATION.md
│   ├── SRS.md
│   ├── SYSTEM_ARCHITECTURE.md
│   ├── TECH_STACK.md
│   ├── TESTING_STRATEGY.md
│   └── THREAT_MODEL.md
├── CHANGELOG.md                 # Version history (Keep a Changelog)
├── CONTRIBUTING.md              # Contributor guidelines and workflow
├── LICENSE                      # License evaluation and status
├── OPEN_QUESTIONS.md            # Unresolved architectural decisions
├── README.md                    # Project overview and quickstart
├── SECURITY.md                  # Responsible vulnerability disclosure policy
├── SECURITY_CHECKLIST.md        # Security verification checklist
├── package.json                 # Monorepo root package definition & scripts
├── tsconfig.base.json           # Shared base TypeScript compiler options
└── tsconfig.json                # Project-wide TypeScript solution file
```

---

## 2. Directory Responsibilities

### `apps/cli`
- **Purpose**: The executable CLI utility installed globally or run via `npx vibesec`.
- **Key Modules**:
  - `src/index.ts`: Entrypoint and commander setup.
  - `src/commands/`: Command handlers (`scan.ts`, `verify.ts`, `init.ts`, `rules.ts`, `version.ts`).
  - `src/ui/`: Terminal banners, interactive prompts, and spinners.

### `apps/web`
- **Purpose**: Web application providing the project management dashboard, historical analytics, and RESTful API.
- **Key Modules**:
  - `src/app/` or `src/pages/`: Frontend pages and interactive UI components.
  - `src/server/`: API route controllers, authentication middleware, and database services.

### `packages/core`
- **Purpose**: The engine orchestrating the static analysis pipeline.
- **Key Modules**:
  - `src/scanner.ts`: Core `scanDirectory()` and `scanFile()` methods.
  - `src/walker.ts`: Directory tree traversal with ignore filter logic.
  - `src/pipeline.ts`: Pipeline steps (discovery, parsing, rule evaluation, redaction, aggregation).

### `packages/rules`
- **Purpose**: The repository of all vulnerability detection rules.
- **Key Modules**:
  - `src/registry.ts`: Rule registry and lookup engine.
  - `src/rules/javascript/`: JS/TS rules (SQLi, XSS, Command Injection, etc.).
  - `src/rules/generic/`: Hardcoded secrets and config checks.
  - `test/fixtures/`: Positive and negative test cases for every rule.

### `packages/parsers`
- **Purpose**: Language adapters that parse source code into tokens and AST trees.
- **Key Modules**:
  - `src/adapter.ts`: Base `LanguageAdapter` contract.
  - `src/javascript/`: Babel AST parser adapter.
  - `src/regex/`: Universal regular expression pattern matcher.

### `packages/reporting`
- **Purpose**: Converts scan findings into human-readable and machine-readable output formats.
- **Key Modules**:
  - `src/terminal.ts`: Colorized terminal output with code snippets.
  - `src/json.ts`: Structured JSON output.
  - `src/sarif.ts`: OASIS SARIF v2.1.0 standard serializer for CI/CD.
  - `src/markdown.ts`: Markdown summaries for PR comments and reports.

### `packages/config`
- **Purpose**: Validates project settings, CLI flags, and configuration files.
- **Key Modules**:
  - `src/schema.ts`: Zod schema for configuration.
  - `src/loader.ts`: Locates and parses `.voomsecrc.json` or `voom-nexus.config.json`.

### `packages/shared`
- **Purpose**: Zero-dependency shared utilities, domain types, and constants.
- **Key Modules**:
  - `src/types/`: TypeScript definitions (`SecurityIssue`, `ScanResult`, `Severity`).
  - `src/constants/`: CWE IDs, OWASP 2021 mappings, default exclude patterns.
  - `src/logger.ts`: Structured console and file logger.
  - `src/redact.ts`: High-speed in-memory secret masking utility.

# Product Requirements Document (PRD)
**Product**: Voom Nexus — Vibe Security Tool  
**Document Version**: 1.0.0  
**Status**: Initialized Foundation  

---

## 1. Product Goals

1. **Empower Developers to Code Securely**: Lower the barrier for individual developers and teams to identify and eliminate security risks early in the software development lifecycle (Shift-Left).
2. **Mitigate AI-Induced Insecurities**: Provide a proactive defense layer that teaches AI coding assistants not to generate known vulnerable patterns.
3. **Minimize Noise and False Positives**: Combine syntax-level AST pattern matching with contextual regex heuristics to produce high-confidence, actionable findings.
4. **Unified Multi-Interface Experience**: Deliver a single security brain accessible via a fast terminal CLI and a collaborative web platform.

---

## 2. Target Users & User Personas

### Persona A: "The Vibe Coder" (Alex)
- **Profile**: Full-stack developer building SaaS applications rapidly with Claude and Cursor.
- **Pain Point**: Moves too fast to manually review every generated line; fears deploying a hardcoded secret or an unescaped SQL query that leaks user data.
- **Goal**: Needs a 2-second CLI check before pushing to production and wants Cursor to stop suggesting vulnerable code.

### Persona B: "The Team Lead" (Priya)
- **Profile**: Engineering manager overseeing 6 developers and multiple microservices.
- **Pain Point**: Inconsistent code reviews; junior developers inadvertently introduce security regressions; lack of visibility into security debt across projects.
- **Goal**: Wants a central dashboard showing security trends, open vulnerabilities, and automated PR blocking for Critical severity issues.

### Persona C: "The Security Reviewer / Student" (Marcus)
- **Profile**: Security researcher, AppSec engineer, or computer science student.
- **Pain Point**: Needs clear CWE mapping, reproducible test cases, verifiable remediation steps, and standard SARIF outputs for auditing.
- **Goal**: Wants an extensible, modular rule system to write custom rules and inspect exact detection mechanics.

---

## 3. User Journeys

### Journey 1: Local Developer Scan & Immediate Remediation
```
[Developer edits code with AI] 
       │
       ▼
[Runs `vibesec scan .`]
       │
       ▼
[Terminal displays colorized findings with file, line, CWE, and fix snippet]
       │
       ▼
[Developer applies recommended fix or runs `vibesec scan --fix`]
       │
       ▼
[Runs `vibesec verify` -> Confirms 0 vulnerabilities remain -> Commits cleanly]
```

### Journey 2: AI Guardrail Onboarding
```
[Developer creates new repository]
       │
       ▼
[Runs `vibesec init --ai cursor --ai claude`]
       │
       ▼
[Voom Nexus generates .cursorrules and CLAUDE.md with hardened security rules]
       │
       ▼
[AI assistant references rules during prompt generation, outputting secure patterns by default]
```

### Journey 3: Team CI/CD & Dashboard Ingestion
```
[Developer opens Pull Request on GitHub]
       │
       ▼
[GitHub Actions runs `vibesec scan --format sarif --output report.sarif`]
       │
       ▼
[Scan results uploaded to GitHub Security tab and synchronized to Voom Nexus Web Dashboard]
       │
       ▼
[Team Lead reviews team dashboard: overall security health score updates in real-time]
```

---

## 4. Functional Requirements (FR)

### FR-1: Security Scanning Engine
- **FR-1.1**: Engine must parse source files and execute static rule evaluations without executing code.
- **FR-1.2**: Engine must support filtering by severity: `CRITICAL`, `HIGH`, `MEDIUM`, `LOW`, `INFORMATIONAL`.
- **FR-1.3**: Engine must report: rule ID, rule title, CWE ID, OWASP 2021 category, file path, line numbers, snippet, severity, confidence, and remediation guide.
- **FR-1.4**: Engine must redact discovered secrets and API keys in all outputs.

### FR-2: Multi-Language Extensibility
- **FR-2.1**: Modular language adapter interface capable of registering language file extensions, parser delegates, and rule sets.
- **FR-2.2**: Initial focus on JavaScript / TypeScript, with extensible contracts for Python, Java, Go, PHP, C#, Ruby, Rust.

### FR-3: CLI Application (`apps/cli`)
- **FR-3.1**: Subcommands: `scan`, `verify`, `init`, `report`, `rules`, `version`.
- **FR-3.2**: Output formats: Interactive terminal (Chalk/Ora), JSON (`--format json`), SARIF v2.1.0 (`--format sarif`), and Markdown.
- **FR-3.3**: Exit codes: Return non-zero exit code when issues meeting or exceeding `--threshold` (e.g., `high`) are detected.
- **FR-3.4**: Ignore mechanisms: Support `.voomsecignore` and inline ignore comments (e.g., `// voomsec-ignore-next-line <RULE-ID>`).

### FR-4: AI Assistant Instruction Generation
- **FR-4.1**: Command `vibesec init` generates tailored configuration files for Claude (`CLAUDE.md`), Cursor (`.cursorrules`), Windsurf (`.windsurfrules`), GitHub Copilot (`.github/copilot-instructions.md`), and Antigravity (`.agent/`).
- **FR-4.2**: Instructions must include explicit negative constraints (e.g., "Never use `eval()`", "Always use prepared statements for SQL").

### FR-5: Web Application & Dashboard (`apps/web`)
- **FR-5.1**: User authentication (Email/Password + JWT session management).
- **FR-5.2**: Project & repository management (create, list, configure scan targets).
- **FR-5.3**: Scan history tracking and differential comparison (compare Scan A vs Scan B).
- **FR-5.4**: Vulnerability detail views with remediation snippets and status toggles (Open, In Progress, Resolved, False Positive).
- **FR-5.5**: Organizational health score calculation based on open vulnerability count and severity weights.

---

## 5. Non-Functional Requirements (NFR)

- **NFR-1 (Performance)**: The CLI engine must scan a repository of 1,000 source files in under 5 seconds on standard developer hardware (M-series Mac or 8-core x86_64).
- **NFR-2 (Memory)**: Peak memory usage of the CLI scanner must not exceed 250 MB for typical codebases.
- **NFR-3 (Reliability & Determinism)**: The engine must produce identical findings across multiple runs against the same unchanged codebase.
- **NFR-4 (Safety & Isolation)**: Source code is analyzed in read-only mode. The engine must never execute or evaluate scanned code.
- **NFR-5 (Usability)**: Terminal error outputs must be clean, color-coded, and provide immediate remediation instructions.

---

## 6. Feature Prioritization (MoSCoW)

| Priority | Features |
| :--- | :--- |
| **Must Have (P0 - Foundation & MVP)** | Monorepo scaffolding, Shared core engine interface, AST/Regex rule execution pipeline, OWASP Top 10 rules for JS/TS, CLI `scan` and `init` commands, JSON/SARIF formatters, Comprehensive documentation. |
| **Should Have (P1 - Fast Follow)** | Auto-fix engine (`--fix`), baseline verification (`verify`), Python & Go language adapters, Web API scaffold, Web Dashboard MVP. |
| **Could Have (P2 - Advanced)** | Multi-tenant organization RBAC, GitHub App webhook integration for automated PR scanning, Cloud scan synchronization, Language Server Protocol (LSP) integration. |
| **Won't Have (Initial Release)** | Dynamic DAST fuzzing, automated binary reverse engineering, live network exploit verification. |

---

## 7. Success Metrics

1. **False Positive Rate**: < 5% on verified benchmark codebases.
2. **Scan Latency**: Average scan time under 3 ms per source file.
3. **Developer Actionability**: > 90% of reported vulnerabilities contain a valid, copy-pasteable remediation snippet.
4. **AI Assistant Adoption**: Successful generation of valid instruction files across all 5 major AI coding assistants.

# System Architecture Document
**Product**: Voom Nexus — Vibe Security Tool  
**Document Version**: 1.0.0  
**Status**: Architecture Approved  

---

## 1. High-Level Architectural Overview

Voom Nexus is structured as a **modular monorepo** containing two client applications (CLI and Web) powered by an independent, shared security analysis engine.

```mermaid
flowchart TD
    subgraph Clients["Primary Client Interfaces"]
        CLI["apps/cli (vibesec)"]
        WEB["apps/web (Dashboard & API)"]
    end

    subgraph CoreEngine["Shared Security Core"]
        ORCH["@voom-nexus/core<br/>(Scan Orchestrator)"]
        RULES["@voom-nexus/rules<br/>(Security Rule Registry)"]
        PARSERS["@voom-nexus/parsers<br/>(AST & Regex Adapters)"]
        CONFIG["@voom-nexus/config<br/>(Schema & Config Loader)"]
        REP["@voom-nexus/reporting<br/>(Formatters: SARIF, JSON, CLI)"]
        SHARED["@voom-nexus/shared<br/>(Types, Logger, CWE/OWASP)"]
    end

    subgraph Storage["Data & Persistence Layer"]
        DB[(PostgreSQL Database)]
        CACHE[(Redis Job Queue)]
        FS[(Local / S3 Artifact Storage)]
    end

    CLI -->|Invokes| ORCH
    CLI -->|Loads| CONFIG
    CLI -->|Renders with| REP

    WEB -->|Triggers async scans via| ORCH
    WEB -->|Persists reports to| DB
    WEB -->|Queues scans in| CACHE
    WEB -->|Stores SARIF in| FS

    ORCH -->|Evaluates| RULES
    ORCH -->|Dispatches files to| PARSERS
    ORCH -->|Formats results via| REP
    RULES -->|Uses| SHARED
    PARSERS -->|Uses| SHARED
```

---

## 2. Monorepo Package Boundaries & Responsibilities

| Package / App | Responsibility | Dependencies |
| :--- | :--- | :--- |
| **`apps/cli`** | Interactive terminal tool, argument parsing, spinner display, local file walking, exit codes. | `@voom-nexus/core`, `@voom-nexus/config`, `@voom-nexus/reporting`, `@voom-nexus/shared` |
| **`apps/web`** | Web dashboard frontend (React/Tailwind) & API server (Fastify/Node.js) for scan ingestion and reporting. | `@voom-nexus/core`, `@voom-nexus/reporting`, `@voom-nexus/shared` |
| **`packages/core`** | Scan pipeline orchestrator, file tree traverser, concurrent worker manager, finding aggregator. | `@voom-nexus/rules`, `@voom-nexus/parsers`, `@voom-nexus/shared` |
| **`packages/rules`** | Definitions, CWE/OWASP metadata, AST node matching logic, regex patterns, and remediation templates. | `@voom-nexus/shared` |
| **`packages/parsers`** | Language-specific AST parser adapters (Babel, Tree-sitter) and tokenizer abstractions. | `@voom-nexus/shared` |
| **`packages/config`** | Zod schema validation for `.voomsecrc.json`, `.voomsecignore`, and runtime options. | `@voom-nexus/shared` |
| **`packages/reporting`** | Report formatting drivers: Terminal Pretty-Print, JSON, SARIF v2.1.0, Markdown summary. | `@voom-nexus/shared` |
| **`packages/shared`** | Universal TypeScript types, severity enums, logger abstraction, redaction helpers. | *None (zero internal dependencies)* |

---

## 3. The Core Scan Pipeline (Orchestration Sequence)

The scanning process is deterministic and completely isolated from code execution:

```mermaid
sequenceDiagram
    autonumber
    actor Dev as Developer / CI Pipeline
    participant CLI as apps/cli
    participant Config as @voom-nexus/config
    participant Core as @voom-nexus/core (Orchestrator)
    participant Parsers as @voom-nexus/parsers
    participant Rules as @voom-nexus/rules
    participant Rep as @voom-nexus/reporting

    Dev->>CLI: vibesec scan ./src --severity high
    CLI->>Config: loadConfig(cwd)
    Config-->>CLI: validated Config options
    CLI->>Core: runScan({ path, config })
    
    rect rgb(240, 248, 255)
    Note over Core,Parsers: Pipeline Step 1: File Discovery & Filtering
    Core->>Core: Walk directory, apply .gitignore & .voomsecignore
    end

    rect rgb(255, 250, 240)
    Note over Core,Rules: Pipeline Step 2: Concurrent Multi-Language Scanning
    loop For each eligible source file
        Core->>Parsers: parseFile(filePath, content)
        Parsers-->>Core: AST Representation + Token Stream
        Core->>Rules: evaluateRules(ast, tokens, content)
        Rules-->>Core: Raw Vulnerability Findings
    end
    end

    rect rgb(240, 255, 240)
    Note over Core,Rep: Pipeline Step 3: Aggregation & Secret Redaction
    Core->>Core: Redact sensitive values (API keys, tokens)
    Core->>Core: Deduplicate and sort findings by severity
    Core-->>CLI: ScanResult (Issues, Metrics, Timing)
    end

    CLI->>Rep: formatReport(ScanResult, 'terminal')
    Rep-->>CLI: Formatted ANSI output
    CLI->>Dev: Render output & exit with status code
```

---

## 4. Language Adapter Architecture

To support 9+ programming languages without coupling, the parser architecture uses a unified adapter contract:

```mermaid
classDiagram
    class LanguageAdapter {
        <<interface>>
        +name: string
        +extensions: string[]
        +supportsAST: boolean
        +parse(content: string, options: ParseOptions): ParseResult
    }

    class JavaScriptAdapter {
        +parseBabelAST(content: string)
    }

    class PythonAdapter {
        +parseTreeSitterAST(content: string)
    }

    class GenericRegexAdapter {
        +evaluateRegexPatterns(content: string)
    }

    LanguageAdapter <|-- JavaScriptAdapter
    LanguageAdapter <|-- PythonAdapter
    LanguageAdapter <|-- GenericRegexAdapter
```

1. **AST-Capable Adapters**: Convert code into an Abstract Syntax Tree (AST), enabling precise syntactic queries (e.g., checking if `db.query()` receives a binary string concatenation instead of a parameterized variable).
2. **Regex/Heuristic Adapters**: Execute pre-compiled, ReDoS-safe regular expressions for languages where full AST overhead is unnecessary or during early-stage language rollout.

---

## 5. Web Application Architecture (`apps/web`)

The Web interface provides multi-project security governance:

```mermaid
flowchart LR
    subgraph Frontend["Web Client (Next.js / React)"]
        UI["Dashboard UI"]
        Viewer["Vulnerability Inspector"]
        Trends["Historical Trend Charts"]
    end

    subgraph API["Backend API (Fastify / Node.js)"]
        AuthMid["JWT & RBAC Middleware"]
        ScanCtrl["Scan Controller"]
        ProjCtrl["Project Controller"]
        ReportCtrl["Reporting Controller"]
    end

    subgraph Workers["Background Scan Workers"]
        Worker["Async Scanner Job"]
    end

    UI -->|HTTPS / REST API| AuthMid
    AuthMid --> ScanCtrl
    AuthMid --> ProjCtrl
    AuthMid --> ReportCtrl

    ScanCtrl -->|Enqueue Scan Job| Worker
    Worker -->|Execute Core Engine| Worker
    Worker -->|Save Findings| DB[(PostgreSQL)]
```

---

## 6. AI Assistant Security Guideline Integration

Voom Nexus injects defensive constraints into AI coding assistants using the `vibesec init` command:

```mermaid
flowchart TD
    InitCmd["vibesec init --ai [assistant]"]
    Engine["@voom-nexus/rules (Export AI Templates)"]
    
    InitCmd --> Engine
    Engine --> Claude["CLAUDE.md<br/>(Claude Code / Anthropic)"]
    Engine --> Cursor[".cursorrules<br/>(Cursor IDE)"]
    Engine --> Windsurf[".windsurfrules<br/>(Windsurf Cascade)"]
    Engine --> Copilot[".github/copilot-instructions.md<br/>(GitHub Copilot)"]
    Engine --> Antigravity[".agent/security-rules.md<br/>(Google Antigravity)"]
```

Each generated rule file translates OWASP Top 10 negative constraints into assistant-specific syntax, instructing LLMs to:
1. Always use parameterized queries for database operations.
2. Avoid `dangerouslySetInnerHTML`, `innerHTML`, and `eval()`.
3. Require cryptographic algorithms like `argon2id` and `AES-256-GCM`.
4. Refuse to generate raw hardcoded API keys or placeholder passwords.

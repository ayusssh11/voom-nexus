# Technology Stack Evaluation & Architectural Decisions
**Product**: Voom Nexus — Vibe Security Tool  
**Document Version**: 1.0.0  
**Status**: Evaluated & Selected  

---

## 1. Executive Summary & Selection Principles

Technologies for Voom Nexus are selected based on five objective criteria:
1. **Maintainability & Type Safety**: Unified TypeScript across CLI, Web, and Core Engine.
2. **Determinism & Security**: Zero runtime code execution, minimal unsafe dependencies, low attack surface.
3. **Performance**: High scanning throughput without C++ native compilation dependencies where possible.
4. **Developer Experience (DX)**: Rapid onboarding, standard tooling that runs on Node.js without requiring third-party runtimes.
5. **Code Sharing**: High reusability of security logic between CLI and Web Dashboard.

---

## 2. Technology Stack Matrix

| Layer / Component | Selected Technology | Alternative Evaluated | Justification |
| :--- | :--- | :--- | :--- |
| **Runtime** | **Node.js 20+ LTS** | Bun, Deno | Node.js 20 LTS provides rock-solid enterprise stability, native test runners, crypto APIs, and universal CI/CD compatibility. Bun was evaluated in the reference repo but lacks native availability on many developer systems and enterprise build agents. |
| **Language** | **TypeScript 5.7+** | Pure JavaScript, Go, Rust | TypeScript delivers compile-time type safety across packages and interfaces without sacrificing developer onboarding velocity. Rust/Go would require multi-platform binary compilation and separate rule engines for CLI vs Web. |
| **Monorepo / Workspaces** | **Native npm Workspaces** | Turborepo, pnpm, Nx | Native npm workspaces work out of the box with Node 20 and npm 10 without needing additional global tooling installations. Turborepo can be layered on later for caching. |
| **CLI Framework** | **Commander.js 12+** | Yargs, Oclif | Commander is lightweight, battle-tested, provides clean subcommand dispatching, and does not pull in heavy dependency trees. |
| **Terminal Styling** | **Chalk 5+ & Ora 8+** | Clack, Ink | Standard, ubiquitous, ESM-native terminal styling and spinners for interactive scanning. |
| **AST Parsing (JS/TS)** | **@babel/parser** | Tree-sitter, TypeScript Compiler API | `@babel/parser` provides the most mature, tolerant ECMAScript/TypeScript parsing with rich AST visitors (`@babel/traverse`) and zero native C++ binding rebuild failures. Tree-sitter is planned for Phase 2 polyglot expansion via WASM. |
| **Configuration Validation** | **Zod 3.23+** | Joi, Ajv | Type-safe schema validation where TypeScript types are automatically inferred from schemas (`z.infer<typeof ConfigSchema>`). |
| **Web Dashboard** | **Next.js 14+ (App Router)** | Vite SPA, Nuxt | Provides modern React Server Components, server actions, and rapid dashboard rendering in a single deployable package. |
| **Backend API** | **Fastify 4+** | Express.js, NestJS | Fastify offers 2x–4x the throughput of Express, built-in JSON schema serialization, and first-class async/await plugin architecture. |
| **Database** | **PostgreSQL 16+** | MongoDB, MySQL, SQLite | PostgreSQL provides native ACID transactions, powerful `JSONB` support for AST finding contexts, and battle-tested Row-Level Security for multi-tenancy. |
| **ORM / Data Access** | **Prisma / Kysely** | TypeORM, Sequelize | Type-safe query generation, automated schema migrations, and intuitive relational querying. |
| **Authentication** | **JWT + Argon2id** | Auth0, NextAuth | Self-hosted, privacy-first authentication without external SaaS vendor dependencies. |
| **Testing Harness** | **Vitest 2+ / Node Test** | Jest, Mocha | Fast ESM-native execution, compatible with Vite, near-instant TypeScript transpilation. |
| **Linting & Formatting** | **ESLint 9+ & Prettier** | Biome | Industry standard code style enforcement across TypeScript monorepo packages. |

---

## 3. In-Depth Architectural Evaluations

### 3.1 Why TypeScript Over Go/Rust for the Shared Engine?
While Go or Rust can provide microsecond-level raw CPU execution speed, using TypeScript allows:
1. **100% Shared Rule Definitions**: The exact same rule AST queries and detection logic run in the local CLI (`apps/cli`), the Web dashboard worker (`apps/web`), and even in-browser client-side demo playgrounds without code duplication.
2. **Ecosystem Familiarity**: The primary users of "vibe coding" tools are JavaScript, TypeScript, and full-stack developers. Writing security rules in TypeScript makes it trivial for the community to contribute new rules.

### 3.2 Why Not Rely on Bun as a Hard Prerequisite?
The reference repository `vibe-security` relied directly on `bun build` and `bun run` in `package.json`. However:
- Many enterprise environments, college lab machines, and default developer setups only have Node.js and npm installed.
- Requiring Bun as a hard dependency introduces unnecessary installation friction.
- Voom Nexus standardizes on standard Node.js 20 LTS tooling while maintaining code that remains 100% compatible with Bun if developers choose to use it.


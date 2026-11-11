# Contributing to Voom Nexus

Thank you for your interest in contributing to **Voom Nexus (Vibe Security Tool)**! This document outlines our development standards, processes, and policies.

---

## 1. Code of Conduct & Ethical Standards

Voom Nexus is an application security platform created to help developers defend their applications. Contributors must adhere to the highest ethical standards:
- **No Malicious Payloads**: Test cases and fixtures must only contain benign proofs-of-concept that trigger rule detection without causing external damage.
- **Privacy First**: Never commit real credentials, sensitive corporate IP, or real user data to test fixtures.

---

## 2. Development Setup

### Prerequisites
- **Node.js**: `>= 20.19.0`
- **npm**: `>= 10.0.0`
- **Git**: `>= 2.40.0`

### Setup Instructions
```bash
# Clone your fork
git clone https://github.com/<your-username>/voom-nexus.git
cd voom-nexus

# Install dependencies across all workspaces
npm install

# Verify build and tests
npm run typecheck
npm test
```

---

## 3. Branch Naming Conventions

All development must occur on dedicated branches cut from `main`. Use the following format:

`<category>/<short-description>`

Valid categories:
- `feat/` — New capability or rule (e.g., `feat/xss-detection-rule`)
- `fix/` — Bug fix or false-positive reduction (e.g., `fix/path-traversal-false-positive`)
- `docs/` — Documentation updates or additions (e.g., `docs/add-ast-parser-spec`)
- `refactor/` — Code refactoring without behavior change (e.g., `refactor/rule-engine-interfaces`)
- `perf/` — Performance optimization (e.g., `perf/streaming-file-reader`)
- `test/` — Adding or correcting tests (e.g., `test/sqli-csharp-fixtures`)
- `chore/` — Build process, dependency updates, maintenance (e.g., `chore/eslint-config-update`)

*Examples*:
- `feat/cwe-89-sql-injection-rule`
- `fix/cli-spinner-exit-code`

---

## 4. Commit Message Conventions

We enforce [Conventional Commits v1.0.0](https://www.conventionalcommits.org/):

```
<type>(<optional scope>): <description>

[optional body]

[optional footer(s)]
```

### Commit Types
- `feat`: A new feature or rule
- `fix`: A bug fix or false-positive remediation
- `docs`: Documentation only changes
- `style`: Changes that do not affect the meaning of the code (formatting, linting)
- `refactor`: A code change that neither fixes a bug nor adds a feature
- `perf`: A code change that improves performance
- `test`: Adding missing tests or correcting existing tests
- `chore`: Changes to build scripts, configurations, or tooling

*Example*:
```
feat(rules): add AST detection for prototype pollution in object assignments

Implements rule SEC-JS-014 to detect unsafe __proto__ and constructor.prototype
assignments in JavaScript and TypeScript AST trees.

Closes #42
```

---

## 5. Pull Request (PR) Process

1. **Self-Review**: Review your changes for readability, clean code practices, and adherence to security principles.
2. **Automated Checks**: Ensure all of the following commands pass locally before submitting:
   ```bash
   npm run lint
   npm run typecheck
   npm test
   npm run build
   ```
3. **PR Description**: Provide a clear explanation of:
   - What problem is solved.
   - What approach was chosen and why.
   - What testing was performed (including false-positive & false-negative checks).
   - Any relevant issue references (`Closes #XYZ`).
4. **Code Review**: At least one maintainer approval is required for all PRs.
5. **No Force Pushes to `main`**: All merges to `main` are squashed or rebased.

---

## 6. Testing Requirements

Quality is paramount for security tooling:
- **Unit Tests**: Every new function, utility, or class must have unit test coverage.
- **Rule Verification**: Any PR introducing a new security rule must provide:
  - **Positive Test Cases**: Code snippets that *must* trigger the rule (true positives).
  - **Negative Test Cases**: Secure equivalents or alternative implementations that *must not* trigger the rule (false positive prevention).
- **Determinism**: Scans must produce deterministic findings across multiple runs.

---

## 7. Security Contribution Guidelines

When authoring or modifying security detection rules:
- Map every rule to standard CWE and OWASP categories.
- Assign an accurate, conservative confidence score (`CERTAIN`, `FIRM`, `TENTATIVE`).
- Provide actionable, safe remediation snippets. Never recommend insecure workarounds (e.g., disabling SSL verification or turning off CSRF tokens).
- Ensure regular expressions are reviewed for Regular Expression Denial of Service (ReDoS) vulnerabilities.


# Voom Nexus — Viva Voce & Presentation Defense Guide

This guide prepares you for academic evaluation, project presentations, and oral examinations (viva voce). It covers high-frequency examiner questions, architectural decisions, and technical defense strategies.

---

## 🎯 Top 15 Viva Voce Questions & Model Answers

### Q1: What makes Voom Nexus "AI-Aware" compared to standard linters like ESLint or SonarQube?
**Answer**:
> *"Most traditional security scanners only analyze code post-facto ('shift-right'). Voom Nexus is AI-aware in two complementary ways:  
> 1. **Proactive AI Guardrail Injection**: Through `vibesec init --framework <name>`, it generates tailored instructions for AI assistants like Cursor (`.cursorrules`), Claude (`CLAUDE.md`), Copilot, and Google Antigravity. These instruct the AI's LLM on strict negative constraints (e.g., never generate unparameterized SQL, never import server secrets in Next.js `'use client'` files).  
> 2. **Remediation for AI-Generated Regressions**: It detects and auto-fixes the most common failure modes of AI coding tools—such as outdated cryptographic primitives (MD5/SHA1), raw string interpolations, and exposed API keys."*

---

### Q2: How does your scanning engine achieve sub-millisecond per file throughput (~0.87 ms/file)?
**Answer**:
> *"We achieved this through four deliberate architectural decisions:  
> 1. **Zero External Runtime Overhead**: Built purely on native Node.js 20 LTS primitives without heavy VM or JVM overhead.  
> 2. **Streaming Directory Traversal**: Asynchronous, non-blocking directory walking with inode-based cycle detection.  
> 3. **Early Binary Rejection**: Instead of regex matching huge binary files, `SafeFileReader` checks an initial 8KB chunk for null bytes (`\0`) and immediately bails out.  
> 4. **Linear Line-Stream Evaluation**: Rules evaluate against indexed source line streams without executing code, keeping CPU memory usage under 65MB."*

---

### Q3: Why did you build custom rules instead of just wrapping existing tools?
**Answer**:
> *"Wrapping third-party CLI tools creates external dependencies, version drift, and security risks (since external binaries could be tampered with). Writing our own modular rule engine in `@voom-nexus/rules` gives us full control over:  
> - Precise CWE and OWASP Top 10 mappings;  
> - Deterministic confidence scoring (`CERTAIN`, `HIGH`, `MEDIUM`);  
> - Direct integration with our `AutoFixer` remediation engine;  
> - Standardized SARIF v2.1.0 output formatting for GitHub Code Scanning."*

---

### Q4: How does your tool defend against malicious repositories (e.g. Zip Slip or Decompression Bombs)?
**Answer**:
> *"In accordance with our STRIDE threat model, we treat repository source code as untrusted input:  
> - **Zip Slip (CWE-22)**: `SafeArchiveExtractor` verifies `resolve(destinationDir, entry.path)` and rejects any entry whose relative path starts with `..`, is absolute, or escapes the target boundary.  
> - **Decompression Bombs**: We enforce a hard ceiling of 100MB cumulative uncompressed bytes and 2,000 maximum files per archive.  
> - **Infinite Symlink Loops**: `DirectoryWalker` tracks filesystem inode keys (`${dev}:${ino}`) to halt recursive cycles."*

---

### Q5: How does the Automated Remediation (`AutoFixer`) work without corrupting code?
**Answer**:
> *"The `AutoFixer` adheres to high-confidence deterministic patterns:  
> 1. It only targets verified, deterministic rules (such as MD5/SHA-1 replacement with SHA-256, or replacing `Math.random` with `crypto.randomBytes`).  
> 2. It groups modifications by file so each file is read and written atomically once.  
> 3. It supports a `--dry-run` flag so developers can preview exact diffs before committing changes to disk."*

---

### Q6: What is SARIF and why is it important in your project?
**Answer**:
> *"SARIF stands for **Static Analysis Results Interchange Format** (OASIS / ISO standard v2.1.0). By generating standardized SARIF reports (`--format sarif`), Voom Nexus findings natively integrate into GitHub's Security tab, VS Code, and GitLab without requiring custom plugins or parsers."*

---

### Q7: Explain your Project Health Score formula.
**Answer**:
> *"The Health Score represents the security hygiene of a repository on a scale of 0 to 100:  
> $$\text{Score} = \max(0, 100 - (25C + 10H + 4M + 1L))$$  
> Where $C, H, M, L$ are counts of Critical, High, Medium, and Low open vulnerabilities. Critical flaws deduct 25 points because even a single unparameterized SQLi poses severe risk. Furthermore, when an auditor triages a finding as `RESOLVED` or `FALSE_POSITIVE`, the score recalculates and rebounds in real-time."*

---

### Q8: What is Software Composition Analysis (SCA) and how does Voom Nexus implement it?
**Answer**:
> *"SCA focuses on third-party supply chain dependencies. In `packages/core/src/audit.ts`, our `DependencyAuditor` parses `package-lock.json` and evaluates installed packages against known CVE advisories (e.g., prototype pollution in `lodash`, SSRF in `axios`, malicious code in `event-stream`). It maps these to `CWE-1395` and `OWASP A06:2021`."*

---

## 🎬 5-Minute Live Demonstration Flow

| Step | What to Run | What to Explain to Evaluators |
| :---: | :--- | :--- |
| **1. Show Rules Taxonomy** | `node apps/cli/dist/index.js rules` | Highlight the 15 OWASP & CWE rules with severity and classification. |
| **2. Scan Vulnerable Testbed** | `node apps/cli/dist/index.js scan samples/vulnerable-app` | Show instant detection (5ms) of SQLi, Command Injection, Weak Hashes, and masked secrets (`sk****ef`). |
| **3. Show Auto-Fix Simulation** | `node apps/cli/dist/index.js scan samples/vulnerable-app --fix --dry-run` | Show simulated patches: upgrading MD5 to SHA-256 and enforcing password length. |
| **4. Show Supply Chain Audit** | `node apps/cli/dist/index.js audit samples/vulnerable-app` | Show detection of vulnerable third-party libraries (lodash, axios, event-stream). |
| **5. Show AI Guardrail Generation** | `node apps/cli/dist/index.js init ./my-demo --framework nextjs --ai all --force` | Show how `.cursorrules` and `CLAUDE.md` prevent AI coding assistants from introducing flaws. |
| **6. Show Web Dashboard** | `node apps/web/dist/index.js` (open `http://localhost:4000/dashboard`) | Show the live Health Score, project monitoring table, and REST API. |
| **7. Show Automated Test Suite** | `npm test` | Run all 74 unit, integration, and benchmark tests passing at 100% in ~350ms. |

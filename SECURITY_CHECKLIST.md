# Voom Nexus — Security & Compliance Checklist

This checklist tracks security controls, engineering standards, and defensive guarantees across the Voom Nexus platform (Engine, CLI, and Web Dashboard). It follows the OWASP Application Security Verification Standard (ASVS v4.0) and NIST SP 800-218 (Secure Software Development Framework).

---

## Status Legend
- [x] **Implemented**: Control is enforced and verified in code.
- [ ] **Planned**: Specified in architecture, scheduled in development roadmap.
- [~] **In Progress**: Active implementation underway.
- [N/A] **Not Applicable**: Not relevant to current architecture.

---

## 1. Application Security Architecture

- [x] **AS-01**: Define clear trust boundaries between CLI, Web, Engine, and scanned user code. *(Status: Implemented in docs/SYSTEM_ARCHITECTURE.md)*
- [x] **AS-02**: Enforce zero-execution policy for analyzed code (source code must be treated strictly as passive text/AST data). *(Status: Implemented in engine design)*
- [ ] **AS-03**: Implement resource limits (maximum file size, recursion limits, timeout per file) to prevent ReDoS or memory exhaustion during scanning. *(Status: Planned - Phase 1)*
- [ ] **AS-04**: Sandbox parser executions to isolate potential native parser crashes or vulnerabilities. *(Status: Planned - Phase 1)*

---

## 2. Authentication & Session Management (Web Platform)

- [ ] **AUTH-01**: Implement multi-factor authentication (MFA / TOTP) support for all web user accounts. *(Status: Planned - Phase 4)*
- [ ] **AUTH-02**: Store passwords using Argon2id or bcrypt (cost factor >= 12) with unique per-user cryptographic salts. *(Status: Planned - Phase 4)*
- [ ] **AUTH-03**: Issue short-lived JWT access tokens (15-minute lifespan) paired with cryptographically secure, rotating refresh tokens. *(Status: Planned - Phase 4)*
- [ ] **AUTH-04**: Bind session cookies with `HttpOnly`, `Secure`, and `SameSite=Strict` attributes. *(Status: Planned - Phase 4)*
- [ ] **AUTH-05**: Implement rate limiting on all authentication routes (login, registration, password reset) to prevent brute force attacks. *(Status: Planned - Phase 4)*
- [ ] **AUTH-06**: Invalidate all active sessions upon password change or account recovery. *(Status: Planned - Phase 4)*

---

## 3. Authorization & Multi-Tenancy

- [ ] **AUTHZ-01**: Enforce strict Role-Based Access Control (RBAC): Admin, Maintainer, Member, Auditor. *(Status: Planned - Phase 4)*
- [ ] **AUTHZ-02**: Apply tenant-scoping predicates on every database query to prevent Insecure Direct Object References (IDOR / BOLA). *(Status: Planned - Phase 4)*
- [ ] **AUTHZ-03**: Verify organization membership on all project, scan, and report retrieval endpoints. *(Status: Planned - Phase 4)*
- [ ] **AUTHZ-04**: Restrict CLI API token permissions with least-privilege scoping (e.g., `scans:write` without admin privileges). *(Status: Planned - Phase 4)*

---

## 4. Input Validation & Data Sanitization

- [x] **IV-01**: Define strict type schemas using Zod for all incoming CLI options and configuration files. *(Status: Implemented in `@voom-nexus/config`)*
- [ ] **IV-02**: Validate all HTTP incoming payloads against runtime validation schemas before executing controller logic. *(Status: Planned - Phase 4)*
- [ ] **IV-03**: Prevent Path Traversal (CWE-22) when resolving user-supplied file paths in the CLI scanner using `path.resolve` and boundary verification. *(Status: Planned - Phase 1)*
- [ ] **IV-04**: Reject or safely escape control characters in filenames and repository paths. *(Status: Planned - Phase 1)*

---

## 5. Output Encoding & Presentation Safety

- [ ] **OE-01**: Sanitize all scan findings before rendering in the Web UI to prevent Stored Cross-Site Scripting (XSS). *(Status: Planned - Phase 4)*
- [ ] **OE-02**: Escape ANSI escape sequences and terminal control characters when logging untrusted file contents in the CLI to prevent terminal injection. *(Status: Planned - Phase 1)*
- [ ] **OE-03**: Enforce strict Content Security Policy (CSP) headers on the Web Dashboard (`default-src 'self'`). *(Status: Planned - Phase 4)*

---

## 6. Database & Storage Security

- [ ] **DB-01**: Use parameterized queries / Object-Relational Mapping (Prisma / Kysely) for 100% of database interactions; prohibit raw string concatenation. *(Status: Planned - Phase 4)*
- [ ] **DB-02**: Encrypt database storage at rest using AES-256. *(Status: Planned - Phase 4)*
- [ ] **DB-03**: Enforce TLS 1.3 encryption for all database connections in transit. *(Status: Planned - Phase 4)*
- [ ] **DB-04**: Enforce automated daily encrypted database backups with point-in-time recovery testing. *(Status: Planned - Phase 8)*

---

## 7. API Security

- [ ] **API-01**: Require HTTPS for all external API endpoints with HSTS (`Strict-Transport-Security`) enabled. *(Status: Planned - Phase 4)*
- [ ] **API-02**: Implement token bucket rate limiting on public and authenticated API routes. *(Status: Planned - Phase 4)*
- [ ] **API-03**: Configure Cross-Origin Resource Sharing (CORS) with explicit origin whitelists; never use `Access-Control-Allow-Origin: *` for authenticated routes. *(Status: Planned - Phase 4)*
- [ ] **API-04**: Sanitize API error responses to prevent internal stack trace and infrastructure leakage (CWE-209). *(Status: Planned - Phase 4)*

---

## 8. File Upload & Archive Extraction Security

- [ ] **FU-01**: Validate archive file signatures (magic bytes) for ZIP/tar uploads rather than trusting MIME types or extensions. *(Status: Planned - Phase 5)*
- [ ] **FU-02**: Prevent Zip Slip vulnerabilities by verifying that every extracted entry resolves strictly within the designated target directory. *(Status: Planned - Phase 5)*
- [ ] **FU-03**: Defend against decompression bombs (Zip Bombs) by enforcing uncompressed size limits, ratio limits, and total file count thresholds. *(Status: Planned - Phase 5)*
- [ ] **FU-04**: Scan uploaded repositories in isolated, ephemeral disk locations and securely wipe files immediately after scanning. *(Status: Planned - Phase 5)*

---

## 9. Secrets Management & Privacy

- [x] **SM-01**: Redact discovered secrets (passwords, tokens, API keys) in memory and reports so sensitive credentials are never stored or logged in plaintext. *(Status: Implemented in engine rule specification)*
- [x] **SM-02**: Never commit real credentials, API tokens, or encryption keys into version control. Prohibit default credentials in `.env.example`. *(Status: Verified)*
- [ ] **SM-03**: Integrate with secret management solutions (e.g., HashiCorp Vault, AWS Secrets Manager, GitHub Secrets) for deployment environments. *(Status: Planned - Phase 8)*
- [ ] **SM-04**: Ensure source code analyzed locally by the CLI is never dispatched to cloud services without explicit, documented user confirmation. *(Status: Core architectural principle)*

---

## 10. Dependency & Supply Chain Security

- [x] **DEP-01**: Lock all direct and transitive dependency versions using package lockfiles (`package-lock.json`). *(Status: Implemented)*
- [ ] **DEP-02**: Integrate automated dependency vulnerability scanning (`npm audit`, Snyk, Dependabot) in continuous integration pipelines. *(Status: Planned - Phase 8)*
- [ ] **DEP-03**: Audit installed dependencies for integrity and provenance. *(Status: Planned - Phase 8)*
- [ ] **DEP-04**: Maintain a Software Bill of Materials (SBOM) in SPDX and CycloneDX formats. *(Status: Planned - Phase 8)*

---

## 11. Infrastructure, Cloud & Container Security

- [ ] **INF-01**: Run containerized services (Web, Worker) as non-root users with read-only root filesystems where practical. *(Status: Planned - Phase 8)*
- [ ] **INF-02**: Minimize container image attack surfaces using minimal base images (e.g., Chainguard or Alpine Linux). *(Status: Planned - Phase 8)*
- [ ] **INF-03**: Disable unnecessary ports, network interfaces, and container capabilities. *(Status: Planned - Phase 8)*

---

## 12. CI/CD Security

- [x] **CI-01**: Enforce automated branch protection on `main`, requiring passing CI checks (linting, typechecking, tests) before merging. *(Status: Implemented in .github/workflows/ci.yml)*
- [ ] **CI-02**: Run security scanners (SAST, secret scanning, dependency checking) on all pull requests. *(Status: Planned - Phase 8)*
- [ ] **CI-03**: Sign release binaries and npm packages cryptographically using Sigstore / npm provenance. *(Status: Planned - Phase 8)*

---

## 13. Logging, Monitoring & Auditability

- [x] **LOG-01**: Use structured JSON logging across all backend and CLI modules. *(Status: Implemented in `@voom-nexus/shared`)*
- [ ] **LOG-02**: Maintain tamper-resistant audit logs for all security-sensitive actions (user logins, role modifications, scan deletions, API key generation). *(Status: Planned - Phase 4)*
- [ ] **LOG-03**: Ensure logs are scrubbed of Personally Identifiable Information (PII) and secret tokens. *(Status: Planned - Phase 1)*

---

## 14. Secure Software Development Lifecycle (SSDLC)

- [x] **SDLC-01**: Require comprehensive documentation and Architecture Decision Records (ADR) prior to feature implementation. *(Status: Implemented)*
- [x] **SDLC-02**: Enforce peer code review for all code changes via pull requests. *(Status: Documented in CONTRIBUTING.md)*
- [x] **SDLC-03**: Establish a formal Responsible Vulnerability Disclosure policy and dedicated security contact. *(Status: Implemented in SECURITY.md)*

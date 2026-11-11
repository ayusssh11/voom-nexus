# Security Policy

The Voom Nexus project team takes the security of our software, dependencies, and users seriously. This document describes our vulnerability disclosure policy and reporting process.

---

## 1. Supported Versions

Security updates and patches are provided for the following releases:

| Version | Supported | Notes |
| :--- | :--- | :--- |
| `0.1.x` (current development) | :white_check_mark: | Active development & pre-release security patches |
| `< 0.1.0` | :x: | Legacy / unsupported prototypes |

---

## 2. Reporting a Vulnerability

**DO NOT report security vulnerabilities via public GitHub issues, discussions, or pull requests.**

If you discover a security vulnerability in Voom Nexus (including the CLI, core engine, rules, web dashboard, or backend services), please report it responsibly:

### Primary Reporting Channel
- **Email**: `security@voom-nexus.local` (Placeholder: maintainer contact)
- **Subject Line**: `[SECURITY VULNERABILITY] <Component>: <Brief Description>`
- **Encryption**: If sensitive details or credentials must be included, please request our PGP public key prior to transmission.

### Information to Include in Your Report
To help us triage and resolve the issue quickly, please provide:
1. **Description**: Clear description of the vulnerability and potential impact.
2. **Affected Component**: Specific package, CLI command, or API endpoint affected.
3. **Reproduction Steps**: Detailed, step-by-step instructions or minimal reproducible proof-of-concept (PoC).
4. **Environment**: Operating System, Node.js version, and Voom Nexus version.
5. **Mitigation**: Any proposed fix or workaround, if available.

---

## 3. Our Response Timeline & Commitment

When a report is received, the team commits to the following timetable:

- **Initial Acknowledgment**: Within **48 hours** of report receipt.
- **Triage & Validation**: Within **5 business days**, confirming severity, impact, and reproducability.
- **Fix Development & Testing**: Prioritized according to CVSS severity:
  - *Critical (CVSS 9.0 - 10.0)*: Patched within 7 days.
  - *High (CVSS 7.0 - 8.9)*: Patched within 14 days.
  - *Medium / Low (CVSS < 7.0)*: Patched in the next scheduled release.
- **Coordinated Disclosure**: We adhere to a 90-day responsible disclosure window before public publication, allowing affected users sufficient time to update.

---

## 4. Scope & Safe Harbor

We consider activities conducted under this policy to be authorized and in good faith:
- We will not pursue legal action against researchers who discover and report vulnerabilities in accordance with this policy.
- Testing must not disrupt service availability (DoS/DDoS) or access unauthorized user data.
- Testing should be conducted against local installations rather than shared staging or production environments.

Thank you for helping keep Voom Nexus and the developer community secure!

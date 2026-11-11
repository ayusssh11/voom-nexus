# Configuration Specification
**Product**: Voom Nexus — Vibe Security Tool  
**Document Version**: 1.0.0  
**Status**: Specification Standard  

---

## 1. Configuration File Discovery & Precedence

Voom Nexus automatically resolves configuration options using the following order of precedence (highest to lowest):

1. **CLI Command-Line Flags** (e.g. `--severity high --format json`)
2. **Environment Variables** (e.g. `VOOM_SEVERITY=HIGH`)
3. **Local Project Configuration**:
   - `.voomsecrc.json`
   - `.voomsecrc.yaml`
   - `voom-nexus.config.json`
4. **Built-in Secure Defaults**

---

## 2. Configuration Schema (`.voomsecrc.json`)

The configuration file is validated against a strict Zod schema:

```json
{
  "$schema": "https://voom-nexus.local/schemas/config.v1.json",
  "version": "1.0",
  "scan": {
    "paths": ["."],
    "exclude": [
      "**/node_modules/**",
      "**/dist/**",
      "**/build/**",
      "**/.git/**",
      "**/coverage/**"
    ],
    "severity": ["CRITICAL", "HIGH", "MEDIUM", "LOW"],
    "confidence": ["CERTAIN", "FIRM"],
    "threshold": "HIGH",
    "timeoutMs": 500
  },
  "rules": {
    "disable": ["SEC-JS-015"],
    "overrides": {
      "SEC-GEN-001": {
        "severity": "CRITICAL"
      }
    }
  },
  "reporting": {
    "format": "text",
    "output": null,
    "redactSecrets": true,
    "showRemediation": true
  },
  "ai": {
    "assistants": ["cursor", "claude"],
    "outputDirectory": "./"
  }
}
```

---

## 3. Ignore Patterns (`.voomsecignore`)

In addition to `.gitignore`, developers can place a `.voomsecignore` file in their repository root to exclude specific files or test fixtures from security scans.

Standard glob syntax is supported:
```
# Ignore test fixtures
test/fixtures/**
**/__mocks__/**

# Ignore auto-generated files
src/generated/**
*.bundle.js
```

---

## 4. Environment Variables Reference

| Variable | Description | Default |
| :--- | :--- | :--- |
| `VOOM_LOG_LEVEL` | Minimum logging verbosity (`debug`, `info`, `warn`, `error`) | `info` |
| `VOOM_NO_COLOR` | Disables ANSI color escapes in CLI output (respects `NO_COLOR`) | `false` |
| `VOOM_TIMEOUT_MS` | Max parsing timeout in milliseconds per file | `500` |
| `VOOM_API_ENDPOINT` | Web application API URL for scan report synchronization | `http://localhost:4000/api/v1` |
| `VOOM_API_TOKEN` | Bearer API token used to authenticate CLI requests | *None* |

---

## 5. Secure Defaults Policy

Voom Nexus operates with security-first defaults:
- **`redactSecrets` is always TRUE**: Passwords and keys are redacted by default; this cannot be disabled via CLI flags.
- **`threshold` defaults to `HIGH`**: In CI pipelines, any newly introduced `CRITICAL` or `HIGH` issues will exit with code `1`, preventing vulnerable merges.
- **Read-Only by default**: The CLI never modifies files unless `--fix` is passed with explicit interactive confirmation.


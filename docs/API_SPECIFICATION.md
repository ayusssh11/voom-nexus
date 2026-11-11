# Web Application REST API Specification
**Product**: Voom Nexus — Vibe Security Tool  
**API Version**: `v1` (Proposed / Specification Only)  
**Base URL**: `https://api.voom-nexus.local/api/v1`  
**Status**: Architecture Proposal — Marked as Planned, Not Yet Implemented  

---

## 1. Authentication & Security Headers

All protected endpoints require a Bearer token in the `Authorization` header:
```http
Authorization: Bearer <jwt_access_token>
```

### Standard Response Envelope
All API endpoints return JSON conforming to the standard envelope:
```json
{
  "success": true,
  "data": { ... },
  "error": null,
  "meta": {
    "timestamp": "2026-11-11T14:40:00Z",
    "requestId": "req_01h8x9p3b..."
  }
}
```

---

## 2. Authentication Endpoints

### 2.1 `POST /auth/register`
Creates a new user account and personal organization.
- **Request**:
```json
{
  "email": "developer@example.com",
  "password": "CorrectHorseBatteryStaple!2026",
  "fullName": "Alex Rivera",
  "organizationName": "Acme Engineering"
}
```
- **Response (201 Created)**:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "u_948a3c20...",
      "email": "developer@example.com",
      "fullName": "Alex Rivera"
    },
    "token": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

### 2.2 `POST /auth/login`
Authenticates user and returns JWT access & refresh tokens.

---

## 3. Project Management Endpoints

### 3.1 `GET /projects`
Lists all projects accessible to the authenticated user within their organization.
- **Query Params**: `page=1&limit=20&search=frontend`
- **Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "projects": [
      {
        "id": "proj_a1b2c3d4",
        "name": "E-Commerce Frontend",
        "slug": "ecommerce-frontend",
        "repositoryUrl": "https://github.com/acme/frontend",
        "defaultBranch": "main",
        "healthScore": 88,
        "lastScanAt": "2026-11-10T19:30:00Z",
        "openIssuesCount": {
          "critical": 0,
          "high": 2,
          "medium": 5,
          "low": 3
        }
      }
    ],
    "pagination": {
      "total": 1,
      "page": 1,
      "limit": 20
    }
  }
}
```

### 3.2 `POST /projects`
Creates a new monitored project.

---

## 4. Scan Orchestration Endpoints

### 4.1 `POST /projects/:projectId/scans`
Submits a scan result or initiates a remote scan.
- **Request**:
```json
{
  "scanType": "CLI_LOCAL",
  "branch": "main",
  "commitSha": "c070492...",
  "totalFiles": 142,
  "durationMs": 1840,
  "findings": [
    {
      "ruleId": "SEC-JS-001",
      "filePath": "src/controllers/user.ts",
      "lineStart": 42,
      "lineEnd": 44,
      "severity": "CRITICAL",
      "confidence": "CERTAIN",
      "snippetRedacted": "db.query(`SELECT * FROM users WHERE id = '${userId}'`)",
      "cwe": "CWE-89",
      "owasp": "A03:2021-Injection"
    }
  ]
}
```
- **Response (202 Accepted)**:
```json
{
  "success": true,
  "data": {
    "scanId": "scan_88f910a...",
    "status": "COMPLETED",
    "totalIssues": 1,
    "healthScoreDelta": -12
  }
}
```

### 4.2 `GET /scans/:scanId`
Retrieves detailed results, timing, and finding summaries for a specific scan.

---

## 5. Vulnerability Findings & Remediation

### 5.1 `GET /scans/:scanId/findings`
Lists findings for a scan with filtering options.
- **Query Params**: `severity=CRITICAL,HIGH&status=OPEN`

### 5.2 `PATCH /findings/:findingId/status`
Updates status of a finding (e.g. mark as False Positive or Fixed).
- **Request**:
```json
{
  "status": "FALSE_POSITIVE",
  "reason": "Input is sanitized by custom WAF middleware upstream."
}
```
- **Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "findingId": "find_19472...",
    "status": "FALSE_POSITIVE",
    "auditRecordId": "aud_091823..."
  }
}
```

---

## 6. Reports & Export Endpoints

### 6.1 `GET /scans/:scanId/export?format=sarif`
Exports the complete scan report in OASIS SARIF v2.1.0 standard format for ingestion into GitHub Advanced Security, GitLab Security Dashboard, or SonarQube.

### 6.2 `GET /scans/:scanId/export?format=json`
Exports machine-readable raw JSON findings.

---

## 7. Error Handling Standard
When an error occurs, the server responds with a structured error payload:
```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "Field 'severity' must be one of: CRITICAL, HIGH, MEDIUM, LOW, INFORMATIONAL",
    "details": [
      {
        "field": "severity",
        "issue": "Invalid enum value"
      }
    ]
  },
  "meta": {
    "timestamp": "2026-11-11T14:41:00Z",
    "requestId": "req_err_09183"
  }
}
```

import test from 'node:test';
import assert from 'node:assert/strict';
import { VoomWebServer, MemoryDataStore, webPlatformService } from '../dist/index.js';

test('WebPlatformService exposes valid online status', () => {
  const status = webPlatformService.getStatus();
  assert.strictEqual(status.version, '0.1.0-alpha.0');
  assert.strictEqual(status.status, 'ONLINE');
});

test('GET /api/v1/health returns system status', async () => {
  const server = new VoomWebServer(new MemoryDataStore());
  const res = await server.inject('GET', '/api/v1/health');
  assert.strictEqual(res.statusCode, 200);
  const data = res.json();
  assert.strictEqual(data.success, true);
  assert.strictEqual(data.data.status, 'ONLINE');
});

test('POST /api/v1/auth/login authenticates valid user', async () => {
  const server = new VoomWebServer(new MemoryDataStore());
  const res = await server.inject('POST', '/api/v1/auth/login', {
    email: 'admin@voom-nexus.local',
    password: 'password123'
  });
  assert.strictEqual(res.statusCode, 200);
  const data = res.json();
  assert.strictEqual(data.success, true);
  assert.ok(data.data.token);
  assert.strictEqual(data.data.user.email, 'admin@voom-nexus.local');
});

test('POST and GET /api/v1/projects manages project records', async () => {
  const server = new VoomWebServer(new MemoryDataStore());
  // Create project
  const createRes = await server.inject('POST', '/api/v1/projects', {
    name: 'Banking API Gateway',
    repositoryUrl: 'https://github.com/voom/banking'
  });
  assert.strictEqual(createRes.statusCode, 201);
  const created = createRes.json().data;
  assert.ok(created.id);
  assert.strictEqual(created.name, 'Banking API Gateway');
  assert.strictEqual(created.healthScore, 100);

  // List projects
  const listRes = await server.inject('GET', '/api/v1/projects');
  assert.strictEqual(listRes.statusCode, 200);
  const list = listRes.json().data.projects;
  assert.ok(list.some((p) => p.name === 'Banking API Gateway'));
});

test('POST /api/v1/projects/:id/scans ingests findings and updates health score', async () => {
  const store = new MemoryDataStore();
  const server = new VoomWebServer(store);
  const project = store.createProject('Test Ingest Project');

  // Submit scan with 1 critical issue
  const scanPayload = {
    scanId: 'scan_unit_01',
    targetPath: './src',
    metrics: {
      totalFiles: 20,
      scannedFiles: 20,
      skippedFiles: 0,
      totalIssues: 1,
      criticalCount: 1,
      highCount: 0,
      mediumCount: 0,
      lowCount: 0,
      infoCount: 0,
      durationMs: 15
    },
    findings: [
      {
        id: 'find_01',
        ruleId: 'SEC-JS-001',
        title: 'SQL Injection',
        severity: 'CRITICAL',
        confidence: 'CERTAIN',
        cwe: 'CWE-89',
        owasp: 'A03:2021-Injection',
        file: 'src/db.ts',
        line: 12,
        snippet: 'SELECT * FROM users',
        remediation: 'Use parameters'
      }
    ]
  };

  const res = await server.inject('POST', `/api/v1/projects/${project.id}/scans`, scanPayload);
  assert.strictEqual(res.statusCode, 202);
  const data = res.json().data;
  assert.strictEqual(data.totalIssues, 1);
  assert.strictEqual(data.projectHealthScore, 75); // 100 - 25 for critical

  // Verify SARIF export
  const exportRes = await server.inject('GET', `/api/v1/scans/${data.scanId}/export?format=sarif`);
  assert.strictEqual(exportRes.statusCode, 200);
  const sarif = exportRes.json();
  assert.strictEqual(sarif.version, '2.1.0');
  assert.strictEqual(sarif.runs[0].results.length, 1);

  // Update finding status
  const patchRes = await server.inject('PATCH', '/api/v1/findings/find_01/status', {
    status: 'FALSE_POSITIVE',
    reason: 'Sanitized upstream'
  });
  assert.strictEqual(patchRes.statusCode, 200);
  assert.strictEqual(patchRes.json().data.status, 'FALSE_POSITIVE');
});

test('GET /dashboard renders responsive HTML dashboard', async () => {
  const server = new VoomWebServer(new MemoryDataStore());
  const res = await server.inject('GET', '/dashboard');
  assert.strictEqual(res.statusCode, 200);
  assert.ok(res.headers['content-type']?.includes('text/html'));
  assert.ok(res.body.includes('VOOM NEXUS'));
  assert.ok(res.body.includes('Monitored Applications & Repositories'));
});

test('POST /api/v1/projects/:id/queue-scan enqueues background scan and updates job status', async () => {
  const store = new MemoryDataStore();
  const server = new VoomWebServer(store);
  const project = store.createProject('Async Worker Project');

  // Enqueue job
  const enqueueRes = await server.inject('POST', `/api/v1/projects/${project.id}/queue-scan`, {
    targetPath: './packages/core/src'
  });

  assert.strictEqual(enqueueRes.statusCode, 202);
  const jobInfo = enqueueRes.json().data;
  assert.ok(jobInfo.jobId);
  assert.strictEqual(jobInfo.projectId, project.id);
  assert.strictEqual(jobInfo.status, 'QUEUED');

  // Get job immediately
  const getJobRes = await server.inject('GET', `/api/v1/jobs/${jobInfo.jobId}`);
  assert.strictEqual(getJobRes.statusCode, 200);
  const fetchedJob = getJobRes.json().data;
  assert.strictEqual(fetchedJob.id, jobInfo.jobId);

  // List jobs
  const listJobsRes = await server.inject('GET', '/api/v1/jobs');
  assert.strictEqual(listJobsRes.statusCode, 200);
  assert.ok(listJobsRes.json().data.total >= 1);

  // Allow async worker tick to run
  await new Promise((resolve) => setTimeout(resolve, 200));

  // Verify completed job
  const completedJobRes = await server.inject('GET', `/api/v1/jobs/${jobInfo.jobId}`);
  assert.strictEqual(completedJobRes.statusCode, 200);
  const jobState = completedJobRes.json().data;
  assert.ok(jobState.status === 'COMPLETED' || jobState.status === 'RUNNING');
});

test('GET /api/v1/findings and /api/v1/audit-logs support filtering and compliance tracking', async () => {
  const store = new MemoryDataStore();
  const server = new VoomWebServer(store);
  const project = store.createProject('FinTech Core');

  const scanPayload = {
    scanId: 'scan_fintech_01',
    targetPath: './src',
    metrics: {
      totalFiles: 5,
      scannedFiles: 5,
      skippedFiles: 0,
      totalIssues: 1,
      criticalCount: 1,
      highCount: 0,
      mediumCount: 0,
      lowCount: 0,
      infoCount: 0,
      durationMs: 5
    },
    findings: [
      {
        id: 'find_sqli_100',
        ruleId: 'SEC-JS-001',
        title: 'SQL Injection',
        severity: 'CRITICAL',
        confidence: 'CERTAIN',
        cwe: 'CWE-89',
        owasp: 'A03',
        file: 'src/account.ts',
        line: 42,
        snippet: 'SELECT * FROM accounts',
        remediation: 'Use prepared statements'
      }
    ]
  };

  await server.inject('POST', `/api/v1/projects/${project.id}/scans`, scanPayload);

  // Initial health score should be 75 (100 - 25 for critical)
  assert.strictEqual(store.getProject(project.id)?.healthScore, 75);

  // List findings
  const findingsRes = await server.inject('GET', `/api/v1/findings?projectId=${project.id}`);
  assert.strictEqual(findingsRes.statusCode, 200);
  const findings = findingsRes.json().data.findings;
  assert.strictEqual(findings.length, 1);
  assert.strictEqual(findings[0].id, 'find_sqli_100');

  // Mark finding as RESOLVED
  const resolveRes = await server.inject('PATCH', '/api/v1/findings/find_sqli_100/status', {
    status: 'RESOLVED',
    reason: 'Parameterized query applied via AutoFixer'
  });
  assert.strictEqual(resolveRes.statusCode, 200);

  // Health score should automatically rebound to 100
  assert.strictEqual(store.getProject(project.id)?.healthScore, 100);

  // Check audit log
  const auditRes = await server.inject('GET', '/api/v1/audit-logs');
  assert.strictEqual(auditRes.statusCode, 200);
  const logs = auditRes.json().data.logs;
  assert.ok(logs.some((l) => l.action === 'FINDING_STATUS_UPDATED' && l.entityId === 'find_sqli_100'));
});

test('GET /api/v1/ai/guidelines serves tailored assistant directives', async () => {
  const server = new VoomWebServer(new MemoryDataStore());

  // Request Cursor rules for Next.js
  const nextRes = await server.inject('GET', '/api/v1/ai/guidelines?framework=nextjs&ai=cursor');
  assert.strictEqual(nextRes.statusCode, 200);
  const nextData = nextRes.json().data;
  assert.strictEqual(nextData.framework, 'nextjs');
  assert.strictEqual(nextData.assistant, 'cursor');
  assert.ok(nextData.content.includes('Next.js (App Router & Server Components) Security Guardrails'));

  // Request Claude guidelines for Express
  const expressRes = await server.inject('GET', '/api/v1/ai/guidelines?framework=express&ai=claude');
  assert.strictEqual(expressRes.statusCode, 200);
  const expressData = expressRes.json().data;
  assert.strictEqual(expressData.framework, 'express');
  assert.strictEqual(expressData.assistant, 'claude');
  assert.ok(expressData.content.includes('Express.js & Node.js REST API Security Guardrails'));
});

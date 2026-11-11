import { IncomingMessage, ServerResponse } from 'node:http';
import { URL } from 'node:url';
import { randomUUID } from 'node:crypto';
import { MemoryDataStore } from '../store/data-store.js';
import { ScanJobQueue } from '../services/queue.js';
import { renderDashboardHtml } from '../ui/dashboard.js';
import { SarifReportFormatter, JsonReportFormatter } from '@voom-nexus/reporting';

export interface RouteContext {
  req: IncomingMessage;
  res: ServerResponse;
  url: URL;
  store: MemoryDataStore;
  queue?: ScanJobQueue;
  body?: any;
}

export async function handleRequest(
  req: IncomingMessage,
  res: ServerResponse,
  store: MemoryDataStore,
  queue?: ScanJobQueue
): Promise<void> {
  const host = req.headers.host || 'localhost:4000';
  const url = new URL(req.url || '/', `http://${host}`);
  const pathname = url.pathname;
  const method = (req.method || 'GET').toUpperCase();

  // Read request body if present
  let body: any = null;
  if (method === 'POST' || method === 'PUT' || method === 'PATCH') {
    try {
      body = await readJsonBody(req);
    } catch {
      return sendJson(res, 400, {
        success: false,
        data: null,
        error: { code: 'INVALID_JSON', message: 'Malformed JSON payload' }
      });
    }
  }

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  // 1. Dashboard UI
  if (method === 'GET' && (pathname === '/' || pathname === '/dashboard')) {
    const html = renderDashboardHtml(store);
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.end(html);
    return;
  }

  // 2. Health Endpoint
  if (method === 'GET' && pathname === '/api/v1/health') {
    return sendJson(res, 200, {
      success: true,
      data: {
        service: 'Voom Nexus Web & API Platform',
        version: '0.1.0-alpha.0',
        status: 'ONLINE',
        sharedEngineVersion: '0.1.0-alpha.0',
        timestamp: new Date().toISOString()
      }
    });
  }

  // 3. Auth Login Endpoint
  if (method === 'POST' && pathname === '/api/v1/auth/login') {
    const email = body?.email;
    const password = body?.password;

    if (!email || !password) {
      return sendJson(res, 400, {
        success: false,
        data: null,
        error: { code: 'VALIDATION_FAILED', message: 'Email and password are required' }
      });
    }

    return sendJson(res, 200, {
      success: true,
      data: {
        token: `mock_jwt_token_${Buffer.from(email).toString('base64')}`,
        user: {
          id: 'u_default_admin',
          email,
          role: 'ADMIN'
        }
      }
    });
  }

  // 4. Projects Endpoints
  if (method === 'GET' && pathname === '/api/v1/projects') {
    const projects = store.listProjects();
    return sendJson(res, 200, {
      success: true,
      data: { projects, total: projects.length }
    });
  }

  if (method === 'POST' && pathname === '/api/v1/projects') {
    const name = body?.name;
    if (!name) {
      return sendJson(res, 400, {
        success: false,
        data: null,
        error: { code: 'VALIDATION_FAILED', message: 'Project name is required' }
      });
    }

    const project = store.createProject(name, body.repositoryUrl, body.defaultBranch);
    return sendJson(res, 201, {
      success: true,
      data: project
    });
  }

  // 5. Asynchronous Scan Queueing: POST /api/v1/projects/:projectId/queue-scan
  const queueScanMatch = pathname.match(/^\/api\/v1\/projects\/([^/]+)\/queue-scan$/);
  if (method === 'POST' && queueScanMatch) {
    const projectId = queueScanMatch[1];
    const project = store.getProject(projectId);
    if (!project) {
      return sendJson(res, 404, {
        success: false,
        data: null,
        error: { code: 'NOT_FOUND', message: `Project ${projectId} not found` }
      });
    }

    const targetPath = body?.targetPath || '.';
    if (!queue) {
      return sendJson(res, 503, {
        success: false,
        data: null,
        error: { code: 'QUEUE_UNAVAILABLE', message: 'Background queue is not initialized' }
      });
    }

    const job = queue.enqueue(projectId, targetPath);
    return sendJson(res, 202, {
      success: true,
      data: {
        jobId: job.id,
        projectId: job.projectId,
        status: job.status,
        createdAt: job.createdAt
      }
    });
  }

  // 6. Project Ingest Scan Endpoint: POST /api/v1/projects/:projectId/scans
  const projectScanMatch = pathname.match(/^\/api\/v1\/projects\/([^/]+)\/scans$/);
  if (method === 'POST' && projectScanMatch) {
    const projectId = projectScanMatch[1];
    const project = store.getProject(projectId);
    if (!project) {
      return sendJson(res, 404, {
        success: false,
        data: null,
        error: { code: 'NOT_FOUND', message: `Project ${projectId} not found` }
      });
    }

    const scanData = body || {};
    const storedScan = store.recordScan(projectId, {
      scanId: scanData.scanId || `scan_${randomUUID().slice(0, 8)}`,
      targetPath: scanData.targetPath || project.name,
      timestamp: scanData.timestamp || new Date().toISOString(),
      metrics: scanData.metrics || {
        totalFiles: scanData.totalFiles || 0,
        scannedFiles: scanData.totalFiles || 0,
        skippedFiles: 0,
        totalIssues: (scanData.findings || []).length,
        criticalCount: 0,
        highCount: 0,
        mediumCount: 0,
        lowCount: 0,
        infoCount: 0,
        durationMs: scanData.durationMs || 0
      },
      issues: scanData.findings || []
    });

    return sendJson(res, 202, {
      success: true,
      data: {
        scanId: storedScan.id,
        status: storedScan.status,
        totalIssues: storedScan.totalIssues,
        projectHealthScore: project.healthScore
      }
    });
  }

  // 7. Background Job Status: GET /api/v1/jobs/:jobId
  const jobMatch = pathname.match(/^\/api\/v1\/jobs\/([^/]+)$/);
  if (method === 'GET' && jobMatch) {
    const jobId = jobMatch[1];
    if (!queue) {
      return sendJson(res, 503, {
        success: false,
        data: null,
        error: { code: 'QUEUE_UNAVAILABLE', message: 'Background queue is not initialized' }
      });
    }

    const job = queue.getJob(jobId);
    if (!job) {
      return sendJson(res, 404, {
        success: false,
        data: null,
        error: { code: 'NOT_FOUND', message: `Job ${jobId} not found` }
      });
    }

    return sendJson(res, 200, {
      success: true,
      data: job
    });
  }

  if (method === 'GET' && pathname === '/api/v1/jobs') {
    const jobs = queue ? queue.listJobs() : [];
    return sendJson(res, 200, {
      success: true,
      data: { jobs, total: jobs.length }
    });
  }

  // 8. Scan Details: GET /api/v1/scans/:scanId
  const scanMatch = pathname.match(/^\/api\/v1\/scans\/([^/]+)$/);
  if (method === 'GET' && scanMatch) {
    const scanId = scanMatch[1];
    const scan = store.getScan(scanId);
    if (!scan) {
      return sendJson(res, 404, {
        success: false,
        data: null,
        error: { code: 'NOT_FOUND', message: `Scan ${scanId} not found` }
      });
    }

    return sendJson(res, 200, {
      success: true,
      data: scan
    });
  }

  // 9. Scan Export: GET /api/v1/scans/:scanId/export
  const exportMatch = pathname.match(/^\/api\/v1\/scans\/([^/]+)\/export$/);
  if (method === 'GET' && exportMatch) {
    const scanId = exportMatch[1];
    const scan = store.getScan(scanId);
    if (!scan) {
      return sendJson(res, 404, {
        success: false,
        data: null,
        error: { code: 'NOT_FOUND', message: `Scan ${scanId} not found` }
      });
    }

    const format = url.searchParams.get('format') || 'sarif';
    const scanResult = {
      scanId: scan.id,
      targetPath: scan.projectId,
      timestamp: scan.createdAt,
      metrics: {
        totalFiles: scan.totalFiles,
        scannedFiles: scan.totalFiles,
        skippedFiles: 0,
        totalIssues: scan.totalIssues,
        criticalCount: scan.criticalCount,
        highCount: scan.highCount,
        mediumCount: scan.mediumCount,
        lowCount: scan.lowCount,
        infoCount: 0,
        durationMs: scan.durationMs
      },
      issues: scan.findings
    };

    if (format === 'sarif') {
      const formatter = new SarifReportFormatter();
      const sarif = formatter.format(scanResult);
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(sarif);
      return;
    } else {
      const formatter = new JsonReportFormatter();
      const json = formatter.format(scanResult);
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(json);
      return;
    }
  }

  // 10. Finding Status Update: PATCH /api/v1/findings/:findingId/status
  const findingMatch = pathname.match(/^\/api\/v1\/findings\/([^/]+)\/status$/);
  if (method === 'PATCH' && findingMatch) {
    const findingId = findingMatch[1];
    const status = body?.status;
    const reason = body?.reason;

    if (!status) {
      return sendJson(res, 400, {
        success: false,
        data: null,
        error: { code: 'VALIDATION_FAILED', message: 'Status is required' }
      });
    }

    const updated = store.updateFindingStatus(findingId, status, reason);
    if (!updated) {
      return sendJson(res, 404, {
        success: false,
        data: null,
        error: { code: 'NOT_FOUND', message: `Finding ${findingId} not found` }
      });
    }

    return sendJson(res, 200, {
      success: true,
      data: {
        findingId: updated.id,
        status: updated.status,
        updatedAt: new Date().toISOString()
      }
    });
  }

  // 11. List Findings: GET /api/v1/findings
  if (method === 'GET' && pathname === '/api/v1/findings') {
    const status = url.searchParams.get('status') as any;
    const projectId = url.searchParams.get('projectId') || undefined;
    const findings = store.listFindings({ status, projectId });

    return sendJson(res, 200, {
      success: true,
      data: {
        findings,
        total: findings.length
      }
    });
  }

  // 12. Audit Logs: GET /api/v1/audit-logs
  if (method === 'GET' && pathname === '/api/v1/audit-logs') {
    const logs = store.getAuditLogs();
    return sendJson(res, 200, {
      success: true,
      data: {
        logs,
        total: logs.length
      }
    });
  }

  // Fallback 404
  return sendJson(res, 404, {
    success: false,
    data: null,
    error: { code: 'NOT_FOUND', message: `Route ${method} ${pathname} not found` }
  });
}

function sendJson(res: ServerResponse, statusCode: number, payload: any) {
  const envelope = {
    ...payload,
    meta: {
      timestamp: new Date().toISOString(),
      requestId: `req_${randomUUID().slice(0, 8)}`
    }
  };

  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(envelope, null, 2));
}

async function readJsonBody(req: IncomingMessage): Promise<any> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', () => {
      if (!body.trim()) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', (err) => reject(err));
  });
}

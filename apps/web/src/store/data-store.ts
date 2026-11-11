import { randomUUID } from 'node:crypto';
import { ScanResult, SecurityIssue, Severity, FindingStatus } from '@voom-nexus/shared';

export interface ProjectRecord {
  id: string;
  orgId: string;
  name: string;
  slug: string;
  repositoryUrl: string;
  defaultBranch: string;
  healthScore: number;
  createdAt: string;
  openIssuesCount: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
}

export interface StoredScanRecord {
  id: string;
  projectId: string;
  scanType: string;
  status: string;
  totalFiles: number;
  totalIssues: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  durationMs: number;
  createdAt: string;
  findings: SecurityIssue[];
}

export interface AuditRecord {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  userId?: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export class MemoryDataStore {
  private projects: Map<string, ProjectRecord> = new Map();
  private scans: Map<string, StoredScanRecord> = new Map();
  private findings: Map<string, SecurityIssue> = new Map();
  private auditLogs: AuditRecord[] = [];

  constructor() {
    this.seedDefaultData();
  }

  private seedDefaultData() {
    const defaultProject: ProjectRecord = {
      id: 'proj_demo_01',
      orgId: 'org_default',
      name: 'E-Commerce Platform',
      slug: 'ecommerce-platform',
      repositoryUrl: 'https://github.com/voom-nexus/demo-app',
      defaultBranch: 'main',
      healthScore: 92,
      createdAt: new Date().toISOString(),
      openIssuesCount: {
        critical: 0,
        high: 1,
        medium: 2,
        low: 1
      }
    };
    this.projects.set(defaultProject.id, defaultProject);
  }

  createProject(name: string, repositoryUrl = '', defaultBranch = 'main'): ProjectRecord {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const project: ProjectRecord = {
      id: `proj_${randomUUID().slice(0, 8)}`,
      orgId: 'org_default',
      name,
      slug,
      repositoryUrl,
      defaultBranch,
      healthScore: 100,
      createdAt: new Date().toISOString(),
      openIssuesCount: { critical: 0, high: 0, medium: 0, low: 0 }
    };
    this.projects.set(project.id, project);
    this.logAudit('PROJECT_CREATED', 'project', project.id, { name, slug });
    return project;
  }

  getProject(id: string): ProjectRecord | undefined {
    return this.projects.get(id);
  }

  listProjects(): ProjectRecord[] {
    return Array.from(this.projects.values());
  }

  recordScan(projectId: string, scanResult: ScanResult, scanType = 'CLI_LOCAL'): StoredScanRecord {
    const scanId = scanResult.scanId || `scan_${randomUUID().slice(0, 8)}`;

    const scanRecord: StoredScanRecord = {
      id: scanId,
      projectId,
      scanType,
      status: 'COMPLETED',
      totalFiles: scanResult.metrics.totalFiles,
      totalIssues: scanResult.metrics.totalIssues,
      criticalCount: scanResult.metrics.criticalCount,
      highCount: scanResult.metrics.highCount,
      mediumCount: scanResult.metrics.mediumCount,
      lowCount: scanResult.metrics.lowCount,
      durationMs: scanResult.metrics.durationMs,
      createdAt: scanResult.timestamp || new Date().toISOString(),
      findings: scanResult.issues
    };

    this.scans.set(scanId, scanRecord);

    for (const issue of scanResult.issues) {
      this.findings.set(issue.id, issue);
    }

    // Update project metrics and security health score
    const project = this.projects.get(projectId);
    if (project) {
      project.openIssuesCount = {
        critical: scanResult.metrics.criticalCount,
        high: scanResult.metrics.highCount,
        medium: scanResult.metrics.mediumCount,
        low: scanResult.metrics.lowCount
      };

      // Health score formula: 100 - (Critical * 25 + High * 10 + Medium * 4 + Low * 1)
      const penalty =
        project.openIssuesCount.critical * 25 +
        project.openIssuesCount.high * 10 +
        project.openIssuesCount.medium * 4 +
        project.openIssuesCount.low * 1;
      project.healthScore = Math.max(0, 100 - penalty);
    }

    this.logAudit('SCAN_RECORDED', 'scan', scanId, {
      projectId,
      totalIssues: scanResult.metrics.totalIssues
    });

    return scanRecord;
  }

  getScan(id: string): StoredScanRecord | undefined {
    return this.scans.get(id);
  }

  listScansForProject(projectId: string): StoredScanRecord[] {
    return Array.from(this.scans.values()).filter((s) => s.projectId === projectId);
  }

  updateFindingStatus(findingId: string, status: FindingStatus, reason?: string): SecurityIssue | undefined {
    const finding = this.findings.get(findingId);
    if (!finding) return undefined;

    finding.status = status;
    this.logAudit('FINDING_STATUS_UPDATED', 'finding', findingId, { status, reason });
    return finding;
  }

  logAudit(action: string, entityType: string, entityId: string, metadata: Record<string, unknown> = {}): AuditRecord {
    const record: AuditRecord = {
      id: `aud_${randomUUID().slice(0, 8)}`,
      action,
      entityType,
      entityId,
      metadata,
      createdAt: new Date().toISOString()
    };
    this.auditLogs.push(record);
    return record;
  }

  getAuditLogs(): AuditRecord[] {
    return [...this.auditLogs];
  }
}

export const defaultDataStore = new MemoryDataStore();


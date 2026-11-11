import { randomUUID } from 'node:crypto';
import { ScanOrchestrator } from '@voom-nexus/core';
import { ScanResult, logger } from '@voom-nexus/shared';
import { MemoryDataStore } from '../store/data-store.js';

export type JobStatus = 'QUEUED' | 'RUNNING' | 'COMPLETED' | 'FAILED';

export interface ScanJob {
  id: string;
  projectId: string;
  targetPath: string;
  status: JobStatus;
  progressPercent: number;
  result?: ScanResult;
  error?: string;
  createdAt: string;
  completedAt?: string;
}

export class ScanJobQueue {
  private jobs: Map<string, ScanJob> = new Map();
  private store: MemoryDataStore;
  private orchestrator: ScanOrchestrator;
  private isProcessing = false;

  constructor(store: MemoryDataStore, orchestrator: ScanOrchestrator = new ScanOrchestrator()) {
    this.store = store;
    this.orchestrator = orchestrator;
  }

  enqueue(projectId: string, targetPath: string): ScanJob {
    const job: ScanJob = {
      id: `job_${randomUUID().slice(0, 8)}`,
      projectId,
      targetPath,
      status: 'QUEUED',
      progressPercent: 0,
      createdAt: new Date().toISOString()
    };

    this.jobs.set(job.id, job);
    logger.info(`Enqueued background scan job ${job.id} for project ${projectId}`);

    // Trigger async worker execution on next tick
    setImmediate(() => this.processNextJob());

    return job;
  }

  getJob(id: string): ScanJob | undefined {
    return this.jobs.get(id);
  }

  listJobs(): ScanJob[] {
    return Array.from(this.jobs.values());
  }

  private async processNextJob(): Promise<void> {
    if (this.isProcessing) return;

    const queuedJobs = Array.from(this.jobs.values()).filter((j) => j.status === 'QUEUED');
    if (queuedJobs.length === 0) return;

    const job = queuedJobs[0];
    this.isProcessing = true;
    job.status = 'RUNNING';
    job.progressPercent = 10;
    logger.info(`Processing background scan job ${job.id}`);

    try {
      job.progressPercent = 50;
      const result = await this.orchestrator.scanPath(job.targetPath);
      job.result = result;
      job.progressPercent = 90;

      // Persist results into datastore
      this.store.recordScan(job.projectId, result, 'ASYNC_JOB');

      job.status = 'COMPLETED';
      job.progressPercent = 100;
      job.completedAt = new Date().toISOString();
      logger.info(`Successfully completed background scan job ${job.id}`);
    } catch (err: any) {
      job.status = 'FAILED';
      job.error = err.message || String(err);
      job.completedAt = new Date().toISOString();
      logger.error(`Background scan job ${job.id} failed:`, err);
    } finally {
      this.isProcessing = false;
      // Check if more jobs are queued
      setImmediate(() => this.processNextJob());
    }
  }
}

import { resolve, relative, isAbsolute } from 'node:path';
import { logger } from '@voom-nexus/shared';

export interface ArchiveEntry {
  path: string;
  sizeBytes: number;
  content: Buffer | string;
}

export interface ExtractionLimits {
  maxTotalBytes?: number; // Default: 100 MB
  maxFileCount?: number;  // Default: 2,000 files
}

export class SafeArchiveExtractor {
  private maxTotalBytes: number;
  private maxFileCount: number;

  constructor(limits: ExtractionLimits = {}) {
    this.maxTotalBytes = limits.maxTotalBytes || 100 * 1024 * 1024; // 100 MB
    this.maxFileCount = limits.maxFileCount || 2000;
  }

  /**
   * Validates archive entries against Zip Slip (CWE-22) and Decompression Bombs (Zip Bombs).
   * Throws an error if any entry attempts directory traversal or exceeds resource limits.
   */
  validateEntries(destinationDir: string, entries: ArchiveEntry[]): { safeEntries: ArchiveEntry[]; totalBytes: number } {
    const dest = resolve(destinationDir);
    let cumulativeBytes = 0;

    if (entries.length > this.maxFileCount) {
      throw new Error(
        `Archive exceeds maximum file count limit: ${entries.length} files > ${this.maxFileCount} allowed`
      );
    }

    const safeEntries: ArchiveEntry[] = [];

    for (const entry of entries) {
      // 1. Defend against Zip Slip (CWE-22)
      const targetPath = resolve(dest, entry.path);
      const rel = relative(dest, targetPath);

      if (rel.startsWith('..') || isAbsolute(entry.path) || targetPath === dest) {
        logger.error(`Zip Slip attack blocked for entry: ${entry.path}`);
        throw new Error(`Security Violation: Zip Slip path traversal detected in entry "${entry.path}"`);
      }

      // 2. Defend against Decompression Bombs
      cumulativeBytes += entry.sizeBytes;
      if (cumulativeBytes > this.maxTotalBytes) {
        logger.error(`Decompression bomb threshold exceeded: ${cumulativeBytes} bytes > ${this.maxTotalBytes}`);
        throw new Error(`Security Violation: Decompression bomb limit exceeded (${cumulativeBytes} bytes)`);
      }

      safeEntries.push({
        path: targetPath,
        sizeBytes: entry.sizeBytes,
        content: entry.content
      });
    }

    return { safeEntries, totalBytes: cumulativeBytes };
  }
}

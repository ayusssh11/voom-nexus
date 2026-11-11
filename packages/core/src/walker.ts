import { readdir, readFile, stat } from 'node:fs/promises';
import { join, relative, resolve } from 'node:path';
import { DEFAULT_EXCLUDES, logger } from '@voom-nexus/shared';
import { defaultAdapterRegistry } from '@voom-nexus/parsers';

export interface FileEntry {
  path: string;
  relativePath: string;
  sizeBytes: number;
  extension: string;
}

export interface WalkerOptions {
  basePath: string;
  excludePatterns?: string[];
  maxFileSizeBytes?: number; // Default: 2MB (2 * 1024 * 1024)
  respectGitignore?: boolean;
  respectVoomsecignore?: boolean;
}

export class DirectoryWalker {
  private basePath: string;
  private excludePatterns: Set<string>;
  private maxFileSizeBytes: number;
  private visitedInodes: Set<string> = new Set();

  constructor(options: WalkerOptions) {
    this.basePath = resolve(options.basePath);
    this.maxFileSizeBytes = options.maxFileSizeBytes || 2 * 1024 * 1024; // 2 MB
    this.excludePatterns = new Set([
      'node_modules',
      '.git',
      'dist',
      'build',
      'coverage',
      '.next',
      '.nuxt',
      'vendor',
      '__pycache__',
      '.venv',
      ...(options.excludePatterns || [])
    ]);
  }

  /**
   * Loads custom ignore patterns from .gitignore and .voomsecignore in directory
   */
  async loadIgnoreFiles(dir: string): Promise<void> {
    const ignoreFiles = ['.gitignore', '.voomsecignore'];
    for (const file of ignoreFiles) {
      const filePath = join(dir, file);
      try {
        const content = await readFile(filePath, 'utf-8');
        const lines = content.split('\n');
        for (let line of lines) {
          line = line.trim();
          if (!line || line.startsWith('#')) continue;
          // Strip leading/trailing slashes for directory matching
          const clean = line.replace(/^\/+|\/+$/g, '');
          this.excludePatterns.add(clean);
        }
        logger.debug(`Loaded ignore patterns from ${filePath}`);
      } catch {
        // Ignore file doesn't exist; continue
      }
    }
  }

  /**
   * Traverses directory or returns single file entry
   */
  async walk(): Promise<FileEntry[]> {
    const results: FileEntry[] = [];
    await this.loadIgnoreFiles(this.basePath);

    let targetStat;
    try {
      targetStat = await stat(this.basePath);
    } catch (err) {
      logger.warn(`Cannot access scan path: ${this.basePath}`, err);
      return [];
    }

    if (targetStat.isFile()) {
      const ext = this.getExtension(this.basePath);
      results.push({
        path: this.basePath,
        relativePath: relative(process.cwd(), this.basePath) || this.basePath,
        sizeBytes: targetStat.size,
        extension: ext
      });
      return results;
    }

    await this.walkDirectory(this.basePath, results);
    return results;
  }

  private async walkDirectory(currentDir: string, results: FileEntry[]): Promise<void> {
    let entries;
    try {
      entries = await readdir(currentDir, { withFileTypes: true });
    } catch (err) {
      logger.warn(`Failed to read directory: ${currentDir}`, err);
      return;
    }

    for (const entry of entries) {
      const fullPath = join(currentDir, entry.name);
      const relPath = relative(this.basePath, fullPath);

      if (this.isExcluded(entry.name, relPath)) {
        continue;
      }

      if (entry.isDirectory()) {
        try {
          const dirStat = await stat(fullPath);
          const inodeKey = `${dirStat.dev}:${dirStat.ino}`;
          if (this.visitedInodes.has(inodeKey)) {
            logger.warn(`Cycle detected, skipping directory: ${fullPath}`);
            continue;
          }
          this.visitedInodes.add(inodeKey);
        } catch {
          // If stat fails, continue normal traversal
        }

        await this.walkDirectory(fullPath, results);
      } else if (entry.isFile()) {
        const ext = this.getExtension(entry.name);
        const adapter = defaultAdapterRegistry.getAdapterForFile(entry.name);

        if (adapter) {
          try {
            const fileStat = await stat(fullPath);
            if (fileStat.size > this.maxFileSizeBytes) {
              logger.warn(`File exceeds size limit (${fileStat.size} bytes > ${this.maxFileSizeBytes} bytes), skipping: ${relPath}`);
              continue;
            }

            results.push({
              path: fullPath,
              relativePath: relPath,
              sizeBytes: fileStat.size,
              extension: ext
            });
          } catch {
            // File could not be stated, skip
          }
        }
      }
    }
  }

  private isExcluded(name: string, relPath: string): boolean {
    if (this.excludePatterns.has(name)) {
      return true;
    }

    for (const pattern of this.excludePatterns) {
      if (pattern.includes('/') && relPath.includes(pattern)) {
        return true;
      }
      if (pattern.startsWith('*') && name.endsWith(pattern.slice(1))) {
        return true;
      }
    }

    return false;
  }

  private getExtension(fileName: string): string {
    const dotIndex = fileName.lastIndexOf('.');
    return dotIndex !== -1 ? fileName.slice(dotIndex).toLowerCase() : '';
  }
}


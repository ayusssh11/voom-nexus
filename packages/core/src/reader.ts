import { open } from 'node:fs/promises';
import { logger } from '@voom-nexus/shared';

export interface ReadFileResult {
  success: boolean;
  content: string;
  isBinary: boolean;
  errorMessage?: string;
}

export class SafeFileReader {
  private static BUFFER_CHECK_SIZE = 8192; // 8KB check for binary detection

  /**
   * Reads a file and verifies it is plain-text UTF-8, rejecting binary or corrupt files.
   */
  static async readTextFile(filePath: string): Promise<ReadFileResult> {
    let fileHandle;
    try {
      fileHandle = await open(filePath, 'r');
      const buffer = Buffer.alloc(SafeFileReader.BUFFER_CHECK_SIZE);
      const { bytesRead } = await fileHandle.read(buffer, 0, SafeFileReader.BUFFER_CHECK_SIZE, 0);

      // Binary detection: check for null bytes in initial chunk
      for (let i = 0; i < bytesRead; i++) {
        if (buffer[i] === 0) {
          return {
            success: false,
            content: '',
            isBinary: true,
            errorMessage: 'Binary file detected (null byte present)'
          };
        }
      }

      // Read complete content
      const fullContent = await fileHandle.readFile({ encoding: 'utf-8' });
      return {
        success: true,
        content: fullContent,
        isBinary: false
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      logger.debug(`Failed reading file ${filePath}: ${msg}`);
      return {
        success: false,
        content: '',
        isBinary: false,
        errorMessage: msg
      };
    } finally {
      if (fileHandle) {
        await fileHandle.close();
      }
    }
  }
}

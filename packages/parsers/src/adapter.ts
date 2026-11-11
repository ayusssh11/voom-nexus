export interface CodeLocation {
  line: number;
  column: number;
}

export interface ParseResult {
  filePath: string;
  language: string;
  lineCount: number;
  lines: string[];
  ast?: unknown;
  rawContent: string;
  syntaxError?: string;
  getLine(lineNumber: number): string | undefined;
}

export interface LanguageAdapter {
  name: string;
  extensions: string[];
  supportsAST: boolean;
  parse(filePath: string, content: string): Promise<ParseResult>;
}

export class GenericLanguageAdapter implements LanguageAdapter {
  name = 'generic';
  extensions = ['.txt', '.env', '.json', '.yaml', '.yml', '.md', '.ini', '.conf'];
  supportsAST = false;

  async parse(filePath: string, content: string): Promise<ParseResult> {
    const lines = content.split('\n');
    return {
      filePath,
      language: this.name,
      lineCount: lines.length,
      lines,
      rawContent: content,
      getLine(num: number) {
        return lines[num - 1];
      }
    };
  }
}

export class JavaScriptAdapter implements LanguageAdapter {
  name = 'javascript';
  extensions = ['.js', '.jsx', '.mjs', '.cjs', '.ts', '.tsx'];
  supportsAST = true;

  async parse(filePath: string, content: string): Promise<ParseResult> {
    const lines = content.split('\n');
    return {
      filePath,
      language: this.name,
      lineCount: lines.length,
      lines,
      rawContent: content,
      getLine(num: number) {
        return lines[num - 1];
      }
    };
  }
}

export class PythonAdapter implements LanguageAdapter {
  name = 'python';
  extensions = ['.py', '.pyw'];
  supportsAST = false; // Planned for AST in Phase 2

  async parse(filePath: string, content: string): Promise<ParseResult> {
    const lines = content.split('\n');
    return {
      filePath,
      language: this.name,
      lineCount: lines.length,
      lines,
      rawContent: content,
      getLine(num: number) {
        return lines[num - 1];
      }
    };
  }
}

export class LanguageAdapterRegistry {
  private adapters: Map<string, LanguageAdapter> = new Map();
  private extensionMap: Map<string, LanguageAdapter> = new Map();

  register(adapter: LanguageAdapter): void {
    this.adapters.set(adapter.name, adapter);
    for (const ext of adapter.extensions) {
      this.extensionMap.set(ext.toLowerCase(), adapter);
    }
  }

  getAdapterForFile(filePath: string): LanguageAdapter | undefined {
    const ext = filePath.includes('.') ? '.' + filePath.split('.').pop()!.toLowerCase() : '';
    return this.extensionMap.get(ext);
  }

  getAll(): LanguageAdapter[] {
    return Array.from(this.adapters.values());
  }
}

export const defaultAdapterRegistry = new LanguageAdapterRegistry();
defaultAdapterRegistry.register(new GenericLanguageAdapter());
defaultAdapterRegistry.register(new JavaScriptAdapter());
defaultAdapterRegistry.register(new PythonAdapter());

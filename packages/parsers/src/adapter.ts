export interface ParseResult {
  filePath: string;
  language: string;
  lineCount: number;
  ast?: unknown;
  rawContent: string;
}

export interface LanguageAdapter {
  name: string;
  extensions: string[];
  supportsAST: boolean;
  parse(filePath: string, content: string): Promise<ParseResult>;
}

export class GenericLanguageAdapter implements LanguageAdapter {
  name = 'generic';
  extensions = ['.txt', '.env', '.json', '.yaml', '.yml', '.md'];
  supportsAST = false;

  async parse(filePath: string, content: string): Promise<ParseResult> {
    const lineCount = content.split('\n').length;
    return {
      filePath,
      language: this.name,
      lineCount,
      rawContent: content
    };
  }
}

export class JavaScriptAdapter implements LanguageAdapter {
  name = 'javascript';
  extensions = ['.js', '.jsx', '.mjs', '.cjs', '.ts', '.tsx'];
  supportsAST = true;

  async parse(filePath: string, content: string): Promise<ParseResult> {
    const lineCount = content.split('\n').length;
    return {
      filePath,
      language: this.name,
      lineCount,
      rawContent: content
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


import { defaultRuleRegistry } from './registry.js';

export type FrameworkType = 'generic' | 'react' | 'nextjs' | 'express' | 'python' | 'fastapi';
export type AiAssistantType = 'cursor' | 'claude' | 'windsurf' | 'copilot' | 'antigravity' | 'all';

export interface FrameworkRulePack {
  framework: FrameworkType;
  title: string;
  directives: string[];
  prohibitedPatterns: string[];
  requiredPatterns: string[];
}

export const FRAMEWORK_RULE_PACKS: Record<FrameworkType, FrameworkRulePack> = {
  nextjs: {
    framework: 'nextjs',
    title: 'Next.js (App Router & Server Components) Security Guardrails',
    directives: [
      'Server Component Secret Isolation: NEVER import private environment variables or secrets into Client Components ("use client").',
      'Server Action Authorization: ALWAYS verify user session and permissions at the entry point of every Server Action.',
      'Route Handler Validation: ALWAYS parse and validate request payload and searchParams using Zod schema before processing.',
      'Safe Navigation: Validate external URLs before passing to redirect() or useRouter.push() to prevent Open Redirect (CWE-601).',
      'XSS Prevention: Do NOT use dangerouslySetInnerHTML. If HTML rendering is mandatory, sanitize using DOMPurify.'
    ],
    prohibitedPatterns: [
      '// DO NOT: Expose server secrets in client components\n"use client";\nconst apiKey = process.env.STRIPE_SECRET_KEY;',
      '// DO NOT: Unauthenticated Server Action mutation\nexport async function deleteUser(userId: string) {\n  await db.users.delete(userId);\n}',
      '// DO NOT: Raw dangerouslySetInnerHTML\n<div dangerouslySetInnerHTML={{ __html: userInput }} />'
    ],
    requiredPatterns: [
      '// MANDATORY: Keep server secrets in Server Components or server-only modules\nimport "server-only";\nconst stripeKey = process.env.STRIPE_SECRET_KEY;',
      '// MANDATORY: Session and authorization verification in Server Actions\nexport async function deleteUser(userId: string) {\n  const session = await auth();\n  if (!session?.user?.isAdmin) throw new Error("Unauthorized");\n  await db.users.delete(userId);\n}',
      '// MANDATORY: DOMPurify sanitization before dangerous HTML injection\n<div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(userInput) }} />'
    ]
  },
  react: {
    framework: 'react',
    title: 'React Single-Page Application Security Guardrails',
    directives: [
      'Prevent Reflected/DOM XSS: Never inject unescaped HTML strings into component output.',
      'URL Protocol Validation: Verify that external URLs start with https:// or http:// before binding to <a href>. Block javascript: pseudo-protocols.',
      'Storage Isolation: Never store long-lived tokens, passwords, or sensitive keys in localStorage or sessionStorage (vulnerable to XSS). Prefer HttpOnly, Secure, SameSite cookies.',
      'Sensitive Client State: Do not log or expose raw state objects containing credentials.'
    ],
    prohibitedPatterns: [
      '// DO NOT: Unvalidated link href\n<a href={userProvidedUrl}>Visit Profile</a>',
      '// DO NOT: Storing bearer token in localStorage\nlocalStorage.setItem("authToken", token);'
    ],
    requiredPatterns: [
      '// MANDATORY: Safe protocol check for links\nconst safeUrl = /^https?:\\/\\//i.test(userProvidedUrl) ? userProvidedUrl : "#";\n<a href={safeUrl} rel="noopener noreferrer">Visit Profile</a>',
      '// MANDATORY: Use HttpOnly cookies handled by the backend server for session tokens'
    ]
  },
  express: {
    framework: 'express',
    title: 'Express.js & Node.js REST API Security Guardrails',
    directives: [
      'Security Headers: Always mount helmet() as the first middleware in the application pipeline.',
      'Strict CORS Policy: Never combine Access-Control-Allow-Origin: * with credentials: true. Explicitly whitelist allowed domains.',
      'Rate Limiting: Mount express-rate-limit on sensitive routes (/api/login, /api/auth/*, /api/password-reset).',
      'Input Validation: Enforce schema validation (Zod, Joi) on req.body, req.query, and req.params.',
      'Error Handling: Avoid leaking stack traces, SQL errors, or path details in 500 error responses.'
    ],
    prohibitedPatterns: [
      '// DO NOT: Permissive CORS with credentials\napp.use(cors({ origin: "*", credentials: true }));',
      '// DO NOT: Leaking error details\napp.use((err, req, res, next) => res.status(500).json({ error: err.stack }));'
    ],
    requiredPatterns: [
      '// MANDATORY: Hardened CORS with strict whitelist\napp.use(cors({ origin: process.env.ALLOWED_ORIGINS?.split(","), credentials: true }));',
      '// MANDATORY: Safe generic error response\napp.use((err, req, res, next) => res.status(500).json({ error: "Internal Server Error" }));'
    ]
  },
  fastapi: {
    framework: 'fastapi',
    title: 'Python / FastAPI Application Security Guardrails',
    directives: [
      'Database Parameterization: Use SQLAlchemy ORM or bound parameters; never format raw SQL with f-strings.',
      'Safe Deserialization: Never use pickle.loads() on untrusted user data. Use Pydantic models for request validation.',
      'Restricted CORS: Configure CORSMiddleware with specific origins and headers; disallow wildcard origins with credentials.',
      'Token Generation: Use secrets.token_urlsafe() or secrets.token_hex(); never use random.random() for security tokens.'
    ],
    prohibitedPatterns: [
      '# DO NOT: Raw SQL formatting with f-string\nquery = f"SELECT * FROM users WHERE id = \'{user_id}\'"',
      '# DO NOT: Insecure random for tokens\ntoken = str(random.random())'
    ],
    requiredPatterns: [
      '# MANDATORY: Parameterized ORM or bind variables\nstmt = select(User).where(User.id == user_id)',
      '# MANDATORY: Cryptographically secure token generation\nimport secrets\ntoken = secrets.token_urlsafe(32)'
    ]
  },
  python: {
    framework: 'python',
    title: 'Python General Application Security Guardrails',
    directives: [
      'Database Parameterization: Always use DB-API parameterized queries; never use string formatting.',
      'Safe Deserialization: Avoid pickle, marshal, or PyYAML yaml.load(); use yaml.safe_load() and json.loads().',
      'Path Traversal: Sanitize filenames using os.path.basename() and verify realpath stays within target directory.',
      'Secrets Management: Load secrets from environment variables (os.environ); never hardcode API keys or credentials.'
    ],
    prohibitedPatterns: [
      '# DO NOT: Unsafe YAML loader\ndata = yaml.load(untrusted_input)',
      '# DO NOT: Insecure subprocess execution\nsubprocess.run(f"cat {user_file}", shell=True)'
    ],
    requiredPatterns: [
      '# MANDATORY: Safe YAML loader\ndata = yaml.safe_load(untrusted_input)',
      '# MANDATORY: Safe subprocess with argument list\nsubprocess.run(["cat", safe_filename], check=True)'
    ]
  },
  generic: {
    framework: 'generic',
    title: 'Universal Application Security Standards (OWASP Top 10 & CWE)',
    directives: [
      'Injection Defense: Parameterize all database queries (CWE-89) and system commands (CWE-78).',
      'Cryptographic Standards: Use SHA-256 / SHA-3 or Argon2id; MD5 and SHA-1 are strictly banned (CWE-327).',
      'Secret Protection: Never commit or hardcode API keys, access tokens, or private keys (CWE-798).',
      'Access Control: Validate all file paths to prevent directory traversal escapes (CWE-22).',
      'Randomness: Use cryptographically secure pseudo-random number generators (crypto.randomBytes / secrets).'
    ],
    prohibitedPatterns: [
      '// DO NOT: Concatenated SQL\nconst q = `SELECT * FROM data WHERE id = ${id}`;',
      '// DO NOT: Child process with shell concatenation\nexec(`convert ${filename} output.png`);'
    ],
    requiredPatterns: [
      '// MANDATORY: Parameterized SQL\nconst q = db.prepare("SELECT * FROM data WHERE id = ?").get(id);',
      '// MANDATORY: execFile with separate argument array\nexecFile("convert", [filename, "output.png"]);'
    ]
  }
};

export class AiGuidelineGenerator {
  /**
   * Automatically detects the primary project framework from package.json or dependencies.
   */
  static detectFramework(packageJsonString?: string): FrameworkType {
    if (!packageJsonString) return 'generic';
    try {
      const pkg = JSON.parse(packageJsonString);
      const allDeps = {
        ...pkg.dependencies,
        ...pkg.devDependencies
      };

      if (allDeps['next']) return 'nextjs';
      if (allDeps['express']) return 'express';
      if (allDeps['react'] || allDeps['react-dom']) return 'react';
      return 'generic';
    } catch {
      return 'generic';
    }
  }

  /**
   * Generates formatted rules for Cursor (.cursorrules)
   */
  static generateCursorRules(framework: FrameworkType = 'generic'): string {
    const pack = FRAMEWORK_RULE_PACKS[framework] || FRAMEWORK_RULE_PACKS.generic;
    const rules = defaultRuleRegistry.getAll();
    const ruleSummary = rules.map((r) => `- **${r.title}** (${r.id}): ${r.remediation}`).join('\n');

    return `# Voom Nexus — Security Directives for Cursor AI
# Framework: ${pack.title}

You are an expert DevSecOps engineer and secure code generator adhering strictly to OWASP Top 10 (2021) and CWE standards.
NEVER generate insecure code patterns or bypass security controls under any circumstances.

## Core Security Rules
${ruleSummary}

## Framework-Specific Directives: ${pack.title}
${pack.directives.map((d, i) => `${i + 1}. ${d}`).join('\n')}

## Strictly Prohibited Insecure Patterns (DO NOT GENERATE):
${pack.prohibitedPatterns.map((p) => `\`\`\`typescript\n${p}\n\`\`\``).join('\n\n')}

## Required Secure Implementation Patterns:
${pack.requiredPatterns.map((p) => `\`\`\`typescript\n${p}\n\`\`\``).join('\n\n')}
`;
  }

  /**
   * Generates formatted guidelines for Claude Code (CLAUDE.md)
   */
  static generateClaudeMd(framework: FrameworkType = 'generic'): string {
    const pack = FRAMEWORK_RULE_PACKS[framework] || FRAMEWORK_RULE_PACKS.generic;
    const rules = defaultRuleRegistry.getAll();
    const ruleSummary = rules.map((r) => `- **${r.title}** (${r.id}): ${r.remediation}`).join('\n');

    return `# Security Guidelines for Claude Code (Voom Nexus)
> Framework Profile: ${pack.title}

## Universal Security Policy
When generating or modifying source code in this repository, you must guarantee that no security regressions or CWE vulnerabilities are introduced.

### Registered Security Checks:
${ruleSummary}

### Specific Directives for ${pack.title}:
${pack.directives.map((d) => `- ${d}`).join('\n')}

### Mandatory Secure Coding Rules:
- **Zero Raw Query Concatenation**: Parameterize all SQL and NoSQL queries.
- **Zero Command Injection**: Never invoke child_process.exec with template strings.
- **Zero Hardcoded Secrets**: Load all credentials from environment variables.
- **Zero Weak Cryptography**: Ban MD5, SHA-1, and Math.random() for security contexts.
- **Safe Path Resolution**: Enforce path.resolve + path.relative boundary checks.
`;
  }

  /**
   * Generates formatted rules for Windsurf (.windsurfrules)
   */
  static generateWindsurfRules(framework: FrameworkType = 'generic'): string {
    const pack = FRAMEWORK_RULE_PACKS[framework] || FRAMEWORK_RULE_PACKS.generic;
    return `# Voom Nexus Security Directives for Windsurf Cascade
# Target Framework: ${pack.title}

Apply strict secure coding policies on every suggested code edit:
${pack.directives.map((d, i) => `${i + 1}. ${d}`).join('\n')}

Enforce parameterized queries, safe path traversal defenses, strong cryptography, and secure secrets handling.
`;
  }

  /**
   * Generates instructions for GitHub Copilot (.github/copilot-instructions.md)
   */
  static generateCopilotInstructions(framework: FrameworkType = 'generic'): string {
    const pack = FRAMEWORK_RULE_PACKS[framework] || FRAMEWORK_RULE_PACKS.generic;
    return `# GitHub Copilot Security Directives (Voom Nexus)
## Framework: ${pack.title}

When suggesting code, Copilot must prioritize application security:
${pack.directives.map((d) => `- ${d}`).join('\n')}

Adhere strictly to OWASP Top 10: avoid dynamic SQL concatenation, command injection, and hardcoded secrets.
`;
  }

  /**
   * Generates instructions for Google Antigravity / Gemini code assistants (.agent/security-rules.md)
   */
  static generateAntigravityRules(framework: FrameworkType = 'generic'): string {
    const pack = FRAMEWORK_RULE_PACKS[framework] || FRAMEWORK_RULE_PACKS.generic;
    return `# Google Antigravity AI Security Rules (Voom Nexus)
## Target: ${pack.title}

You are pair programming on a production-ready application.
Adhere strictly to the following security directives:

${pack.directives.map((d, i) => `${i + 1}. ${d}`).join('\n')}

Security Checklist:
- [ ] No SQL Injection (parameterized queries only)
- [ ] No Command Injection (execFile with array arguments)
- [ ] No Hardcoded Secrets (environment variables only)
- [ ] No Insecure Cryptography (SHA-256 / Argon2id only)
- [ ] Safe Deserialization and input validation
`;
  }
}

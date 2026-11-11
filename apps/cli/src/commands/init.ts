import { writeFile, readFile, mkdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { logger } from '@voom-nexus/shared';
import { AiGuidelineGenerator, FrameworkType } from '@voom-nexus/rules';

export interface InitOptions {
  ai?: string[];
  framework?: FrameworkType;
  force?: boolean;
}

export async function runInit(options: InitOptions = {}, targetDir = process.cwd()): Promise<number> {
  console.log('Initializing Voom Nexus in project...\n');
  await mkdir(targetDir, { recursive: true });

  // 1. Detect or use specified framework
  let framework: FrameworkType = options.framework || 'generic';
  if (!options.framework) {
    try {
      const pkgPath = join(targetDir, 'package.json');
      const pkgContent = await readFile(pkgPath, 'utf-8');
      framework = AiGuidelineGenerator.detectFramework(pkgContent);
      console.log(`Detected project framework: ${framework.toUpperCase()}`);
    } catch {
      framework = 'generic';
    }
  } else {
    console.log(`Selected project framework: ${framework.toUpperCase()}`);
  }

  // 2. Generate default .voomsecrc.json if not present
  const configPath = join(targetDir, '.voomsecrc.json');
  const defaultConfigContent = JSON.stringify(
    {
      "$schema": "https://voom-nexus.local/schemas/config.v1.json",
      "version": "1.0",
      "framework": framework,
      "scan": {
        "paths": ["."],
        "exclude": [
          "**/node_modules/**",
          "**/dist/**",
          "**/build/**",
          "**/.git/**",
          "**/coverage/**"
        ],
        "severity": ["CRITICAL", "HIGH", "MEDIUM", "LOW"],
        "threshold": "HIGH"
      },
      "rules": {
        "disable": []
      },
      "reporting": {
        "format": "text",
        "redactSecrets": true
      }
    },
    null,
    2
  );

  try {
    await writeFile(configPath, defaultConfigContent, { flag: options.force ? 'w' : 'wx' });
    console.log(`[CREATED] ${configPath}`);
  } catch (err: any) {
    if (err.code === 'EEXIST') {
      console.log(`[EXISTS]  ${configPath} (use --force to overwrite)`);
    } else {
      logger.warn(`Could not create ${configPath}: ${err.message}`);
    }
  }

  // 3. Generate AI Coding Assistant Guidelines using AiGuidelineGenerator
  const selectedAi = options.ai && options.ai.length > 0 ? options.ai : ['all'];

  const aiGenerators: Record<string, { path: string; getContent: () => string }> = {
    cursor: {
      path: join(targetDir, '.cursorrules'),
      getContent: () => AiGuidelineGenerator.generateCursorRules(framework)
    },
    claude: {
      path: join(targetDir, 'CLAUDE.md'),
      getContent: () => AiGuidelineGenerator.generateClaudeMd(framework)
    },
    windsurf: {
      path: join(targetDir, '.windsurfrules'),
      getContent: () => AiGuidelineGenerator.generateWindsurfRules(framework)
    },
    copilot: {
      path: join(targetDir, '.github/copilot-instructions.md'),
      getContent: () => AiGuidelineGenerator.generateCopilotInstructions(framework)
    },
    antigravity: {
      path: join(targetDir, '.agent/security-rules.md'),
      getContent: () => AiGuidelineGenerator.generateAntigravityRules(framework)
    }
  };

  const targets = selectedAi.includes('all') ? Object.keys(aiGenerators) : selectedAi;

  for (const aiName of targets) {
    const generator = aiGenerators[aiName.toLowerCase()];
    if (generator) {
      await mkdir(dirname(generator.path), { recursive: true });
      try {
        await writeFile(generator.path, generator.getContent(), { flag: options.force ? 'w' : 'wx' });
        console.log(`[CREATED] ${generator.path}`);
      } catch (err: any) {
        if (err.code === 'EEXIST') {
          console.log(`[EXISTS]  ${generator.path} (use --force to overwrite)`);
        } else {
          logger.warn(`Could not create ${generator.path}: ${err.message}`);
        }
      }
    }
  }

  console.log('\nInitialization complete! Run "vibesec scan" to verify your repository.');
  return 0;
}

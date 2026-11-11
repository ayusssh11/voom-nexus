import test from 'node:test';
import assert from 'node:assert/strict';
import { AiGuidelineGenerator } from '../dist/index.js';

test('AiGuidelineGenerator.detectFramework accurately identifies project frameworks', () => {
  assert.strictEqual(
    AiGuidelineGenerator.detectFramework('{"dependencies": {"next": "14.2.0", "react": "18.2.0"}}'),
    'nextjs'
  );

  assert.strictEqual(
    AiGuidelineGenerator.detectFramework('{"dependencies": {"express": "^4.19.2"}}'),
    'express'
  );

  assert.strictEqual(
    AiGuidelineGenerator.detectFramework('{"dependencies": {"react": "^18.3.1"}}'),
    'react'
  );

  assert.strictEqual(
    AiGuidelineGenerator.detectFramework('{"dependencies": {"lodash": "^4.17.21"}}'),
    'generic'
  );

  assert.strictEqual(
    AiGuidelineGenerator.detectFramework('invalid json string'),
    'generic'
  );
});

test('generateCursorRules produces framework-specific Next.js rules', () => {
  const content = AiGuidelineGenerator.generateCursorRules('nextjs');
  assert.ok(content.includes('Voom Nexus — Security Directives for Cursor AI'));
  assert.ok(content.includes('Next.js (App Router & Server Components) Security Guardrails'));
  assert.ok(content.includes('Server Component Secret Isolation'));
  assert.ok(content.includes('Server Action Authorization'));
  assert.ok(content.includes('STRIPE_SECRET_KEY'));
  assert.ok(content.includes('DOMPurify'));
});

test('generateClaudeMd produces Express.js security directives', () => {
  const content = AiGuidelineGenerator.generateClaudeMd('express');
  assert.ok(content.includes('Security Guidelines for Claude Code'));
  assert.ok(content.includes('Express.js & Node.js REST API Security Guardrails'));
  assert.ok(content.includes('helmet()'));
  assert.ok(content.includes('Strict CORS Policy'));
  assert.ok(content.includes('Zero Raw Query Concatenation'));
});

test('generateWindsurfRules produces concise cascade directives', () => {
  const content = AiGuidelineGenerator.generateWindsurfRules('fastapi');
  assert.ok(content.includes('Voom Nexus Security Directives for Windsurf Cascade'));
  assert.ok(content.includes('Python / FastAPI Application Security Guardrails'));
  assert.ok(content.includes('SQLAlchemy'));
});

test('generateCopilotInstructions produces Copilot directives', () => {
  const content = AiGuidelineGenerator.generateCopilotInstructions('react');
  assert.ok(content.includes('GitHub Copilot Security Directives'));
  assert.ok(content.includes('React Single-Page Application Security Guardrails'));
  assert.ok(content.includes('Prevent Reflected/DOM XSS'));
});

test('generateAntigravityRules produces Antigravity assistant checklist', () => {
  const content = AiGuidelineGenerator.generateAntigravityRules('generic');
  assert.ok(content.includes('Google Antigravity AI Security Rules'));
  assert.ok(content.includes('No SQL Injection'));
  assert.ok(content.includes('No Command Injection'));
  assert.ok(content.includes('No Hardcoded Secrets'));
});

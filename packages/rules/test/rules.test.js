import test from 'node:test';
import assert from 'node:assert/strict';
import {
  defaultRuleRegistry,
  sqlInjectionRule,
  xssOutputRule,
  commandInjectionRule,
  weakHashRule,
  pathTraversalRule,
  unsafeEvalRule,
  ssrfRule,
  corsWildcardRule,
  insecureRandomnessRule,
  logExposureRule,
  weakPasswordPolicyRule,
  prototypePollutionRule,
  hardcodedSecretsRule,
  privateKeyRule
} from '../dist/index.js';

function createContext(code, language = 'javascript') {
  const lines = code.split('\n');
  return {
    filePath: 'test.ts',
    lines,
    content: code,
    language
  };
}

test('RuleRegistry initializes with all 15 OWASP rules', () => {
  assert.strictEqual(defaultRuleRegistry.count(), 15);
});

test('SEC-JS-001 detects SQL injection in template string', () => {
  const ctx = createContext('const q = `SELECT * FROM users WHERE id = ${req.query.id}`;');
  const findings = sqlInjectionRule.evaluate(ctx);
  assert.strictEqual(findings.length, 1);
  assert.strictEqual(findings[0].line, 1);
});

test('SEC-JS-002 detects XSS in res.send and innerHTML', () => {
  const ctx = createContext('res.send(`<h1>Welcome ${user}</h1>`);\ndocument.body.innerHTML = input;');
  const findings = xssOutputRule.evaluate(ctx);
  assert.strictEqual(findings.length, 2);
});

test('SEC-JS-003 detects command injection in exec', () => {
  const ctx = createContext('exec(`tar -czf backup.tar.gz ${filename}`);');
  const findings = commandInjectionRule.evaluate(ctx);
  assert.strictEqual(findings.length, 1);
});

test('SEC-JS-004 detects weak MD5 and SHA1 hashes', () => {
  const ctx = createContext('crypto.createHash("md5");\ncrypto.createHash("sha1");');
  const findings = weakHashRule.evaluate(ctx);
  assert.strictEqual(findings.length, 2);
});

test('SEC-JS-005 detects path traversal in readFile and sendFile', () => {
  const ctx = createContext('fs.readFile(join(__dirname, req.query.path));\nres.sendFile(`${userDir}/${filename}`);');
  const findings = pathTraversalRule.evaluate(ctx);
  assert.strictEqual(findings.length, 2);
});

test('SEC-JS-006 detects unsafe eval and new Function', () => {
  const ctx = createContext('eval(userScript);\nconst fn = new Function("a", "b", code);');
  const findings = unsafeEvalRule.evaluate(ctx);
  assert.strictEqual(findings.length, 2);
});

test('SEC-JS-007 detects SSRF via dynamic axios/fetch', () => {
  const ctx = createContext('axios.get(req.query.targetUrl);\nfetch(`${req.body.webhookUrl}`);');
  const findings = ssrfRule.evaluate(ctx);
  assert.strictEqual(findings.length, 2);
});

test('SEC-JS-009 detects CORS wildcard origin', () => {
  const ctx = createContext('app.use(cors({ origin: "*" }));');
  const findings = corsWildcardRule.evaluate(ctx);
  assert.strictEqual(findings.length, 1);
});

test('SEC-JS-010 detects Math.random for security tokens', () => {
  const ctx = createContext('const sessionToken = Math.random().toString(36);');
  const findings = insecureRandomnessRule.evaluate(ctx);
  assert.strictEqual(findings.length, 1);
});

test('SEC-JS-011 detects sensitive data logging', () => {
  const ctx = createContext('console.log("User password is:", password);');
  const findings = logExposureRule.evaluate(ctx);
  assert.strictEqual(findings.length, 1);
});

test('SEC-JS-012 detects weak password length check', () => {
  const ctx = createContext('if (password.length < 5) return false;');
  const findings = weakPasswordPolicyRule.evaluate(ctx);
  assert.strictEqual(findings.length, 1);
});

test('SEC-JS-013 detects prototype pollution assignments', () => {
  const ctx = createContext('obj.__proto__ = payload;\ntarget.constructor.prototype = bad;');
  const findings = prototypePollutionRule.evaluate(ctx);
  assert.strictEqual(findings.length, 2);
});

test('SEC-GEN-001 detects hardcoded secrets and AWS keys', () => {
  const ctx = createContext('const API_KEY = "sk-1234567890abcdef12345678";\nconst aws = "AKIA1234567890ABCDEF";');
  const findings = hardcodedSecretsRule.evaluate(ctx);
  assert.strictEqual(findings.length, 2);
});

test('SEC-GEN-002 detects hardcoded private keys', () => {
  const ctx = createContext('const key = "-----BEGIN RSA PRIVATE KEY-----\\nMIIE...";');
  const findings = privateKeyRule.evaluate(ctx);
  assert.strictEqual(findings.length, 1);
});

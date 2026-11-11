/**
 * High-speed in-memory secret masking utility.
 * Replaces high-entropy credentials, API keys, and sensitive tokens with masked strings.
 */
const SECRET_PATTERNS: RegExp[] = [
  // AWS Access Key ID
  /\b(AKIA[0-9A-Z]{16})\b/g,
  // GitHub Personal Access Token
  /\b(gh[pous]_[0-9a-zA-Z]{36})\b/g,
  // Generic Bearer Token / API Key assignments
  /(["']?(?:api[_-]?key|secret|password|auth[_-]?token)["']?\s*[:=]\s*["'])([^"']{6,})(["'])/gi,
  // Slack Token
  /\b(xox[baprs]-[0-9a-zA-Z]{10,48})\b/g
];

export function redactSecrets(content: string): string {
  let redacted = content;

  // Mask exact token types
  redacted = redacted.replace(/\b(AKIA[0-9A-Z]{16})\b/g, 'AKIA****************');
  redacted = redacted.replace(/\b(gh[pous]_[0-9a-zA-Z]{36})\b/g, 'ghp_************************************');
  redacted = redacted.replace(/\b(xox[baprs]-[0-9a-zA-Z]{10,48})\b/g, 'xox*-********************');

  // Mask assignments like apiKey = "value"
  redacted = redacted.replace(
    /(["']?(?:api[_-]?key|secret|password|auth[_-]?token)["']?\s*[:=]\s*["'])([^"']{6,})(["'])/gi,
    (_match, prefix, secretVal, suffix) => {
      const visibleChars = Math.min(2, Math.floor(secretVal.length / 4));
      const masked = secretVal.substring(0, visibleChars) + '****' + secretVal.substring(secretVal.length - visibleChars);
      return `${prefix}${masked}${suffix}`;
    }
  );

  return redacted;
}


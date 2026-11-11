import express from 'express';
import { exec } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const app = express();
app.use(express.json());

// 1. SEC-GEN-001: Hardcoded API Secret
const apiKey = "mock_insecure_demo_key_xyz123";

// 2. SEC-JS-009: Permissive CORS Wildcard
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  next();
});

// 3. SEC-JS-001: SQL Injection via String Concatenation
app.get('/api/users', (req, res) => {
  const userId = req.query.id;
  const sqlQuery = "SELECT * FROM users WHERE id = '" + userId + "'";
  res.json({ query: sqlQuery });
});

// 4. SEC-JS-002: Reflected Cross-Site Scripting (XSS)
app.get('/welcome', (req, res) => {
  const username = req.query.name;
  res.send('<h1>Welcome ' + username + '</h1>');
});

// 5. SEC-JS-003: Command Injection via child_process.exec
app.get('/api/ping', (req, res) => {
  const host = req.query.host;
  exec('ping -c 1 ' + host, (err, stdout) => {
    res.send(stdout);
  });
});

// 6. SEC-JS-004: Weak Cryptographic Hash (MD5)
app.post('/api/hash', (req, res) => {
  const input = req.body.data || '';
  const hash = crypto.createHash('md5').update(input).digest('hex');
  res.json({ md5: hash });
});

// 7. SEC-JS-005: Path Traversal
app.get('/api/file', (req, res) => {
  const filename = req.query.file;
  const filePath = path.join('./uploads', filename);
  fs.readFile(filePath, 'utf-8', (err, data) => {
    res.send(data);
  });
});

// 8. SEC-JS-010: Insecure Pseudo-Random Number Generation for Security Tokens
app.get('/api/reset-token', (req, res) => {
  const resetToken = Math.random().toString(36).substring(2);
  res.json({ token: resetToken });
});

// 9. SEC-JS-012: Weak Password Length Policy (< 6 chars)
app.post('/api/register', (req, res) => {
  const password = req.body.password || '';
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password too short' });
  }
  res.json({ success: true });
});

app.listen(3000, () => {
  console.log('Sample vulnerable application running on port 3000');
});


import { MemoryDataStore } from '../store/data-store.js';

export function renderDashboardHtml(store: MemoryDataStore): string {
  const projects = store.listProjects();
  let totalIssues = 0;
  let totalCritical = 0;
  let totalHigh = 0;

  for (const p of projects) {
    totalIssues +=
      p.openIssuesCount.critical +
      p.openIssuesCount.high +
      p.openIssuesCount.medium +
      p.openIssuesCount.low;
    totalCritical += p.openIssuesCount.critical;
    totalHigh += p.openIssuesCount.high;
  }

  const avgHealthScore =
    projects.length > 0
      ? Math.round(projects.reduce((acc, p) => acc + p.healthScore, 0) / projects.length)
      : 100;

  const projectRows = projects
    .map(
      (p) => `
      <tr>
        <td style="font-weight: 600;">${escapeHtml(p.name)}</td>
        <td><code>${escapeHtml(p.defaultBranch)}</code></td>
        <td>
          <span class="badge ${p.healthScore >= 80 ? 'badge-green' : p.healthScore >= 50 ? 'badge-yellow' : 'badge-red'}">
            ${p.healthScore} / 100
          </span>
        </td>
        <td>
          <span style="color: #ef4444; font-weight: bold;">${p.openIssuesCount.critical}</span> /
          <span style="color: #f97316; font-weight: bold;">${p.openIssuesCount.high}</span> /
          <span style="color: #eab308;">${p.openIssuesCount.medium}</span> /
          <span style="color: #3b82f6;">${p.openIssuesCount.low}</span>
        </td>
        <td><code>${p.id}</code></td>
      </tr>`
    )
    .join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Voom Nexus — Security Dashboard</title>
  <style>
    :root {
      --bg: #0f172a;
      --card-bg: #1e293b;
      --text: #f8fafc;
      --text-muted: #94a3b8;
      --border: #334155;
      --primary: #38bdf8;
    }
    body {
      margin: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background: var(--bg);
      color: var(--text);
      line-height: 1.5;
    }
    .header {
      padding: 1.5rem 2rem;
      border-bottom: 1px solid var(--border);
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: var(--card-bg);
    }
    .logo {
      font-size: 1.25rem;
      font-weight: 800;
      color: var(--primary);
      letter-spacing: -0.025em;
    }
    .tag {
      font-size: 0.75rem;
      background: #0284c7;
      color: white;
      padding: 0.2rem 0.5rem;
      border-radius: 4px;
      margin-left: 0.5rem;
    }
    .container {
      max-width: 1200px;
      margin: 2rem auto;
      padding: 0 1.5rem;
    }
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 1.5rem;
      margin-bottom: 2rem;
    }
    .card {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 1.5rem;
    }
    .card-title {
      font-size: 0.875rem;
      color: var(--text-muted);
      margin-bottom: 0.5rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .card-value {
      font-size: 2rem;
      font-weight: 700;
    }
    .table-container {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 8px;
      overflow: hidden;
    }
    .table-header {
      padding: 1.25rem 1.5rem;
      font-weight: 700;
      border-bottom: 1px solid var(--border);
    }
    table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
    }
    th, td {
      padding: 1rem 1.5rem;
      border-bottom: 1px solid var(--border);
    }
    th {
      color: var(--text-muted);
      font-size: 0.75rem;
      text-transform: uppercase;
    }
    .badge {
      display: inline-block;
      padding: 0.25rem 0.75rem;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 600;
    }
    .badge-green { background: #065f46; color: #34d399; }
    .badge-yellow { background: #854d0e; color: #fde047; }
    .badge-red { background: #991b1b; color: #f87171; }
    code {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 0.875em;
      background: #0f172a;
      padding: 0.2em 0.4em;
      border-radius: 4px;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">
      VOOM NEXUS <span class="tag">Vibe Security Platform</span>
    </div>
    <div>
      <a href="/api/v1/health" style="color: var(--text-muted); text-decoration: none; font-size: 0.875rem; margin-right: 1rem;">API Health</a>
      <a href="/api/v1/projects" style="color: var(--primary); text-decoration: none; font-size: 0.875rem;">Projects API</a>
    </div>
  </div>

  <div class="container">
    <div class="metrics-grid">
      <div class="card">
        <div class="card-title">Average Security Health</div>
        <div class="card-value" style="color: ${avgHealthScore >= 80 ? '#34d399' : '#f87171'};">${avgHealthScore}%</div>
      </div>
      <div class="card">
        <div class="card-title">Monitored Projects</div>
        <div class="card-value">${projects.length}</div>
      </div>
      <div class="card">
        <div class="card-title">Total Open Vulnerabilities</div>
        <div class="card-value">${totalIssues}</div>
      </div>
      <div class="card">
        <div class="card-title">Critical / High Issues</div>
        <div class="card-value" style="color: #ef4444;">${totalCritical + totalHigh}</div>
      </div>
    </div>

    <div class="table-container">
      <div class="table-header">Monitored Applications & Repositories</div>
      <table>
        <thead>
          <tr>
            <th>Project Name</th>
            <th>Default Branch</th>
            <th>Health Score</th>
            <th>Open Issues (C / H / M / L)</th>
            <th>Project ID</th>
          </tr>
        </thead>
        <tbody>
          ${projectRows}
        </tbody>
      </table>
    </div>
  </div>
</body>
</html>`;
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}


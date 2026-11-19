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
      <tr id="row-${escapeHtml(p.id)}">
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
        <td><code>${escapeHtml(p.id)}</code></td>
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
      --card-hover: #24344d;
      --text: #f8fafc;
      --text-muted: #94a3b8;
      --border: #334155;
      --primary: #38bdf8;
      --primary-hover: #0284c7;
      --danger: #ef4444;
      --warning: #f97316;
      --accent: #10b981;
    }
    * {
      box-sizing: border-box;
    }
    body {
      margin: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background: var(--bg);
      color: var(--text);
      line-height: 1.5;
    }
    .header {
      padding: 1.25rem 2rem;
      border-bottom: 1px solid var(--border);
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: var(--card-bg);
      position: sticky;
      top: 0;
      z-index: 100;
    }
    .logo {
      font-size: 1.25rem;
      font-weight: 800;
      color: var(--primary);
      letter-spacing: -0.025em;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .tag {
      font-size: 0.75rem;
      background: #0284c7;
      color: white;
      padding: 0.2rem 0.5rem;
      border-radius: 4px;
      font-weight: 600;
    }
    .nav-links a {
      color: var(--text-muted);
      text-decoration: none;
      font-size: 0.875rem;
      margin-left: 1.5rem;
      transition: color 0.15s ease;
    }
    .nav-links a:hover {
      color: var(--primary);
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
      border-radius: 10px;
      padding: 1.5rem;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.2);
    }
    .card-title {
      font-size: 0.85rem;
      color: var(--text-muted);
      margin-bottom: 0.5rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      font-weight: 600;
    }
    .card-value {
      font-size: 2rem;
      font-weight: 800;
      letter-spacing: -0.02em;
    }

    /* Scanner Section */
    .scanner-card {
      background: linear-gradient(180deg, #1e293b 0%, #151f30 100%);
      border: 1px solid #38bdf840;
      border-radius: 12px;
      padding: 1.75rem;
      margin-bottom: 2.5rem;
      box-shadow: 0 8px 24px -4px rgba(56, 189, 248, 0.08);
    }
    .scanner-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.75rem;
      flex-wrap: wrap;
      gap: 0.5rem;
    }
    .scanner-title {
      font-size: 1.25rem;
      font-weight: 700;
      color: var(--text);
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .scanner-desc {
      color: var(--text-muted);
      font-size: 0.9rem;
      margin-bottom: 1.25rem;
    }
    .presets-row {
      display: flex;
      gap: 0.5rem;
      margin-bottom: 1rem;
      flex-wrap: wrap;
      align-items: center;
    }
    .preset-label {
      font-size: 0.75rem;
      color: var(--text-muted);
      text-transform: uppercase;
      font-weight: 600;
      margin-right: 0.25rem;
    }
    .preset-btn {
      background: #0f172a;
      border: 1px solid var(--border);
      color: var(--primary);
      padding: 0.35rem 0.75rem;
      border-radius: 6px;
      font-size: 0.8rem;
      cursor: pointer;
      font-family: inherit;
      transition: all 0.15s ease;
    }
    .preset-btn:hover {
      background: #1e293b;
      border-color: var(--primary);
    }
    .scan-form {
      display: flex;
      gap: 0.75rem;
      flex-wrap: wrap;
    }
    .scan-input {
      flex: 1;
      min-width: 280px;
      background: #0f172a;
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 0.75rem 1rem;
      color: var(--text);
      font-size: 0.95rem;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      outline: none;
      transition: border-color 0.2s ease, box-shadow 0.2s ease;
    }
    .scan-input:focus {
      border-color: var(--primary);
      box-shadow: 0 0 0 3px rgba(56, 189, 248, 0.2);
    }
    .scan-btn {
      background: var(--primary);
      color: #0f172a;
      border: none;
      border-radius: 8px;
      padding: 0.75rem 1.75rem;
      font-weight: 700;
      font-size: 0.95rem;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      transition: all 0.2s ease;
    }
    .scan-btn:hover {
      background: #7dd3fc;
      transform: translateY(-1px);
    }
    .scan-btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none;
    }
    .spinner {
      width: 1rem;
      height: 1rem;
      border: 2px solid #0f172a;
      border-top-color: transparent;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      display: inline-block;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    .scan-status {
      margin-top: 1rem;
      padding: 0.75rem 1rem;
      border-radius: 6px;
      font-size: 0.875rem;
      display: none;
    }
    .scan-status.error {
      background: #7f1d1d40;
      border: 1px solid #ef4444;
      color: #fca5a5;
      display: block;
    }
    .scan-status.loading {
      background: #0369a130;
      border: 1px solid #0284c7;
      color: #7dd3fc;
      display: block;
    }

    /* Results Section */
    #resultsSection {
      display: none;
      margin-bottom: 2.5rem;
      animation: fadeIn 0.3s ease;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(8px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .results-card {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 12px;
      overflow: hidden;
    }
    .results-header {
      padding: 1.25rem 1.5rem;
      border-bottom: 1px solid var(--border);
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 1rem;
      background: #192231;
    }
    .results-summary-pills {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
    }
    .summary-pill {
      font-size: 0.8rem;
      padding: 0.35rem 0.75rem;
      border-radius: 9999px;
      font-weight: 600;
      background: #0f172a;
      border: 1px solid var(--border);
    }
    .filter-tabs {
      display: flex;
      padding: 0.75rem 1.5rem;
      gap: 0.5rem;
      border-bottom: 1px solid var(--border);
      background: #141d2b;
      overflow-x: auto;
    }
    .filter-tab {
      background: transparent;
      border: 1px solid transparent;
      color: var(--text-muted);
      padding: 0.4rem 0.85rem;
      border-radius: 6px;
      font-size: 0.85rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .filter-tab:hover {
      color: var(--text);
      background: #1e293b;
    }
    .filter-tab.active {
      color: var(--primary);
      background: #0f172a;
      border-color: #38bdf860;
    }
    .findings-container {
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }
    .finding-card {
      background: #0f172a;
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 1.25rem;
      transition: border-color 0.15s ease;
    }
    .finding-card:hover {
      border-color: #475569;
    }
    .finding-top {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 0.75rem;
      flex-wrap: wrap;
      gap: 0.5rem;
    }
    .finding-title {
      font-weight: 700;
      font-size: 1rem;
      color: var(--text);
    }
    .finding-loc {
      color: var(--primary);
      font-family: ui-monospace, monospace;
      font-size: 0.85rem;
      background: #1e293b;
      padding: 0.2rem 0.5rem;
      border-radius: 4px;
    }
    .finding-standards {
      font-size: 0.8rem;
      color: var(--text-muted);
      margin-bottom: 0.75rem;
    }
    .code-box {
      background: #060913;
      border: 1px solid #1e293b;
      border-radius: 6px;
      padding: 0.75rem 1rem;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 0.85rem;
      color: #fca5a5;
      overflow-x: auto;
      margin-bottom: 0.75rem;
    }
    .remed-box {
      background: #064e3b20;
      border-left: 3px solid #10b981;
      padding: 0.6rem 0.85rem;
      border-radius: 0 4px 4px 0;
      font-size: 0.85rem;
      color: #a7f3d0;
    }

    /* Table Styles */
    .table-container {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 10px;
      overflow: hidden;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.2);
    }
    .table-header {
      padding: 1.25rem 1.5rem;
      font-weight: 700;
      border-bottom: 1px solid var(--border);
      display: flex;
      justify-content: space-between;
      align-items: center;
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
      letter-spacing: 0.05em;
    }
    tr:hover td {
      background: rgba(255, 255, 255, 0.015);
    }
    .badge {
      display: inline-block;
      padding: 0.25rem 0.75rem;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 700;
    }
    .badge-green { background: #065f46; color: #34d399; }
    .badge-yellow { background: #854d0e; color: #fde047; }
    .badge-red { background: #991b1b; color: #f87171; }
    .badge-critical { background: #450a0a; color: #f87171; border: 1px solid #dc2626; }
    .badge-high { background: #431407; color: #fb923c; border: 1px solid #ea580c; }
    .badge-medium { background: #422006; color: #facc15; border: 1px solid #ca8a04; }
    .badge-low { background: #172554; color: #60a5fa; border: 1px solid #2563eb; }

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
    <div class="nav-links">
      <a href="/api/v1/health">API Health</a>
      <a href="/api/v1/projects">Projects API</a>
      <a href="/api/v1/findings">Findings API</a>
    </div>
  </div>

  <div class="container">
    <!-- Top Metrics -->
    <div class="metrics-grid">
      <div class="card">
        <div class="card-title">Average Security Health</div>
        <div class="card-value" id="metricAvgHealth" style="color: ${avgHealthScore >= 80 ? '#34d399' : '#f87171'};">${avgHealthScore}%</div>
      </div>
      <div class="card">
        <div class="card-title">Monitored Projects</div>
        <div class="card-value" id="metricTotalProjects">${projects.length}</div>
      </div>
      <div class="card">
        <div class="card-title">Total Open Vulnerabilities</div>
        <div class="card-value" id="metricTotalIssues">${totalIssues}</div>
      </div>
      <div class="card">
        <div class="card-title">Critical / High Issues</div>
        <div class="card-value" id="metricCritHigh" style="color: #ef4444;">${totalCritical + totalHigh}</div>
      </div>
    </div>

    <!-- Live Scanner Box -->
    <div class="scanner-card">
      <div class="scanner-header">
        <div class="scanner-title">
          <span>⚡ Live Interactive Security Scanner</span>
          <span class="tag" style="background: #065f46; color: #34d399;">Active Engine</span>
        </div>
      </div>
      <div class="scanner-desc">
        Paste or enter any local directory or file path to run real-time static security analysis across all 15 OWASP & CWE rules.
      </div>
      
      <div class="presets-row">
        <span class="preset-label">Quick Presets:</span>
        <button class="preset-btn" onclick="setTargetPath('samples/vulnerable-app')">📁 samples/vulnerable-app</button>
        <button class="preset-btn" onclick="setTargetPath('packages/core/src')">📁 packages/core/src</button>
        <button class="preset-btn" onclick="setTargetPath('.')">📁 . (Whole Project)</button>
      </div>

      <div class="scan-form">
        <input 
          type="text" 
          id="targetPathInput" 
          class="scan-input" 
          placeholder="Paste or enter target path e.g. samples/vulnerable-app or /Users/..." 
          value="samples/vulnerable-app"
          onkeydown="if(event.key === 'Enter') runLiveScan()"
        />
        <button id="scanBtn" class="scan-btn" onclick="runLiveScan()">
          <span>🔍 Run Security Scan</span>
        </button>
      </div>

      <div id="scanStatus" class="scan-status"></div>
    </div>

    <!-- Live Scan Results Container -->
    <div id="resultsSection">
      <div class="results-card">
        <div class="results-header">
          <div>
            <h3 style="margin: 0 0 0.35rem 0; font-size: 1.15rem; color: #f8fafc;">
              Scan Report: <span id="resTargetName" style="color: var(--primary);"></span>
            </h3>
            <span id="resMetaInfo" style="font-size: 0.8rem; color: var(--text-muted);"></span>
          </div>
          <div class="results-summary-pills">
            <span id="resHealthPill" class="summary-pill">Health: --</span>
            <span id="resCritPill" class="summary-pill" style="color: #f87171; border-color: #dc262650;">0 Critical</span>
            <span id="resHighPill" class="summary-pill" style="color: #fb923c; border-color: #ea580c50;">0 High</span>
            <span id="resMedPill" class="summary-pill" style="color: #facc15; border-color: #ca8a0450;">0 Medium</span>
          </div>
        </div>

        <div class="filter-tabs">
          <button class="filter-tab active" onclick="filterFindings('ALL')">All Issues (<span id="countAll">0</span>)</button>
          <button class="filter-tab" onclick="filterFindings('CRITICAL')">Critical (<span id="countCrit">0</span>)</button>
          <button class="filter-tab" onclick="filterFindings('HIGH')">High (<span id="countHigh">0</span>)</button>
          <button class="filter-tab" onclick="filterFindings('MEDIUM')">Medium (<span id="countMed">0</span>)</button>
        </div>

        <div id="findingsList" class="findings-container"></div>
      </div>
    </div>

    <!-- Monitored Projects Table -->
    <div class="table-container">
      <div class="table-header">
        <span>Monitored Applications & Repositories</span>
        <span style="font-size: 0.8rem; color: var(--text-muted); font-weight: normal;">Automatically synced with scans</span>
      </div>
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
        <tbody id="projectsTableBody">
          ${projectRows}
        </tbody>
      </table>
    </div>
  </div>

  <script>
    let currentFindings = [];
    let activeFilter = 'ALL';

    function setTargetPath(path) {
      const input = document.getElementById('targetPathInput');
      input.value = path;
      input.focus();
    }

    async function runLiveScan() {
      const input = document.getElementById('targetPathInput');
      const btn = document.getElementById('scanBtn');
      const statusDiv = document.getElementById('scanStatus');
      const resultsSection = document.getElementById('resultsSection');
      const targetPath = input.value.trim();

      if (!targetPath) {
        showStatus('Please enter a target path to scan.', 'error');
        return;
      }

      btn.disabled = true;
      btn.innerHTML = '<span class="spinner"></span> Scanning...';
      showStatus('Scanning target directory with Voom Nexus AST & regex engine...', 'loading');

      try {
        const response = await fetch('/api/v1/scan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ targetPath })
        });

        const res = await response.json();

        if (!response.ok || !res.success) {
          throw new Error(res.error?.message || 'Security scan failed');
        }

        const data = res.data;
        const scan = data.scanResult;
        const metrics = scan.metrics;
        const project = data.project;

        statusDiv.style.display = 'none';

        // Update Top Metric Cards dynamically
        if (data.metrics) {
          const avgHealth = data.metrics.avgHealthScore;
          const avgHealthEl = document.getElementById('metricAvgHealth');
          avgHealthEl.textContent = avgHealth + '%';
          avgHealthEl.style.color = avgHealth >= 80 ? '#34d399' : '#f87171';
          
          document.getElementById('metricTotalProjects').textContent = data.metrics.totalProjects;
          document.getElementById('metricTotalIssues').textContent = data.metrics.totalIssues;
          document.getElementById('metricCritHigh').textContent = data.metrics.totalCritHigh;
        }

        // Update or insert into projects table
        updateProjectsTable(project);

        // Display results
        currentFindings = scan.issues || [];
        displayScanResults(scan, project);

      } catch (err) {
        showStatus('Error: ' + err.message, 'error');
      } finally {
        btn.disabled = false;
        btn.innerHTML = '<span>🔍 Run Security Scan</span>';
      }
    }

    function showStatus(msg, type) {
      const statusDiv = document.getElementById('scanStatus');
      statusDiv.className = 'scan-status ' + type;
      statusDiv.textContent = msg;
      statusDiv.style.display = 'block';
    }

    function updateProjectsTable(project) {
      const tbody = document.getElementById('projectsTableBody');
      const existingRow = document.getElementById('row-' + project.id);
      
      const badgeClass = project.healthScore >= 80 ? 'badge-green' : project.healthScore >= 50 ? 'badge-yellow' : 'badge-red';
      const rowHtml = \`
        <td style="font-weight: 600;">\${escapeHtml(project.name)}</td>
        <td><code>\${escapeHtml(project.defaultBranch)}</code></td>
        <td>
          <span class="badge \${badgeClass}">
            \${project.healthScore} / 100
          </span>
        </td>
        <td>
          <span style="color: #ef4444; font-weight: bold;">\${project.openIssuesCount.critical}</span> /
          <span style="color: #f97316; font-weight: bold;">\${project.openIssuesCount.high}</span> /
          <span style="color: #eab308;">\${project.openIssuesCount.medium}</span> /
          <span style="color: #3b82f6;">\${project.openIssuesCount.low}</span>
        </td>
        <td><code>\${escapeHtml(project.id)}</code></td>
      \`;

      if (existingRow) {
        existingRow.innerHTML = rowHtml;
      } else {
        const tr = document.createElement('tr');
        tr.id = 'row-' + project.id;
        tr.innerHTML = rowHtml;
        tbody.prepend(tr);
      }
    }

    function displayScanResults(scan, project) {
      const resultsSection = document.getElementById('resultsSection');
      resultsSection.style.display = 'block';

      document.getElementById('resTargetName').textContent = scan.targetPath;
      document.getElementById('resMetaInfo').textContent = 
        'Scanned ' + scan.metrics.scannedFiles + ' files in ' + scan.metrics.durationMs + 'ms • ' + new Date(scan.timestamp).toLocaleTimeString();

      const healthPill = document.getElementById('resHealthPill');
      healthPill.textContent = 'Health: ' + project.healthScore + '/100';
      healthPill.style.color = project.healthScore >= 80 ? '#34d399' : project.healthScore >= 50 ? '#fde047' : '#f87171';

      document.getElementById('resCritPill').textContent = scan.metrics.criticalCount + ' Critical';
      document.getElementById('resHighPill').textContent = scan.metrics.highCount + ' High';
      document.getElementById('resMedPill').textContent = scan.metrics.mediumCount + ' Medium';

      document.getElementById('countAll').textContent = currentFindings.length;
      document.getElementById('countCrit').textContent = scan.metrics.criticalCount;
      document.getElementById('countHigh').textContent = scan.metrics.highCount;
      document.getElementById('countMed').textContent = scan.metrics.mediumCount;

      renderFilteredFindings();
      resultsSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    function filterFindings(severity) {
      activeFilter = severity;
      const tabs = document.querySelectorAll('.filter-tab');
      tabs.forEach(tab => {
        if (tab.textContent.toUpperCase().includes(severity)) {
          tab.classList.add('active');
        } else {
          tab.classList.remove('active');
        }
      });
      renderFilteredFindings();
    }

    function renderFilteredFindings() {
      const container = document.getElementById('findingsList');
      const filtered = activeFilter === 'ALL' 
        ? currentFindings 
        : currentFindings.filter(f => f.severity.toUpperCase() === activeFilter);

      if (filtered.length === 0) {
        container.innerHTML = '<div style="text-align: center; color: #94a3b8; padding: 2rem 0;">🎉 No vulnerabilities detected for this severity category!</div>';
        return;
      }

      container.innerHTML = filtered.map(f => {
        const sevClass = 'badge-' + f.severity.toLowerCase();
        return \`
          <div class="finding-card">
            <div class="finding-top">
              <div>
                <span class="badge \${sevClass}" style="margin-right: 0.5rem;">\${escapeHtml(f.severity)}</span>
                <span class="finding-title">\${escapeHtml(f.title)}</span>
                <span style="color: var(--text-muted); font-size: 0.85rem; margin-left: 0.35rem;">(\${escapeHtml(f.ruleId)})</span>
              </div>
              <div class="finding-loc">📍 \${escapeHtml(f.file)}:\${f.line}</div>
            </div>
            <div class="finding-standards">
              <strong>Standard:</strong> \${escapeHtml(f.cwe || 'CWE')} • \${escapeHtml(f.owasp || 'OWASP')}
            </div>
            \${f.snippet ? \`<div class="code-box">\${escapeHtml(f.snippet)}</div>\` : ''}
            <div class="remed-box">
              <strong>💡 Remediation:</strong> \${escapeHtml(f.remediation || 'Review and sanitize input parameters.')}
            </div>
          </div>
        \`;
      }).join('');
    }

    function escapeHtml(str) {
      if (!str) return '';
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    }
  </script>
</body>
</html>`;
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

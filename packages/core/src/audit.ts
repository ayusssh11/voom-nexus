import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { SecurityIssue, Severity, logger } from '@voom-nexus/shared';

export interface KnownAdvisory {
  name: string;
  vulnerableRange: RegExp;
  fixedVersion: string;
  cve: string;
  cwe: string;
  severity: Severity;
  title: string;
  remediation: string;
}

export const KNOWN_ADVISORIES: KnownAdvisory[] = [
  {
    name: 'event-stream',
    vulnerableRange: /^3\.3\.[5-6]$/,
    fixedVersion: '>= 4.0.0',
    cve: 'CVE-2018-20834',
    cwe: 'CWE-506',
    severity: 'CRITICAL',
    title: 'Malicious Code Injection in event-stream (flatmap-stream)',
    remediation: 'Upgrade to event-stream@4.0.1 or remove package immediately'
  },
  {
    name: 'lodash',
    vulnerableRange: /^(?:[0-3]\.|4\.(?:[0-9]|1[0-6])\.|4\.17\.(?:[0-9]|1[0-9]|20)$)/,
    fixedVersion: '4.17.21',
    cve: 'CVE-2020-8203',
    cwe: 'CWE-1321',
    severity: 'HIGH',
    title: 'Prototype Pollution in lodash.zipObjectDeep / defaultsDeep',
    remediation: 'Upgrade lodash to >= 4.17.21'
  },
  {
    name: 'axios',
    vulnerableRange: /^0\.(?:[0-9]|1[0-9]|20)\./,
    fixedVersion: '0.21.1',
    cve: 'CVE-2020-28168',
    cwe: 'CWE-918',
    severity: 'HIGH',
    title: 'Server-Side Request Forgery (SSRF) bypass in axios',
    remediation: 'Upgrade axios to >= 0.21.1'
  },
  {
    name: 'minimist',
    vulnerableRange: /^(?:0\.|1\.[0-1]\.|1\.2\.[0-5]$)/,
    fixedVersion: '1.2.6',
    cve: 'CVE-2021-44906',
    cwe: 'CWE-1321',
    severity: 'HIGH',
    title: 'Prototype Pollution in minimist parseArgs',
    remediation: 'Upgrade minimist to >= 1.2.6'
  },
  {
    name: 'jsonwebtoken',
    vulnerableRange: /^[0-8]\./,
    fixedVersion: '9.0.0',
    cve: 'CVE-2022-23529',
    cwe: 'CWE-94',
    severity: 'CRITICAL',
    title: 'Remote Code Execution via insecure secretOrPublicKey in jsonwebtoken',
    remediation: 'Upgrade jsonwebtoken to >= 9.0.0'
  },
  {
    name: 'shelljs',
    vulnerableRange: /^0\.[0-7]\.|^0\.8\.[0-4]$/,
    fixedVersion: '0.8.5',
    cve: 'CVE-2022-0144',
    cwe: 'CWE-78',
    severity: 'HIGH',
    title: 'Command Injection in shelljs.exec',
    remediation: 'Upgrade shelljs to >= 0.8.5'
  }
];

export interface AuditReport {
  scannedDependencies: number;
  vulnerableCount: number;
  issues: SecurityIssue[];
}

export class DependencyAuditor {
  private advisories: KnownAdvisory[];

  constructor(customAdvisories?: KnownAdvisory[]) {
    this.advisories = customAdvisories || KNOWN_ADVISORIES;
  }

  /**
   * Audits a package.json and/or package-lock.json in the target directory for known vulnerabilities.
   */
  async auditDirectory(targetDir: string): Promise<AuditReport> {
    const issues: SecurityIssue[] = [];
    const scannedDeps = new Set<string>();

    // 1. Try reading package-lock.json for exact installed versions
    const lockPath = join(targetDir, 'package-lock.json');
    let hasLock = false;

    try {
      const lockRaw = await readFile(lockPath, 'utf-8');
      const lockData = JSON.parse(lockRaw);
      hasLock = true;

      // npm lockfile v2 / v3
      if (lockData.packages) {
        for (const [pkgPath, pkgInfo] of Object.entries<any>(lockData.packages)) {
          if (!pkgInfo.version) continue;
          const pkgName = pkgPath.replace(/^node_modules\//, '');
          scannedDeps.add(pkgName);
          this.checkDependency(pkgName, pkgInfo.version, 'package-lock.json', issues);
        }
      }

      // npm lockfile v1 fallback
      if (lockData.dependencies) {
        for (const [pkgName, pkgInfo] of Object.entries<any>(lockData.dependencies)) {
          if (!pkgInfo.version) continue;
          scannedDeps.add(pkgName);
          this.checkDependency(pkgName, pkgInfo.version, 'package-lock.json', issues);
        }
      }
    } catch {
      hasLock = false;
    }

    // 2. If no lockfile, inspect package.json manifest declarations
    if (!hasLock) {
      const pkgPath = join(targetDir, 'package.json');
      try {
        const pkgRaw = await readFile(pkgPath, 'utf-8');
        const pkgData = JSON.parse(pkgRaw);
        const allDeps = {
          ...pkgData.dependencies,
          ...pkgData.devDependencies
        };

        for (const [pkgName, versionRange] of Object.entries<string>(allDeps)) {
          scannedDeps.add(pkgName);
          const cleanVersion = versionRange.replace(/^[\^~>=<]+/, '');
          this.checkDependency(pkgName, cleanVersion, 'package.json', issues);
        }
      } catch (err: any) {
        logger.debug(`No dependency manifest found at ${targetDir}: ${err.message}`);
      }
    }

    return {
      scannedDependencies: scannedDeps.size,
      vulnerableCount: issues.length,
      issues
    };
  }

  private checkDependency(name: string, version: string, manifestFile: string, issues: SecurityIssue[]): void {
    for (const adv of this.advisories) {
      if (adv.name === name && adv.vulnerableRange.test(version)) {
        issues.push({
          id: `dep_${name}_${version.replace(/[^a-zA-Z0-9]/g, '_')}`,
          ruleId: 'SEC-DEP-001',
          title: `${adv.title} (${name}@${version})`,
          severity: adv.severity,
          confidence: 'CERTAIN',
          cwe: adv.cwe,
          owasp: 'A06:2021-Vulnerable and Outdated Components',
          file: manifestFile,
          line: 1,
          snippet: `"${name}": "${version}"`,
          remediation: `${adv.remediation} (Mitigates ${adv.cve})`
        });
      }
    }
  }
}

import { mkdirSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';

const reportsDir = path.resolve('reports');
mkdirSync(reportsDir, { recursive: true });

const command = process.platform === 'win32' ? 'cmd.exe' : 'npm';
const args = process.platform === 'win32' ? ['/d', '/s', '/c', 'npm audit --json'] : ['audit', '--json'];

const result = spawnSync(command, args, {
  encoding: 'utf8',
});

const stdout = result.stdout || result.stderr || '{}';
writeFileSync(path.join(reportsDir, 'npm-audit.json'), stdout);

let summary = 'npm audit completed with no parseable summary.';
try {
  const parsed = JSON.parse(stdout);
  const vulnerabilities = parsed.metadata?.vulnerabilities;
  if (vulnerabilities) {
    summary = `npm audit: ${vulnerabilities.total ?? 0} total (${vulnerabilities.low ?? 0} low, ${vulnerabilities.moderate ?? 0} moderate, ${vulnerabilities.high ?? 0} high, ${vulnerabilities.critical ?? 0} critical).`;
  }
} catch {
  summary = 'npm audit output was not valid JSON.';
}

writeFileSync(path.join(reportsDir, 'npm-audit-summary.txt'), `${summary}\n`);
console.log(summary);

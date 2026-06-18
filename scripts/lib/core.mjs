import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';

export const SCHEMA_VERSION = '0.1.0';

const DANGEROUS_PATTERNS = [
  { code: 'curl-pipe-shell', pattern: /\b(curl|wget)\b[\s\S]{0,80}\|\s*(sh|bash|pwsh|powershell)/i },
  { code: 'destructive-remove', pattern: /\brm\s+-rf\b|Remove-Item\s+.*-Recurse/i },
  { code: 'encoded-powershell', pattern: /powershell(?:\.exe)?\s+.*-(enc|encodedcommand)\b/i },
  { code: 'remote-shell', pattern: /\b(ssh|scp|rsync|nc)\b/i },
  { code: 'publish-deploy', pattern: /\b(npm\s+publish|twine\s+upload|vercel\s+deploy|firebase\s+deploy)\b/i },
  { code: 'secret-path', pattern: /(\.ssh|\.aws|\.npmrc|\.pypirc|\.netrc|id_rsa|GITHUB_TOKEN|OPENAI_API_KEY)/i }
];

const DEFAULT_LIMITS = {
  maxFiles: 3000,
  maxFileBytes: 5 * 1024 * 1024,
  maxTotalBytes: 75 * 1024 * 1024,
  maxDepth: 30,
  commandTimeoutMs: 15000,
  maxOutputBytes: 12000
};

export function parseArgs(argv) {
  const positional = [];
  const flags = {};
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (!arg.startsWith('--')) {
      positional.push(arg);
      continue;
    }
    const key = arg.slice(2);
    if (key.includes('=')) {
      const [name, value] = key.split(/=(.*)/s);
      flags[name] = value;
    } else if (i + 1 < argv.length && !argv[i + 1].startsWith('--')) {
      flags[key] = argv[i + 1];
      i += 1;
    } else {
      flags[key] = true;
    }
  }
  return { positional, flags };
}

export function resolveRepo(input = '.') {
  return path.resolve(process.cwd(), input);
}

export function readTextIfExists(file) {
  try {
    return fs.readFileSync(file, 'utf8');
  } catch {
    return '';
  }
}

export function readJsonIfExists(file) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return null;
  }
}

export function detectProject(repoPath) {
  const packageJson = readJsonIfExists(path.join(repoPath, 'package.json'));
  const pyproject = readTextIfExists(path.join(repoPath, 'pyproject.toml'));
  const setupPy = fs.existsSync(path.join(repoPath, 'setup.py'));
  const requirements = fs.existsSync(path.join(repoPath, 'requirements.txt'));
  const project = {
    type: 'unknown',
    packageManager: null,
    runtime: null,
    manifests: []
  };

  if (packageJson) {
    project.type = 'node';
    project.runtime = 'node';
    project.manifests.push('package.json');
    if (packageJson.packageManager) {
      project.packageManager = packageJson.packageManager.split('@')[0];
    } else if (fs.existsSync(path.join(repoPath, 'pnpm-lock.yaml'))) {
      project.packageManager = 'pnpm';
    } else if (fs.existsSync(path.join(repoPath, 'yarn.lock'))) {
      project.packageManager = 'yarn';
    } else if (fs.existsSync(path.join(repoPath, 'package-lock.json'))) {
      project.packageManager = 'npm';
    } else {
      project.packageManager = 'npm';
    }
  }

  if (pyproject || setupPy || requirements) {
    project.type = project.type === 'node' ? 'mixed' : 'python';
    project.runtime = project.runtime ? `${project.runtime},python` : 'python';
    if (pyproject) project.manifests.push('pyproject.toml');
    if (setupPy) project.manifests.push('setup.py');
    if (requirements) project.manifests.push('requirements.txt');
    if (!project.packageManager) {
      if (pyproject.includes('[tool.poetry]')) project.packageManager = 'poetry';
      else if (fs.existsSync(path.join(repoPath, 'uv.lock'))) project.packageManager = 'uv';
      else project.packageManager = 'pip';
    }
  }

  return project;
}

export function extractReadmeSteps(readmeText) {
  const steps = [];
  const fencePattern = /```([^\n`]*)\n([\s\S]*?)```/g;
  let match;
  while ((match = fencePattern.exec(readmeText))) {
    const lang = (match[1] || '').trim().toLowerCase();
    const isShell = ['', 'sh', 'shell', 'bash', 'zsh', 'powershell', 'ps1', 'pwsh', 'console', 'terminal'].includes(lang);
    if (!isShell) continue;
    const lines = match[2]
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => line.replace(/^\$\s*/, '').replace(/^>\s*/, ''));
    for (const line of lines) {
      if (line.startsWith('#')) continue;
      steps.push({
        command: line,
        category: categorizeCommand(line),
        lang: lang || 'shell'
      });
    }
  }
  return steps;
}

function categorizeCommand(command) {
  if (/\b(install|ci|sync)\b/.test(command)) return 'install';
  if (/\b(test|pytest|vitest|jest)\b/.test(command)) return 'test';
  if (/\b(dev|start|serve|run)\b/.test(command)) return 'run';
  if (/\b(pack|build|twine|python -m build)\b/.test(command)) return 'package';
  return 'demo';
}

export function collectAudit(repoPath, options = {}) {
  const readmePath = ['README.md', 'Readme.md', 'readme.md'].map((name) => path.join(repoPath, name)).find(fs.existsSync);
  const readmeText = readmePath ? fs.readFileSync(readmePath, 'utf8') : '';
  const steps = extractReadmeSteps(readmeText);
  const project = detectProject(repoPath);
  const issues = [];
  const packageJson = readJsonIfExists(path.join(repoPath, 'package.json'));
  const pyproject = readTextIfExists(path.join(repoPath, 'pyproject.toml'));

  if (!readmePath) {
    issues.push(issue('README_MISSING', 'error', 'No README.md file was found.', 'documentation'));
  }

  detectPackageManagerMismatch(project, steps, issues);
  detectEnvExample(repoPath, readmeText, packageJson, issues);
  detectDangerousReadmeCommands(steps, issues);
  detectDangerousScripts(packageJson, pyproject, readTextIfExists(path.join(repoPath, 'setup.py')), issues);
  detectMissingReadmeFileReferences(repoPath, readmeText, steps, issues);
  detectPythonVersionMismatch(readmeText, pyproject, issues);
  detectNodePackageIssues(repoPath, packageJson, issues);
  detectWindowsIncompatibleScripts(packageJson, issues);
  detectWebPortMismatch(readmeText, packageJson, repoPath, issues);
  detectCacheOnlyPattern(repoPath, readmeText, packageJson, issues);
  detectDemoMismatch(readmeText, repoPath, issues);

  let cleanroom = { enabled: false, copyPath: null, rejected: [] };
  if (options.cleanroom) {
    cleanroom = createCleanroom(repoPath, options.outputDir);
  }

  return buildReport({
    repoPath,
    mode: 'audit',
    status: issues.some((item) => item.severity === 'error') ? 'failed' : 'passed',
    project,
    readme: {
      path: readmePath ? path.relative(repoPath, readmePath).replaceAll('\\', '/') : null,
      steps
    },
    issues,
    commands: [],
    cleanroom,
    fix: null
  });
}

function detectPackageManagerMismatch(project, steps, issues) {
  if (project.type !== 'node' && project.type !== 'mixed') return;
  const expected = project.packageManager;
  const seen = new Set();
  for (const step of steps) {
    const actual = step.command.match(/^(npm|pnpm|yarn)\b/)?.[1];
    const key = `${actual}->${expected}`;
    if (actual && expected && actual !== expected && !seen.has(key)) {
      seen.add(key);
      issues.push(issue(
        'README_PACKAGE_MANAGER_MISMATCH',
        'error',
        `README uses ${actual}, but project declares ${expected}.`,
        'documentation',
        { expected, actual, command: step.command }
      ));
    }
  }
}

function detectEnvExample(repoPath, readmeText, packageJson, issues) {
  const envMentioned = /\.env\b|process\.env|import\.meta\.env|REQUIRED_ENV|API_KEY|DATABASE_URL/i.test(readmeText)
    || JSON.stringify(packageJson ?? {}).includes('REQUIRED_ENV');
  if (envMentioned && !fs.existsSync(path.join(repoPath, '.env.example'))) {
    issues.push(issue('MISSING_ENV_EXAMPLE', 'error', 'README or scripts mention environment variables but .env.example is missing.', 'configuration'));
  }
}

function detectDangerousReadmeCommands(steps, issues) {
  for (const step of steps) {
    const hit = DANGEROUS_PATTERNS.find(({ pattern }) => pattern.test(step.command));
    if (hit) {
      issues.push(issue('DANGEROUS_README_COMMAND', 'error', `README command is blocked by safety policy: ${hit.code}.`, 'security', { command: step.command }));
    }
  }
}

function detectDangerousScripts(packageJson, pyproject, setupPy, issues) {
  if (packageJson?.scripts) {
    for (const [name, script] of Object.entries(packageJson.scripts)) {
      const lifecycle = /^(preinstall|install|postinstall|prepare|pretest|prepublish|prepack)$/i.test(name);
      const hit = DANGEROUS_PATTERNS.find(({ pattern }) => pattern.test(script));
      if (lifecycle || hit) {
        issues.push(issue('DANGEROUS_SCRIPT', lifecycle ? 'warning' : 'error', `package.json script "${name}" requires review before execution.`, 'security', { script: name, command: script }));
      }
    }
  }
  if (/curl|wget|subprocess|os\.system|shutil\.rmtree|rm -rf/i.test(setupPy || '') || /build-backend\s*=/i.test(pyproject || '')) {
    issues.push(issue('DANGEROUS_SCRIPT', 'warning', 'Python build configuration may execute project code during install/build.', 'security'));
  }
}

function detectMissingReadmeFileReferences(repoPath, readmeText, steps, issues) {
  const references = new Set();
  const pathPattern = /(?:^|[\s("'])((?:examples?|data|fixtures|samples|demo|docs)\/[A-Za-z0-9._\-\/]+)(?=$|[\s)"'.])/gm;
  let match;
  while ((match = pathPattern.exec(readmeText))) references.add(match[1]);
  for (const step of steps) {
    for (const token of step.command.split(/\s+/)) {
      if (/^(examples?|data|fixtures|samples|demo|docs)\//.test(token)) {
        references.add(token.replace(/^['"]|['"]$/g, ''));
      }
    }
  }
  for (const ref of references) {
    if (!fs.existsSync(path.join(repoPath, ref))) {
      issues.push(issue('README_REFERENCES_MISSING_FILE', 'error', `README references missing file ${ref}.`, 'documentation', { path: ref }));
    }
  }
}

function detectPythonVersionMismatch(readmeText, pyproject, issues) {
  if (!pyproject) return;
  const readmeVersion = readmeText.match(/Python\s+(\d+\.\d+)/i)?.[1];
  const requires = pyproject.match(/requires-python\s*=\s*["']([^"']+)["']/i)?.[1];
  if (!readmeVersion || !requires) return;
  const minVersion = requires.match(/>=\s*(\d+\.\d+)/)?.[1];
  if (minVersion && compareVersions(readmeVersion, minVersion) < 0) {
    issues.push(issue('PYTHON_VERSION_MISMATCH', 'error', `README says Python ${readmeVersion}, but pyproject requires ${requires}.`, 'configuration', { readmeVersion, requires }));
  }
}

function detectNodePackageIssues(repoPath, packageJson, issues) {
  if (!packageJson) return;
  const files = Array.isArray(packageJson.files) ? packageJson.files : [];
  for (const entry of files) {
    if (!fs.existsSync(path.join(repoPath, entry))) {
      issues.push(issue('NPM_PACK_MISSING_FILES', 'error', `package.json files includes missing path ${entry}.`, 'packaging', { path: entry }));
    }
  }
  const readme = readTextIfExists(path.join(repoPath, 'README.md'));
  const globalCommands = ['serve', 'vite', 'http-server', 'tsx'];
  for (const command of globalCommands) {
    const uses = new RegExp(`(^|\\s)${command}\\b`, 'm').test(readme);
    const declared = packageJson.dependencies?.[command] || packageJson.devDependencies?.[command] || packageJson.scripts && Object.values(packageJson.scripts).some((script) => script.includes(command));
    if (uses && !declared) {
      issues.push(issue('UNDECLARED_GLOBAL_DEPENDENCY', 'error', `README uses ${command} but it is not declared as a dependency or script.`, 'configuration', { command }));
    }
  }
}

function detectWindowsIncompatibleScripts(packageJson, issues) {
  if (!packageJson?.scripts) return;
  for (const [name, script] of Object.entries(packageJson.scripts)) {
    if (/\brm\s+-rf\b|\bcp\s+-r\b|\bexport\s+[A-Za-z_]/.test(script)) {
      issues.push(issue('WINDOWS_INCOMPATIBLE_SCRIPT', 'warning', `Script "${name}" uses POSIX-only syntax.`, 'platform', { script: name, command: script }));
    }
  }
}

function detectWebPortMismatch(readmeText, packageJson, repoPath, issues) {
  const readmePort = readmeText.match(/localhost:(\d{2,5})/)?.[1];
  if (!readmePort) return;
  const files = fs.readdirSync(repoPath).filter((file) => /\.(mjs|js|ts)$/.test(file));
  const sourceText = files.map((file) => readTextIfExists(path.join(repoPath, file))).join('\n');
  const sourcePort = sourceText.match(/listen\((\d{2,5})\)|PORT\s*=\s*(\d{2,5})/)?.slice(1).filter(Boolean)[0];
  if (sourcePort && sourcePort !== readmePort) {
    issues.push(issue('README_PORT_MISMATCH', 'error', `README points to port ${readmePort}, but source appears to use ${sourcePort}.`, 'documentation', { readmePort, sourcePort }));
  }
}

function detectCacheOnlyPattern(repoPath, readmeText, packageJson, issues) {
  const combined = `${readmeText}\n${JSON.stringify(packageJson ?? {})}\n${readTextIfExists(path.join(repoPath, 'index.js'))}`;
  if (/cache-only|REQUIRE_CACHE|\.cache\/maintainer/i.test(combined)) {
    issues.push(issue('CACHE_ONLY_WORKFLOW', 'error', 'Project appears to rely on maintainer-local cache state.', 'configuration'));
  }
}

function detectDemoMismatch(readmeText, repoPath, issues) {
  const marker = readTextIfExists(path.join(repoPath, 'demo-output.txt')).trim();
  const promised = readmeText.match(/Expected output:\s*`([^`]+)`/i)?.[1];
  if (marker && promised && marker !== promised) {
    issues.push(issue('DEMO_OUTPUT_MISMATCH', 'error', 'README demo output does not match the fixture output.', 'documentation', { expected: promised, actual: marker }));
  }
}

function compareVersions(a, b) {
  const av = a.split('.').map(Number);
  const bv = b.split('.').map(Number);
  for (let i = 0; i < Math.max(av.length, bv.length); i += 1) {
    const diff = (av[i] ?? 0) - (bv[i] ?? 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

export function issue(code, severity, message, category, details = {}) {
  return { code, severity, category, message, details };
}

export function buildReport({ repoPath, mode, status, project, readme, issues, commands, cleanroom, fix }) {
  return {
    schemaVersion: SCHEMA_VERSION,
    generatedAt: new Date().toISOString(),
    mode,
    status,
    repository: {
      path: redactText(repoPath),
      commit: getCommit(repoPath)
    },
    project,
    readme,
    safety: {
      defaultMode: 'audit-only',
      allowExecRequired: true,
      sandbox: 'best-effort-cleanroom-not-strong-isolation'
    },
    cleanroom,
    issues,
    commands,
    fix
  };
}

function getCommit(repoPath) {
  const result = spawnSync('git', ['-C', repoPath, 'rev-parse', '--short=12', 'HEAD'], { encoding: 'utf8' });
  return result.status === 0 ? result.stdout.trim() : null;
}

export function createCleanroom(repoPath, baseOutputDir = null) {
  const base = baseOutputDir || os.tmpdir();
  fs.mkdirSync(base, { recursive: true });
  const root = fs.mkdtempSync(path.join(base, 'repoproof-cleanroom-'));
  const copyPath = path.join(root, 'repo');
  const rejected = [];
  copySafe(repoPath, copyPath, { rejected, root: repoPath, depth: 0, stats: { files: 0, bytes: 0 } });
  return { enabled: true, copyPath, rejected };
}

function copySafe(src, dest, state) {
  const rel = path.relative(state.root, src);
  if (rel === '.git' || rel.startsWith(`.git${path.sep}`)) return;
  if (state.depth > DEFAULT_LIMITS.maxDepth) {
    state.rejected.push({ path: rel, reason: 'max-depth' });
    return;
  }
  const stat = fs.lstatSync(src);
  if (stat.isSymbolicLink()) {
    state.rejected.push({ path: rel, reason: 'symlink' });
    return;
  }
  if (stat.isDirectory()) {
    fs.mkdirSync(dest, { recursive: true });
    for (const entry of fs.readdirSync(src)) {
      copySafe(path.join(src, entry), path.join(dest, entry), { ...state, depth: state.depth + 1 });
    }
    return;
  }
  if (!stat.isFile()) {
    state.rejected.push({ path: rel, reason: 'not-regular-file' });
    return;
  }
  if (stat.size > DEFAULT_LIMITS.maxFileBytes) {
    state.rejected.push({ path: rel, reason: 'max-file-bytes' });
    return;
  }
  state.stats.files += 1;
  state.stats.bytes += stat.size;
  if (state.stats.files > DEFAULT_LIMITS.maxFiles || state.stats.bytes > DEFAULT_LIMITS.maxTotalBytes) {
    state.rejected.push({ path: rel, reason: 'copy-limit' });
    return;
  }
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
}

export function runProve(repoPath, options = {}) {
  if (!options.allowExec) {
    const report = collectAudit(repoPath, { outputDir: options.outputDir });
    report.mode = 'prove';
    report.status = 'blocked';
    report.issues.unshift(issue('EXECUTION_REQUIRES_ALLOW_EXEC', 'error', 'Prove mode executes repository commands and requires --allow-exec.', 'security'));
    return { report, exitCode: 2 };
  }

  const cleanroom = createCleanroom(repoPath, options.outputDir);
  const report = collectAudit(cleanroom.copyPath, { outputDir: options.outputDir });
  report.mode = 'prove';
  report.cleanroom = cleanroom;
  report.commands = [];

  if (report.issues.some((item) => item.code.startsWith('DANGEROUS'))) {
    report.status = 'blocked';
    return { report, exitCode: 3 };
  }

  const env = buildSafeEnv(options.outputDir);
  let failed = false;
  for (const step of report.readme.steps) {
    if (shouldSkipCommand(step.command)) continue;
    const commandResult = runCommand(step.command, cleanroom.copyPath, env, options.timeoutMs ?? DEFAULT_LIMITS.commandTimeoutMs);
    report.commands.push(commandResult);
    if (commandResult.exitCode !== 0) failed = true;
  }

  const url = findLocalhostUrl(readTextIfExists(path.join(cleanroom.copyPath, 'README.md')));
  if (url) {
    const reachable = checkReachable(url);
    if (!reachable) {
      failed = true;
      report.issues.push(issue('SERVICE_NOT_REACHABLE', 'error', `README demo URL was not reachable: ${url}.`, 'runtime', { url }));
    }
  }

  report.status = failed || report.issues.some((item) => item.severity === 'error') ? 'failed' : 'passed';
  return { report, exitCode: report.status === 'passed' ? 0 : 1 };
}

function shouldSkipCommand(command) {
  return /^#|^open\s+|^start\s+http|^xdg-open\s+|^explorer\s+/i.test(command);
}

function buildSafeEnv(outputDir) {
  const tempHome = fs.mkdtempSync(path.join(outputDir || os.tmpdir(), 'repoproof-home-'));
  return {
    PATH: process.env.PATH || '',
    Path: process.env.Path || process.env.PATH || '',
    TEMP: tempHome,
    TMP: tempHome,
    TMPDIR: tempHome,
    HOME: tempHome,
    USERPROFILE: tempHome,
    CI: 'true',
    LANG: process.env.LANG || 'C.UTF-8'
  };
}

function runCommand(command, cwd, env, timeoutMs) {
  const started = Date.now();
  const result = spawnSync(command, {
    cwd,
    env,
    shell: true,
    encoding: 'utf8',
    timeout: timeoutMs,
    windowsHide: true,
    maxBuffer: DEFAULT_LIMITS.maxOutputBytes
  });
  return {
    command,
    cwd: redactText(cwd),
    exitCode: result.status ?? (result.error ? 124 : 1),
    durationMs: Date.now() - started,
    stdout: redactText(String(result.stdout || '')).slice(0, DEFAULT_LIMITS.maxOutputBytes),
    stderr: redactText(String(result.stderr || result.error?.message || '')).slice(0, DEFAULT_LIMITS.maxOutputBytes)
  };
}

function findLocalhostUrl(text) {
  return text.match(/https?:\/\/(?:127\.0\.0\.1|localhost):\d+[^\s)`]*/)?.[0] ?? null;
}

function checkReachable(url) {
  try {
    const result = spawnSync(process.execPath, ['-e', `
      const url = process.argv[1];
      fetch(url, { signal: AbortSignal.timeout(2000) })
        .then((r) => process.exit(r.ok ? 0 : 1))
        .catch(() => process.exit(1));
    `, url], { encoding: 'utf8', timeout: 3000 });
    return result.status === 0;
  } catch {
    return false;
  }
}

export function generateFix(repoPath, options = {}) {
  const report = collectAudit(repoPath, { outputDir: options.outputDir });
  report.mode = 'fix';
  const patches = [];
  const readmePath = path.join(repoPath, 'README.md');
  let readme = readTextIfExists(readmePath);

  const pmIssue = report.issues.find((item) => item.code === 'README_PACKAGE_MANAGER_MISMATCH');
  if (pmIssue && readme) {
    const { expected, actual } = pmIssue.details;
    const updated = readme.replaceAll(`${actual} install`, `${expected} install`)
      .replaceAll(`${actual} test`, `${expected} test`)
      .replaceAll(`${actual} run`, `${expected} run`);
    if (updated !== readme) {
      patches.push(makeUnifiedPatch('README.md', readme, updated));
      readme = updated;
    }
  }

  const envIssue = report.issues.find((item) => item.code === 'MISSING_ENV_EXAMPLE');
  if (envIssue) {
    patches.push('--- /dev/null\n+++ .env.example\n@@\n+REQUIRED_ENV=replace-me\n');
  }

  report.fix = {
    mode: options.dryRun ? 'dry-run' : 'patch-only',
    patchCount: patches.length,
    applied: false
  };
  report.status = patches.length > 0 ? 'fixed-pending-verification' : report.status;
  return { report, patch: patches.join('\n') || '# RepoProof found no automatic safe fixes.\n' };
}

function makeUnifiedPatch(file, before, after) {
  const beforeLines = before.split(/\r?\n/);
  const afterLines = after.split(/\r?\n/);
  return [
    `--- ${file}`,
    `+++ ${file}`,
    '@@',
    ...beforeLines.map((line) => `-${line}`),
    ...afterLines.map((line) => `+${line}`)
  ].join('\n') + '\n';
}

export function writeReports(report, outputDir, options = {}) {
  fs.mkdirSync(outputDir, { recursive: true });
  const redactedReport = redactReport(report);
  const jsonPath = path.join(outputDir, 'repoproof-report.json');
  const mdPath = path.join(outputDir, 'repoproof-report.md');
  fs.writeFileSync(jsonPath, JSON.stringify(redactedReport, null, 2));
  fs.writeFileSync(mdPath, renderMarkdownReport(redactedReport));
  if (options.patch !== undefined) {
    fs.writeFileSync(path.join(outputDir, 'repoproof-fixes.patch'), options.patch);
  }
  return { jsonPath, mdPath };
}

export function renderMarkdownReport(report) {
  const lines = [
    '# RepoProof Report',
    '',
    `- Status: ${report.status}`,
    `- Mode: ${report.mode}`,
    `- Repository: ${report.repository.path}`,
    `- Project: ${report.project.type}${report.project.packageManager ? ` (${report.project.packageManager})` : ''}`,
    '',
    '## Issues',
    ''
  ];
  if (!report.issues.length) {
    lines.push('No issues found.');
  } else {
    for (const item of report.issues) {
      lines.push(`- [${item.severity}] ${item.code}: ${item.message}`);
    }
  }
  lines.push('', '## Commands', '');
  if (!report.commands.length) {
    lines.push('No commands executed.');
  } else {
    for (const command of report.commands) {
      lines.push(`- \`${command.command}\` -> ${command.exitCode} (${command.durationMs}ms)`);
    }
  }
  lines.push('', '## Safety', '', `Default mode: ${report.safety.defaultMode}. ${report.safety.sandbox}.`);
  return lines.join('\n') + '\n';
}

export function redactReport(report) {
  return JSON.parse(redactText(JSON.stringify(report)));
}

export function redactText(text) {
  if (!text) return text;
  let output = String(text);
  output = output.replace(/(OPENAI_API_KEY|ANTHROPIC_API_KEY|GITHUB_TOKEN|GH_TOKEN|NPM_TOKEN|AWS_SECRET_ACCESS_KEY|AWS_ACCESS_KEY_ID|DATABASE_URL)=([^\s"']+)/gi, '$1=[REDACTED_SECRET]');
  output = output.replace(/\b(?:sk-[A-Za-z0-9_-]{8,}|gh[pousr]_[A-Za-z0-9_]{8,}|npm_[A-Za-z0-9_]{8,})\b/g, '[REDACTED_SECRET]');
  output = output.replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[REDACTED_EMAIL]');
  output = output.replace(/[A-Za-z]:\\Users\\[^\\\s"]+/g, '[REDACTED_HOME]');
  output = output.replace(/\/Users\/[^/\s"]+/g, '[REDACTED_HOME]');
  output = output.replace(/\/home\/[^/\s"]+/g, '[REDACTED_HOME]');
  return output;
}

export function validateReportObject(report) {
  const required = ['schemaVersion', 'status', 'mode', 'repository', 'project', 'readme', 'issues', 'commands', 'safety'];
  const missing = required.filter((key) => !(key in report));
  if (missing.length) {
    throw new Error(`Report missing required fields: ${missing.join(', ')}`);
  }
  if (!Array.isArray(report.issues)) throw new Error('Report issues must be an array.');
  if (!Array.isArray(report.commands)) throw new Error('Report commands must be an array.');
  for (const command of report.commands) {
    if (!Number.isInteger(command.exitCode)) throw new Error(`Command missing integer exitCode: ${command.command}`);
  }
  return true;
}

export function generateActionWorkflow(owner = '<owner>') {
  return `name: RepoProof
on:
  pull_request:
  workflow_dispatch:
permissions:
  contents: read
jobs:
  repoproof:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@<pinned-sha>
      - uses: ${owner}/repo-proof/action@v0.1.0
        with:
          mode: audit
          profile: baseline
          fail-on: error
          upload-artifact: true
`;
}

export function writeActionWorkflow(outputDir, owner) {
  fs.mkdirSync(outputDir, { recursive: true });
  const file = path.join(outputDir, 'repoproof-action.yml');
  fs.writeFileSync(file, generateActionWorkflow(owner));
  return file;
}

export function hashFile(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fixturePath, readJson, runCli, tempDir } from './helpers.mjs';

test('audit detects README package-manager mismatch and writes reports', () => {
  const out = tempDir();
  const result = runCli(['audit', fixturePath('node', 'wrong-package-manager'), '--json', '--output', out]);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(path.join(out, 'repoproof-report.json'));
  assert.equal(report.status, 'failed');
  assert.equal(report.project.type, 'node');
  assert.equal(report.project.packageManager, 'pnpm');
  assert.ok(report.issues.some((issue) => issue.code === 'README_PACKAGE_MANAGER_MISMATCH'));
  assert.ok(report.readme.steps.some((step) => step.command === 'npm install'));
  assert.match(result.stdout, /README_PACKAGE_MANAGER_MISMATCH/);
});

test('audit detects missing env example and dangerous install scripts', () => {
  const out = tempDir();
  const result = runCli(['audit', fixturePath('node', 'missing-env-danger'), '--json', '--output', out]);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(path.join(out, 'repoproof-report.json'));
  assert.ok(report.issues.some((issue) => issue.code === 'MISSING_ENV_EXAMPLE'));
  assert.ok(report.issues.some((issue) => issue.code === 'DANGEROUS_SCRIPT'));
  assert.equal(report.safety.defaultMode, 'audit-only');
});

test('audit detects Python version mismatch and missing demo file references', () => {
  const out = tempDir();
  const result = runCli(['audit', fixturePath('python', 'version-mismatch'), '--json', '--output', out]);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(path.join(out, 'repoproof-report.json'));
  assert.equal(report.project.type, 'python');
  assert.ok(report.issues.some((issue) => issue.code === 'PYTHON_VERSION_MISMATCH'));
  assert.ok(report.issues.some((issue) => issue.code === 'README_REFERENCES_MISSING_FILE'));
});

import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import fs from 'node:fs';
import { fixturePath, readJson, runCli, tempDir } from './helpers.mjs';

test('fix dry-run generates a minimal patch for README package manager mismatch', () => {
  const out = tempDir();
  const result = runCli(['fix', fixturePath('node', 'wrong-package-manager'), '--dry-run', '--json', '--output', out]);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(path.join(out, 'repoproof-report.json'));
  const patch = fs.readFileSync(path.join(out, 'repoproof-fixes.patch'), 'utf8');
  assert.equal(report.fix.mode, 'dry-run');
  assert.match(patch, /npm install/);
  assert.match(patch, /pnpm install/);
  assert.ok(report.issues.some((issue) => issue.code === 'README_PACKAGE_MANAGER_MISMATCH'));
});

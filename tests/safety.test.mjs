import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fixturePath, readJson, runCli, tempDir } from './helpers.mjs';

test('prove blocks execution unless --allow-exec is supplied', () => {
  const out = tempDir();
  const result = runCli(['prove', fixturePath('node', 'good-cli'), '--json', '--output', out]);

  assert.equal(result.status, 2);
  const report = readJson(path.join(out, 'repoproof-report.json'));
  assert.equal(report.status, 'blocked');
  assert.ok(report.issues.some((issue) => issue.code === 'EXECUTION_REQUIRES_ALLOW_EXEC'));
});

test('danger scanner blocks curl pipe shell and destructive commands', () => {
  const out = tempDir();
  const result = runCli(['audit', fixturePath('node', 'dangerous-readme'), '--json', '--output', out]);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(path.join(out, 'repoproof-report.json'));
  const codes = report.issues.map((issue) => issue.code);
  assert.ok(codes.includes('DANGEROUS_README_COMMAND'));
  assert.ok(codes.includes('DANGEROUS_SCRIPT'));
});

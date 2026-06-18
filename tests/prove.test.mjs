import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fixturePath, readJson, runCli, tempDir } from './helpers.mjs';

test('prove executes README commands when explicitly allowed', () => {
  const out = tempDir();
  const result = runCli(['prove', fixturePath('node', 'good-cli'), '--allow-exec', '--json', '--output', out], { timeout: 30000 });

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(path.join(out, 'repoproof-report.json'));
  assert.equal(report.status, 'passed');
  assert.ok(report.commands.length >= 2);
  assert.ok(report.commands.every((command) => Number.isInteger(command.exitCode)));
});

test('prove identifies a web service that exits without becoming reachable', () => {
  const out = tempDir();
  const result = runCli(['prove', fixturePath('web', 'service-not-accessible'), '--allow-exec', '--json', '--output', out], { timeout: 30000 });

  assert.notEqual(result.status, 0);
  const report = readJson(path.join(out, 'repoproof-report.json'));
  assert.ok(report.issues.some((issue) => issue.code === 'SERVICE_NOT_REACHABLE'));
});

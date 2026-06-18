import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fixturePath, readJson, runCli, tempDir } from './helpers.mjs';

test('cleanroom creates a safe copy without .git and records provenance', () => {
  const out = tempDir();
  const result = runCli(['audit', fixturePath('node', 'good-cli'), '--json', '--output', out, '--cleanroom']);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(path.join(out, 'repoproof-report.json'));
  assert.equal(report.cleanroom.enabled, true);
  assert.ok(report.cleanroom.copyPath);
  assert.equal(fs.existsSync(path.join(report.cleanroom.copyPath, '.git')), false);
  assert.equal(report.cleanroom.rejected.length, 0);
});

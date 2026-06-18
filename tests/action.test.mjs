import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { repoRoot, runCli, tempDir } from './helpers.mjs';

test('GitHub Action metadata uses read-only defaults and exposes reports', () => {
  const action = fs.readFileSync(path.join(repoRoot, 'action', 'action.yml'), 'utf8');
  assert.match(action, /name: RepoProof/);
  assert.match(action, /mode:/);
  assert.match(action, /report-path:/);
});

test('generate-action writes a minimal permissions workflow snippet', () => {
  const out = tempDir();
  const result = runCli(['generate-action', '--output', out]);
  assert.equal(result.status, 0, result.stderr);
  const workflow = fs.readFileSync(path.join(out, 'repoproof-action.yml'), 'utf8');
  assert.match(workflow, /permissions:\s*\r?\n\s+contents: read/);
  assert.match(workflow, /repo-proof\/action@v0\.1\.0/);
});

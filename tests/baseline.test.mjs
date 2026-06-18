import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { repoRoot } from './helpers.mjs';

test('baseline comparison records failures and does not show only successes', () => {
  const text = fs.readFileSync(path.join(repoRoot, 'evals', 'baseline-comparison.md'), 'utf8');
  assert.match(text, /baseline-agent/);
  assert.match(text, /explicit-repo-proof/);
  assert.match(text, /Failure cases/);
});

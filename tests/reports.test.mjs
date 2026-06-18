import test from 'node:test';
import assert from 'node:assert/strict';
import { runCli, repoRoot } from './helpers.mjs';
import path from 'node:path';

test('example report validates against the RepoProof schema', () => {
  const result = runCli(['validate-report', path.join(repoRoot, 'reports', 'examples', 'before-after.json')]);
  assert.equal(result.status, 0, result.stderr);
});

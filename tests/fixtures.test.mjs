import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { repoRoot } from './helpers.mjs';

const expectedDir = path.join(repoRoot, 'fixtures', 'expected');

test('fixture suite contains the required twelve expected cases', () => {
  const files = fs.readdirSync(expectedDir).filter((file) => file.endsWith('.json'));
  assert.equal(files.length, 12);
  for (const file of files) {
    const expected = JSON.parse(fs.readFileSync(path.join(expectedDir, file), 'utf8'));
    assert.ok(expected.fixture);
    assert.ok(Array.isArray(expected.expectedIssues));
    assert.ok(expected.expectedIssues.length > 0);
  }
});

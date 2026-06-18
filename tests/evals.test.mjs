import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { repoRoot } from './helpers.mjs';

test('trigger evals include positive and negative examples', () => {
  const file = path.join(repoRoot, 'evals', 'trigger-evals.jsonl');
  const rows = fs.readFileSync(file, 'utf8').trim().split(/\r?\n/).map((line) => JSON.parse(line));
  const positives = rows.filter((row) => row.shouldTrigger);
  const negatives = rows.filter((row) => !row.shouldTrigger);
  assert.ok(positives.length >= 6);
  assert.ok(negatives.length >= 6);
});

test('behavior evals compare baseline, explicit skill, and implicit skill', () => {
  const file = path.join(repoRoot, 'evals', 'behavior-evals.json');
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));
  assert.deepEqual(data.conditions, ['baseline-agent', 'explicit-repo-proof', 'implicit-repo-proof']);
  assert.ok(data.metrics.includes('avoids_false_success'));
});

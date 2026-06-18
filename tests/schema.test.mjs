import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { repoRoot } from './helpers.mjs';

test('evidence schema documents required report fields', () => {
  const schema = JSON.parse(fs.readFileSync(path.join(repoRoot, 'references', 'evidence-schema.json'), 'utf8'));
  assert.ok(schema.required.includes('schemaVersion'));
  assert.ok(schema.required.includes('status'));
  assert.ok(schema.required.includes('issues'));
  assert.ok(schema.properties.commands.items.required.includes('exitCode'));
});

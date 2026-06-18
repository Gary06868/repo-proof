import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { repoRoot } from './helpers.mjs';

const skillPath = path.join(repoRoot, 'SKILL.md');
const skill = fs.readFileSync(skillPath, 'utf8');

assert.match(skill, /^---\nname: repo-proof\n/m);
assert.match(skill, /description: .+fresh clone.+README/im);
assert.match(skill, /scripts\/repoproof\.mjs/);
assert.ok(fs.existsSync(path.join(repoRoot, 'agents', 'openai.yaml')));
assert.ok(fs.existsSync(path.join(repoRoot, 'references', 'safety-model.md')));

console.log('RepoProof skill metadata is valid.');

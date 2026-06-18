import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { repoRoot } from './helpers.mjs';

test('release artifacts include checksums, SBOM, and immutable release policy', () => {
  const outDir = fs.mkdtempSync(path.join(os.tmpdir(), 'repoproof-release-'));
  const result = spawnSync(process.execPath, ['scripts/release-artifacts.mjs', '--output', outDir], {
    cwd: repoRoot,
    encoding: 'utf8',
    timeout: 20000,
  });

  assert.equal(result.status, 0, result.stderr);
  const summary = JSON.parse(result.stdout);
  assert.equal(summary.status, 'generated');

  const sums = fs.readFileSync(path.join(outDir, 'SHA256SUMS'), 'utf8');
  assert.match(sums, /README\.md/);
  assert.match(sums, /SKILL\.md/);
  assert.doesNotMatch(sums, /\.env\s*$/m);

  const sbom = JSON.parse(fs.readFileSync(path.join(outDir, 'sbom.spdx.json'), 'utf8'));
  assert.equal(sbom.spdxVersion, 'SPDX-2.3');
  assert.ok(sbom.files.some((file) => file.fileName === 'scripts/repoproof.mjs'));

  const manifest = JSON.parse(fs.readFileSync(path.join(outDir, 'release-manifest.json'), 'utf8'));
  assert.equal(manifest.releasePolicy.immutableTags, true);
  assert.ok(manifest.verification.includes('pnpm verify'));
});

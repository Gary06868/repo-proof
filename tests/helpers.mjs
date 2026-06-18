import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';

export const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export function runCli(args, options = {}) {
  return spawnSync(process.execPath, [path.join(repoRoot, 'scripts', 'repoproof.mjs'), ...args], {
    cwd: options.cwd ?? repoRoot,
    encoding: 'utf8',
    env: { ...process.env, ...options.env },
    timeout: options.timeout ?? 20000
  });
}

export function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

export function tempDir(prefix = 'repoproof-test-') {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

export function fixturePath(...parts) {
  return path.join(repoRoot, 'fixtures', ...parts);
}

#!/usr/bin/env node
import childProcess from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const outputDir = path.resolve(root, getArg('--output') || '.tmp/release-artifacts');
const packageJson = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const commit = git(['rev-parse', 'HEAD']) || 'unknown';
const branch = git(['branch', '--show-current']) || 'unknown';
const files = listReleaseFiles(root);

fs.mkdirSync(outputDir, { recursive: true });

const checksums = files
  .map((file) => `${sha256(path.join(root, file))}  ${file.replaceAll(path.sep, '/')}`)
  .sort()
  .join('\n') + '\n';

const sbom = {
  spdxVersion: 'SPDX-2.3',
  dataLicense: 'CC0-1.0',
  SPDXID: 'SPDXRef-DOCUMENT',
  name: `${packageJson.name}-${packageJson.version}`,
  documentNamespace: `https://github.com/Gary06868/repo-proof/releases/tag/v${packageJson.version}/spdx/${commit}`,
  creationInfo: {
    creators: ['Tool: RepoProof release-artifacts'],
    created: new Date().toISOString(),
  },
  packages: [
    {
      name: packageJson.name,
      SPDXID: 'SPDXRef-Package-repo-proof',
      versionInfo: packageJson.version,
      downloadLocation: 'https://github.com/Gary06868/repo-proof',
      filesAnalyzed: true,
      licenseConcluded: packageJson.license,
      licenseDeclared: packageJson.license,
      copyrightText: 'NOASSERTION',
    },
  ],
  files: files.map((file) => ({
    fileName: file.replaceAll(path.sep, '/'),
    SPDXID: `SPDXRef-File-${safeId(file)}`,
    checksums: [
      {
        algorithm: 'SHA256',
        checksumValue: sha256(path.join(root, file)),
      },
    ],
    licenseConcluded: 'NOASSERTION',
    copyrightText: 'NOASSERTION',
  })),
  relationships: [
    {
      spdxElementId: 'SPDXRef-DOCUMENT',
      relationshipType: 'DESCRIBES',
      relatedSpdxElement: 'SPDXRef-Package-repo-proof',
    },
  ],
};

const manifest = {
  name: packageJson.name,
  version: packageJson.version,
  commit,
  branch,
  generatedAt: new Date().toISOString(),
  releasePolicy: {
    immutableTags: true,
    retagging: 'never rewrite public version tags',
    publishCommandsAreDryRunOnly: true,
  },
  artifacts: [
    'SHA256SUMS',
    'sbom.spdx.json',
    'release-manifest.json',
  ],
  verification: [
    'pnpm verify',
    'pnpm release:dry-run',
    'npm pack --dry-run',
  ],
};

fs.writeFileSync(path.join(outputDir, 'SHA256SUMS'), checksums);
fs.writeFileSync(path.join(outputDir, 'sbom.spdx.json'), `${JSON.stringify(sbom, null, 2)}\n`);
fs.writeFileSync(path.join(outputDir, 'release-manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);

process.stdout.write(JSON.stringify({
  status: 'generated',
  output: path.relative(root, outputDir).replaceAll(path.sep, '/'),
  files: manifest.artifacts,
  releaseFiles: files.length,
}) + '\n');

function getArg(name) {
  const index = process.argv.indexOf(name);
  if (index === -1) return '';
  return process.argv[index + 1] || '';
}

function git(args) {
  try {
    return childProcess.execFileSync('git', args, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch {
    return '';
  }
}

function listReleaseFiles(base) {
  const tracked = git(['ls-files', '--cached', '--others', '--exclude-standard']);
  const rawFiles = tracked
    ? tracked.split(/\r?\n/).filter(Boolean)
    : walk(base).map((file) => path.relative(base, file));

  return rawFiles
    .filter((file) => !file.startsWith('.git/'))
    .filter((file) => !file.startsWith('.tmp/'))
    .filter((file) => !file.startsWith('node_modules/'))
    .filter((file) => path.basename(file) !== '.env')
    .sort();
}

function walk(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === '.git' || entry.name === 'node_modules' || entry.name === '.tmp') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    if (entry.isFile()) out.push(full);
  }
  return out;
}

function sha256(filePath) {
  return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

function safeId(file) {
  return file.replace(/[^A-Za-z0-9.-]+/g, '-').replace(/^-|-$/g, '');
}

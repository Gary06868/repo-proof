#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import {
  collectAudit,
  generateFix,
  parseArgs,
  redactText,
  resolveRepo,
  runProve,
  validateReportObject,
  writeActionWorkflow,
  writeReports
} from './lib/core.mjs';

async function main(argv = process.argv.slice(2)) {
  const { positional, flags } = parseArgs(argv);
  const command = positional[0] || 'help';

  if (command === 'help' || flags.help) {
    printHelp();
    return 0;
  }

  if (command === 'audit') {
    const repo = resolveRepo(positional[1] || '.');
    const output = path.resolve(flags.output || 'repoproof-output');
    const report = collectAudit(repo, { outputDir: output, cleanroom: Boolean(flags.cleanroom) });
    writeReports(report, output);
    emit(report, flags);
    return 0;
  }

  if (command === 'prove') {
    const repo = resolveRepo(positional[1] || '.');
    const output = path.resolve(flags.output || 'repoproof-output');
    const { report, exitCode } = runProve(repo, {
      outputDir: output,
      allowExec: Boolean(flags['allow-exec']),
      timeoutMs: flags.timeout ? Number(flags.timeout) * 1000 : undefined
    });
    writeReports(report, output);
    emit(report, flags);
    return exitCode;
  }

  if (command === 'fix') {
    const repo = resolveRepo(positional[1] || '.');
    const output = path.resolve(flags.output || 'repoproof-output');
    const { report, patch } = generateFix(repo, { outputDir: output, dryRun: Boolean(flags['dry-run']) });
    writeReports(report, output, { patch });
    emit(report, flags);
    return 0;
  }

  if (command === 'redact') {
    const input = process.env.REPOPROOF_STDIN || fs.readFileSync(0, 'utf8');
    process.stdout.write(redactText(input));
    return 0;
  }

  if (command === 'generate-action') {
    const output = path.resolve(flags.output || '.');
    const file = writeActionWorkflow(output, flags.owner || '<owner>');
    process.stdout.write(`${file}\n`);
    return 0;
  }

  if (command === 'validate-report') {
    const reportFile = path.resolve(positional[1] || '');
    const report = JSON.parse(fs.readFileSync(reportFile, 'utf8'));
    validateReportObject(report);
    process.stdout.write(`valid ${reportFile}\n`);
    return 0;
  }

  process.stderr.write(`Unknown RepoProof command: ${command}\n`);
  printHelp();
  return 64;
}

function emit(report, flags) {
  if (flags.json) {
    process.stdout.write(`${JSON.stringify({ status: report.status, issues: report.issues.map((issue) => issue.code) })}\n`);
  } else {
    process.stdout.write(`RepoProof ${report.mode}: ${report.status}\n`);
    for (const issue of report.issues) {
      process.stdout.write(`- ${issue.code}: ${issue.message}\n`);
    }
  }
}

function printHelp() {
  process.stdout.write(`RepoProof - Make your README true.

Usage:
  repoproof audit [repo] [--json] [--output dir] [--cleanroom]
  repoproof prove [repo] --allow-exec [--json] [--output dir]
  repoproof fix [repo] --dry-run [--json] [--output dir]
  repoproof redact
  repoproof generate-action [--output dir] [--owner owner]
  repoproof validate-report <report.json>
`);
}

main().then((code) => {
  process.exitCode = code;
}).catch((error) => {
  process.stderr.write(`${error.stack || error.message}\n`);
  process.exitCode = 1;
});

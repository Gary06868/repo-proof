#!/usr/bin/env node
import path from 'node:path';
import { collectAudit } from './lib/core.mjs';

const report = collectAudit(path.resolve(process.argv[2] || '.'));
const danger = report.issues.filter((issue) => issue.category === 'security');
process.stdout.write(`${JSON.stringify(danger, null, 2)}\n`);
process.exitCode = danger.some((issue) => issue.severity === 'error') ? 1 : 0;

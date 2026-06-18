#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { validateReportObject } from './lib/core.mjs';

const reportFile = path.resolve(process.argv[2] || '');
validateReportObject(JSON.parse(fs.readFileSync(reportFile, 'utf8')));
process.stdout.write(`valid ${reportFile}\n`);
